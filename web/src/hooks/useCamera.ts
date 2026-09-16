/**
 * Rear-camera access via getUserMedia, with the failure modes a browser can
 * actually produce spelled out — a page served over plain HTTP, a browser with
 * no media devices, and a permission the user has blocked all look different to
 * the user and need different advice.
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

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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

  // Release the camera when the screen unmounts — the browser keeps the
  // indicator light on otherwise.
  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop };
}
