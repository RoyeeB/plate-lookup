/**
 * Two cars side by side — for someone weighing two listings. Each column loads
 * independently, so one slow or missing car never blocks the other.
 */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { buildComparison } from '@/lib/compare';
import { useVehicleOverview, type VehicleOverviewState } from '@/hooks/useVehicleOverview';
import { PlateBadge } from '@/components/PlateBadge';
import { StateView } from '@/components/StateView';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/Button';

function ColumnHead({ plate, state }: { plate: string; state: VehicleOverviewState }) {
  return (
    <th scope="col" className="compare__car">
      <Link to={`/vehicle/${plate}`} className="compare__car-link">
        <PlateBadge plate={plate} size="sm" />
        <span className="compare__car-name">
          {state.loading ? (
            <Skeleton width={90} height={16} />
          ) : state.notFound ? (
            t.states.notFoundTitle
          ) : state.failed ? (
            t.states.errorTitle
          ) : (
            (state.overview?.name ?? t.vehicle.unnamed)
          )}
        </span>
      </Link>
    </th>
  );
}

export default function ComparePage() {
  const params = useParams<{ a: string; b: string }>();
  const navigate = useNavigate();
  const plateA = normalizePlate(params.a ?? '');
  const plateB = normalizePlate(params.b ?? '');

  const a = useVehicleOverview(plateA);
  const b = useVehicleOverview(plateB);
  const rows = useMemo(() => buildComparison(a.overview, b.overview), [a.overview, b.overview]);
  const loading = a.loading || b.loading;

  if (!isValidPlate(plateA) || !isValidPlate(plateB) || plateA === plateB) {
    return (
      <div className="screen">
        <StateView
          icon="compare"
          title={t.compare.invalidTitle}
          body={t.compare.invalidBody}
          actions={[{ label: t.states.notFoundCta, icon: 'search', onClick: () => navigate('/') }]}
        />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__scroll reveal-stack">
        <p className="compare__intro">{t.compare.intro}</p>

        <table className="compare" aria-busy={loading || undefined}>
          <caption className="visually-hidden">{t.compare.title}</caption>
          <thead>
            <tr>
              <td className="compare__corner" />
              <ColumnHead plate={plateA} state={a} />
              <ColumnHead plate={plateB} state={b} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.differs ? 'compare__row--differs' : undefined}>
                <th scope="row" className="compare__label">
                  {row.label}
                </th>
                {row.values.map((value, i) => {
                  const state = i === 0 ? a : b;
                  return (
                    <td key={i} className="compare__value">
                      {state.loading ? <Skeleton width="70%" height={14} /> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="compare__legend">{t.compare.legend}</p>
      </div>

      <div className="screen__actions screen__actions--row">
        <Button
          label={t.compare.swap}
          title={t.compare.swapLabel}
          variant="secondary"
          icon="refresh"
          onClick={() => navigate(`/compare/${plateB}/${plateA}`, { replace: true })}
        />
        <Button label={t.vehicle.searchAgain} icon="search" onClick={() => navigate('/')} />
      </div>
    </div>
  );
}
