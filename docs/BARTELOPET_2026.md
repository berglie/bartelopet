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
- Turen må være minst 3 km etter avrunding og maks 120 km (`MIN_RUN_KM`/`MAX_RUN_KM` i koden og
  `validate_2026_run()` i databasen).
- Dato må være innenfor arrangementsperioden og kan ikke være i fremtiden i `Europe/Oslo`.
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
- Endre aldri policyer for hånd i dashboardet. Legg endringen i en ny migrasjon.

## Årsarkiv

2026 er standardåret. De offentlige 2025-sidene nås med `?year=2025`, blant annet:

- `/?year=2025`
- `/galleri?year=2025`
- `/deltakere?year=2025`
- `/premier?year=2025`
