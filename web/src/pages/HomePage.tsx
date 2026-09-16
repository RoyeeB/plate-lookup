import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { useRecentSearches } from '@/api/queries';
import { PlateInput } from '@/components/PlateInput';
import { Button } from '@/components/Button';
import { RecentSearches } from '@/components/RecentSearches';

export default function HomePage() {
  const [plate, setPlate] = useState('');
  const [showError, setShowError] = useState(false);
  const { recent, add, clear, refresh } = useRecentSearches();
  const navigate = useNavigate();

  // Refresh history whenever we return to Home (e.g. via the back button).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const goToVehicle = useCallback(
    (raw: string) => {
      const normalized = normalizePlate(raw);
      if (!isValidPlate(normalized)) {
        setShowError(true);
        return;
      }
      add(normalized);
      navigate(`/vehicle/${normalized}`);
    },
    [add, navigate]
  );

  const onSearch = useCallback(() => goToVehicle(plate), [goToVehicle, plate]);

  return (
    <div className="screen">
      <div className="screen__scroll">
        <header>
          <h1 className="home__title">{t.home.title}</h1>
          <p className="home__subtitle">{t.home.subtitle}</p>
        </header>

        <PlateInput
          value={plate}
          onChange={(text) => {
            setPlate(text);
            if (showError) setShowError(false);
          }}
          onSubmit={onSearch}
          placeholder={t.home.platePlaceholder}
          autoFocus
        />
        {showError && (
          <p className="form-error" role="alert">
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
        <Button
          label={t.home.searchButton}
          icon="search"
          variant="primary"
          onClick={onSearch}
          disabled={!isValidPlate(plate)}
        />
      </div>
    </div>
  );
}
