# 🏃 Barteløpet

[![Deploy Production](https://github.com/berglie/bartelopet/actions/workflows/cd-prod.yaml/badge.svg)](https://github.com/berglie/bartelopet/actions/workflows/cd-prod.yaml)
[![CI](https://github.com/berglie/bartelopet/actions/workflows/ci.yaml/badge.svg)](https://github.com/berglie/bartelopet/actions/workflows/ci.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **En virtuell veldedighetsløp i Stavanger sentrum til støtte for mental helse gjennom Movember** 💜

<div align="center">

🌐 **[www.barteløpet.no](https://www.barteløpet.no)** |
💰 **[Støtt på Spleis](https://spleis.no/barteløpet2025)**

</div>

---

**✨ Bygget med moderne teknologi:** Next.js 16 • TypeScript • Supabase • Tailwind CSS

---

## 🎯 Om Barteløpet

Barteløpet er et årlig veldedighetsarrangement i Stavanger hvor deltakere løper en definert rute i sentrum i løpet av november. Arrangementet støtter mental helse bevissthet gjennom Movember.

### 🚀 Slik fungerer det

| Steg            | Beskrivelse                                                               |
| --------------- | ------------------------------------------------------------------------- |
| **1. Løp** 🏃   | Løp den definerte ruten i Stavanger sentrum når det passer deg i november |
| **2. Del** 📸   | Last opp bilder som bevis på gjennomføring                                |
| **3. Stem** 🗳️  | Stem på andre deltakeres beste bilder                                     |
| **4. Vinn** 🏆  | Alle deltakere får en trofé, med ekstra premier for de beste bildene      |
| **5. Støtt** 💜 | Alle inntekter går til mental helse via Movember                          |

> 📱 **Denne applikasjonen** er den offisielle nettsiden for Barteløpet-arrangementet.

## ⚡ Quick Start

```bash
# Klon repositoryet
git clone https://github.com/berglie/bartelopet.git && cd bartelopet

# Installer avhengigheter
pnpm install

# Sett opp miljøvariabler
cp .env.example .env.local
# ✏️ Rediger .env.local med dine API-nøkler

# Start utviklingsserveren
pnpm dev
```

🎉 **Applikasjonen kjører nå på** [http://localhost:3000](http://localhost:3000)

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

## 🚀 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend

- 🎨 **[Next.js 16](https://nextjs.org/)** - App Router
- 🔷 **[TypeScript](https://www.typescriptlang.org/)** - Strict mode
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- 🧩 **[Radix UI](https://www.radix-ui.com/)** - UI komponenter

</td>
<td valign="top" width="33%">

### Backend & Database

- 🔥 **[Supabase](https://supabase.com/)** - BaaS
  - PostgreSQL database
  - Magic link auth
  - File storage
  - Row Level Security
- ⚡ **[Upstash Redis](https://upstash.com/)** - Rate limiting
- 📧 **[Resend](https://resend.com/)** - E-post

</td>
<td valign="top" width="33%">

### Integrasjoner

- 🗺️ **Mapbox/MapLibre** - Kart
- 📍 **GPX Parser** - Rutefiler
- 🔐 **Zod** - Validering
- 📊 **Analytics** - Brukerinnsikt

</td>
</tr>
</table>

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

### 🪝 Git Hooks

Prosjektet bruker git hooks for å sikre kodekvalitet:

- **Pre-commit**: Formaterer automatisk alle staged filer med Prettier
- Hooks installeres automatisk når du kjører `pnpm install` (hoppes over i CI/Vercel)
- Sikrer konsistent kodeformatering på tvers av teamet

```bash
# Manuelt installer/reinstaller hooks
pnpm hooks:install

# Hoppe over hooks (kun i nødstilfeller)
git commit --no-verify
```

## 🔑 Hovedfunksjoner

<details>
<summary><b>✨ Klikk for å se alle funksjoner</b></summary>

| Funksjon                     | Beskrivelse                                   |
| ---------------------------- | --------------------------------------------- |
| 🔐 **Magic Link Auth**       | Sikker pålogging uten passord via Supabase    |
| 📸 **Multi-bildeopplasting** | Last opp flere bilder per gjennomføring       |
| 🗳️ **Stemmesystem**          | Stem på de beste bidragene                    |
| 🖼️ **Bildegalleri**          | Interaktivt galleri med alle innleveringer    |
| 📊 **Dashboard**             | Personlig statistikk og administrasjon        |
| 📅 **Flerårstøtte**          | Håndterer flere år med separate arrangementer |
| 🇳🇴 **100% Norsk**            | Fullstendig norsk brukergrensesnitt           |
| 📱 **Responsiv**             | Fungerer på mobil, tablet og desktop          |
| ⚡ **Rask**                  | Optimalisert ytelse med Next.js 16            |
| 🔒 **Sikker**                | Row Level Security og rate limiting           |

</details>

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

## 🚢 Deployment

### Automatisk CI/CD Pipeline

Prosjektet bruker GitHub Actions for automatisk deployment:

| Miljø             | Trigger         | Workflow                                               | Beskrivelse                                         |
| ----------------- | --------------- | ------------------------------------------------------ | --------------------------------------------------- |
| **🔵 Preview**    | Pull Request    | [`cd-preview.yaml`](.github/workflows/cd-preview.yaml) | Automatisk deploy av preview-miljø for hver PR      |
| **🟢 Produksjon** | Push til `main` | [`cd-prod.yaml`](.github/workflows/cd-prod.yaml)       | Automatisk deploy til produksjon ved merge til main |

#### Arbeidsflyt

1. **🔀 Lag en Pull Request** → Preview-miljø deployes automatisk
2. **✅ Review og test** → Test endringene i preview-miljøet
3. **🔄 Merge til main** → Produksjon oppdateres automatisk
4. **🚀 Live!** → Endringene er live på [barteløpet.no](https://www.barteløpet.no)

</details>

## 🤝 Bidra

Vi setter pris på bidrag! Se [`CONTRIBUTING.md`](CONTRIBUTING.md) for retningslinjer.

1. Fork repositoryet
2. Opprett en feature branch (`git checkout -b feature/fantastisk-funksjon`)
3. Commit endringene dine (`git commit -m 'Legg til fantastisk funksjon'`)
4. Push til branchen (`git push origin feature/fantastisk-funksjon`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er open source under MIT License. Se [LICENSE](LICENSE) for detaljer.

Utviklet for Barteløpet av ÅpenAid til støtte for mental helse gjennom Movember 💜

## 👥 Bidragsytere

<a href="https://github.com/berglie/bartelopet/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=berglie/bartelopet" />
</a>

_Laget med [contrib.rocks](https://contrib.rocks)._

## 🆘 Støtte

Trenger du hjelp? Vi er her for deg!

- 🐛 **Funnet en bug?** [Åpne en issue](https://github.com/berglie/bartelopet/issues/new?template=bug_report.md)
- 💡 **Har en idé?** [Foreslå en ny funksjon](https://github.com/berglie/bartelopet/issues/new?template=feature_request.md)
- 💬 **Generelle spørsmål?** [Start en diskusjon](https://github.com/berglie/bartelopet/discussions)

---

<div align="center">

**Bygget med ❤️ av ÅpenAid**

_Støtter mental helse bevissthet gjennom Movember_ 💜

[![GitHub Stars](https://img.shields.io/github/stars/berglie/bartelopet?style=social)](https://github.com/berglie/bartelopet)

[**Topp ↑**](#-barteløpet)

</div>
