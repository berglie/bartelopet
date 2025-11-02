# Sikkerhet

Vi tar sikkerheten til Barteløpet på alvor. Hvis du har oppdaget en sikkerhetssårbarhet, setter vi pris på din hjelp med å avsløre den til oss på en ansvarlig måte.

## 🔒 Rapportere en sikkerhetssårbarhet

**VIKTIG**: Vennligst IKKE opprett en offentlig GitHub issue for sikkerhetssårbarheter.

I stedet, vennligst bruk en av følgende metoder:

1. **GitHub Security Advisories** (anbefalt):
   - Gå til https://github.com/berglie/bartelopet/security/advisories
   - Klikk "Report a vulnerability"
   - Fyll ut skjemaet med detaljert informasjon

2. **Kontaktskjema**:
   - Bruk kontaktskjemaet på https://barteløpet.no/kontakt
   - Merk e-posten med "[SIKKERHET]" i emnefeltet

### Hva du bør inkludere

For å hjelpe oss med å forstå og løse problemet raskt, vennligst inkluder følgende informasjon:

1. **Beskrivelse av sårbarheten**
   - Type sårbarhet (f.eks. XSS, SQL Injection, CSRF)
   - Alvorlighetsgrad (lav, medium, høy, kritisk)

2. **Steg for å reprodusere**
   - Detaljerte instruksjoner for å reprodusere sårbarheten
   - URL-er og parametere som er involvert
   - Request/response-eksempler hvis relevant

3. **Påvirkning**
   - Hva kan en angriper oppnå?
   - Hvilke data eller systemer er berørt?

4. **Mulig løsning** (hvis du har ett forslag)

5. **Din kontaktinformasjon**
   - E-postadresse for oppfølging
   - Ønsket kreditering (hvis du vil bli nevnt når fiksen blir publisert)

### Eksempel på rapport

```
Emne: [SIKKERHET] XSS-sårbarhet i kommentarfelt

Hei,

Jeg har oppdaget en potensiell XSS-sårbarhet i kommentarfeltet på deltakergalleriet.

Type: Stored Cross-Site Scripting (XSS)
Alvorlighetsgrad: Høy

Steg for å reprodusere:
1. Gå til /galleri
2. Legg igjen en kommentar med innhold: <script>alert('XSS')</script>
3. Last siden på nytt
4. Scriptet kjøres

Påvirkning:
En angriper kan injisere skadelig JavaScript-kode som vil kjøres for alle brukere som ser kommentaren.

Mulig løsning:
Implementer HTML-escaping på alle bruker-genererte kommentarer før de vises.

Kontakt: ditt.navn@example.com
Kreditering: Ja, vennligst krediter meg som "John Doe"
```

## 🔐 Ansvarsfullt avsløringsretningslinjer

Vi følger prinsippene for ansvarlig avsløring:

1. **Ikke utnytt sårbarheten**: Test kun i den grad det er nødvendig for å demonstrere problemet
2. **Ikke tilgang til data**: Ikke få tilgang til, endre eller slette data som ikke tilhører deg
3. **Gi oss tid**: Vi ber om minimum 90 dager til å undersøke og fikse problemet før offentliggjøring
4. **Hold det konfidensielt**: Ikke del sårbarheten med andre før vi har fikset den
5. **Vær respektfull**: Ikke utfør DoS-angrep eller andre forstyrrende handlinger

### Vår forpliktelse

Når vi mottar en sikkerhetsrapport, forplikter vi oss til:

1. **Bekrefte mottak** innen 48 timer
2. **Gi et tidsmessig estimat** for undersøkelse og fiksing innen 7 dager
3. **Holde deg oppdatert** på fremdriften av fiksen
4. **Gi deg kreditt** (hvis du ønsker det) når fiksen blir publisert
5. **Informere deg** når sårbarheten er fikset

## 🛡️ Sikkerhetsfunksjoner

Barteløpet implementerer flere sikkerhetslag:

### Autentisering og autorisasjon
- Magic link-autentisering via Supabase
- Row Level Security (RLS) på alle databasetabeller
- Session-basert autorisasjon
- Automatisk session-utløp

### Input-validering
- Zod-schema-validering på alle server actions
- HTML-escaping av bruker-generert innhold
- E-post header injection-beskyttelse
- XSS-beskyttelse

### Rate Limiting
- Redis-basert rate limiting via Upstash
- Beskytter API-endepunkter mot spam og brute-force
- IP-basert begrensning

### Sikkerhetshoder
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options` (Clickjacking-beskyttelse)
- `X-Content-Type-Options` (MIME-sniffing-beskyttelse)
- `Content-Security-Policy` (CSP)
- `Referrer-Policy`
- `Permissions-Policy`

### Filopplasting
- Filtype-validering
- Størrelsebegrensninger (5MB per bilde)
- Sharp-basert bildevalidering
- Automatisk bildekomprimering
- Sikker lagring i Supabase Storage

### Database
- PostgreSQL Row Level Security (RLS)
- Prepared statements (via Supabase-klienten)
- Ingen direkte SQL-spørringer fra klienten
- Kryptert kommunikasjon (TLS)

## 🔍 Kjente problemer og begrensninger

### Avhengighetssårbarheter

Vi er klar over følgende sårbarheter i tredjepartsavhengigheter:

#### gpxparser (v3.0.8)
- **Status**: Overvåket
- **Sårbarhet**: Avhenger av utdaterte pakker (`jsdom`, `request`)
- **Påvirkning**: Lav - Brukes kun server-side for parsing av GPX-filer
- **Mitigering**: Server-side prosessering med validert input
- **Handling**: Venter på oppdatering fra pakkevedlikeholder

### Utenfor omfang

Følgende anses IKKE som sikkerhetssårbarheter:

- **Social engineering**: Phishing, pretexting, etc.
- **Fysiske angrep**: Fysisk tilgang til servere eller enheter
- **Denial of Service (DoS)**: Unngå å teste DoS-angrep
- **Spam**: Rapporter av spam uten teknisk sårbarhet
- **Utdaterte nettlesere**: Problemer som kun forekommer i utgåtte nettlesere
- **Manglende beste praksis**: Uten demonstrerbar sikkerhetsinnvirkning

## 📋 Sikkerhets-checklist for bidragsytere

Hvis du bidrar til prosjektet, vennligst sikre at du:

- [ ] Aldri committer hemmeligheter, API-nøkler eller passord
- [ ] Validerer all brukerinput med Zod eller lignende
- [ ] Escaper HTML i bruker-generert innhold
- [ ] Bruker parameteriserte spørringer (Supabase-klienten håndterer dette)
- [ ] Implementerer riktige autorisasjonssjekker
- [ ] Tester for vanlige sårbarheter (XSS, CSRF, SQLi)
- [ ] Følger prinsippet om minste privilegium
- [ ] Dokumenterer sikkerhetskritiske endringer

## 🏆 Hall of Fame

Vi ønsker å takke følgende personer for ansvarlig avsløring av sikkerhetssårbarheter:

*Ingen rapporterte sårbarheter ennå*

## 📞 Kontakt

For ikke-sikkerhetsspørsmål:
- GitHub Issues: https://github.com/berglie/bartelopet/issues
- Kontaktskjema: https://barteløpet.no/kontakt

For sikkerhetsspørsmål:
- GitHub Security Advisories: https://github.com/berglie/bartelopet/security/advisories
- Kontaktskjema: https://barteløpet.no/kontakt (merk "[SIKKERHET]" i emnefeltet)

## 📚 Ressurser

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

---

*Denne sikkerhetspolicyen kan oppdateres over tid. Sist oppdatert: Januar 2025*
