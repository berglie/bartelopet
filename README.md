# 🏃 Barteløpet

**En virtuell veldedighetsløp i Stavanger sentrum til støtte for mental helse gjennom Movember.**

🌐 **Nettside**: [www.barteløpet.no](https://www.barteløpet.no)
💰 **Spleis**: [spleis.no/barteløpet2025](https://spleis.no/barteløpet2025)

Bygget med Next.js 16, TypeScript og Supabase.

---

## 🎯 Om Barteløpet

Barteløpet er et årlig veldedighetsarrangement i Stavanger hvor deltakere løper en definert rute i sentrum i løpet av november. Arrangementet støtter mental helse bevissthet gjennom Movember.

**Slik fungerer det:**
- 🏃 Løp den definerte ruten i Stavanger sentrum når det passer deg i november
- 📸 Last opp bilder som bevis på gjennomføring
- 🗳️ Stem på andre deltakeres beste bilder
- 🏆 Alle deltakere får en trofé, med ekstra premier for de beste bildene
- 💜 Alle inntekter går til mental helse via Movember

Denne applikasjonen er nettsiden for Barteløpet-arrangementet.

## 🏗️ Arkitektur

Prosjektet følger et **Vertical Slices Architecture**-mønster hvor funksjoner er organisert som selvstendige moduler med kolokerte komponenter.

```
barteløpet/
├── app/                         # Next.js 16 App Router
│   ├── api/                    # API-ruter
│   ├── actions/                # Server Actions
│   ├── _shared/                # Delte komponenter og verktøy
│   │   ├── components/        # UI-komponenter (Radix UI)
│   │   ├── lib/               # Kjernebiblioteker
│   │   └── hooks/             # React hooks
│   ├── pamelding/             # Påmelding og innleveringsskjema
│   ├── deltakere/             # Deltakervisning
│   ├── galleri/               # Bildegalleri
│   ├── dashboard/             # Brukerdashboard
│   └── [andre-sider]/         # Statiske sider
├── supabase/                   # Database-migreringer
│   └── migrations/            # SQL-migreringsfiler
├── public/                     # Statiske filer
│   ├── bartelopet-2025.gpx   # Rutedefinisjon
│   └── images/                # Bilder
└── docs/                       # Dokumentasjon
```

## 🚀 Teknologi

### Kjerneteknologier
- **Rammeverk:** [Next.js 16](https://nextjs.org/) (App Router)
- **Språk:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI-komponenter:** Egendefinerte komponenter + [Radix UI](https://www.radix-ui.com/)

### Backend og Database
- **BaaS:** [Supabase](https://supabase.com/)
  - PostgreSQL-database
  - Autentisering (Magic links)
  - Fillagring
  - Row Level Security (RLS)
- **Rate Limiting:** [Upstash Redis](https://upstash.com/)
- **E-post:** [Resend](https://resend.com/)

### Tredjepartsintegrasjoner
- **Mapbox/MapLibre:** Rutevisualisering
- **Upstash Redis:** Rate limiting for API-endepunkter
- **GPX Parser:** Parsing av rutefiler

## 📋 Forutsetninger

- Node.js 18+
- pnpm (anbefalt) eller npm
- Supabase-konto
- Upstash Redis-konto (for rate limiting)
- Mapbox-konto (for kart)
- Resend-konto (for e-post)

## 🛠️ Installasjon

### 1. Klon repositoryet
```bash
git clone https://github.com/berglie/bartelopet.git
cd bartelopet
```

### 2. Installer avhengigheter
```bash
pnpm install
# eller
npm install
```

### 3. Miljøvariabeloppsett

Kopier eksempelfilen for miljøvariabler:
```bash
cp .env.example .env.local
```

Konfigurer følgende miljøvariabler i `.env.local`:

```bash
# Supabase (Påkrevd)
NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key

# Upstash Redis (Påkrevd for produksjon)
UPSTASH_REDIS_REST_URL=din_upstash_url
UPSTASH_REDIS_REST_TOKEN=din_upstash_token

# Mapbox (Påkrevd for kart)
NEXT_PUBLIC_MAPBOX_TOKEN=ditt_mapbox_token

# Resend (Påkrevd for kontaktskjema)
RESEND_API_KEY=din_resend_api_key
CONTACT_FORM_ADMIN_EMAIL=din-epost

# Applikasjon
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Se [`docs/setup/ENV_EXAMPLE.md`](docs/setup/ENV_EXAMPLE.md) for detaljert dokumentasjon om miljøvariabler.

### 4. Databaseoppsett

Kjør Supabase-migreringene:

```bash
# Migreringene finnes i supabase/migrations/
# Bruk dem i Supabase-dashboardet eller via Supabase CLI
```

Se [`docs/setup/SUPABASE_SETUP.md`](docs/setup/SUPABASE_SETUP.md) for detaljerte instruksjoner om databaseoppsett.

## 🚀 Utvikling

### Start utviklingsserveren
```bash
pnpm dev
# eller
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren din.

### Bygg for produksjon
```bash
pnpm build
# eller
npm run build
```

### Kjør produksjonsbygg lokalt
```bash
pnpm start
# eller
npm start
```

### Linting og typekontroll
```bash
pnpm lint        # Kjør ESLint
pnpm type-check  # Kjør TypeScript-typekontroll
```

## 🔑 Hovedfunksjoner

- **Brukerregistrering** - Magic link-autentisering via Supabase
- **Flere bildeopplastinger** - Deltakere kan laste opp flere gjennomføringsbilder
- **Stemme system** - Stem på de beste innleveringene
- **Galleri** - Bla gjennom alle innleveringer
- **Dashboard** - Personlig statistikk og administrasjon
- **Flrårstøtte** - Håndterer arrangementer på tvers av forskjellige år
- **Norsk lokalisering** - Fullstendig norsk UI

## 🗄️ Databaseskjema

Viktige tabeller:
- `participants` - Brukerregistreringer per år
- `completions` - Løpsinnleveringer
- `completion_images` - Flere bilder per innlevering
- `votes` - Stemmeposter
- `photo_comments` - Kommentarer på innleveringer

## 🔒 Sikkerhet

- Row Level Security (RLS) på alle tabeller
- Rate limiting på API-endepunkter
- Inputvalidering med Zod
- CSRF-beskyttelse (Next.js innebygd)
- Sikker filopplastingsvalidering
- Sikkerhetshoder (CSP, HSTS, X-Frame-Options, etc.)

Se [`SECURITY.md`](SECURITY.md) for detaljer om sikkerhetsretningslinjer.

## 📚 Dokumentasjon

- [`/docs/setup/`](docs/setup/) - Oppsett- og konfigurasjonsveiledninger
- [`/docs/features/`](docs/features/) - Funksjonsspesifikk dokumentasjon
- [`/docs/database/`](docs/database/) - Databasedokumentasjon
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Arkitekturoversikt
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Bidragsretningslinjer

## 🚢 Distribusjon

Applikasjonen er optimalisert for distribusjon på [Vercel](https://vercel.com/):

1. Push koden din til GitHub
2. Importer prosjektet til Vercel
3. Konfigurer miljøvariabler
4. Distribuer

## 🤝 Bidra

Vi setter pris på bidrag! Se [`CONTRIBUTING.md`](CONTRIBUTING.md) for retningslinjer.

1. Fork repositoryet
2. Opprett en feature branch (`git checkout -b feature/fantastisk-funksjon`)
3. Commit endringene dine (`git commit -m 'Legg til fantastisk funksjon'`)
4. Push til branchen (`git push origin feature/fantastisk-funksjon`)
5. Åpne en Pull Request

## 📝 Kjente problemer

### Avhengighetssårbarheter
Det er kjente sårbarheter i `gpxparser`-pakken (v3.0.8) som kommer fra utdaterte avhengigheter (`jsdom`, `request`). Disse brukes kun server-side for parsing av GPX-filer og utgjør ingen direkte sikkerhetsrisiko for brukere. Vi overvåker situasjonen og vil oppdatere når en ny versjon er tilgjengelig.

## 📄 Lisens

Dette prosjektet er open source under MIT License. Se [LICENSE](LICENSE) for detaljer.

Utviklet for Barteløpet av ÅpenAid til støtte for mental helse gjennom Movember 💜

## 🆘 Støtte

For problemer og spørsmål, vennligst åpne en issue i GitHub-repositoryet eller kontakt oss via kontaktskjemaet på nettsiden.

---

Bygget med ❤️ for å støtte mental helse bevissthet gjennom Movember
