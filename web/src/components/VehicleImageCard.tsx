/**
 * Illustrative photo of the MODEL, from Wikipedia.
 *
 * This is deliberately captioned as an illustration rather than presented as
 * the vehicle: Wikipedia can only supply some example of the model, which may
 * differ in year, trim and colour. The caption is part of the feature, not
 * decoration — without it the image would misrepresent the record.
 */
import { useState } from 'react';
import { t } from '@/i18n';
import type { VehicleImage } from '@/lib/vehicleImage';

interface VehicleImageCardProps {
  image: VehicleImage | null | undefined;
}

export function VehicleImageCard({ image }: VehicleImageCardProps) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) return null;

  return (
    <figure className="vehicle-image">
      <img
        className="vehicle-image__img"
        src={image.url}
        alt={image.articleTitle}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      <figcaption className="vehicle-image__caption">
        <strong className="vehicle-image__warning">{t.image.caption}</strong>
        <span className="vehicle-image__detail">{t.image.detail}</span>
        <a
          className="vehicle-image__credit"
          href={image.articleUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t.image.credit}: {image.articleTitle}
        </a>
      </figcaption>
    </figure>
  );
}
