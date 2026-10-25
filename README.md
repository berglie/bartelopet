# 🏃 Barteløpet

[![Deploy Production](https://github.com/berglie/bartelopet/actions/workflows/cd-prod.yaml/badge.svg)](https://github.com/berglie/bartelopet/actions/workflows/cd-prod.yaml)
[![CI](https://github.com/berglie/bartelopet/actions/workflows/ci.yaml/badge.svg)](https://github.com/berglie/bartelopet/actions/workflows/ci.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Et gratis, virtuelt veldedighetsløp i november til støtte for Prosjekt SUT** 💜

<div align="center">

🌐 **[www.barteløpet.no](https://www.barteløpet.no)**

</div>

---

## 🎯 Om Barteløpet

Barteløpet er et frivillig initiativ i november. Deltakerne løper eller går der de vil, registrerer
turene sine på nettsiden og samler lodd i en trekning av startnummer som løpeklubber og arrangører
har donert. Vi oppfordrer til å gi 5 kr per kilometer til
[Prosjekt SUT](https://www.sandnesultratrail.com/prosjekt-sut), et gratis treningsfellesskap drevet
i samarbeid med A-larm Rogaland, Dale fjelløpere og Sandnes Ultratrail. Barteløpet er ikke tilknyttet
Movember Foundation.

### 🚀 Slik fungerer det (2026)

| Steg                   | Beskrivelse                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1. Meld deg på** 📝  | Gratis påmelding. Velg premiekategoriene du vil være med i: Kort (opptil 10 km), Mellom (10–30 km), Lang (30+ km) |
| **2. Løp eller gå** 🏃 | Én tur per dag i november, minst 1 km. All bevegelse teller                                                       |
| **3. Registrer** 🎟️    | Hver kilometer gir ett lodd i hver valgt kategori turen er lang nok til                                           |
| **4. Gi om du kan** 💜 | Frivillig gave via Spleis. Gaver påvirker ikke trekningen                                                         |
| **5. Trekning** 🏆     | Etter november trekkes startnumrene, lengste løp først, én premie per deltaker                                    |

Reglene er forklart for deltakerne på [`/trekning`](https://www.barteløpet.no/trekning).

> ⚖️ **Lodd fås bare gjennom aktivitet, aldri ved å gi penger.** En gave som betingelse for lodd ville
> vært innsats etter pengespilloven § 2, og Spleis tillater ikke trekning blant givere. Ikke koble
> gaver og lodd sammen i kode eller tekst.

2025-utgaven (fast rute i Stavanger, bildegalleri og avstemning) ligger som arkiv på `?year=2025`.

## ⚡ Kom i gang

```bash
git clone https://github.com/berglie/bartelopet.git && cd bartelopet
pnpm install
cp .env.example .env.local   # fyll inn nøklene, se .env.example
pnpm dev                     # http://localhost:3000
```

I utvikling vises realistiske demodata på forsiden hvis Supabase ikke svarer eller ikke har turer.
Sett `BARTELOPET_USE_MOCK_DATA=true` for å alltid bruke dem, eller `false` for å skru dem av.

### Kommandoer

| Kommando            | Beskrivelse                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Utviklingsserver                  |
| `pnpm build`        | Produksjonsbygg                   |
| `pnpm lint`         | ESLint                            |
| `pnpm type-check`   | TypeScript-typekontroll           |
| `pnpm format:check` | Prettier-sjekk (kjøres også i CI) |

Git-hooks installeres ved `pnpm install`. Pre-commit formaterer staged filer med Prettier, og
commit-meldinger følger [Conventional Commits](https://www.conventionalcommits.org/) (sjekkes av
commitlint).

## 🏗️ Struktur

```
app/
├── _components/        # Forsiden 2026, bartelinjen, navigasjon
├── _shared/            # Delte komponenter, Supabase-klienter, typer, validering
├── actions/            # Server Actions (turer, admin, trekning)
├── admin/              # Arrangørside: innstillinger, premier og trekning
├── dashboard/          # Min side: turer, kategorier og lodd
├── deltakere/          # Løpere og lodd
├── pamelding/          # Påmelding
├── premier/            # Startnummer og vinnere
├── trekning/           # Forklaring av lodd og trekning, med FAQ
└── galleri/ …          # 2025-arkivet
supabase/migrations/    # SQL-migreringer (kjøres i rekkefølge)
docs/                   # Drift- og utgivelsesdokumentasjon
```

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Radix UI ·
Supabase (Postgres, auth med magic link og Google, storage, RLS) · Zod · Resend (kontaktskjema) · Mapbox/MapLibre (2025-ruten).

## 🗄️ Database (2026)

| Tabell / view                                         | Innhold                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `event_editions`                                      | Årets innstillinger: påmelding, turregistrering, publisering   |
| `distance_categories`                                 | Premiekategoriene Kort, Mellom og Lang                         |
| `participants`, `participant_distance_interests`      | Deltakere og valgte kategorier                                 |
| `runs`                                                | Registrerte turer (én per dag, 3–120 km etter avrunding)       |
| `eligible_entries`                                    | Lodd per tur og kategori (`ROUND(km)` lodd)                    |
| `category_ticket_totals`, `participant_ticket_totals` | Loddsummer. Bruk disse, ikke summer `eligible_entries` i appen |
| `race_prizes`, `draw_results`                         | Startnummer og trekninger, med historikk over annulleringer    |

Trekningen skjer i `draw_race_prize()`. Den krever at påmelding og turregistrering er stengt,
trekker lengste premie først og gir hvert lodd lik sjanse med `gen_random_uuid()`.

Supabase-API-et returnerer maks 1000 rader per spørring. Lister som kan bli lengre hentes med
`fetchAll()` fra `app/_shared/lib/supabase/fetch-all.ts`.

Mer om produksjonsoppsett, administratorrolle og reglene i databasen står i
[`docs/BARTELOPET_2026.md`](docs/BARTELOPET_2026.md).

## 🚢 Deployment

| Miljø             | Trigger         | Workflow                                               |
| ----------------- | --------------- | ------------------------------------------------------ |
| **🔵 Preview**    | Pull Request    | [`cd-preview.yaml`](.github/workflows/cd-preview.yaml) |
| **🟢 Produksjon** | Push til `main` | [`cd-prod.yaml`](.github/workflows/cd-prod.yaml)       |

Databasemigreringer kjøres automatisk med `supabase db push` før utrulling: preview-workflowen mot
preview-databasen og prod-workflowen mot produksjonsdatabasen. Endre aldri policyer eller rettigheter
for hånd i Supabase-dashboardet; legg dem i en ny migrasjon, ellers skiller databasene lag. Utgivelser er beskrevet i [`docs/RELEASE.md`](docs/RELEASE.md).

## 🤝 Bidra

Se [`CONTRIBUTING.md`](CONTRIBUTING.md) og [`SECURITY.md`](SECURITY.md).

## 📄 Lisens

MIT. Se [LICENSE](LICENSE).

<div align="center">

**Bygget med ❤️ av ÅpenAid**

</div>
