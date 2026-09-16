/**
 * Inline notice for the secondary datasets: either some of them failed
 * (`partial`) or the whole enrichment request did (`failed`). The official
 * registry fields above are complete either way, so this is a quiet note with a
 * retry, never an error screen.
 */
import { t } from '@/i18n';
import { Icon } from './Icon';

interface EnrichmentNoteProps {
  kind: 'partial' | 'failed';
  onRetry: () => void;
  retrying: boolean;
}

export function EnrichmentNote({ kind, onRetry, retrying }: EnrichmentNoteProps) {
  const title = kind === 'failed' ? t.enrichment.failedTitle : t.enrichment.partialTitle;
  const body = kind === 'failed' ? t.enrichment.failedBody : t.enrichment.partialBody;

  return (
    <div className={`enrichment-note enrichment-note--${kind}`} role="status">
      <Icon name={kind === 'failed' ? 'warning' : 'info-circle'} size={18} />
      <span className="enrichment-note__text">
        <span className="enrichment-note__title">{title}</span>
        {body}
        <button
          type="button"
          className="enrichment-note__retry"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying || undefined}
        >
          {retrying ? t.states.retrying : t.states.retry}
        </button>
      </span>
    </div>
  );
}
