/**
 * Share image for a vehicle: the plate, what the car is, and the site name,
 * at the 1200×630 size link previews use. A Node.js Vercel Function: satori
 * lays the card out as SVG and resvg rasterises it. Fonts are fetched from
 * /og so the image matches the app's type.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { isValidPlate, normalizePlate } from '../src/lib/plate';
import { fetchVehicleMeta } from '../server/vehicleMeta';
import { rtlTokens } from '../server/rtlTokens';

const WIDTH = 1200;
const HEIGHT = 630;

/** One right-to-left line: words laid out right to left (see rtlTokens). */
function RtlLine({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: Math.round(fontSize * 0.28),
        fontSize,
        color,
        maxWidth: 1040,
      }}
    >
      {rtlTokens(text).map((token, i) => (
        <div key={i} style={{ display: 'flex' }}>
          {token}
        </div>
      ))}
    </div>
  );
}

async function font(origin: string, file: string, fetchImpl: typeof fetch): Promise<ArrayBuffer> {
  const response = await fetchImpl(new URL(`/og/${file}`, origin));
  if (!response.ok) throw new Error(`font ${file}: HTTP ${response.status}`);
  return response.arrayBuffer();
}

export async function GET(request: Request, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  const plate = normalizePlate(url.searchParams.get('plate') ?? '');
  if (!isValidPlate(plate)) return new Response('Invalid plate', { status: 400 });

  const [meta, hebrew, latin, figures] = await Promise.all([
    fetchVehicleMeta(plate, fetchImpl),
    font(url.origin, 'plex-hebrew-700.woff', fetchImpl),
    font(url.origin, 'plex-latin-700.woff', fetchImpl),
    font(url.origin, 'barlow-condensed-700.woff', fetchImpl),
  ]);

  const carLine = [meta.name, meta.year].filter(Boolean).join(' ');

  const svg = await satori(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          background: 'radial-gradient(circle at 50% 0%, #3a3210 0%, #0f1115 60%)',
          color: '#f1f2f4',
          fontFamily: 'Plex',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            padding: '26px 48px',
            background: 'linear-gradient(180deg, #ffd83d, #f4c400 55%, #d9ae00)',
            border: '8px solid #111111',
            borderRadius: 28,
            boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '8px 14px',
              background: '#0033a0',
              color: '#ffffff',
              borderRadius: 10,
              fontSize: 44,
            }}
          >
            IL
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Barlow',
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: 6,
              color: '#111111',
            }}
          >
            {meta.formattedPlate}
          </div>
        </div>

        {carLine && <RtlLine text={carLine} fontSize={64} color="#f1f2f4" />}

        <RtlLine text="איתור לוחית · נתוני משרד התחבורה" fontSize={30} color="#9aa1ac" />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Plex', data: hebrew, weight: 700, style: 'normal' },
        { name: 'Plex', data: latin, weight: 700, style: 'normal' },
        { name: 'Barlow', data: figures, weight: 700, style: 'normal' },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      // Registry facts barely change; let previews and the CDN cache it.
      'cache-control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
