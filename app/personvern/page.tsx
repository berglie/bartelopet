import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Personvernerklæring - Barteløpet 2025',
  description: 'Personvernerklæring for Barteløpet',
};

export default function PersonvernPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            ← Tilbake
          </Button>
        </Link>
      </div>

      <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
        <h1 className="text-foreground">Personvernerklæring</h1>
        <p className="text-sm text-muted-foreground">
          <em>Sist oppdatert: 30. oktober 2025</em>
        </p>

        <h2>1. Innledning</h2>
        <p>
          Denne personvernerklæringen beskriver hvordan Barteløpet samler inn, bruker og beskytter dine personopplysninger i henhold til personopplysningsloven og GDPR.
        </p>

        <h2>2. Behandlingsansvarlig</h2>
        <p>Barteløpet er behandlingsansvarlig for behandling av dine personopplysninger.</p>

        <h2>3. Hvilke personopplysninger samler vi inn?</h2>
        <p>Vi samler inn følgende opplysninger når du registrerer deg:</p>

        <h3>Obligatoriske opplysninger:</h3>
        <ul>
          <li><strong>Fullt navn</strong> - for identifikasjon og premiellevering</li>
          <li><strong>E-postadresse</strong> - for innlogging og kommunikasjon</li>
          <li><strong>Postadresse</strong> - for levering av pokal og eventuelle premier</li>
        </ul>

        <h3>Valgfrie opplysninger:</h3>
        <ul>
          <li><strong>Telefonnummer</strong> - for enklere kontakt ved behov</li>
        </ul>

        <h3>Informasjon du deler frivillig:</h3>
        <ul>
          <li><strong>Løpsbilder</strong> - bilder du laster opp som bevis på gjennomføring</li>
          <li><strong>Kommentar</strong> - din beskrivelse av gjennomføringen</li>
          <li><strong>Dato for gjennomføring</strong> - når du gjennomførte løpet</li>
          <li><strong>Varighet</strong> - hvor lang tid løpet tok (valgfritt)</li>
        </ul>

        <h3>Teknisk informasjon:</h3>
        <ul>
          <li><strong>Innloggingsdata</strong> - tidspunkt for innlogging og aktivitet</li>
          <li><strong>Stemmedata</strong> - hvem du har stemt på (anonymisert i visninger)</li>
        </ul>

        <h2>4. Hvorfor samler vi inn personopplysninger?</h2>
        <p>Vi samler inn og bruker personopplysningene dine til følgende formål:</p>
        <ul>
          <li><strong>Kontoadministrasjon</strong> - for å opprette og administrere din brukerkonto</li>
          <li><strong>Premielevering</strong> - for å sende pokal og eventuelle premier til deg</li>
          <li><strong>Kommunikasjon</strong> - for å kontakte deg ved behov angående premielevering eller arrangementet</li>
          <li><strong>Gjennomføring av arrangement</strong> - for å administrere deltakelse, avstemning og resultater</li>
          <li><strong>Historikk</strong> - for å oppbevare arrangementets historie</li>
        </ul>

        <h3>Rettslig grunnlag:</h3>
        <ul>
          <li><strong>Samtykke</strong> - du gir samtykke ved registrering</li>
          <li><strong>Kontraktsoppfyllelse</strong> - nødvendig for å oppfylle avtalen om deltakelse</li>
          <li><strong>Berettiget interesse</strong> - for å administrere arrangementet</li>
        </ul>

        <h2>5. Hvor lenge lagrer vi personopplysningene?</h2>
        <ul>
          <li><strong>Kontoinformasjon</strong> - lagres så lenge du har en aktiv konto</li>
          <li><strong>Løpsdata og bilder</strong> - lagres permanent for historiske formål, med mindre du ber om sletting</li>
          <li><strong>E-postadresse</strong> - beholdes for kommunikasjon selv etter arrangementet</li>
          <li><strong>Postadresse og telefonnummer</strong> - kan slettes etter at premier er levert</li>
        </ul>
        <p>
          Du kan når som helst be om at dine personopplysninger slettes. Se punkt 9 for dine rettigheter.
        </p>

        <h2>6. Deling med tredjeparter</h2>
        <p><strong>Vi deler IKKE dine personopplysninger med tredjeparter.</strong></p>
        <p>Dine opplysninger behandles kun av:</p>
        <ul>
          <li><strong>Barteløpet</strong> - arrangøren</li>
          <li><strong>Supabase</strong> - vår tekniske leverandør for database og autentisering (databehandler)</li>
          <li><strong>Vercel</strong> - vår hostingleverandør (databehandler)</li>
          <li><strong>Posten/logistikkpartner</strong> - kun for levering av fysiske premier (kun navn og adresse)</li>
        </ul>
        <p>
          Alle databehandlere er underlagt databehandleravtaler som sikrer at dine data behandles forsvarlig.
        </p>

        <h2>7. Sikkerhet</h2>
        <p>Vi bruker følgende sikkerhetstiltak for å beskytte dine personopplysninger:</p>
        <ul>
          <li><strong>Kryptert kommunikasjon</strong> - all kommunikasjon skjer over HTTPS</li>
          <li><strong>Sikker autentisering</strong> - magic link-innlogging uten passord</li>
          <li><strong>Database-sikkerhet</strong> - Row Level Security (RLS) i Supabase</li>
          <li><strong>Tilgangskontroll</strong> - kun du har tilgang til dine egne data</li>
          <li><strong>Backup</strong> - regelmessig sikkerhetskopiering av data</li>
        </ul>

        <h2>8. Offentlig tilgjengelig informasjon</h2>
        <p>Følgende informasjon er offentlig synlig på nettsiden:</p>
        <ul>
          <li>Ditt fulle navn (eller visningsnavn hvis oppgitt)</li>
          <li>Bilder du laster opp</li>
          <li>Kommentarer du skriver</li>
          <li>Dato og varighet for gjennomføring</li>
          <li>Antall stemmer du har mottatt</li>
        </ul>
        <p className="font-semibold">
          OBS: Ikke del sensitive eller private opplysninger i kommentarfeltet eller bilder, da dette blir offentlig tilgjengelig.
        </p>

        <h2>9. Dine rettigheter</h2>
        <p>I henhold til GDPR har du følgende rettigheter:</p>

        <h3>Rett til innsyn</h3>
        <p>Du kan be om en kopi av alle personopplysninger vi har om deg.</p>

        <h3>Rett til retting</h3>
        <p>Du kan be om at feil eller utdaterte opplysninger rettes.</p>

        <h3>Rett til sletting</h3>
        <p>
          Du kan be om at dine personopplysninger slettes. Merk at dette vil føre til at du ikke lenger kan delta i arrangementet og at din historikk fjernes.
        </p>

        <h3>Rett til begrensning</h3>
        <p>Du kan be om at behandlingen av dine personopplysninger begrenses.</p>

        <h3>Rett til dataportabilitet</h3>
        <p>Du kan be om å få dine personopplysninger i et strukturert format.</p>

        <h3>Rett til å trekke samtykke</h3>
        <p>Du kan når som helst trekke ditt samtykke til behandling av personopplysninger.</p>

        <h3>Rett til å klage</h3>
        <p>
          Du har rett til å klage til Datatilsynet hvis du mener vi behandler dine personopplysninger i strid med regelverket.
        </p>

        <p className="font-semibold">
          For å utøve dine rettigheter, ta kontakt med oss via e-post eller kontaktskjema.
        </p>

        <h2>10. Cookies og sporingsteknikker</h2>
        <p>Vi bruker minimalt med cookies:</p>
        <ul>
          <li><strong>Autentiseringscookies</strong> - for å holde deg innlogget (nødvendig)</li>
          <li><strong>Preferanse-cookies</strong> - for å huske dine innstillinger (valgfritt)</li>
        </ul>
        <p>Vi bruker <strong>ikke</strong> cookies for markedsføring eller sporing av tredjepart.</p>

        <h2>11. Endringer i personvernerklæringen</h2>
        <p>
          Vi kan oppdatere denne personvernerklæringen fra tid til annen. Endringer vil bli publisert på denne siden med oppdatert dato. Vi oppfordrer deg til å lese denne erklæringen regelmessig.
        </p>
        <p>Ved vesentlige endringer vil vi informere deg via e-post.</p>

        <h2>12. Kontakt oss</h2>
        <p>
          Har du spørsmål om hvordan vi behandler dine personopplysninger, eller ønsker å utøve dine rettigheter?
        </p>
        <p>Kontakt oss via e-post eller kontaktskjema på nettsiden.</p>

        <h2>13. Datatilsynet</h2>
        <p>
          Du kan klage til Datatilsynet hvis du mener vi behandler personopplysningene dine i strid med regelverket:
        </p>
        <div className="bg-muted p-4 rounded-lg not-prose">
          <p className="font-semibold mb-2 text-foreground">Datatilsynet</p>
          <p className="text-sm text-foreground">
            Postboks 8177 Dep.<br />
            0034 Oslo
          </p>
          <p className="text-sm mt-2 text-foreground">
            Telefon: 22 39 69 00<br />
            E-post: postkasse@datatilsynet.no<br />
            Nettside: <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.datatilsynet.no</a>
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
