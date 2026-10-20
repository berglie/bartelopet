# Barteløpet 2026

2026-utgaven bruker egne tabeller for løpeturer, interesser, startnummer og trekninger. De
eksisterende `completions`-, bilde- og stemmetabellene tilhører 2025-arkivet og skal ikke
konverteres.

## Produksjonsoppsett

1. Kjør migreringen `supabase/migrations/20260725000000_add_2026_event.sql`.
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

## Årsarkiv

2026 er standardåret. De offentlige 2025-sidene nås med `?year=2025`, blant annet:

- `/?year=2025`
- `/galleri?year=2025`
- `/deltakere?year=2025`
- `/premier?year=2025`
