/**
 * Share the current vehicle page.
 *
 * Every lookup already has its own URL, but there was no way to hand it to
 * anyone — and checking a used car is something people do together. On a phone
 * this opens the native share sheet; anywhere else it copies the link.
 */
import { useCallback } from 'react';
import { t } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import { formatPlate } from '@/lib/plate';
import { Button } from './Button';

interface ShareButtonProps {
  plate: string;
  /** e.g. "טויוטה קורולה 2019" — what the car is, for the share text. */
  description?: string;
}

export function ShareButton({ plate, description }: ShareButtonProps) {
  const toast = useToast();

  const share = useCallback(async () => {
    const url = window.location.href;
    const title = t.share.subject.replace('{plate}', formatPlate(plate));

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description ? `${description} — ${title}` : title,
          url,
        });
        return;
      } catch (err) {
        // Dismissing the sheet is not a failure, and must not then paste the
        // link over the user's clipboard.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.show(t.share.copied);
    } catch {
      // Clipboard needs a secure context and a user gesture; both should hold
      // here, but a locked-down browser can still refuse.
      toast.show(t.share.failed);
    }
  }, [description, plate, toast]);

  return (
    <Button
      label={t.share.action}
      icon="share"
      variant="secondary"
      onClick={() => void share()}
    />
  );
}
