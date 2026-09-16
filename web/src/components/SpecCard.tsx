/**
 * Official registry spec card. Renders the mapped fields as label/value rows.
 * The VIN row (misgeret) is clickable to copy, with a toast confirmation.
 */
import { useCallback } from 'react';
import { t } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import type { MappedField } from '@/api/mapper';
import { Icon } from './Icon';

interface SpecCardProps {
  title: string;
  fields: MappedField[];
  subtitle?: string;
}

export function SpecCard({ title, fields, subtitle }: SpecCardProps) {
  const toast = useToast();

  if (fields.length === 0) return null;

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.show(t.vehicle.copyVin);
      } catch {
        // Clipboard is unavailable over plain HTTP or when the user denied it;
        // the value stays selectable in the DOM either way.
      }
    },
    [toast]
  );

  return (
    <section className="card">
      <h2 className="card__title">{title}</h2>
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
      {fields.map((field) => {
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
                <Icon name="copy" size={16} color="var(--text-secondary)" />
              )}
            </span>
          </>
        );

        if (field.copyable) {
          return (
            <button
              key={field.key}
              type="button"
              className="spec-row"
              onClick={() => void copy(field.value)}
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
