import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { normalizePlate } from '@/lib/plate';
import { useRecentSearches } from '@/api/queries';
import { useCamera } from '@/hooks/useCamera';
import { preloadOcr, recognizePlateConsensus, terminateOcr } from '@/lib/webOcr';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Button } from '@/components/Button';
import { StateView } from '@/components/StateView';
import { Icon } from '@/components/Icon';
import { prefersReducedMotion } from '@/lib/motion';
import '@/styles/scan.css';

type ScanState = 'camera' | 'processing' | 'detected' | 'confirm' | 'error';

/** How long the green "got it" frame shows before the confirm sheet opens. */
const DETECTED_FEEDBACK_MS = 450;

export default function ScanPage() {
  const navigate = useNavigate();
  const { videoRef, status, start, stop, torchAvailable, torchOn, toggleTorch } = useCamera();
  const cutoutRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [detected, setDetected] = useState('');
  const { add } = useRecentSearches();
  const feedbackTimer = useRef<number | undefined>(undefined);

  // Ask for the camera as soon as the screen opens, and warm the OCR engine in
  // the background so the first capture isn't stuck behind a model download.
  useEffect(() => {
    void start();
    preloadOcr();
  }, [start]);

  // The worker holds a few tens of MB — drop it when leaving the screen.
  useEffect(() => () => void terminateOcr(), []);

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), []);

  const goBack = useCallback(() => {
    stop();
    navigate('/');
  }, [navigate, stop]);

  const runOcr = useCallback(async () => {
    const video = videoRef.current;
    const cutout = cutoutRef.current;
    if (!video || !cutout || state !== 'camera') return;

    setState('processing');
    try {
      const videoBox = video.getBoundingClientRect();
      const guideBox = cutout.getBoundingClientRect();
      // Captures a short burst of frames and OCRs each — takes ~1s, hence the
      // 'processing' overlay staying up (and the shutter staying disabled)
      // for the whole call, not just a single recognize().
      const plate = await recognizePlateConsensus(video, {
        x: guideBox.left - videoBox.left,
        y: guideBox.top - videoBox.top,
        width: guideBox.width,
        height: guideBox.height,
        displayWidth: videoBox.width,
        displayHeight: videoBox.height,
      });

      if (plate) {
        setDetected(plate);
        // A beat of confirmation (green frame + a short buzz where supported)
        // before the sheet covers the camera. Still never auto-searches — the
        // user must confirm the digits.
        navigator.vibrate?.(40);
        if (prefersReducedMotion()) {
          setState('confirm');
        } else {
          setState('detected');
          feedbackTimer.current = window.setTimeout(
            () => setState('confirm'),
            DETECTED_FEEDBACK_MS
          );
        }
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [state, videoRef]);

  const onConfirm = useCallback(
    (plate: string) => {
      const normalized = normalizePlate(plate);
      setState('camera');
      add(normalized);
      stop();
      navigate(`/vehicle/${normalized}`, { replace: true });
    },
    [add, navigate, stop]
  );

  // --- Camera unavailable: explain why, and always offer manual entry ---
  if (status === 'denied' || status === 'unsupported' || status === 'insecure' || status === 'error') {
    const copy = {
      denied: { title: t.permission.deniedTitle, body: t.permission.deniedBody },
      unsupported: { title: t.scan.unsupportedTitle, body: t.scan.unsupportedBody },
      insecure: { title: t.scan.insecureTitle, body: t.scan.insecureBody },
      error: { title: t.states.errorTitle, body: t.scan.unsupportedBody },
    }[status];

    return (
      <div className="screen">
        <StateView
          icon="camera"
          iconColor="var(--warning)"
          title={copy.title}
          body={copy.body}
          actions={[
            ...(status === 'denied' || status === 'error'
              ? [{ label: t.permission.grant, icon: 'camera' as const, onClick: () => void start() }]
              : []),
            { label: t.scan.manualEntry, variant: 'secondary' as const, onClick: goBack },
          ]}
        />
      </div>
    );
  }

  // --- Camera ---
  return (
    <div className="scan">
      <video
        ref={videoRef}
        className="scan__video"
        playsInline
        muted
        autoPlay
        aria-label={t.scan.title}
      />

      <div className="scan__guide">
        <div
          className={`scan__cutout${state === 'detected' ? ' scan__cutout--detected' : ''}${
            state === 'processing' ? ' scan__cutout--busy' : ''
          }`}
          ref={cutoutRef}
        >
          {state === 'camera' && status === 'ready' && (
            <span className="scan__beam" aria-hidden="true" />
          )}
          <span className="scan__corner scan__corner--tl" />
          <span className="scan__corner scan__corner--tr" />
          <span className="scan__corner scan__corner--bl" />
          <span className="scan__corner scan__corner--br" />
        </div>
        <p className="scan__hint">{t.scan.hint}</p>
      </div>

      <div className="scan__top-bar">
        <button
          type="button"
          className="scan__icon-button"
          onClick={goBack}
          aria-label={t.states.back}
        >
          <Icon name="close" size={28} />
        </button>

        {/* iOS Safari has no torch API at all — hide the control entirely
            rather than showing a button that can never do anything. */}
        {torchAvailable && (
          <button
            type="button"
            className="scan__icon-button"
            onClick={() => void toggleTorch()}
            aria-label={torchOn ? t.scan.torchOff : t.scan.torchOn}
          >
            <Icon name={torchOn ? 'flash-off' : 'flash'} size={24} />
          </button>
        )}
      </div>

      <div className="scan__bottom-bar">
        <button
          type="button"
          className="scan__shutter"
          onClick={() => void runOcr()}
          disabled={state !== 'camera' || status !== 'ready'}
          aria-label={t.scan.capture}
        >
          <span className="scan__shutter-inner" />
        </button>
      </div>

      {status === 'starting' && (
        <div className="scan__overlay">
          <span className="spinner spinner--lg" aria-hidden="true" />
          <p className="scan__overlay-text">{t.scan.starting}</p>
        </div>
      )}

      {state === 'processing' && (
        <div className="scan__overlay" role="status" aria-live="polite">
          <span className="spinner spinner--lg" aria-hidden="true" />
          <p className="scan__overlay-text">{t.scan.processing}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="scan__error-sheet">
          <Icon name="alert-circle" size={40} color="var(--warning)" />
          <p className="scan__error-text">{t.scan.noPlateDetected}</p>
          <div className="scan__error-actions">
            <Button
              label={t.scan.retake}
              icon="camera"
              variant="plate"
              onClick={() => setState('camera')}
            />
            <Button label={t.scan.manualEntry} variant="secondary" onClick={goBack} />
          </div>
        </div>
      )}

      <ConfirmSheet
        open={state === 'confirm'}
        initialPlate={detected}
        onConfirm={onConfirm}
        onCancel={() => setState('camera')}
      />
    </div>
  );
}
