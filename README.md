# Barteløpet - Barfotløp for veldedighet

En moderne webapplikasjon for å registrere, dele og stemme på barfotløp for veldedighet.

## Teknologistack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS med earth tone fargepalett
- **Backend:** Supabase (PostgreSQL, Authentication, Storage)
- **Validering:** Zod
- **Forms:** React Hook Form
- **Ikoner:** Lucide React
- **Bildeprosessering:** Sharp

## Prosjektstruktur

```
barteløpet/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Autentiseringsruter
│   ├── (protected)/              # Beskyttede ruter
│   ├── api/                      # API ruter
│   ├── globals.css               # Globale stiler
│   ├── layout.tsx                # Rot layout
│   └── page.tsx                  # Hjemmeside
│
├── components/                   # React komponenter
│   ├── ui/                       # Basis UI komponenter
│   ├── layout/                   # Layout komponenter
│   ├── forms/                    # Skjemakomponenter
│   ├── gallery/                  # Gallerikomponenter
│   ├── participants/             # Deltakerkomponenter
│   ├── upload/                   # Opplastingskomponenter
│   └── providers/                # Context providers
│
├── lib/                          # Kjernebiblioteker
│   ├── supabase/                 # Supabase klienter
│   ├── validations/              # Zod schemas
│   ├── utils/                    # Hjelpefunksjoner
│   └── constants/                # Konstanter
│
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript typer
└── public/                       # Statiske filer

## Kom i gang

### Forutsetninger

- Node.js 18+ og npm
- Supabase-konto og prosjekt

### Installasjon

1. Klon repositoriet:
```bash
git clone <repository-url>
cd barteløpet
```

2. Installer avhengigheter:
```bash
npm install
```

3. Kopier environment variabler:
```bash
cp .env.example .env.local
```

4. Fyll inn Supabase credentials i `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Kjør utviklingsserveren:
```bash
npm run dev
```

6. Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Database oppsett

Database migreringer og RLS policies må settes opp i Supabase:

Se `ARCHITECTURE.md` for fullstendig database schema og setup instruksjoner.

### Hovedtabeller:
- `participants` - Brukerprofile r og statistikk
- `completions` - Løpsgjennomføringer med bilder
- `votes` - Stemmer på gjennomføringer

### Storage buckets:
- `completions` - Løpsbilder (originaler og thumbnails)
- `avatars` - Brukeravatarer

## Tilgjengelige scripts

- `npm run dev` - Start utviklingsserver
- `npm run build` - Bygg for produksjon
- `npm start` - Start produksjonsserver
- `npm run lint` - Kjør ESLint
- `npm run type-check` - Kjør TypeScript type checking

## Fargepalett (Earth Tones)

Prosjektet bruker en earth tone fargepalett som representerer naturlig, barfot løping:

- **Primary (Brun):** `#8c7355` - Jordfarger
- **Accent (Grønn):** `#42896f` - Skogsgrønn

Se `tailwind.config.ts` for fullstendig fargepalett.

## Arkitektur

Prosjektet følger Next.js 14 App Router beste praksis:

- **Server Components** som standard for datahenting
- **Client Components** (`'use client'`) kun for interaktivitet
- **API Routes** for server-side logikk
- **Middleware** for autentiseringstoken refresh
- **Row Level Security (RLS)** på database-nivå

Les `ARCHITECTURE.md` for detaljert arkitekturdokumentasjon.

## Språk

Hele applikasjonen er bygget med norsk språk (nb-NO):
- UI tekster og meldinger
- Feilmeldinger og validering
- Datoformatering
- Tall og enheter

## Sikkerhetsaspekter

- Magic link autentisering (passordløs)
- Row Level Security (RLS) policies
- Input validering (client + server)
- Filstørrelse og type validering
- HTTPS-only i produksjon
- Content Security Policy headers

## Deployment

Prosjektet er optimalisert for deployment på Vercel:

1. Push koden til GitHub
2. Koble til Vercel
3. Konfigurer environment variabler
4. Deploy!

Supabase database og storage håndteres separat.

## Lisens

Privat prosjekt

## Kontakt

For spørsmål, kontakt prosjektteamet.
