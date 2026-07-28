import { ImageResponse } from 'next/og';

export const alt = 'Barteløpet 2026 – Hver kilometer teller, for Prosjekt SUT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        background: '#13231b',
        color: '#f2f0e8',
        display: 'flex',
        height: '100%',
        padding: '56px 64px',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          border: '4px solid #c9f05a',
          bottom: 46,
          display: 'flex',
          position: 'absolute',
          right: 56,
          top: 46,
          transform: 'rotate(8deg)',
          width: 330,
        }}
      />
      <div
        style={{
          background: '#e8613a',
          bottom: 0,
          display: 'flex',
          height: 18,
          left: 0,
          position: 'absolute',
          width: '100%',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            color: '#c9f05a',
            display: 'flex',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Barteløpet 2026 · For Prosjekt SUT
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 0.8,
              textTransform: 'uppercase',
            }}
          >
            Hver kilometer
          </div>
          <div
            style={{
              color: '#c9f05a',
              display: 'flex',
              fontSize: 142,
              fontWeight: 900,
              letterSpacing: -7,
              lineHeight: 0.9,
              textTransform: 'uppercase',
            }}
          >
            teller.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          Løp hvor du vil · Hele november · 5 kr per km
        </div>
      </div>
    </div>,
    size
  );
}
