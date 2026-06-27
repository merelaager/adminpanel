import { createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/privaatsustingimused')({
  component: () => (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl mb-4">Privaatsustingimused</h1>
        <p>
          Nendes privaatsustingimustes (Privaatsustingimused) kirjeldame, kuidas
          töötleme isikuandmeid merelaagri silla (Sild) veebi- ja
          mobiilirakendustes.
        </p>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">
          Milliseid (isiku)andmeid me kogume?
        </h2>
        <ul className="list-disc list-inside">
          <li>Kasutaja täisnimi</li>
          <li>Autentimise teave (kasutajanimi, meiliaadress)</li>
          <li>Osakutsetunnistuste numbrid</li>
        </ul>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">Andmete kogumise eesmärk</h2>
        <p className="mb-2">
          Andmeid kogume Silla funktsionaalsuse tagamiseks ja laagri arhiivi
          tarbeks.
        </p>
        <p>
          Konto kustutamiseks saada teavitus taaniel@merelaager.ee. Kustutame Su
          konto (sh kasutajanime ja meiliaadressi), ent mitte Su nime, kuna see
          kuulub vahetuste meeskondade arhiivi.
        </p>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">
          Isikuandmete edastamine ja volitatud töötlemine
        </h2>
        <p className="mb-2">
          Talletame isikuandmeid andmebaasis, mida majutab Zone Media OÜ.
        </p>
        <a
          href="https://www.zone.ee/et/zone-media-ou-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-4"
        >
          Zone Media OÜ privaatsuspõhimõtted
          <ExternalLink size={14} />
        </a>
        <p className="mt-2">
          Me ei edasta kasutajate isikuandmeid muudele välistele osapooltele.
        </p>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">Muudatused</h2>
        <p className="mb-1">Privaatsuspõhimõtete jõustumine:</p>
        <p>Avaldamine 2026 juuni</p>
        <p>Jõustumine 2026 juuni</p>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">Kontaktandmed</h2>
        <p>
          Kui Sul on isikuandmete töötlemise kohta küsimusi, saada küsimus
          aadressile webmaster@merelaager.ee.
        </p>
      </div>
    </div>
  ),
})
