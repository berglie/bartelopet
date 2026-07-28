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
- Dato må være innenfor arrangementsperioden og kan ikke være i fremtiden i `Europe/Oslo`.
- Donasjon beregnes som `ceil(km × donasjonssats)`.
- 10 km kvalifiserer til kort, over 10 km til kort og mellom, og 30 km eller mer til alle tre.
- Hver tur er ett lodd per valgt og kvalifisert kategori.
- En deltaker kan bare ha én aktiv premiegevinst.
- Annullerte trekninger beholdes i historikken, men sperrer ikke ny trekning.

## Årsarkiv

2026 er standardåret. De offentlige 2025-sidene nås med `?year=2025`, blant annet:

- `/?year=2025`
- `/galleri?year=2025`
- `/deltakere?year=2025`
- `/premier?year=2025`
