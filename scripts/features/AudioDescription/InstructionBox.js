import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

/**
 * Updated steps content (shortened)
 */
const stepsData = [
  {
    stepNumber: 1,
    title: "1. Ange exakt starttid för ämnet",
    shortPoints: [
      "Skriv tiden (t.ex. 01:23) eller klicka i spelaren",
      "Det hjälper andra hoppa direkt till rätt ämne",
    ],
    details: `Tidsätt varje större ämne. Exempel:
01:23 Morotsodling
05:12 Potatisupptagning
08:45 Bekämpning av ohyra

Om ämnen hänger ihop, samla dem:
01:23 Jordbruk (morotsodling, potatisupptagning, bekämpning av ohyra).`,
  },
  {
    stepNumber: 2,
    title: "2. Beskriv innehållet tydligt",
    shortPoints: [
      "Var konkret: ”höstsådd” i stället för ”jordbruk”",
      "Undvik allmänt som ”gamla minnen” eller ”intressant samtal”",
    ],
    details: `Använd hellre konkreta ord än allmänna. Undvik “Intervju om…” – det är underförstått.
Skriv ”dialekt” i stället för förkortningen ”dial.” Ordet "dialekt" är sökbart medan "dial." inte är det.`,
  },
  {
    stepNumber: 3,
    title: "3. Lägg till minst ett ämnesord",
    shortPoints: [
      "Välj från listan som bäst beskriver ämnet",
      "Flera ämnesord om flera aspekter behandlas",
    ],
    details: `Exempel: Om ni pratar om jordbruk på 1930-talet:
- #Jordbruk (#B.IV.)
- #Potatis (#B.IV.10.)
- #Arbetsliv (#B.IX.)

Kombinera gärna ämnesord om ni rör olika delar.`,
  },
];

/**
 * Component for each step with toggle for details
 */
const InstructionStep = ({ title, shortPoints, details }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Title */}
      <p className="font-semibold mb-1">{title}</p>

      {/* Short bullet list */}
      <ul className="ml-5 list-disc text-sm space-y-1 !mb-0">
        {shortPoints.map((point, index) => (
          <li className="!mb-0" key={index}>
            {point}
          </li>
        ))}
      </ul>

      {/* “Visa fler tips & exempel” / “Dölj” toggle button */}
      <a
        onClick={() => setIsOpen(!isOpen)}
        className="ml-4 mt-2 text-isof underline cursor-pointer inline-block text-sm"
      >
        {isOpen ? "Dölj" : "Visa fler tips & exempel"}
      </a>

      {/* Reveal full details when isOpen = true */}
      {isOpen && (
        <div className="ml-4 mt-2 text-gray-700 leading-relaxed space-y-2 whitespace-pre-line text-sm">
          {details}
        </div>
      )}
    </div>
  );
};

/**
 * Main component
 */
const InstructionBox = () => {
  return (
    <div className="bg-isof/5 p-4 rounded-lg mb-6 border border-isof/20">
      <details className="group">
        {/* The main summary for the entire instructions box */}
        <summary className="flex items-center cursor-pointer list-none mb-1">
          <FontAwesomeIcon
            icon={faChevronDown}
            className="mr-2 text-isof/70 transform transition-transform duration-200 group-open:rotate-180"
          />
          <span className="text-isof font-semibold text-base">
            Instruktioner: Kom igång snabbt
          </span>
        </summary>

        {/* Body content visible when <details> is open */}
        <div className="mt-4 space-y-4 text-sm">
          {/* Steps container */}
          <div className="bg-white p-4 rounded-lg border shadow-sm space-y-6">
            {/* Render each step */}
            {stepsData.map(({ stepNumber, title, shortPoints, details }) => (
              <InstructionStep
                key={stepNumber}
                title={title}
                shortPoints={shortPoints}
                details={details}
              />
            ))}
          </div>

          {/* Quick example table */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="font-semibold mb-2 text-isof">
              Exempel: Bra och mindre bra beskrivning
            </p>
            <table className="w-full table-auto border-collapse text-xs mb-2">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-3 px-4 text-left">
                    Starttid
                  </th>
                  <th scope="col" className="py-3 px-4 text-left">
                    Beskrivning
                  </th>
                  <th scope="col" className="py-3 px-4 text-left">
                    Termer
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Good example row */}
                <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                  <td className="py-3 px-4 font-mono">00:00</td>
                  <td className="py-3 px-4 text-isof font-semibold">
                    Skogsarbete i Norrland på 1930-talet: vedhuggning, flottning
                    och timmerarbete.
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block m-1">
                      #Skogsbruk (#B.V.)
                    </span>
                    <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block m-1">
                      #Arbetsliv (#B.IX.)
                    </span>
                  </td>
                </tr>
                {/* Avoid example row */}
                <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                  <td className="py-3 px-4 font-mono">00:00</td>
                  <td className="py-3 px-4 text-red-700 font-semibold">
                    Intressant samtal om gamla minnen
                    <span className="block text-xs text-gray-600">
                      (Otydligt, för generellt)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                      #Minnesbilder
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-600">
              Ju mer specifik beskrivning och termer du väljer, desto lättare
              blir det för andra att hitta rätt ämne.
            </p>
          </div>

          {/* Fuller examples */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <details>
              <summary className="cursor-pointer font-semibold text-isof">
                Fler tidssatta exempel (klicka för att visa)
              </summary>
              <div className="mt-4 space-y-8 text-sm">
                {/* Example table */}
                <div>
                  <p className="font-semibold mb-2">
                    Från Alnö socken i Medelpad
                  </p>
                  <table className="w-full table-auto border-collapse text-xs mb-2">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th scope="col" className="py-3 px-4 text-left">
                          Starttid
                        </th>
                        <th scope="col" className="py-3 px-4 text-left">
                          Beskrivning
                        </th>
                        <th scope="col" className="py-3 px-4 text-left">
                          Termer
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">00:00</td>
                        <td className="py-3 px-4">Personalia</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block mr-1">
                            #Personalia (#E.VII.1.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">00:48</td>
                        <td className="py-3 px-4">Familjen</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Familj, släkt och vänner (#E.VII.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">01:42</td>
                        <td className="py-3 px-4">Barndomen</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Barndom (#E.VIII.1.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">02:35</td>
                        <td className="py-3 px-4">Modern och hennes tro</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Religiösa visor (#M.I.10.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">04:06</td>
                        <td className="py-3 px-4">
                          Morfar (hur han kom till Sundsvall, båtsmanstjänst,
                          bakgrund)
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Sjöfart (#C.I.2.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">09:11</td>
                        <td className="py-3 px-4">Mormor</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Släkthistorier (#E.VII.3.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">11:46</td>
                        <td className="py-3 px-4">
                          Massinflyttning till Sundsvall
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Urbanisering (#D.XIII.3.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">16:07</td>
                        <td className="py-3 px-4">Jämlikhet och fritänkande</td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Arbetsliv (#B.IX.)
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white even:bg-gray-100 border-b border-gray-200">
                        <td className="py-3 px-4 font-mono">18:43</td>
                        <td className="py-3 px-4">
                          Arbete i ung ålder (arbetssökande, hyvleri, sågverk,
                          arbetskläder, minnen)
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-isof text-white rounded-xl px-2 py-1 inline-block">
                            #Industriarbete (#B.VII.16.)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </div>

          <div className="text-center text-sm italic mt-6">
            Tack för ditt bidrag! Du hjälper till att göra kulturarvet mer
            tillgängligt.
          </div>
        </div>
      </details>
    </div>
  );
};

export default InstructionBox;
