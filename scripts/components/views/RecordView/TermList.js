import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";

export function TermNode({ node, selectedTags, onToggle, source }) {
  const [expanded, setExpanded] = useState(false);

  const isSelected = selectedTags?.some((t) => t.termid === node.termid);
  const hasChildren = node.children && node.children.length > 0;

  const handleCheckboxChange = () => {
    onToggle(source, { term: node.term, termid: node.termid });
  };

  return (
    <div className="text-sm">
      <div className="flex items-center py-0.5">
        {/* Toggle button if children exist */}
        {hasChildren && (
          <a
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle expand/collapse"
            className="border border-gray-500 text-gray-500 hover:text-gray-700 mb-2 mr-1 p-2 transition-transform duration-200 transform hover:cursor-pointer"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            <FontAwesomeIcon icon={faCaretDown} />
          </a>
        )}

        {/* Label + checkbox */}
        <label
          className={`cursor-pointer flex items-center gap-1 px-2 rounded-lg transition-all duration-200 
            ${isSelected ? "bg-isof text-white" : "hover:bg-gray-100"}`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="form-checkbox h-4 w-4 text-isof rounded focus:ring-isof cursor-pointer transition-colors duration-200"
          />
          <span className="font-medium">
            {node.termid} - {node.term}
          </span>
        </label>
      </div>

      {/* Recursively render children if expanded */}
      {expanded && hasChildren && (
        <div className="ml-6 pl-3 border-l border-gray-300 transition-all duration-200">
          {node.children.map((child) => (
            <TermNode
              key={child.termid}
              node={child}
              selectedTags={selectedTags}
              onToggle={onToggle}
              source={source}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const TermList = [
  {
    term: "Mytologisk diktning",
    termid: "#J",
    children: [
      {
        term: "Övernaturliga väsen",
        termid: "#J.VI",
        children: [
          {
            term: "Jättar",
            termid: "#J.VI.1.a",
            children: [],
          },
          {
            term: "Troll",
            termid: "#J.VI.1.c",
            children: [],
          },
          {
            term: "Vättar m.m.",
            termid: "#J.VI.1.d",
            children: [],
          },
          {
            term: "Älvor m.m.",
            termid: "#J.VI.1.i",
            children: [],
          },
        ],
      },
      {
        term: "Djävulen",
        termid: "#J.V",
        children: [],
      },
      {
        term: "Demoner och änglar",
        termid: "#J.IV.5",
        children: [],
      },
    ],
  },
  {
    term: "Samhället",
    termid: "#D",
    children: [
      {
        term: "Brott och straff",
        termid: "#D.VII",
        children: [
          {
            term: "Brott och brottsling",
            termid: "#D.VII.1",
            children: [
              {
                term: "Misshandel",
                termid: "#D.VII.1.a",
                children: [],
              },
              {
                term: "Övergrepp",
                termid: "#D.VII.1.b",
                children: [],
              },
              {
                term: "Våld i nära relationer",
                termid: "#D.VII.1.c",
                children: [],
              },
              {
                term: "Stöld",
                termid: "#D.VII.1.e",
                children: [],
              },
              {
                term: "Dråp och mord",
                termid: "#D.VII.1.f",
                children: [],
              },
            ],
          },
          {
            term: "Rättsutövning",
            termid: "#D.VII.2",
            children: [
              {
                term: "Avrättningar",
                termid: "#D.VII.2.a",
                children: [],
              },
              {
                term: "Fängelse",
                termid: "#D.VII.2.b",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Trossamfund",
        termid: "#D.V",
        children: [
          {
            term: "Mässa och gudstjänst",
            termid: "#D.V.1.a",
            children: [],
          },
          {
            term: "Bönehus",
            termid: "#D.V.1.b",
            children: [],
          },
          {
            term: "Missionsförening",
            termid: "#D.V.1.c",
            children: [],
          },
          {
            term: "Frikyrkorörelse",
            termid: "#D.V.1.d",
            children: [],
          },
          {
            term: "Bönemöte",
            termid: "#D.V.1.e",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Yrken, näringar och hushållning",
    termid: "#B",
    children: [
      {
        term: "Hushåll och levnadssätt",
        termid: "#B.VIII",
        children: [
          {
            term: "Eld och eldgörning",
            termid: "#B.VIII.1",
            children: [],
          },
          {
            term: "Belysning",
            termid: "#B.VIII.2",
            children: [],
          },
          {
            term: "Slakt",
            termid: "#B.VIII.4",
            children: [],
          },
          {
            term: "Viltet",
            termid: "#B.VIII.5",
            children: [],
          },
          {
            term: "Fisk",
            termid: "#B.VIII.6",
            children: [],
          },
          {
            term: "Insamling av frukt, bär och växter",
            termid: "#B.VIII.7",
            children: [],
          },
          {
            term: "Brännvinsbränning",
            termid: "#B.VIII.9",
            children: [],
          },
          {
            term: "Konservering",
            termid: "#B.VIII.11",
            children: [],
          },
          {
            term: "Matlagning",
            termid: "#B.VIII.12",
            children: [],
          },
          {
            term: "Berusning",
            termid: "#B.VIII.14.a.i",
            children: [],
          },
          {
            term: "Alkoholism",
            termid: "#B.VIII.14.a.ii",
            children: [],
          },
          {
            term: "Kaffe",
            termid: "#B.VIII.14.b",
            children: [],
          },
          {
            term: "Tobak",
            termid: "#B.VIII.14.c",
            children: [],
          },
          {
            term: "Narkotika",
            termid: "#B.VIII.14.d",
            children: [],
          },
          {
            term: "Hygien",
            termid: "#B.VIII.15",
            children: [],
          },
          {
            term: "Hushållsarbete",
            termid: "#B.VIII.16",
            children: [],
          },
        ],
      },
      {
        term: "Ledighet och fritid",
        termid: "#B.X",
        children: [
          {
            term: "Läsning",
            termid: "#B.X.1",
            children: [],
          },
          {
            term: "Fritidsaktiviteter",
            termid: "#B.X.2",
            children: [],
          },
          {
            term: "Semesterresor",
            termid: "#B.X.3",
            children: [],
          },
          {
            term: "Sommarstugor",
            termid: "#B.X.4",
            children: [],
          },
          {
            term: "Friluftsliv",
            termid: "#B.X.5",
            children: [],
          },
          {
            term: "Träning",
            termid: "#B.X.6",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Kommunikation och handel",
    termid: "#C",
    children: [
      {
        term: "Kommunikation",
        termid: "#C.I",
        children: [
          {
            term: "Bil och buss",
            termid: "#C.I.1.a",
            children: [],
          },
          {
            term: "Cykel",
            termid: "#C.I.1.b",
            children: [],
          },
          {
            term: "Färja",
            termid: "#C.I.1.c",
            children: [],
          },
          {
            term: "Roddbåt, segelbåt etc.",
            termid: "#C.I.1.d",
            children: [],
          },
          {
            term: "Järnväg",
            termid: "#C.I.1.e",
            children: [],
          },
          {
            term: "Skjutsväsen",
            termid: "#C.I.1.f",
            children: [],
          },
          {
            term: "Häst och vagn",
            termid: "#C.I.1.h",
            children: [],
          },
          {
            term: "Skidor, skridskor etc.",
            termid: "#C.I.1.i",
            children: [],
          },
          {
            term: "Promenera",
            termid: "#C.I.1.j",
            children: [],
          },
        ],
      },
      {
        term: "Handel",
        termid: "#C.II",
        children: [
          {
            term: "Gårdfarihandel",
            termid: "#C.II.1",
            children: [],
          },
          {
            term: "Marknader och handelsplatser",
            termid: "#C.II.2",
            children: [],
          },
          {
            term: "Auktioner",
            termid: "#C.II.3",
            children: [],
          },
          {
            term: "Affärer (butik)",
            termid: "#C.II.4",
            children: [],
          },
          {
            term: "Byteshandel",
            termid: "#C.II.5",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Människan",
    termid: "#E",
    children: [
      {
        term: "Kärlek och sex",
        termid: "#E.II",
        children: [
          {
            term: "Leva i hop",
            termid: "#E.II.1",
            children: [],
          },
          {
            term: "HBTQI+ kärlek",
            termid: "#E.II.2",
            children: [],
          },
          {
            term: "Kärleksmagi",
            termid: "#E.II.3",
            children: [],
          },
          {
            term: "Spådomar och varsel om kärlek",
            termid: "#E.II.4",
            children: [],
          },
        ],
      },
      {
        term: "Frieri och bröllop",
        termid: "#E.V",
        children: [
          {
            term: "Nattfrieri",
            termid: "#E.V.1",
            children: [],
          },
          {
            term: "Bröllopsfest",
            termid: "#E.V.2.a",
            children: [],
          },
          {
            term: "Bröllopskläder",
            termid: "#E.V.2.b",
            children: [],
          },
          {
            term: "Bröllopsgåvor och frierigåvor",
            termid: "#E.V.2.c",
            children: [],
          },
          {
            term: "Flytta i hop",
            termid: "#E.V.3",
            children: [],
          },
          {
            term: "Äktenskap",
            termid: "#E.V.4",
            children: [],
          },
          {
            term: "Skilsmässa",
            termid: "#E.V.5",
            children: [],
          },
          {
            term: "Omgifte",
            termid: "#E.V.6",
            children: [],
          },
          {
            term: "Tvångsäktenskap",
            termid: "#E.V.7",
            children: [],
          },
          {
            term: "Ogifta",
            termid: "#E.V.8",
            children: [],
          },
        ],
      },
      {
        term: "Död och begravning",
        termid: "#E.VI",
        children: [
          {
            term: "Begravning",
            termid: "#E.VI.2",
            children: [],
          },
          {
            term: "Sorg",
            termid: "#E.VI.3",
            children: [],
          },
          {
            term: "Dödsvarsel",
            termid: "#E.VI.4",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Musik",
    termid: "#M",
    children: [
      {
        term: "Arbetarrörelsens sånger",
        termid: "#M.I.7",
        children: [],
      },
      {
        term: "Arbetsvisor",
        termid: "#M.I.6",
        children: [],
      },
      {
        term: "Att sjunga",
        termid: "#M.I.23",
        children: [],
      },
      {
        term: "Ballader",
        termid: "#M.I.1",
        children: [],
      },
      {
        term: "Barnvisor",
        termid: "#M.I.4",
        children: [],
      },
      {
        term: "Bevärings- och soldatvisor",
        termid: "#M.I.15",
        children: [],
      },
      {
        term: "Dryckesvisor",
        termid: "#M.I.12",
        children: [],
      },
      {
        term: "Fångvisor",
        termid: "#M.I.13",
        children: [],
      },
      {
        term: "Lusse, staffans-, stjärngosse- och majvisor",
        termid: "#M.I.20",
        children: [],
      },
      {
        term: "Nidvisor",
        termid: "#M.I.14",
        children: [],
      },
      {
        term: "Religiösa visor",
        termid: "#M.I.10",
        children: [],
      },
      {
        term: "Sjömansvisor",
        termid: "#M.I.16",
        children: [],
      },
      {
        term: "Skillingsvisor",
        termid: "#M.I.8",
        children: [],
      },
      {
        term: "Skillingtryck",
        termid: "#M.I.21",
        children: [],
      },
      {
        term: "Tillfällighetsdiktning",
        termid: "#M.I.19",
        children: [],
      },
      {
        term: "Vaggvisor",
        termid: "#M.I.5",
        children: [],
      },
      {
        term: "Vallvisor m.m.",
        termid: "#M.I.11",
        children: [],
      },
      {
        term: "Visböcker",
        termid: "#M.I.22",
        children: [],
      },
      {
        term: "Yngre historiska visor",
        termid: "#M.I.17",
        children: [],
      },
    ],
  },
  {
    term: "Lokalsamhälle",
    termid: "#A",
    children: [
      {
        term: "Bondbyn",
        termid: "#A.I.1",
        children: [],
      },
      {
        term: "Gruvsamhället",
        termid: "#A.I.2",
        children: [],
      },
      {
        term: "Fiskeläget",
        termid: "#A.I.3",
        children: [],
      },
      {
        term: "Gård och hus",
        termid: "#A.IV",
        children: [
          {
            term: "Bostadshus, mangårdsbyggnad",
            termid: "#A.IV.5.a",
            children: [],
          },
          {
            term: "Ladugård",
            termid: "#A.IV.5.b",
            children: [],
          },
          {
            term: "Lada och loge",
            termid: "#A.IV.5.c",
            children: [],
          },
          {
            term: "Trädgård",
            termid: "#A.IV.4",
            children: [],
          },
        ],
      },
      {
        term: "Gränser",
        termid: "#A.VI",
        children: [
          {
            term: "Gränsmärken",
            termid: "#A.VI.1",
            children: [],
          },
          {
            term: "Hägnader",
            termid: "#A.VI.2",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Historisk tradition",
    termid: "#K.",
    children: [
      {
        term: "Ättestup, ätteklubba etc.",
        termid: "#K.VII.",
        children: [],
      },
      {
        term: "Farsoter, nödår, olyckor",
        termid: "#K.V.",
        children: [
          {
            term: "Bränder",
            termid: "#K.V.5.",
            children: [],
          },
          {
            term: "Dramatiska händelser",
            termid: "#K.V.6.",
            children: [],
          },
          {
            term: "Farsoter",
            termid: "#K.V.2.",
            children: [],
          },
          {
            term: "Nödår",
            termid: "#K.V.3.",
            children: [],
          },
          {
            term: "Olyckor och naturkatastrofer",
            termid: "#K.V.4.",
            children: [],
          },
          {
            term: "Svarta döden",
            termid: "#K.V.1.",
            children: [
              {
                term: "Pesten",
                termid: "#K.V.1.a.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Kriger, konflikter och kriser",
        termid: "#K.IV.",
        children: [
          {
            term: "Flykt",
            termid: "#K.IV.4.",
            children: [],
          },
          {
            term: "Krig",
            termid: "#K.IV.2.",
            children: [],
          },
          {
            term: "Kristider",
            termid: "#K.IV.1.",
            children: [],
          },
        ],
      },
      {
        term: "Kyrkosägner",
        termid: "#K.III.",
        children: [
          {
            term: "Kyrkklockor",
            termid: "#K.III.1.",
            children: [],
          },
          {
            term: "Kyrkobyggnad",
            termid: "#K.III.2.",
            children: [],
          },
          {
            term: "Offerkyrkor",
            termid: "#K.III.3.",
            children: [],
          },
        ],
      },
      {
        term: "Offerkällor, offerplatser m.m.",
        termid: "#K.I.",
        children: [],
      },
      {
        term: "Personsägner",
        termid: "#K.VI.",
        children: [
          {
            term: "Bönder och torpare",
            termid: "#K.VI.7.",
            children: [],
          },
          {
            term: "Forntida kungar, hövdingar m.m.",
            termid: "#K.VI.1.",
            children: [],
          },
          {
            term: "Genealogiska notiser",
            termid: "#K.VI.15.",
            children: [],
          },
          {
            term: "Hantverkare, arbetare m.m.",
            termid: "#K.VI.8.",
            children: [],
          },
          {
            term: "Herremän och fruar",
            termid: "#K.VI.4.",
            children: [],
          },
          {
            term: "Krigsmän och krigshjältar",
            termid: "#K.VI.5.",
            children: [],
          },
          {
            term: "Kungliga personer i historisk tid",
            termid: "#K.VI.2.",
            children: [],
          },
          {
            term: "Luffare",
            termid: "#K.VI.10.",
            children: [],
          },
          {
            term: "Original",
            termid: "#K.VI.11.",
            children: [],
          },
          {
            term: "Präster",
            termid: "#K.VI.6.",
            children: [],
          },
          {
            term: "Rövare, fredlösa",
            termid: "#K.VI.9.",
            children: [],
          },
          {
            term: "Släktsägner",
            termid: "#K.VI.14.",
            children: [],
          },
          {
            term: "Spelmän",
            termid: "#K.VI.13.",
            children: [],
          },
          {
            term: "St. Olav",
            termid: "#K.VI.3.",
            children: [],
          },
          {
            term: "Starka",
            termid: "#K.VI.12.",
            children: [],
          },
        ],
      },
      {
        term: "Skatter",
        termid: "#K.II.",
        children: [],
      },
    ],
  },

  {
    term: "Idrott, lek och spel",
    termid: "#N",
    children: [
      {
        term: "Dans",
        termid: "#N.VII",
        children: [],
      },
      {
        term: "Leksaker",
        termid: "#N.IX",
        children: [],
      },
      {
        term: "Sånglekar",
        termid: "#N.VI",
        children: [],
      },
      {
        term: "Sällskapslekar utan sång",
        termid: "#N.III",
        children: [],
      },
      {
        term: "Särskilda barnlekar",
        termid: "#N.IV",
        children: [],
      },
    ],
  },
  {
    term: "Läkekonst",
    termid: "#G",
    children: [
      {
        term: "Diagnostiska åtgärder",
        termid: "#G.I",
        children: [
          {
            term: "Stöpning",
            termid: "#G.I.1",
            children: [],
          },
          {
            term: "Mätning",
            termid: "#G.I.2",
            children: [],
          },
          {
            term: "Smöjning",
            termid: "#G.I.3",
            children: [],
          },
        ],
      },
      {
        term: "Bot / kur",
        termid: "#G.II",
        children: [
          {
            term: "Bot med magiska handlingar",
            termid: "#G.II.1",
            children: [],
          },
          {
            term: "Bot med magiska botemedel",
            termid: "#G.II.3",
            children: [],
          },
          {
            term: "Växtmedicin",
            termid: "#G.II.4",
            children: [],
          },
        ],
      },
      {
        term: "Sjukdomar",
        termid: "#G.V",
        children: [
          {
            term: "Engelska sjukan",
            termid: "#G.V.1",
            children: [],
          },
          {
            term: "Epilepsi",
            termid: "#G.V.2",
            children: [],
          },
          {
            term: "Tandvärk",
            termid: "#G.V.3",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Klokskap och svartkonst",
    termid: "#I",
    children: [
      {
        term: "Magiska ting",
        termid: "#I.VIII",
        children: [
          {
            term: "Trummor",
            termid: "#I.VIII.1",
            children: [],
          },
          {
            term: "Dragdocka",
            termid: "#I.VIII.2",
            children: [],
          },
          {
            term: "Magiska ting från kyrkan",
            termid: "#I.VIII.3",
            children: [],
          },
        ],
      },
      {
        term: "Personer med övernaturlig förmåga",
        termid: "#I.X",
        children: [
          {
            term: "Kloka, läkekunniga",
            termid: "#I.X.1",
            children: [],
          },
          {
            term: "Häxor",
            termid: "#I.X.2",
            children: [],
          },
          {
            term: "Trollkarlar",
            termid: "#I.X.3",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Sagor, gåtor och ordspråk",
    termid: "#L",
    children: [
      {
        term: "Sagor",
        termid: "#L.I",
        children: [
          {
            term: "Djursagor",
            termid: "#L.I.1",
            children: [],
          },
          {
            term: "Undersagor",
            termid: "#L.I.2",
            children: [],
          },
          {
            term: "Legendsagor",
            termid: "#L.I.3",
            children: [],
          },
          {
            term: "Novellsagor",
            termid: "#L.I.4",
            children: [],
          },
          {
            term: "Den dumme djävulen",
            termid: "#L.I.5",
            children: [],
          },
          {
            term: "Skämtsagor",
            termid: "#L.I.6",
            children: [],
          },
          {
            term: "Lögnsagor",
            termid: "#L.I.7",
            children: [],
          },
          {
            term: "Formelartade sagor",
            termid: "#L.I.8",
            children: [],
          },
          {
            term: "Ursprungssagor",
            termid: "#L.I.9",
            children: [],
          },
          {
            term: "Särskilda sagoberättare",
            termid: "#L.I.10",
            children: [],
          },
        ],
      },
      {
        term: "Gåtor",
        termid: "#L.IV",
        children: [],
      },
      {
        term: "Ordspråk, ordstäv och talesätt",
        termid: "#L.V",
        children: [],
      },
      {
        term: "Rim och ramsor",
        termid: "#L.VI",
        children: [],
      },
      {
        term: "Böner",
        termid: "#L.VII",
        children: [],
      },
      {
        term: "Vits och skämt",
        termid: "#L.VIII",
        children: [],
      },
    ],
  },
  {
    term: "Minoriteter",
    termid: "#P",
    children: [
      {
        term: "Minoritetskultur",
        termid: "#P.I",
        children: [
          {
            term: "Samer",
            termid: "#P.I.1",
            children: [],
          },
          {
            term: "Romer",
            termid: "#P.I.2",
            children: [],
          },
          {
            term: "Resande",
            termid: "#P.I.3",
            children: [],
          },
          {
            term: "Judar",
            termid: "#P.I.4",
            children: [],
          },
          {
            term: "Finnar",
            termid: "#P.I.5",
            children: [],
          },
          {
            term: "Kvener",
            termid: "#P.I.6",
            children: [],
          },
        ],
      },
      {
        term: "Berättelser om minoriteter",
        termid: "#P.II",
        children: [
          {
            term: "Samer",
            termid: "#P.II.1",
            children: [],
          },
          {
            term: "Romer",
            termid: "#P.II.2",
            children: [],
          },
          {
            term: "Resande",
            termid: "#P.II.3",
            children: [],
          },
          {
            term: "Judar",
            termid: "#P.II.4",
            children: [],
          },
          {
            term: "Finnar",
            termid: "#P.II.5",
            children: [],
          },
          {
            term: "Kvener",
            termid: "#P.II.6",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Natur",
    termid: "#F",
    children: [
      {
        term: "Himlavalv",
        termid: "#F.I.1",
        children: [],
      },
      {
        term: "Måne",
        termid: "#F.I.2",
        children: [],
      },
      {
        term: "Sol",
        termid: "#F.I.3",
        children: [],
      },
      {
        term: "Kometer og meteorer",
        termid: "#F.I.5",
        children: [],
      },
      {
        term: "Vind",
        termid: "#F.I.6",
        children: [],
      },
      {
        term: "Moln",
        termid: "#F.I.7",
        children: [],
      },
      {
        term: "Nederbörd, käle, is",
        termid: "#F.I.8",
        children: [],
      },
      {
        term: "Åska",
        termid: "#F.I.10",
        children: [],
      },
      {
        term: "Regnbåge",
        termid: "#F.I.11",
        children: [],
      },
      {
        term: "Norrsken",
        termid: "#F.I.12",
        children: [],
      },
      {
        term: "Berg, kullar och åsar",
        termid: "#F.II.1",
        children: [],
      },
      {
        term: "Stenar",
        termid: "#F.II.2",
        children: [],
      },
      {
        term: "Hav, sjöar, vattendrag",
        termid: "#F.II.3",
        children: [],
      },
      {
        term: "Källor",
        termid: "#F.II.4",
        children: [],
      },
      {
        term: "Skog och lund",
        termid: "#F.II.5",
        children: [],
      },
      {
        term: "Djur",
        termid: "#F.IV",
        children: [
          {
            term: "Björn",
            termid: "#F.IV.1.a",
            children: [],
          },
          {
            term: "Varg",
            termid: "#F.IV.1.b",
            children: [],
          },
          {
            term: "Fåglar",
            termid: "#F.IV.2",
            children: [],
          },
          {
            term: "Kräldjur",
            termid: "#F.IV.3",
            children: [],
          },
          {
            term: "Fiskar",
            termid: "#F.IV.5",
            children: [],
          },
          {
            term: "Insekter",
            termid: "#F.IV.6",
            children: [],
          },
          {
            term: "Spindeldjur",
            termid: "#F.IV.7",
            children: [],
          },
          {
            term: "Kräftdjur",
            termid: "#F.IV.8",
            children: [],
          },
          {
            term: "Maskdjur",
            termid: "#F.IV.9",
            children: [],
          },
          {
            term: "Blötdjur",
            termid: "#F.IV.10",
            children: [],
          },
        ],
      },
      {
        term: "Växter",
        termid: "#F.III",
        children: [
          {
            term: "Vilda växter",
            termid: "#F.III.1",
            children: [],
          },
          {
            term: "Kultiverade växter",
            termid: "#F.III.3",
            children: [],
          },
          {
            term: "Växter för mat och dryck för människor",
            termid: "#F.III.4",
            children: [],
          },
          {
            term: "Växter för mat för djur",
            termid: "#F.III.5",
            children: [],
          },
          {
            term: "Medicinskt och magiskt bruk av planter",
            termid: "#F.III.6",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Språk",
    termid: "#O",
    children: [
      {
        term: "Dialekter",
        termid: "#O.I",
        children: [],
      },
      {
        term: "Ortnamn",
        termid: "#O.III",
        children: [],
      },
      {
        term: "Djurnamn",
        termid: "#O.IV",
        children: [
          {
            term: "Konamn",
            termid: "#O.IV.a",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Årets gång",
    termid: "#H",
    children: [
      {
        term: "År",
        termid: "#H.I.5",
        children: [],
      },
      {
        term: "Årstider",
        termid: "#H.I.4",
        children: [],
      },
      {
        term: "Månader",
        termid: "#H.I.3",
        children: [],
      },
      {
        term: "Kalendern",
        termid: "#H.I.6",
        children: [],
      },
      {
        term: "Merkedager og högtider",
        termid: "#H.II",
        children: [
          {
            term: "Särskilda festseder",
            termid: "#H.II.1",
            children: [
              {
                term: "Årseldar",
                termid: "#H.II.1.a",
                children: [],
              },
              {
                term: "Källdrickning",
                termid: "#H.II.1.b",
                children: [],
              },
              {
                term: "Larm och skjutning",
                termid: "#H.II.1.c",
                children: [],
              },
              {
                term: "Festmat",
                termid: "#H.II.1.e",
                children: [],
              },
            ],
          },
          {
            term: "Alla Helgons Dag",
            termid: "#H.II.2.a",
            children: [],
          },
          {
            term: "Halloween",
            termid: "#H.II.2.b",
            children: [],
          },
          {
            term: "Mårten",
            termid: "#H.II.2.c",
            children: [],
          },
          {
            term: "Advent",
            termid: "#H.II.2.e",
            children: [],
          },
          {
            term: "Lucia",
            termid: "#H.II.2.f",
            children: [],
          },
          {
            term: "Tomas",
            termid: "#H.II.2.g",
            children: [],
          },
          {
            term: "Julafton",
            termid: "#H.II.2.h.i",
            children: [],
          },
          {
            term: "Julnatten",
            termid: "#H.II.2.h.ii",
            children: [],
          },
          {
            term: "Juldagen",
            termid: "#H.II.2.h.iii",
            children: [],
          },
          {
            term: "Varsel och spådomar vid jul",
            termid: "#H.II.2.h.iv",
            children: [],
          },
          {
            term: "Julbock och julget",
            termid: "#H.II.2.h.v",
            children: [],
          },
          {
            term: "Julgran",
            termid: "#H.II.2.h.vii",
            children: [],
          },
          {
            term: "Jultomten",
            termid: "#H.II.2.h.viii",
            children: [],
          },
          {
            term: "Julgåvor",
            termid: "#H.II.2.h.ix",
            children: [],
          },
          {
            term: "Staffansritt",
            termid: "#H.II.2.h.x",
            children: [],
          },
          {
            term: "Nyårsafton",
            termid: "#H.II.2.i",
            children: [],
          },
          {
            term: "Nyårsdagen",
            termid: "#H.II.2.j",
            children: [],
          },
          {
            term: "Trettondagen",
            termid: "#H.II.2.k",
            children: [],
          },
          {
            term: "Kyndelsmässa",
            termid: "#H.II.2.n",
            children: [],
          },
          {
            term: "Alla hjärtans dag",
            termid: "#H.II.2.o",
            children: [],
          },
          {
            term: "Skottårsdagen",
            termid: "#H.II.2.p",
            children: [],
          },
        ],
      },
    ],
  },
];
