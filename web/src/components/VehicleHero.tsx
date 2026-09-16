/**
 * Top of the result screen: the model photo, the plate, and — finally — what
 * the car actually is, as a heading, instead of leaving the reader to piece it
 * together from rows one and two of the registry table.
 *
 * The photo is Wikipedia's picture of the MODEL, not this vehicle, so the
 * "illustration only" caption sits on the photo itself where it can't be
 * missed, with the detail and credit at the foot of the card.
 */
import { useState, type Ref } from 'react';
import { t } from '@/i18n';
import type { VehicleImage } from '@/lib/vehicleImage';
import { PlateBadge } from './PlateBadge';

interface VehicleHeroProps {
  plate: string;
  name: string | null;
  /** "2019 · Luxury · רכב פרטי" — whatever is known, already joined. */
  meta: string;
  image: VehicleImage | null | undefined;
  imageLoading: boolean;
  /** Attached to the plate so the page can tell when it scrolls away. */
  plateRef?: Ref<HTMLDivElement>;
}

export function VehicleHero({ plate, name, meta, image, imageLoading, plateRef }: VehicleHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const shownImage = image && !imageFailed ? image : null;
  const hasMedia = shownImage !== null || imageLoading;

  return (
    <section className={`vehicle-hero${hasMedia ? ' vehicle-hero--media' : ''}`}>
      {imageLoading && (
        <div className="vehicle-hero__media vehicle-hero__media--loading" role="status">
          <span className="visually-hidden">{t.vehicle.imageLoading}</span>
        </div>
      )}

      {shownImage && (
        <figure className="vehicle-hero__media">
          <img
            className="vehicle-hero__img"
            src={shownImage.url}
            alt={shownImage.articleTitle}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
          <figcaption className="vehicle-hero__caption">{t.image.caption}</figcaption>
        </figure>
      )}

      <div className="vehicle-hero__body">
        <div className="vehicle-hero__plate" ref={plateRef}>
          <PlateBadge plate={plate} size="lg" hero />
        </div>
        <h2 className="vehicle-hero__name">{name ?? t.vehicle.unnamed}</h2>
        {meta && <p className="vehicle-hero__meta">{meta}</p>}
      </div>

      {shownImage && (
        <p className="vehicle-hero__attribution">
          {t.image.detail}{' '}
          <a href={shownImage.articleUrl} target="_blank" rel="noreferrer noopener">
            {t.image.credit}: {shownImage.articleTitle}
          </a>
        </p>
      )}
    </section>
  );
}
