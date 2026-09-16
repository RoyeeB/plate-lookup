/**
 * The buyer checklist card. The count in the header only counts "check this"
 * items — unknown ones are shown as unknown rather than folded into either
 * side, so a failed data source can't make a car look cleaner than it is.
 */
import { useId } from 'react';
import { t } from '@/i18n';
import type { ChecklistItem, ChecklistStatus } from '@/lib/buyerChecklist';
import { Icon, type IconName } from './Icon';

const ICON: Record<ChecklistStatus, IconName> = {
  ok: 'check-circle',
  attention: 'warning',
  unknown: 'help-circle',
  pending: 'help-circle',
};

const STATUS_LABEL: Record<ChecklistStatus, string> = {
  ok: t.checklist.statusOk,
  attention: t.checklist.statusAttention,
  unknown: t.checklist.statusUnknown,
  pending: t.checklist.statusPending,
};

interface BuyerChecklistProps {
  items: ChecklistItem[];
}

export function BuyerChecklist({ items }: BuyerChecklistProps) {
  const titleId = useId();
  const attention = items.filter((item) => item.status === 'attention').length;
  const pending = items.some((item) => item.status === 'pending');

  const summary =
    attention > 1
      ? t.checklist.summaryAttention.replace('{n}', String(attention))
      : attention === 1
        ? t.checklist.summaryOne
        : pending
          ? t.checklist.loading
          : t.checklist.summaryNone;

  return (
    <section className="checklist" aria-labelledby={titleId}>
      <div className="checklist__head">
        <Icon name="clipboard-check" size={22} />
        <div className="checklist__heading">
          <h2 id={titleId} className="checklist__title">
            {t.checklist.title}
          </h2>
          <p className={`checklist__summary${attention > 0 ? ' checklist__summary--attention' : ''}`}>
            {summary}
          </p>
        </div>
      </div>

      <ul className="checklist__list">
        {items.map((item) => (
          <li key={item.id} className={`checklist__item checklist__item--${item.status}`}>
            <span className="checklist__icon">
              <Icon name={ICON[item.status]} size={20} />
            </span>
            <span className="checklist__text">
              <span className="checklist__item-title">
                {item.title}
                <span className="visually-hidden">: {STATUS_LABEL[item.status]}</span>
              </span>
              <span className="checklist__detail">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="checklist__note">{t.checklist.subtitle}</p>
    </section>
  );
}
