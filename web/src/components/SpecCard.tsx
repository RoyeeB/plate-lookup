/**
 * Official registry spec card. Renders the mapped fields as label/value rows.
 * The VIN row (misgeret) is clickable to copy, with a toast confirmation.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import type { MappedField } from '@/api/mapper';
import { Icon } from './Icon';

const COPIED_MS = 1600;

interface SpecCardProps {
  title: string;
  fields: MappedField[];
  subtitle?: string;
}

export function SpecCard({ title, fields, subtitle }: SpecCardProps) {
  const toast = useToast();
  /** The row that was just copied, for a moment of visual confirmation. */
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const copy = useCallback(
    async (key: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.show(t.vehicle.copyVin);
        window.clearTimeout(copiedTimer.current);
        setCopiedKey(key);
        copiedTimer.current = window.setTimeout(() => setCopiedKey(null), COPIED_MS);
      } catch {
        // Clipboard is unavailable over plain HTTP or when the user denied it;
        // the value stays selectable in the DOM either way.
      }
    },
    [toast]
  );

  // After every hook: the enrichment cards start empty and fill in later, so
  // an earlier return would change the hook count between renders.
  if (fields.length === 0) return null;

  return (
    <section className="card">
      <h2 className="card__title">{title}</h2>
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
      {fields.map((field) => {
        const copied = copiedKey === field.key;
        const content = (
          <>
            <span className="spec-row__label">{field.label}</span>
            <span className="spec-row__value-wrap">
              <span
                className={`spec-row__value${field.copyable ? ' spec-row__value--mono' : ''}`}
              >
                {field.value}
              </span>
              {field.copyable && (
                <span className="spec-row__copy-icon" key={copied ? 'done' : 'copy'}>
                  <Icon
                    name={copied ? 'check' : 'copy'}
                    size={16}
                    color={copied ? 'var(--success)' : 'var(--text-secondary)'}
                  />
                </span>
              )}
            </span>
          </>
        );

        if (field.copyable) {
          return (
            <button
              key={field.key}
              type="button"
              className={`spec-row spec-row--copyable${copied ? ' spec-row--copied' : ''}`}
              onClick={() => void copy(field.key, field.value)}
              title={t.vehicle.copyHint}
            >
              {content}
            </button>
          );
        }
        return (
          <div key={field.key} className="spec-row">
            {content}
          </div>
        );
      })}
    </section>
  );
}
