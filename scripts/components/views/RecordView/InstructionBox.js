import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const InstructionBox = () => (
  <div className="bg-isof/5 p-4 rounded-lg mb-6 border border-isof/20">
    <details className="group">
      <summary className="flex items-center cursor-pointer list-none">
        <FontAwesomeIcon
          icon={faChevronDown}
          className="mr-2 text-isof/70 transform transition-transform duration-200 group-open:rotate-180"
        />
        <span className="text-isof font-semibold">
          Tips: Så skapar du en bra innehållsbeskrivning
        </span>
      </summary>
      <div className="mt-4 space-y-4 text-sm">
        {/* Quick tips */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-isof/70">
          <p className="mb-2 font-semibold text-isof">Snabbstart:</p>
          <ul className="list-disc !list-inside !space-y-1 !mb-0">
            <li className="!mb-0">
              Ange <strong>exakt starttid</strong> när ämnet börjar.
            </li>
            <li>
              Beskriv <strong>kort och tydligt</strong> vad som sägs.
            </li>
            <li>
              Lägg till minst ett <strong>ämnesord</strong>.
            </li>
          </ul>
          <p className="!mt-3 !mb-0">
            Läs mer detaljer nedan eller <em>kör igång direkt</em>!
          </p>
        </div>

        {/* Step-by-step instructions */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-semibold !mb-2 text-isof text-md">
            3 viktiga steg i detalj:
          </p>
          <ol className="list-decimal !list-outside !space-y-2 !pl-4 !mb-0">
            <li>
              <strong>Starttid</strong> – Ange exakt tid med spelaren eller
              manuellt (t.ex. <em>01:23</em>).
            </li>
            <li>
              <strong>Beskrivning</strong> – Beskriv kort men tydligt.
              <br />
              <em>"Diskussion om svensk husmanskost"</em> är mer hjälpsamt än
              <em> "Pratar om gamla tider."</em>
            </li>
            <li>
              <strong>Ämnesord</strong> – Välj eller skriv in ämnesord.
              <br />
              Exempel: <em>"Vår- och sommarfester"</em>, <em>"Festmat."</em>
            </li>
          </ol>
        </div>

        {/* Examples section in a table */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-semibold !mb-2 text-isof">
            Exempel på bra beskrivning:
          </p>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-1/2 py-3 px-4 border-b border-gray-300 text-left text-green-700">
                  Gör så här:
                </th>
                <th className="w-1/2 py-3 px-4 border-b border-gray-300 text-left text-red-700">
                  Undvik:
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td className="py-3 px-4 align-top border-b border-gray-200">
                  <span className="block font-semibold">
                    "Intervju om skogsarbete i Norrland under 1930-talet"
                  </span>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    <span className="px-2 py-1 rounded-lg bg-isof text-white">
                      #Skogsbruk
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-isof text-white">
                      #Norrland
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 align-top border-b border-gray-200">
                  <span className="block font-semibold">
                    "Intressant samtal om gamla minnen"
                  </span>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    <span className="px-2 py-1 rounded-lg bg-isof text-white">
                      #Minnesbilder
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Thank you note */}
        <div className="text-center text-sm italic mt-4">
          Tack för att du hjälper till att göra kulturarvet mer tillgängligt!
        </div>
      </div>
    </details>
  </div>
);

export default InstructionBox;
