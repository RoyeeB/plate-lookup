/**
 * Rear-camera access via getUserMedia, with the failure modes a browser can
 * actually produce spelled out — a page served over plain HTTP, a browser with
 * no media devices, and a permission the user has blocked all look different to
 * the user and need different advice.
 *
 * Also exposes optional torch (flashlight) control. Support is inconsistent —
 * notably absent on iOS Safari — so callers must check `torchAvailable`
 * before showing any UI for it rather than assume it exists.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'denied'
  | 'unsupported'
  | 'insecure'
  | 'error';

/**
 * The DOM lib's `MediaTrackCapabilities`/`MediaTrackConstraintSet` types don't
 * declare `torch` — it's a real capability many Android camera apps expose,
 * just not one the spec has standardised yet. Narrow local extensions let us
 * read/set it without resorting to `any`.
 */
interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}
interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    // Best-effort: turn the LED off before the track is stopped. Stopping
    // the track releases it too, but not every device turns the physical
    // flashlight off the instant that happens.
    const track = trackRef.current;
    if (track) {
      const offConstraint: TorchConstraintSet = { torch: false };
      track.applyConstraints({ advanced: [offConstraint] }).catch(() => {
        // Unsupported or already gone — nothing to do.
      });
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    trackRef.current = null;
    setTorchAvailable(false);
    setTorchOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    // `isSecureContext` is true on https and on localhost, which is exactly
    // where getUserMedia is allowed.
    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      trackRef.current = track ?? null;

      // `getCapabilities` itself is missing entirely on some browsers (e.g.
      // iOS Safari) — guard the call, not just the field.
      const capabilities: TorchCapabilities = track?.getCapabilities?.() ?? {};
      setTorchAvailable(Boolean(capabilities.torch));
      setTorchOn(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // Autoplay can be refused; the muted+playsInline video element
          // normally prevents this, and the user can tap to retry.
        });
      }
      setStatus('ready');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('unsupported');
      else setStatus('error');
    }
  }, []);

  const toggleTorch = useCallback(() => {
    const track = trackRef.current;
    if (!track || !torchAvailable) return;

    const next = !torchOn;
    const constraint: TorchConstraintSet = { torch: next };
    track
      .applyConstraints({ advanced: [constraint] })
      .then(() => setTorchOn(next))
      .catch(() => {
        // Capability was advertised but the constraint was rejected at
        // runtime — leave the toggle as-is rather than claim a state that
        // isn't real.
      });
  }, [torchAvailable, torchOn]);

  // Release the camera when the screen unmounts — the browser keeps the
  // indicator light on otherwise, and `stop` also turns the torch off.
  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop, torchAvailable, torchOn, toggleTorch };
}
