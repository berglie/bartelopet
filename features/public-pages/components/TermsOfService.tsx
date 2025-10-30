import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function TermsOfService() {
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
        <h1 className="text-foreground">Vilkår for bruk</h1>
        <p className="text-sm text-muted-foreground">
          <em>Sist oppdatert: 30. oktober 2025</em>
        </p>

        <h2>1. Aksept av vilkår</h2>
        <p>
          Ved å registrere deg for Barteløpet aksepterer du disse vilkårene. Hvis du ikke aksepterer vilkårene, kan du ikke bruke tjenesten.
        </p>

        <h2>2. Beskrivelse av tjenesten</h2>
        <p>
          Barteløpet er en veldedighetsløpsarrangement i november. Deltakere gjennomfører en løype i Stavanger sentrum, laster opp bevis på gjennomføring, og kan stemme på andre deltakeres bidrag.
        </p>

        <h2>3. Påmelding og brukerinformasjon</h2>
        <p>Ved påmelding må du oppgi:</p>
        <ul>
          <li>Fullt navn</li>
          <li>E-postadresse</li>
          <li>Postadresse (for levering av premie)</li>
          <li>Telefonnummer (valgfritt)</li>
        </ul>
        <p>
          Du er ansvarlig for at informasjonen du oppgir er korrekt. Feil informasjon kan føre til at du ikke mottar din premie.
        </p>

        <h2>4. Deltakerforpliktelser</h2>
        <p>Som deltaker forplikter du deg til å:</p>
        <ul>
          <li>Gjennomføre løpet i november måned</li>
          <li>Laste opp ærlige og korrekte opplysninger om gjennomføringen</li>
          <li>Ikke laste opp støtende, ulovlig eller upassende innhold</li>
          <li>Ikke stemme på egen gjennomføring</li>
          <li>Respektere andre deltakere</li>
        </ul>

        <h2>5. Innhold og bilder</h2>
        <p>Ved opplasting av bilder gir du Barteløpet rett til å:</p>
        <ul>
          <li>Vise bildene i galleriet på nettsiden</li>
          <li>Bruke bildene i markedsføring av arrangementet</li>
          <li>Lagre bildene for historiske formål</li>
        </ul>
        <p>
          Du beholder opphavsretten til dine bilder. Du bekrefter at du har rett til å laste opp bildene og at de ikke krenker andres rettigheter.
        </p>

        <h2>6. Premier og levering</h2>
        <p>
          Alle som fullfører løpet mottar en pokal. Pokalen sendes til oppgitt postadresse etter arrangementet. Ekstra premier kan tildeles etter avstemning eller loddtrekning.
        </p>
        <p>Vi er ikke ansvarlige for forsinkelser i leveransen som skyldes:</p>
        <ul>
          <li>Feil postadresse</li>
          <li>Postens forsinkelser</li>
          <li>Force majeure</li>
        </ul>

        <h2>7. Ansvarsbegrensning</h2>
        <p>
          Barteløpet er et uorganisert løp der hver deltaker løper på eget ansvar. Ved å delta aksepterer du at:
        </p>
        <ul>
          <li>Du deltar på eget ansvar</li>
          <li>Du er selv ansvarlig for din egen sikkerhet</li>
          <li>Arrangøren ikke er ansvarlig for skader, uhell eller tap som oppstår i forbindelse med løpet</li>
          <li>Du har nødvendig helsemessig tilstand for å gjennomføre løpet</li>
        </ul>

        <h2>8. Avslutning av konto</h2>
        <p>Vi forbeholder oss retten til å avslutte din konto hvis du:</p>
        <ul>
          <li>Bryter disse vilkårene</li>
          <li>Laster opp upassende innhold</li>
          <li>Oppfører deg respektløst overfor andre deltakere</li>
          <li>Forsøker å manipulere stemmegivningen</li>
        </ul>

        <h2>9. Endringer i vilkårene</h2>
        <p>
          Vi kan endre disse vilkårene når som helst. Endringer trer i kraft umiddelbart etter publisering på nettsiden. Din videre bruk av tjenesten etter endringer betyr at du aksepterer de nye vilkårene.
        </p>

        <h2>10. Kontaktinformasjon</h2>
        <p>Spørsmål om vilkårene kan sendes til kontaktpersonen for Barteløpet.</p>

        <h2>11. Gjeldende lov</h2>
        <p>
          Disse vilkårene er underlagt norsk lov. Tvister skal løses i norske domstoler.
        </p>
      </article>

      <div className="mt-8 flex gap-4">
        <Link href="/personvern">
          <Button variant="outline">Les personvernerklæring</Button>
        </Link>
        <Link href="/pamelding">
          <Button>Meld deg på</Button>
        </Link>
      </div>
    </div>
  )
}