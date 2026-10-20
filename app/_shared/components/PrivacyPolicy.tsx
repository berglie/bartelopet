import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';

export function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            ← Tilbake
          </Button>
        </Link>
      </div>

      <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
        <h1 className="text-foreground">Personvernerklæring</h1>
        <p className="text-sm text-muted-foreground">
          <em>Sist oppdatert: 20. oktober 2026</em>
        </p>

        <h2>1. Innledning</h2>
        <p>
          Denne personvernerklæringen beskriver hvordan Barteløpet samler inn, bruker og beskytter
          dine personopplysninger i henhold til personopplysningsloven og GDPR.
        </p>

        <h2>2. Behandlingsansvarlig</h2>
        <p>
          ÅpenAid, som arrangerer Barteløpet, er behandlingsansvarlig for behandlingen av dine
          personopplysninger. Du når oss via{' '}
          <Link href="/kontakt" className="text-primary hover:underline">
            kontaktskjemaet
          </Link>
          .
        </p>

        <h2>3. Hvilke personopplysninger samler vi inn?</h2>
        <p>Vi samler inn følgende opplysninger når du registrerer deg:</p>

        <h3>Obligatoriske opplysninger:</h3>
        <ul>
          <li>
            <strong>Fullt navn</strong> - for identifikasjon og premiellevering
          </li>
          <li>
            <strong>E-postadresse</strong> - for innlogging og kommunikasjon
          </li>
          <li>
            <strong>Postadresse</strong> - for eventuell levering av premier
          </li>
        </ul>

        <h3>Valgfrie opplysninger:</h3>
        <ul>
          <li>
            <strong>Telefonnummer</strong> - for enklere kontakt ved behov
          </li>
        </ul>

        <h3>Informasjon du deler frivillig:</h3>
        <ul>
          <li>
            <strong>Løpsbilder eller aktivitetslenker</strong> - valgfritt innhold du deler
          </li>
          <li>
            <strong>Kommentar</strong> - din beskrivelse av gjennomføringen
          </li>
          <li>
            <strong>Dato for gjennomføring</strong> - når du gjennomførte løpet
          </li>
          <li>
            <strong>Varighet</strong> - hvor lang tid løpet tok (valgfritt)
          </li>
          <li>
            <strong>Distanse og premieinteresser</strong> - for beregning av kvalifiserte lodd og
            foreslått gave
          </li>
        </ul>

        <h3>Teknisk informasjon:</h3>
        <ul>
          <li>
            <strong>Innloggingsdata</strong> - tidspunkt for innlogging og aktivitet
          </li>
          <li>
            <strong>IP-adresse</strong> - brukes kortvarig for å begrense misbruk av kontaktskjemaet
            og opplastinger
          </li>
          <li>
            <strong>Trekningsdata</strong> - kvalifiserte lodd og eventuell premiegevinst
          </li>
        </ul>

        <h2>4. Hvorfor samler vi inn personopplysninger?</h2>
        <p>Vi samler inn og bruker personopplysningene dine til følgende formål:</p>
        <ul>
          <li>
            <strong>Kontoadministrasjon</strong> - for å opprette og administrere din brukerkonto
          </li>
          <li>
            <strong>Premielevering</strong> - for å kontakte vinnere og levere premier
          </li>
          <li>
            <strong>Kommunikasjon</strong> - for å kontakte deg ved behov angående premielevering
            eller arrangementet
          </li>
          <li>
            <strong>Gjennomføring av arrangement</strong> - for å administrere deltakelse,
            loddtrekning og resultater
          </li>
          <li>
            <strong>Historikk</strong> - for å oppbevare arrangementets historie
          </li>
        </ul>

        <h3>Rettslig grunnlag:</h3>
        <ul>
          <li>
            <strong>Samtykke</strong> - du gir samtykke ved registrering
          </li>
          <li>
            <strong>Kontraktsoppfyllelse</strong> - nødvendig for å oppfylle avtalen om deltakelse
          </li>
          <li>
            <strong>Berettiget interesse</strong> - for å administrere arrangementet
          </li>
        </ul>

        <h2>5. Hvor lenge lagrer vi personopplysningene?</h2>
        <ul>
          <li>
            <strong>Kontoinformasjon</strong> - lagres så lenge du har en aktiv konto
          </li>
          <li>
            <strong>Turer, bilder og kommentarer</strong> - lagres som arrangementets historikk til
            du sletter dem eller kontoen din
          </li>
          <li>
            <strong>E-postadresse</strong> - lagres så lenge du har en konto, slik at du kan logge
            inn og melde deg på senere år
          </li>
          <li>
            <strong>Postadresse og telefonnummer</strong> - slettes når premiene for året er levert
          </li>
          <li>
            <strong>Trekninger</strong> - beholdes for å dokumentere at trekningen var rettferdig.
            Sletter en vinner kontoen sin, fjernes navn og kontaktinformasjon fra trekningen
          </li>
        </ul>
        <p>
          Du kan når som helst slette kontoen din selv på Min side. Se punkt 9 for dine rettigheter.
        </p>

        <h2>6. Deling med tredjeparter</h2>
        <p>
          Vi selger aldri personopplysninger og deler dem ikke for markedsføring. For å drive
          nettsiden bruker vi disse leverandørene (databehandlere):
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> - database, innlogging og lagring av bilder
          </li>
          <li>
            <strong>Vercel</strong> - drift av nettsiden
          </li>
          <li>
            <strong>Resend</strong> - sender meldinger fra kontaktskjemaet til oss (navn, e-post og
            melding)
          </li>
          <li>
            <strong>Upstash</strong> - begrenser antall forsøk per IP-adresse eller bruker for å
            hindre misbruk
          </li>
          <li>
            <strong>Google</strong> - kun hvis du velger å logge inn med Google
          </li>
          <li>
            <strong>Posten/logistikkpartner</strong> - kun for levering av fysiske premier (navn og
            adresse)
          </li>
        </ul>
        <p>
          Når du besøker sider med kart eller innebygd innhold, henter nettleseren din innhold
          direkte fra <strong>Mapbox</strong> (kart), <strong>Strava</strong> og{' '}
          <strong>Spotify</strong>. Disse tjenestene ser da IP-adressen din. Gavelenken går til{' '}
          <strong>Spleis</strong>, som har sin egen personvernerklæring.
        </p>
        <p>
          Flere av leverandørene er amerikanske selskaper. Når personopplysninger behandles utenfor
          EU/EØS, skjer det på grunnlag av EUs standardkontraktsklausuler eller EU–US Data Privacy
          Framework.
        </p>

        <h2>7. Sikkerhet</h2>
        <p>Vi bruker følgende sikkerhetstiltak for å beskytte dine personopplysninger:</p>
        <ul>
          <li>
            <strong>Kryptert kommunikasjon</strong> - all kommunikasjon skjer over HTTPS
          </li>
          <li>
            <strong>Sikker autentisering</strong> - magic link-innlogging uten passord
          </li>
          <li>
            <strong>Database-sikkerhet</strong> - Row Level Security (RLS) i Supabase
          </li>
          <li>
            <strong>Tilgangskontroll</strong> - bare du ser kontaktinformasjonen din. Arrangørene
            ser kontaktinformasjonen til vinnere for å levere premier
          </li>
          <li>
            <strong>Bilder uten posisjon</strong> - posisjonsdata (EXIF/GPS) fjernes fra bilder du
            laster opp
          </li>
          <li>
            <strong>Backup</strong> - regelmessig sikkerhetskopiering av data
          </li>
        </ul>

        <h2>8. Offentlig tilgjengelig informasjon</h2>
        <p>Følgende informasjon er offentlig synlig på nettsiden:</p>
        <ul>
          <li>Ditt fulle navn og startnummer</li>
          <li>Turene dine: dato, distanse, varighet, tittel og kommentar</li>
          <li>Bilder og aktivitetslenker (for eksempel Strava) du legger ved turene</li>
          <li>Valgte premiekategorier og antall lodd</li>
          <li>Navn på publiserte vinnere</li>
          <li>Fra 2025: bilder, kommentarer og hvilke bilder deltakerne stemte på</li>
        </ul>
        <p className="font-semibold">
          OBS: Ikke del sensitive eller private opplysninger i kommentarfeltet eller bilder, da
          dette blir offentlig tilgjengelig.
        </p>

        <h2>9. Dine rettigheter</h2>
        <p>I henhold til GDPR har du følgende rettigheter:</p>

        <h3>Rett til innsyn</h3>
        <p>Du kan be om en kopi av alle personopplysninger vi har om deg.</p>

        <h3>Rett til retting</h3>
        <p>Du kan be om at feil eller utdaterte opplysninger rettes.</p>

        <h3>Rett til sletting</h3>
        <p>
          Du kan slette kontoen din selv under «Dine data» på Min side. Påmeldingen, turene, bildene
          og kontoen slettes da for alle år. Har du vunnet en premie, beholdes trekningen uten navn
          og kontaktinformasjon.
        </p>

        <h3>Rett til begrensning</h3>
        <p>Du kan be om at behandlingen av dine personopplysninger begrenses.</p>

        <h3>Rett til dataportabilitet</h3>
        <p>
          Du kan laste ned alle opplysningene vi har om deg som en JSON-fil under «Dine data» på Min
          side.
        </p>

        <h3>Rett til å trekke samtykke</h3>
        <p>Du kan når som helst trekke ditt samtykke til behandling av personopplysninger.</p>

        <h3>Rett til å klage</h3>
        <p>
          Du har rett til å klage til Datatilsynet hvis du mener vi behandler dine
          personopplysninger i strid med regelverket.
        </p>

        <p className="font-semibold">
          For andre henvendelser om rettighetene dine, ta kontakt via kontaktskjemaet.
        </p>

        <h2>10. Cookies og sporingsteknikker</h2>
        <p>Vi bruker minimalt med cookies:</p>
        <ul>
          <li>
            <strong>Autentiseringscookies</strong> - for å holde deg innlogget (nødvendig)
          </li>
          <li>
            <strong>Preferanse-cookies</strong> - for å huske dine innstillinger (valgfritt)
          </li>
        </ul>
        <p>
          Vi bruker <strong>ikke</strong> cookies for markedsføring eller sporing av tredjepart.
        </p>

        <h2>11. Endringer i personvernerklæringen</h2>
        <p>
          Vi kan oppdatere denne personvernerklæringen fra tid til annen. Endringer vil bli
          publisert på denne siden med oppdatert dato. Vi oppfordrer deg til å lese denne
          erklæringen regelmessig.
        </p>
        <p>Ved vesentlige endringer vil vi informere deg via e-post.</p>

        <h2>12. Kontakt oss</h2>
        <p>
          Har du spørsmål om hvordan vi behandler dine personopplysninger, eller ønsker å utøve dine
          rettigheter?
        </p>
        <p>Kontakt oss via e-post eller kontaktskjema på nettsiden.</p>

        <h2>13. Datatilsynet</h2>
        <p>
          Du kan klage til Datatilsynet hvis du mener vi behandler personopplysningene dine i strid
          med regelverket:
        </p>
        <div className="not-prose rounded-lg bg-muted p-4">
          <p className="mb-2 font-semibold text-foreground">Datatilsynet</p>
          <p className="text-sm text-foreground">
            Postboks 8177 Dep.
            <br />
            0034 Oslo
          </p>
          <p className="mt-2 text-sm text-foreground">
            Telefon: 22 39 69 00
            <br />
            E-post: postkasse@datatilsynet.no
            <br />
            Nettside:{' '}
            <a
              href="https://www.datatilsynet.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.datatilsynet.no
            </a>
          </p>
        </div>
      </article>

      <div className="mt-8 flex gap-4">
        <Link href="/vilkar">
          <Button variant="outline">Les vilkår for bruk</Button>
        </Link>
        <Link href="/pamelding">
          <Button>Meld deg på</Button>
        </Link>
      </div>
    </div>
  );
}
