# Barteløpet 2026

2026-utgaven bruker egne tabeller for løpeturer, interesser, startnummer og trekninger. De
eksisterende `completions`-, bilde- og stemmetabellene tilhører 2025-arkivet og skal ikke
konverteres.

## Produksjonsoppsett

1. Kjør migreringene (`supabase db push`), inkludert `20261020000002_security_hardening.sql`.
2. Merk arrangørens eksisterende Supabase-bruker som administrator. Erstatt e-postadressen:

   ```sql
   UPDATE auth.users
   SET raw_app_meta_data =
     COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"organizer"}'::jsonb
   WHERE email = 'arrangor@example.no';
   ```

3. Logg ut og inn igjen slik at JWT-tokenet får den nye rollen.
4. Åpne `/admin`, legg inn donasjonslenken og startnumrene.
5. La «Turregistrering åpen» være av frem til november. Påmelding styres separat.

## Regler som håndheves i databasen

- Maks én tur per deltaker og dato.
- Distansen rundes av til nærmeste hele km (2,5 → 3, 2,4 → 2). Den avrundede distansen avgjør
  lodd og kategorier.
- Turen må være minst 1 km etter avrunding og maks 120 km (`MIN_RUN_KM`/`MAX_RUN_KM` i koden og
  `validate_2026_run()` i databasen).
- Dato må være innenfor arrangementsperioden (1.–30. november) og kan ikke være i fremtiden i
  `Europe/Oslo`.
- Deltakere må registrere turen innen et døgn. Turer har bare dato, så det betyr i dag eller i
  går. Dato og distanse kan bare endres så lenge turen er innenfor det samme vinduet. Service
  role (seeding, rettelser fra arrangør) kan bruke tidligere datoer i perioden.
- Gave er frivillig og aldri en betingelse for lodd (pengespilloven § 2 og Spleis' vilkår).
  `donation_amount_nok` er bare et forslag, `ceil(km × donasjonssats)`, og vises ikke ved
  siden av lodd.
- 10 km kvalifiserer til kort, over 10 km til kort og mellom, og 30 km eller mer til alle tre.
- Hver tur gir ett lodd per km i hver valgt og kvalifisert kategori. Trekningen gir hvert lodd
  lik sjanse.
- Loddsummer hentes fra `category_ticket_totals` og `participant_ticket_totals`, ikke ved å summere
  `eligible_entries` i appen (API-et returnerer maks 1000 rader).
- En deltaker vinner bare én premie, med mindre alle gjenværende lodd i potten tilhører
  tidligere vinnere. Da trekkes premien blant dem.
- Trekning er sperret så lenge påmelding eller turregistrering er åpen.
- Premiene må trekkes fra lengst til kortest distanse.
- Vinneren velges med `gen_random_uuid()` (PostgreSQLs sterke tilfeldighetskilde).
- Annullerte trekninger beholdes i historikken. «Vinner takket nei» utelukker deltakeren fra ny
  trekning av samme premie, mens «Annuller (feiltrekning)» legger deltakeren tilbake i potten.
- Trekninger publiseres med en gang hvis «Publiser vinnere» allerede er på.

Den offentlige forklaringen av trekningen ligger på `/trekning`.

## Sikkerhet og personvern

Anon-nøkkelen ligger i nettleseren, så RLS, rettigheter og databasefunksjoner er den eneste
beskyttelsen. Se `20261020000002_security_hardening.sql`.

- `participants` kan ikke leses av publikum og kan ikke skrives direkte. Offentlige sider bruker
  `participants_safe`. Påmelding skjer bare via `register_participant()`, som krever innlogget
  bruker med bekreftet e-post, henter e-posten fra kontoen og tildeler startnummer i databasen.
- Ved e-postpåmelding lagres skjemaet i brukerens metadata til e-posten er bekreftet. Da oppretter
  `/auth/callback` deltakeren og fjerner adressen fra metadataene.
- `runs`, `race_prizes` og `draw_results` leses offentlig bare via `runs_public`,
  `race_prizes_public` og `draw_results_public`. Visningene utelater gavebeløp, interne notater,
  admin-ID-er og hvem som takket nei. Annullerte trekninger vises uten navn.
- Trekninger skrives bare av `draw_race_prize()`, `annul_draw()` og `publish_draws()`, som tar en
  lås slik at to arrangører ikke kan trekke samtidig. Status `drawn` kan ikke settes for hånd.
- `set_current_event_year()`, `open_submission_window()` og `close_submission_window()` kan bare
  kjøres i SQL-editoren, ikke via API-et.
- Turbilder lastes opp via serveren (`uploadRunEvidence`), som koder bildet på nytt og fjerner
  EXIF/GPS. De lagres under deltaker-ID, ikke auth-bruker-ID, og bøttene kan ikke listes.
- Brukere kan laste ned (`export_my_data()`) og slette (`delete_my_account()`) dataene sine på Min
  side. Vinnere anonymiseres i stedet for å slettes, slik at trekningshistorikken består.
- `is_event_admin()` leser rollen fra `auth.users`, ikke fra JWT-en. Fjernes arrangørrollen, mister
  personen tilgangen med en gang, ikke først når tokenet utløper.
- Når premiene er levert, trykker arrangøren «Slett kontaktinformasjon» på `/admin`
  (`purge_contact_details()`). Postadresse og telefon slettes for alle deltakere det året, slik
  personvernerklæringen lover.
- 2025-stemmer er private. Publikum ser bare antall via `completions_with_counts`.
- Content-Security-Policy settes i `proxy.ts` med en ny nonce per forespørsel og `'strict-dynamic'`
  (`app/_shared/lib/security/csp.ts`). Inline-skript uten nonce blokkeres. Egne inline-skript må få
  `nonce` fra `headers().get('x-nonce')`, slik som i `app/layout.tsx`.
- Rate limiting for innloggede handlinger telles per bruker i `rate_limits` via
  `check_rate_limit()` og slipper forespørselen gjennom hvis sjekken feiler. Kontaktskjemaet
  begrenses per IP av en regel i Vercel Firewall, ikke i koden.
- Endre aldri policyer for hånd i dashboardet. Legg endringen i en ny migrasjon. Migrasjonen
  fjerner ukjente policyer på `participants`, men andre tabeller ryddes ikke automatisk.

## Årsarkiv

2026 er standardåret. De offentlige 2025-sidene nås med `?year=2025`, blant annet:

- `/?year=2025`
- `/galleri?year=2025`
- `/deltakere?year=2025`
- `/premier?year=2025`
