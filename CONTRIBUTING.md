# Bidragsretningslinjer for Barteløpet

Takk for at du vurderer å bidra til Barteløpet! Vi setter pris på all hjelp, enten det er feilrapporter, funksjonforespørsler, dokumentasjonsforbedringer eller kodebidrag.

## 📋 Innholdsfortegnelse

- [Hvordan kan jeg bidra?](#hvordan-kan-jeg-bidra)
- [Utviklingsoppsett](#utviklingsoppsett)
- [Kodestandard](#kodestandard)
- [Commit-retningslinjer](#commit-retningslinjer)
- [Pull Request-prosess](#pull-request-prosess)
- [Rapportering av sikkerhetssårbarheter](#rapportering-av-sikkerhetssårbarheter)

## Hvordan kan jeg bidra?

### 🐛 Rapportere bugs

Hvis du finner en bug, vennligst opprett en issue med følgende informasjon:

- **Beskrivelse**: En klar og kortfattet beskrivelse av problemet
- **Steg for å reprodusere**: Detaljerte steg for å reprodusere feilen
- **Forventet oppførsel**: Hva du forventet skulle skje
- **Faktisk oppførsel**: Hva som faktisk skjedde
- **Skjermbilder**: Hvis relevant
- **Miljø**:
  - OS (f.eks. macOS 14.0, Ubuntu 22.04)
  - Nettleser og versjon (f.eks. Chrome 120, Firefox 121)
  - Node.js-versjon
- **Ekstra kontekst**: Annen relevant informasjon

### 💡 Foreslå nye funksjoner

Vi er åpne for forslag! Før du foreslår en ny funksjon:

1. Sjekk om det allerede finnes en lignende issue
2. Opprett en ny issue med label `enhancement`
3. Beskriv funksjonen detaljert:
   - **Hva** ønsker du å legge til?
   - **Hvorfor** er denne funksjonen nyttig?
   - **Hvordan** ser du for deg at den skal fungere?

### 📝 Forbedre dokumentasjon

Dokumentasjon er like viktig som kode! Du kan bidra ved å:

- Rette skrivefeil eller grammatikkfeil
- Forbedre eksisterende forklaringer
- Legge til manglende dokumentasjon
- Oversette dokumentasjon
- Legge til flere eksempler

## Utviklingsoppsett

### Forutsetninger

- Node.js 18 eller høyere
- pnpm 9.0.0 (anbefalt) eller npm
- Git

### Oppsett

1. **Fork repositoryet**

   ```bash
   # Klikk på "Fork"-knappen på GitHub
   ```

2. **Klon din fork**

   ```bash
   git clone https://github.com/ditt-brukernavn/bartelopet.git
   cd bartelopet
   ```

3. **Legg til upstream remote**

   ```bash
   git remote add upstream https://github.com/berglie/bartelopet.git
   ```

4. **Installer avhengigheter**

   ```bash
   pnpm install
   ```

5. **Sett opp miljøvariabler**

   ```bash
   cp .env.example .env.local
   # Rediger .env.local med dine verdier
   ```

6. **Kjør utviklingsserveren**
   ```bash
   pnpm dev
   ```

### Holde din fork oppdatert

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Kodestandard

### Teknologier og verktøy

- **TypeScript**: Alle nye filer må være TypeScript (.ts/.tsx)
- **ESLint**: Kjør `pnpm lint` for å sjekke koden din
- **Prettier**: Koden formateres automatisk (integrert i ESLint)
- **Type-checking**: Kjør `pnpm type-check` før du committer

### Best Practices

#### TypeScript

```typescript
// ✅ Bra: Bruk strict typing
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Dårlig: Unngå 'any'
function getUser(id: any): any {
  // ...
}
```

#### React-komponenter

```typescript
// ✅ Bra: Bruk funksjonelle komponenter med TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ✅ Bra: Bruk 'use client' kun når nødvendig
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  // ...
}
```

#### Server Actions

```typescript
// ✅ Bra: Bruk 'use server' og valider input
'use server';

import { z } from 'zod';
import { createClient } from '@/app/_shared/lib/supabase/server';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

export async function createParticipant(formData: FormData) {
  const validatedData = schema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  const supabase = await createClient();
  // ...
}
```

#### Filstruktur

```
app/
├── feature-navn/
│   ├── page.tsx              # Ruteside
│   ├── _components/          # Komponenter spesifikke for denne featuren
│   │   ├── component-name.tsx
│   │   └── index.ts          # Re-export komponenter
│   └── _utils/               # Verktøyfunksjoner for denne featuren
└── _shared/                  # Delte ressurser
    ├── components/           # Delte UI-komponenter
    ├── lib/                  # Delte biblioteker
    └── hooks/                # Delte React hooks
```

### Kodegjennomgang Checklist

Før du sender inn en PR, sjekk følgende:

- [ ] Koden kompilerer uten feil (`pnpm build`)
- [ ] Linting passerer (`pnpm lint`)
- [ ] Type-checking passerer (`pnpm type-check`)
- [ ] Ingen `console.log` eller debugging-kode er igjen
- [ ] Ingen personlig informasjon eller hemmeligheter er commited
- [ ] Komponenter har riktige TypeScript-typer
- [ ] Nye funksjoner har dokumentasjon
- [ ] Koden følger eksisterende mønstre og stil

## Commit-retningslinjer

Vi følger [Conventional Commits](https://www.conventionalcommits.org/)-standarden.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Typer

- `feat`: En ny funksjon
- `fix`: En bugfiks
- `docs`: Kun dokumentasjonsendringer
- `style`: Endringer som ikke påvirker kodens betydning (whitespace, formatering)
- `refactor`: En kodeendring som verken fikser en bug eller legger til en funksjon
- `perf`: En kodeendring som forbedrer ytelsen
- `test`: Legge til manglende tester eller rette eksisterende tester
- `chore`: Endringer i byggeprosessen eller hjelpeverktøy

### Eksempler

```bash
feat(gallery): legg til filtrering etter år
fix(auth): fiks magic link utløpsproblem
docs(readme): oppdater installasjonsinstruksjoner
refactor(api): forenkle kontaktskjema-validering
chore(deps): oppdater next.js til v16
```

### Commit-meldinger på norsk eller engelsk?

- **Commit-meldinger**: Kan være på enten norsk eller engelsk
- **Kode og kommentarer**: Foretrekkes på engelsk
- **Brukervendte meldinger**: Må være på norsk

## Pull Request-prosess

### 1. Opprett en branch

```bash
git checkout -b feature/min-nye-funksjon
# eller
git checkout -b fix/min-bugfiks
```

### 2. Gjør endringene dine

- Skriv god, ren kode
- Følg kodestandarden
- Commit ofte med gode meldinger

### 3. Test endringene dine

```bash
pnpm lint       # Sjekk linting
pnpm type-check # Sjekk typer
pnpm build      # Sjekk at det bygger
pnpm test:e2e   # Kjør ende-til-ende-testene (se under)
```

#### Ende-til-ende-tester (Playwright)

Testene i `e2e/` går gjennom påmelding, innlogging, Min side, oversiktene, admin og trekning i en
ekte nettleser. De kjører mot en lokal Supabase i Docker, aldri mot prod.

```bash
pnpm e2e:db                       # Start lokal Supabase og kjør alle migrasjoner på nytt
pnpm exec playwright install chromium  # Første gang
pnpm test:e2e                     # Starter `next dev` på port 3100 og kjører testene
pnpm test:e2e:ui                  # Samme, med Playwrights UI
```

- E-post (bekreftelses- og innloggingslenker) fanges av Mailpit på http://127.0.0.1:54324.
- Testbrukere får adresser på `@example.test` og slettes før hver kjøring. Premier fra testene
  starter med `E2E`.
- `event-lifecycle.serial.spec.ts` stenger påmeldingen og trekker premier, så den kjører alene
  til slutt og åpner arrangementet igjen etterpå.
- Supabase CLI 2.109.1 er testet. `supabase/config.toml` bruker `auto_expose_new_tables = true` for
  å gi samme tabelltilganger som prod-prosjektet. Nyere CLI-versjoner fjerner denne innstillingen.

### 4. Push til din fork

```bash
git push origin feature/min-nye-funksjon
```

### 5. Opprett en Pull Request

1. Gå til ditt fork på GitHub
2. Klikk "Compare & pull request"
3. Fyll ut PR-malen med:
   - **Beskrivelse**: Hva endrer denne PR-en?
   - **Motivasjon**: Hvorfor er denne endringen nødvendig?
   - **Testing**: Hvordan har du testet endringene?
   - **Screenshots**: Hvis relevant
   - **Relaterte issues**: Link til relaterte issues

### 6. Code Review

- Vær åpen for feedback
- Svar på kommentarer
- Gjør nødvendige endringer
- Hold PR-en oppdatert med main branch

### PR Checklist

- [ ] PR-tittelen følger commit-konvensjonen
- [ ] Koden er testet og fungerer
- [ ] Dokumentasjonen er oppdatert hvis nødvendig
- [ ] Ingen merge-konflikter med main
- [ ] CI/CD-tester passerer
- [ ] Ingen sikkerhetssårbarheter introdusert

## Rapportering av sikkerhetssårbarheter

**IKKE** opprett en offentlig issue for sikkerhetssårbarheter!

I stedet, vennligst:

1. Send en e-post til sikkerhetsteamet (se [`SECURITY.md`](SECURITY.md))
2. Beskriv sårbarheten detaljert
3. Inkluder steg for å reprodusere
4. Gi oss tid til å fikse problemet før offentliggjøring

Se [`SECURITY.md`](SECURITY.md) for fullstendige retningslinjer.

## Spørsmål?

Hvis du har spørsmål om hvordan du kan bidra, kan du:

- Åpne en discussion på GitHub
- Kontakte oss via kontaktskjemaet på nettsiden
- Sende en e-post til teamet

## Takk!

Takk for at du bidrar til Barteløpet! Hver bidragsyter hjelper oss med å støtte mental helse bevissthet gjennom Movember. 💜

---

_Disse retningslinjene kan oppdateres over tid. Sist oppdatert: Januar 2025_
