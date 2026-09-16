import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { navigateWithPlateMorph, shake } from '@/lib/motion';
import { useRecentSearches } from '@/api/queries';
import { PlateInput } from '@/components/PlateInput';
import { Button } from '@/components/Button';
import { RecentSearches } from '@/components/RecentSearches';

export default function HomePage() {
  const [plate, setPlate] = useState('');
  const [showError, setShowError] = useState(false);
  const { recent, add, clear, refresh } = useRecentSearches();
  const navigate = useNavigate();
  const errorId = useId();
  const plateFieldRef = useRef<HTMLDivElement>(null);

  // Refresh history whenever we return to Home (e.g. via the back button).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const goToVehicle = useCallback(
    (raw: string, source: Element | null) => {
      const normalized = normalizePlate(raw);
      if (!isValidPlate(normalized)) {
        setShowError(true);
        shake(plateFieldRef.current);
        return;
      }
      add(normalized);
      navigateWithPlateMorph(source, () => navigate(`/vehicle/${normalized}`));
    },
    [add, navigate]
  );

  const onSearch = useCallback(
    () => goToVehicle(plate, plateFieldRef.current),
    [goToVehicle, plate]
  );

  return (
    <div className="screen">
      <div className="screen__scroll reveal-stack">
        {/* The app header already carries the page's h1. */}
        <div>
          <h2 className="home__title">{t.home.title}</h2>
          <p className="home__subtitle">{t.home.subtitle}</p>
        </div>

        <div ref={plateFieldRef} className="home__plate">
          <PlateInput
            value={plate}
            onChange={(text) => {
              setPlate(text);
              if (showError) setShowError(false);
            }}
            onSubmit={onSearch}
            placeholder={t.home.platePlaceholder}
            invalid={showError}
            valid={isValidPlate(plate)}
            describedBy={showError ? errorId : undefined}
            autoFocus
          />
        </div>
        {showError && (
          <p id={errorId} className="form-error" role="alert">
            {t.home.invalidPlate}
          </p>
        )}

        <RecentSearches
          items={recent}
          onSelect={goToVehicle}
          onClear={clear}
        />
      </div>

      {/* Bottom-anchored primary actions for one-handed use */}
      <div className="screen__actions">
        <Button
          label={t.home.scanButton}
          icon="camera"
          variant="plate"
          onClick={() => navigate('/scan')}
        />
        {/* Deliberately never disabled: a greyed-out button can't say what's
            wrong, whereas pressing it explains the plate format. */}
        <Button
          label={t.home.searchButton}
          icon="search"
          variant="primary"
          onClick={onSearch}
        />
      </div>
    </div>
  );
}
