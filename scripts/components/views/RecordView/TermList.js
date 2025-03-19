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
    termid: "#J.",
    children: [
      {
        term: "De döda",
        termid: "#J.VII.",
        children: [
          {
            term: "De dödas julotta",
            termid: "#J.VII.4.",
            children: [],
          },
          {
            term: "Gastar",
            termid: "#J.VII.3.",
            children: [],
          },
          {
            term: "Lyktgubbar",
            termid: "#J.VII.6.",
            children: [],
          },
          {
            term: "Mylingar (mördade barn)",
            termid: "#J.VII.5.",
            children: [],
          },
          {
            term: "Spöken",
            termid: "#J.VII.1.",
            children: [],
          },
          {
            term: "Spökskepp",
            termid: "#J.VII.7.",
            children: [],
          },
        ],
      },
      {
        term: "Djävulen",
        termid: "#J.V.",
        children: [],
      },
      {
        term: "Gestalter från kristen tro",
        termid: "#J.IV.",
        children: [
          {
            term: "Demoner och änglar",
            termid: "#J.IV.5.",
            children: [],
          },
          {
            term: "Gud och Jesus",
            termid: "#J.IV.1.",
            children: [],
          },
          {
            term: "Helgon",
            termid: "#J.IV.4.",
            children: [],
          },
          {
            term: "Maria",
            termid: "#J.IV.2.",
            children: [],
          },
          {
            term: "Petrus",
            termid: "#J.IV.3.",
            children: [],
          },
        ],
      },
      {
        term: "Norröna gudar",
        termid: "#J.II.",
        children: [],
      },
      {
        term: "Odens jakt",
        termid: "#J.III.",
        children: [],
      },
      {
        term: "Övernaturliga väsen",
        termid: "#J.VI.",
        children: [
          {
            term: "Berg- och skogsväsen",
            termid: "#J.VI.1.",
            children: [
              {
                term: "Älvor m.m.",
                termid: "#J.VI.1.i.",
                children: [],
              },
              {
                term: "Bergtagning",
                termid: "#J.VI.1.g.",
                children: [],
              },
              {
                term: "Bortbyting",
                termid: "#J.VI.1.f.",
                children: [],
              },
              {
                term: "Gruvväsen",
                termid: "#J.VI.1.e.",
                children: [],
              },
              {
                term: "Jättar",
                termid: "#J.VI.1.a.",
                children: [],
              },
              {
                term: "Skogsrå",
                termid: "#J.VI.1.h.",
                children: [],
              },
              {
                term: "Troll",
                termid: "#J.VI.1.c.",
                children: [],
              },
              {
                term: "Vättar m.m.",
                termid: "#J.VI.1.d.",
                children: [],
              },
            ],
          },
          {
            term: "Byggnads- och gårdsväsen",
            termid: "#J.VI.3.",
            children: [
              {
                term: "Spiritus",
                termid: "#J.VI.3.c.",
                children: [],
              },
              {
                term: "Stallo",
                termid: "#J.VI.3.d.",
                children: [],
              },
              {
                term: "Tomtar",
                termid: "#J.VI.3.a.",
                children: [],
              },
            ],
          },
          {
            term: "Djurväsen",
            termid: "#J.VI.5.",
            children: [
              {
                term: "Drakar",
                termid: "#J.VI.5.a.",
                children: [],
              },
              {
                term: "Gloson",
                termid: "#J.VI.5.c.",
                children: [],
              },
              {
                term: "Hundar",
                termid: "#J.VI.5.d.",
                children: [],
              },
              {
                term: "Ormar",
                termid: "#J.VI.5.b.",
                children: [
                  {
                    term: "Vitorm",
                    termid: "#J.VI.5.b.i.",
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            term: "Förvandlade",
            termid: "#J.VI.4.",
            children: [
              {
                term: "Mara",
                termid: "#J.VI.4.a.",
                children: [],
              },
              {
                term: "Varulv och manbjörn",
                termid: "#J.VI.4.b.",
                children: [],
              },
            ],
          },
          {
            term: "Vattenväsen",
            termid: "#J.VI.2.",
            children: [
              {
                term: "Bäckahästen",
                termid: "#J.VI.2.c.",
                children: [],
              },
              {
                term: "Havsfru etc.",
                termid: "#J.VI.2.f.",
                children: [],
              },
              {
                term: "Näcken",
                termid: "#J.VI.2.a.",
                children: [],
              },
              {
                term: "Sjö- och havsodjur",
                termid: "#J.VI.2.h.",
                children: [],
              },
              {
                term: "Sjörå",
                termid: "#J.VI.2.e.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Skrämsel- och barnväsen",
        termid: "#J.VIII.",
        children: [],
      },
      {
        term: "Upphovssägner",
        termid: "#J.I.",
        children: [],
      },
    ],
  },
  {
    term: "Samhället",
    termid: "#D.",
    children: [
      {
        term: "By och gård (som sociala enheter)",
        termid: "#D.I.",
        children: [
          {
            term: "Byalag, bjudlag etc.",
            termid: "#D.I.1.",
            children: [],
          },
          {
            term: "Arbetslag och arbetsgemenskap",
            termid: "#D.I.2.",
            children: [],
          },
          {
            term: "Sammankomster",
            termid: "#D.I.3.",
            children: [],
          },
          {
            term: "Främmande",
            termid: "#D.I.4.",
            children: [],
          },
        ],
      },
      {
        term: "Kläder",
        termid: "#D.II.",
        children: [
          {
            term: "Arbetskläder",
            termid: "#D.II.1.",
            children: [],
          },
          {
            term: "Högtidsdräkt",
            termid: "#D.II.2.",
            children: [],
          },
          {
            term: "Smycken",
            termid: "#D.II.3.",
            children: [],
          },
          {
            term: "Hår och skägg",
            termid: "#D.II.4.",
            children: [],
          },
          {
            term: "Mode",
            termid: "#D.II.5.",
            children: [],
          },
        ],
      },
      {
        term: "Samhällsklasser",
        termid: "#D.III.",
        children: [],
      },
      {
        term: "Umgängesformer",
        termid: "#D.IV.",
        children: [
          {
            term: "Binamn",
            termid: "#D.IV.1.",
            children: [],
          },
          {
            term: "Tilltalsformer och hälsningar",
            termid: "#D.IV.2.",
            children: [],
          },
          {
            term: "Gäster",
            termid: "#D.IV.3.",
            children: [],
          },
          {
            term: "Bordsskick",
            termid: "#D.IV.4.",
            children: [],
          },
          {
            term: "Gästabud",
            termid: "#D.IV.5.",
            children: [],
          },
          {
            term: "Krogliv",
            termid: "#D.IV.6.",
            children: [],
          },
        ],
      },
      {
        term: "Kyrka och församling",
        termid: "#D.V.",
        children: [
          {
            term: "Mässa och gudstjänst",
            termid: "#D.V.1.a.",
            children: [],
          },
          {
            term: "Bönehus",
            termid: "#D.V.1.b.",
            children: [],
          },
          {
            term: "Missionsförening",
            termid: "#D.V.1.c.",
            children: [],
          },
          {
            term: "Frikyrkorörelse",
            termid: "#D.V.1.d.",
            children: [],
          },
          {
            term: "Bönemöte",
            termid: "#D.V.1.e.",
            children: [],
          },
          {
            term: "Moske och församling",
            termid: "#D.V.2.",
            children: [],
          },
          {
            term: "Synagoga och församling",
            termid: "#D.V.3.",
            children: [],
          },
        ],
      },
      {
        term: "Undervisningsväsen",
        termid: "#D.VI.",
        children: [
          {
            term: "Skolvägen",
            termid: "#D.VI.1.",
            children: [],
          },
          {
            term: "Skoldagen",
            termid: "#D.VI.2.",
            children: [],
          },
          {
            term: "Skolhuset",
            termid: "#D.VI.3.",
            children: [],
          },
          {
            term: "Läraren",
            termid: "#D.VI.4.",
            children: [],
          },
          {
            term: "Straff och belöning på skolan",
            termid: "#D.VI.5.",
            children: [],
          },
          {
            term: "Skolresor",
            termid: "#D.VI.6.",
            children: [],
          },
          {
            term: "Raster",
            termid: "#D.VI.7.",
            children: [],
          },
        ],
      },
      {
        term: "Brott och straff",
        termid: "#D.VII.",
        children: [
          {
            term: "Brott och brottsling",
            termid: "#D.VII.1.",
            children: [
              {
                term: "Misshandel",
                termid: "#D.VII.1.a.",
                children: [],
              },
              {
                term: "Övergrepp",
                termid: "#D.VII.1.b.",
                children: [],
              },
              {
                term: "Våld i nära relationer",
                termid: "#D.VII.1.c.",
                children: [],
              },
              {
                term: "Stöld",
                termid: "#D.VII.1.e.",
                children: [],
              },
              {
                term: "Dråp och mord",
                termid: "#D.VII.1.f.",
                children: [],
              },
            ],
          },
          {
            term: "Rättsutövning",
            termid: "#D.VII.2.",
            children: [
              {
                term: "Avrättningar",
                termid: "#D.VII.2.a.",
                children: [],
              },
              {
                term: "Fängelse",
                termid: "#D.VII.2.b.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Militärväsen",
        termid: "#D.VIII.",
        children: [],
      },
      {
        term: "Fattigvård",
        termid: "#D.IX.",
        children: [],
      },
      {
        term: "Folkrörelse och föreningsliv",
        termid: "#D.X.",
        children: [
          {
            term: "Arbetarrörelsen",
            termid: "#D.X.1.",
            children: [
              {
                term: "Fackföreningar",
                termid: "#D.X.1.a.",
                children: [],
              },
            ],
          },
          {
            term: "Nykterhetsrörelse",
            termid: "#D.X.2.",
            children: [],
          },
          {
            term: "Kvinnorörelsen",
            termid: "#D.X.3.",
            children: [],
          },
          {
            term: "Skyttelag",
            termid: "#D.X.4.",
            children: [],
          },
          {
            term: "Ungdomsrörelsen",
            termid: "#D.X.5.",
            children: [],
          },
          {
            term: "Språkrörelsen",
            termid: "#D.X.6.",
            children: [],
          },
          {
            term: "Hembygdsrörelsen",
            termid: "#D.X.7.",
            children: [],
          },
          {
            term: "Idrottsrörelsen",
            termid: "#D.X.8.",
            children: [],
          },
          {
            term: "Arbetsfester",
            termid: "#D.X.9.",
            children: [],
          },
          {
            term: "HBTQI+ föreningsliv",
            termid: "#D.X.10.",
            children: [],
          },
        ],
      },
      {
        term: "Barnhem",
        termid: "#D.XI.",
        children: [],
      },
      {
        term: "Sjukhus",
        termid: "#D.XII.",
        children: [
          {
            term: "Psykatrisk vårdinrättning",
            termid: "#D.XII.1.",
            children: [],
          },
        ],
      },
      {
        term: "Migration",
        termid: "#D.XIII.",
        children: [
          {
            term: "Immigration",
            termid: "#D.XIII.1.",
            children: [],
          },
          {
            term: "Emigration",
            termid: "#D.XIII.2.",
            children: [],
          },
          {
            term: "Urbanisering",
            termid: "#D.XIII.3.",
            children: [],
          },
          {
            term: "Flytt inom landet",
            termid: "#D.XIII.4.",
            children: [],
          },
          {
            term: "Arbetsvandringar",
            termid: "#D.XIII.5.",
            children: [],
          },
        ],
      },
    ],
  },

  {
    term: "Yrken, näringar och hushållning",
    termid: "#B.",
    children: [
      {
        term: "Jakt",
        termid: "#B.I.",
        children: [],
      },
      {
        term: "Fiske",
        termid: "#B.II.",
        children: [],
      },
      {
        term: "Husdjur och husdjursskötsel",
        termid: "#B.III.",
        children: [
          {
            term: "Nötkreatur",
            termid: "#B.III.1.",
            children: [],
          },
          {
            term: "Häst",
            termid: "#B.III.2.",
            children: [],
          },
          {
            term: "Får",
            termid: "#B.III.3.",
            children: [],
          },
          {
            term: "Get",
            termid: "#B.III.4.",
            children: [],
          },
          {
            term: "Svin",
            termid: "#B.III.5.",
            children: [],
          },
          {
            term: "Fjäderfä",
            termid: "#B.III.6.",
            children: [],
          },
          {
            term: "Bi",
            termid: "#B.III.7.",
            children: [],
          },
          {
            term: "Hund",
            termid: "#B.III.8.",
            children: [],
          },
          {
            term: "Katt",
            termid: "#B.III.9.",
            children: [],
          },
        ],
      },
      {
        term: "Jordbruk",
        termid: "#B.IV.",
        children: [
          {
            term: "Jordbruksredskap",
            termid: "#B.IV.1.",
            children: [],
          },
          {
            term: "Plöjning, harvning och såing",
            termid: "#B.IV.2.",
            children: [],
          },
          {
            term: "Slåtter och skörd",
            termid: "#B.IV.3.",
            children: [],
          },
          {
            term: "Foder",
            termid: "#B.IV.4.",
            children: [],
          },
          {
            term: "Äng",
            termid: "#B.IV.5.",
            children: [],
          },
          {
            term: "Löv-, barr- och mosstäkt.",
            termid: "#B.IV.6.",
            children: [],
          },
          {
            term: "Fäbodväsen",
            termid: "#B.IV.7.",
            children: [],
          },
          {
            term: "Tröskning och maling",
            termid: "#B.IV.8.",
            children: [],
          },
          {
            term: "Gödsel",
            termid: "#B.IV.9.",
            children: [],
          },
          {
            term: "Potatis",
            termid: "#B.IV.10.",
            children: [],
          },
        ],
      },
      {
        term: "Skogsbruk",
        termid: "#B.V.",
        children: [
          {
            term: "Timmerhuggning",
            termid: "#B.V.1.",
            children: [],
          },
          {
            term: "Timmerflottning",
            termid: "#B.V.2.",
            children: [],
          },
          {
            term: "Kolning",
            termid: "#B.V.3.",
            children: [],
          },
          {
            term: "Tjärbränning",
            termid: "#B.V.4.",
            children: [],
          },
          {
            term: "Sågverk",
            termid: "#B.V.5.",
            children: [],
          },
        ],
      },
      {
        term: "Bergsbruk",
        termid: "#B.VI.",
        children: [],
      },
      {
        term: "Slöjd, hantverk och industri",
        termid: "#B.VII.",
        children: [
          {
            term: "Byggnadsarbete",
            termid: "#B.VII.1.",
            children: [],
          },
          {
            term: "Träslöjd och träindustri",
            termid: "#B.VII.2.",
            children: [],
          },
          {
            term: "Målning",
            termid: "#B.VII.3.",
            children: [],
          },
          {
            term: "Horn- och benarbeten",
            termid: "#B.VII.4.",
            children: [],
          },
          {
            term: "Flätning, bindning, slagning",
            termid: "#B.VII.5.",
            children: [],
          },
          {
            term: "Skinn- och läderarbeten",
            termid: "#B.VII.6.",
            children: [],
          },
          {
            term: "Textilarbeten",
            termid: "#B.VII.7.",
            children: [],
          },
          {
            term: "Metallbearbetning",
            termid: "#B.VII.8.",
            children: [],
          },
          {
            term: "Urmakeri",
            termid: "#B.VII.9.",
            children: [],
          },
          {
            term: "Krukmakeri",
            termid: "#B.VII.10.",
            children: [],
          },
          {
            term: "Tegelslagning",
            termid: "#B.VII.11.",
            children: [],
          },
          {
            term: "Murning, kakelugnsmakeri",
            termid: "#B.VII.12.",
            children: [],
          },
          {
            term: "Glastillverkning",
            termid: "#B.VII.13.",
            children: [],
          },
          {
            term: "Stenarbeten",
            termid: "#B.VII.14.",
            children: [],
          },
          {
            term: "Båtbyggeri",
            termid: "#B.VII.15.",
            children: [],
          },
          {
            term: "Industriarbete",
            termid: "#B.VII.16.",
            children: [],
          },
        ],
      },
      {
        term: "Hushåll och levnadssätt",
        termid: "#B.VIII.",
        children: [
          {
            term: "Eld och eldgörning",
            termid: "#B.VIII.1.",
            children: [],
          },
          {
            term: "Belysning",
            termid: "#B.VIII.2.",
            children: [],
          },
          {
            term: "Mjölkhushållning",
            termid: "#B.VIII.3.",
            children: [],
          },
          {
            term: "Slakt",
            termid: "#B.VIII.4.",
            children: [],
          },
          {
            term: "Viltet",
            termid: "#B.VIII.5.",
            children: [],
          },
          {
            term: "Fisk",
            termid: "#B.VIII.6.",
            children: [],
          },
          {
            term: "Insamling av frukt, bär och växter",
            termid: "#B.VIII.7.",
            children: [],
          },
          {
            term: "Brygd",
            termid: "#B.VIII.8.",
            children: [],
          },
          {
            term: "Brännvinsbränning",
            termid: "#B.VIII.9.",
            children: [],
          },
          {
            term: "Bakning",
            termid: "#B.VIII.10.",
            children: [],
          },
          {
            term: "Konservering",
            termid: "#B.VIII.11.",
            children: [],
          },
          {
            term: "Matlagning",
            termid: "#B.VIII.12.",
            children: [],
          },
          {
            term: "Måltider",
            termid: "#B.VIII.13.",
            children: [],
          },
          {
            term: "Njutningsmedel",
            termid: "#B.VIII.14.",
            children: [
              {
                term: "Alkohol",
                termid: "#B.VIII.14.a.",
                children: [
                  {
                    term: "Berusning",
                    termid: "#B.VIII.14.a.i.",
                    children: [],
                  },
                  {
                    term: "Alkoholism",
                    termid: "#B.VIII.14.a.ii.",
                    children: [],
                  },
                ],
              },
              {
                term: "Kaffe",
                termid: "#B.VIII.14.b.",
                children: [],
              },
              {
                term: "Tobak",
                termid: "#B.VIII.14.c.",
                children: [],
              },
              {
                term: "Narkotika",
                termid: "#B.VIII.14.d.",
                children: [],
              },
            ],
          },
          {
            term: "Hygien",
            termid: "#B.VIII.15.",
            children: [],
          },
          {
            term: "Hushållsarbete",
            termid: "#B.VIII.16.",
            children: [],
          },
        ],
      },
      {
        term: "Arbetsliv",
        termid: "#B.IX.",
        children: [
          {
            term: "Yrkesval",
            termid: "#B.IX.1.",
            children: [],
          },
          {
            term: "Arbetsplats och arbetsmiljö",
            termid: "#B.IX.2.",
            children: [],
          },
          {
            term: "Husmors-rollen",
            termid: "#B.IX.3.",
            children: [],
          },
          {
            term: "Arbetslöshet",
            termid: "#B.IX.4.",
            children: [],
          },
        ],
      },
      {
        term: "Ledighet och fritid",
        termid: "#B.X.",
        children: [
          {
            term: "Läsning",
            termid: "#B.X.1.",
            children: [],
          },
          {
            term: "Fritidsaktiviteter",
            termid: "#B.X.2.",
            children: [],
          },
          {
            term: "Semesterresor",
            termid: "#B.X.3.",
            children: [],
          },
          {
            term: "Sommarstugor",
            termid: "#B.X.4.",
            children: [],
          },
          {
            term: "Friluftsliv",
            termid: "#B.X.5.",
            children: [],
          },
          {
            term: "Träning",
            termid: "#B.X.6.",
            children: [],
          },
        ],
      },
      {
        term: "Könsroller",
        termid: "#B.XI.",
        children: [],
      },
    ],
  },
  {
    term: "Kommunikation och handel",
    termid: "#C.",
    children: [
      {
        term: "Kommunikation",
        termid: "#C.I.",
        children: [
          {
            term: "Samfärdsel till lands",
            termid: "#C.I.1.",
            children: [
              {
                term: "Bil och buss",
                termid: "#C.I.1.a.",
                children: [],
              },
              {
                term: "Cykel",
                termid: "#C.I.1.b.",
                children: [],
              },
              {
                term: "Färja",
                termid: "#C.I.1.c.",
                children: [],
              },
              {
                term: "Roddbåt, segelbåt etc.",
                termid: "#C.I.1.d.",
                children: [],
              },
              {
                term: "Järnväg",
                termid: "#C.I.1.e.",
                children: [],
              },
              {
                term: "Skjutsväsen",
                termid: "#C.I.1.f.",
                children: [],
              },
              {
                term: "Häst och vagn",
                termid: "#C.I.1.h.",
                children: [],
              },
              {
                term: "Skidor, skridskor etc.",
                termid: "#C.I.1.i.",
                children: [],
              },
              {
                term: "Promenera",
                termid: "#C.I.1.j.",
                children: [],
              },
            ],
          },
          {
            term: "Sjöfart",
            termid: "#C.I.2.",
            children: [],
          },
          {
            term: "Luftfart",
            termid: "#C.I.3.",
            children: [],
          },
          {
            term: "Postväsen",
            termid: "#C.I.4.",
            children: [],
          },
          {
            term: "Telegraf, telefon, telegram",
            termid: "#C.I.5.",
            children: [],
          },
          {
            term: "Medievanor",
            termid: "#C.I.6.",
            children: [],
          },
        ],
      },
      {
        term: "Handel",
        termid: "#C.II.",
        children: [
          {
            term: "Gårdfarihandel",
            termid: "#C.II.1.",
            children: [],
          },
          {
            term: "Marknader och handelsplatser",
            termid: "#C.II.2.",
            children: [],
          },
          {
            term: "Auktioner",
            termid: "#C.II.3.",
            children: [],
          },
          {
            term: "Affärer (butik)",
            termid: "#C.II.4.",
            children: [],
          },
          {
            term: "Byteshandel",
            termid: "#C.II.5.",
            children: [],
          },
        ],
      },
    ],
  },

  {
    term: "Människan",
    termid: "#E.",
    children: [
      {
        term: "Kroppen",
        termid: "#E.I.",
        children: [
          {
            term: "Funktionsvariationer",
            termid: "#E.I.1.",
            children: [],
          },
        ],
      },
      {
        term: "Kärlek och sex",
        termid: "#E.II.",
        children: [
          {
            term: "Leva i hop",
            termid: "#E.II.1.",
            children: [],
          },
          {
            term: "HBTQI+ kärlek",
            termid: "#E.II.2.",
            children: [],
          },
          {
            term: "Kärleksmagi",
            termid: "#E.II.3.",
            children: [],
          },
          {
            term: "Spådomar och varsel om kärlek",
            termid: "#E.II.4.",
            children: [],
          },
        ],
      },
      {
        term: "Havandeskap, födelse och dop",
        termid: "#E.III.",
        children: [
          {
            term: "Spådomar och varsel om barn",
            termid: "#E.III.1.",
            children: [],
          },
          {
            term: "Abort",
            termid: "#E.III.2.",
            children: [],
          },
          {
            term: "Födsel",
            termid: "#E.III.3.",
            children: [],
          },
          {
            term: "Segerhuva",
            termid: "#E.III.4.",
            children: [],
          },
          {
            term: "Barnets utseende och kropp",
            termid: "#E.III.5.",
            children: [],
          },
          {
            term: "Tidpunkt för födseln",
            termid: "#E.III.6.",
            children: [],
          },
          {
            term: "Barnmorska",
            termid: "#E.III.7.",
            children: [],
          },
          {
            term: "Barnsammankomster",
            termid: "#E.III.8.",
            children: [],
          },
          {
            term: "Det odöpta barnet",
            termid: "#E.III.9.",
            children: [],
          },
          {
            term: "Dop- och namnfest",
            termid: "#E.III.10.",
            children: [],
          },
          {
            term: "Kyrkogång",
            termid: "#E.III.11.",
            children: [],
          },
          {
            term: "Fadderskap",
            termid: "#E.III.13.",
            children: [],
          },
        ],
      },
      {
        term: "Konfirmasjon",
        termid: "#E.IV.",
        children: [],
      },
      {
        term: "Frieri och bröllop",
        termid: "#E.V.",
        children: [
          {
            term: "Nattfrieri",
            termid: "#E.V.1.",
            children: [],
          },
          {
            term: "Bröllop",
            termid: "#E.V.2.",
            children: [
              {
                term: "Bröllopsfest",
                termid: "#E.V.2.a.",
                children: [],
              },
              {
                term: "Bröllopskläder",
                termid: "#E.V.2.b.",
                children: [],
              },
              {
                term: "Bröllopsgåvor och frierigåvor",
                termid: "#E.V.2.c.",
                children: [],
              },
              {
                term: "Brudeferd",
                termid: "#E.V.2.d.",
                children: [],
              },
            ],
          },
          {
            term: "Flytta i hop",
            termid: "#E.V.3.",
            children: [],
          },
          {
            term: "Äktenskap",
            termid: "#E.V.4.",
            children: [],
          },
          {
            term: "Skilsmässa",
            termid: "#E.V.5.",
            children: [],
          },
          {
            term: "Omgifte",
            termid: "#E.V.6.",
            children: [],
          },
          {
            term: "Tvångsäktenskap",
            termid: "#E.V.7.",
            children: [],
          },
          {
            term: "Ogifta",
            termid: "#E.V.8.",
            children: [],
          },
        ],
      },
      {
        term: "Död och begravning",
        termid: "#E.VI.",
        children: [
          {
            term: "Dödsfallet",
            termid: "#E.VI.1.",
            children: [
              {
                term: "Selvmord",
                termid: "#E.VI.1.a.",
                children: [],
              },
            ],
          },
          {
            term: "Begravning",
            termid: "#E.VI.2.",
            children: [],
          },
          {
            term: "Sorg",
            termid: "#E.VI.3.",
            children: [],
          },
          {
            term: "Dödsvarsel",
            termid: "#E.VI.4.",
            children: [],
          },
        ],
      },
      {
        term: "Familj, släkt och vänner",
        termid: "#E.VII.",
        children: [
          {
            term: "Namnskick",
            termid: "#E.VII.1.",
            children: [],
          },
          {
            term: "Födelse- och namnsdagar",
            termid: "#E.VII.2.",
            children: [],
          },
          {
            term: "Släkthistorier/forskning",
            termid: "#E.VII.3.",
            children: [],
          },
          {
            term: "Vänskap",
            termid: "#E.VII.4.",
            children: [],
          },
        ],
      },
      {
        term: "Åldersklasser",
        termid: "#E.VIII.",
        children: [
          {
            term: "Barndom",
            termid: "#E.VIII.1.",
            children: [
              {
                term: "Första minenna",
                termid: "#E.VIII.1.a.",
                children: [],
              },
              {
                term: "Barndomshemmet",
                termid: "#E.VIII.1.b.",
                children: [],
              },
              {
                term: "Uppfostran",
                termid: "#E.VIII.1.c.",
                children: [],
              },
              {
                term: "Barnskötsel",
                termid: "#E.VIII.1.d.",
                children: [],
              },
              {
                term: "Att bli förälder",
                termid: "#E.VIII.1.e.",
                children: [],
              },
            ],
          },
          {
            term: "Ungdomstid",
            termid: "#E.VIII.2.",
            children: [
              {
                term: "Första arbetet",
                termid: "#E.VIII.2.a.",
                children: [],
              },
              {
                term: "Ungdomars mötesplatser",
                termid: "#E.VIII.2.e.",
                children: [],
              },
            ],
          },
          {
            term: "Ålderdom",
            termid: "#E.VIII.3.",
            children: [
              {
                term: "Att bli äldre",
                termid: "#E.VIII.3.a.",
                children: [],
              },
              {
                term: "Livet som pensionär",
                termid: "#E.VIII.3.b.",
                children: [],
              },
              {
                term: "Äldreomsorg",
                termid: "#E.VIII.3.c.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Dagbok",
        termid: "#E.IX.",
        children: [],
      },
      {
        term: "Levnadshistoria",
        termid: "#E.X.",
        children: [
          {
            term: "Barndomsminnen",
            termid: "#E.X.1.",
            children: [],
          },
          {
            term: "Familj, släkt och vänner",
            termid: "#E.X.5.",
            children: [],
          },
          {
            term: "Hem",
            termid: "#E.X.6.",
            children: [
              {
                term: "Interiör och husgeråd",
                termid: "#E.X.6.a.",
                children: [],
              },
              {
                term: "Renovering av hemmet",
                termid: "#E.X.6.b.",
                children: [],
              },
            ],
          },
          {
            term: "Dagligt liv",
            termid: "#E.X.7.",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Musik",
    termid: "#M.",
    children: [
      {
        term: "Att spela musik",
        termid: "#M.IV.",
        children: [],
      },
      {
        term: "Instrumentalmusik",
        termid: "#M.II.",
        children: [
          {
            term: "Musikinstrument",
            termid: "#M.II.1.",
            children: [],
          },
        ],
      },
      {
        term: "Notböcker",
        termid: "#M.III.",
        children: [],
      },
      {
        term: "Visor och vokalmusik",
        termid: "#M.I.",
        children: [
          {
            term: "Arbetarrörelsens sånger",
            termid: "#M.I.7.",
            children: [],
          },
          {
            term: "Arbetsvisor",
            termid: "#M.I.6.",
            children: [],
          },
          {
            term: "Att sjunga",
            termid: "#M.I.23.",
            children: [],
          },
          {
            term: "Ballader",
            termid: "#M.I.1.",
            children: [],
          },
          {
            term: "Barnvisor",
            termid: "#M.I.4.",
            children: [],
          },
          {
            term: "Bevärings- och soldatvisor",
            termid: "#M.I.15.",
            children: [],
          },
          {
            term: "Dryckesvisor",
            termid: "#M.I.12.",
            children: [],
          },
          {
            term: "Fångvisor",
            termid: "#M.I.13.",
            children: [],
          },
          {
            term: "Lusse, staffans-, stjärngosse- och majvisor",
            termid: "#M.I.20.",
            children: [],
          },
          {
            term: "Lyrik",
            termid: "#M.I.18.",
            children: [],
          },
          {
            term: "Nidvisor",
            termid: "#M.I.14.",
            children: [],
          },
          {
            term: "Religiösa visor",
            termid: "#M.I.10.",
            children: [],
          },
          {
            term: "Sjömansvisor",
            termid: "#M.I.16.",
            children: [],
          },
          {
            term: "Skillingsvisor",
            termid: "#M.I.8.",
            children: [],
          },
          {
            term: "Skillingtryck",
            termid: "#M.I.21.",
            children: [],
          },
          {
            term: "Tillfällighetsdiktning",
            termid: "#M.I.19.",
            children: [],
          },
          {
            term: "Vaggvisor",
            termid: "#M.I.5.",
            children: [],
          },
          {
            term: "Vallvisor m.m.",
            termid: "#M.I.11.",
            children: [],
          },
          {
            term: "Visböcker",
            termid: "#M.I.22.",
            children: [],
          },
          {
            term: "Yngre historiska visor",
            termid: "#M.I.17.",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Bebyggelse och bosättning",
    termid: "#A.",
    children: [
      {
        term: "Lokalsamhälle",
        termid: "#A.I.",
        children: [
          {
            term: "Bondbyn",
            termid: "#A.I.1.",
            children: [],
          },
          {
            term: "Gruvsamhället",
            termid: "#A.I.2.",
            children: [],
          },
          {
            term: "Fiskeläget",
            termid: "#A.I.3.",
            children: [],
          },
        ],
      },
      {
        term: "Periodisk bosättning",
        termid: "#A.II.",
        children: [
          {
            term: "Skogsarbetarkoja",
            termid: "#A.II.1.",
            children: [],
          },
          {
            term: "Fäbod",
            termid: "#A.II.2.",
            children: [],
          },
          {
            term: "Jaktkoja",
            termid: "#A.II.3.",
            children: [],
          },
          {
            term: "Fiskekoja",
            termid: "#A.II.4.",
            children: [],
          },
          {
            term: "Fritidshus",
            termid: "#A.II.6.",
            children: [],
          },
        ],
      },
      {
        term: "Stad, köping och tätort",
        termid: "#A.III.",
        children: [
          {
            term: "Stadsdelar och kvarter",
            termid: "#A.III.1.",
            children: [],
          },
          {
            term: "Gator",
            termid: "#A.III.2.",
            children: [],
          },
          {
            term: "Torg",
            termid: "#A.III.3.",
            children: [],
          },
          {
            term: "Kanal och bro",
            termid: "#A.III.4.",
            children: [],
          },
          {
            term: "Hamn",
            termid: "#A.III.5.",
            children: [],
          },
          {
            term: "Offentliga byggnader",
            termid: "#A.III.6.",
            children: [],
          },
          {
            term: "Flerfamiljshus",
            termid: "#A.III.7.",
            children: [],
          },
          {
            term: "Förort",
            termid: "#A.III.8.",
            children: [],
          },
        ],
      },
      {
        term: "Gård och hus",
        termid: "#A.IV.",
        children: [
          {
            term: "Gårdstyp",
            termid: "#A.IV.1.",
            children: [],
          },
          {
            term: "Gårdsplan",
            termid: "#A.IV.2.",
            children: [],
          },
          {
            term: "Vattenförsörjning",
            termid: "#A.IV.3.",
            children: [
              {
                term: "Brunnar",
                termid: "#A.IV.3.a.",
                children: [],
              },
              {
                term: "Vattenposter",
                termid: "#A.IV.3.b.",
                children: [],
              },
              {
                term: "Vatten inomhus",
                termid: "#A.IV.3.c.",
                children: [],
              },
            ],
          },
          {
            term: "Trädgård",
            termid: "#A.IV.4.",
            children: [],
          },
          {
            term: "Gårdens hus",
            termid: "#A.IV.5.",
            children: [
              {
                term: "Bostadshus, mangårdsbyggnad",
                termid: "#A.IV.5.a.",
                children: [],
              },
              {
                term: "Ladugård",
                termid: "#A.IV.5.b.",
                children: [],
              },
              {
                term: "Lada och loge",
                termid: "#A.IV.5.c.",
                children: [],
              },
              {
                term: "Bak-, brygg- och värmestugor",
                termid: "#A.IV.5.f.",
                children: [],
              },
              {
                term: "Härbren, visthusbodar",
                termid: "#A.IV.5.g.",
                children: [],
              },
              {
                term: "Bastu",
                termid: "#A.IV.5.i.",
                children: [],
              },
              {
                term: "Stall",
                termid: "#A.IV.5.j.",
                children: [],
              },
              {
                term: "Smedja",
                termid: "#A.IV.5.k.",
                children: [],
              },
              {
                term: "Vedbodar",
                termid: "#A.IV.5.l.",
                children: [],
              },
              {
                term: "Kvarn",
                termid: "#A.IV.5.m.",
                children: [],
              },
              {
                term: "Avträde",
                termid: "#A.IV.5.n.",
                children: [],
              },
              {
                term: "Undantagsstuga",
                termid: "#A.IV.5.o.",
                children: [],
              },
              {
                term: "Sjöbod",
                termid: "#A.IV.5.p.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Småhus",
        termid: "#A.V.1.",
        children: [
          {
            term: "Enfamiljshus",
            termid: "#A.V.1.a.",
            children: [],
          },
          {
            term: "Radhus och parhus",
            termid: "#A.V.1.b.",
            children: [],
          },
        ],
      },
      {
        term: "Indelning, rumsanvändning",
        termid: "#A.V.2.",
        children: [
          {
            term: "Badrum",
            termid: "#A.V.2.a.",
            children: [],
          },
          {
            term: "Kök",
            termid: "#A.V.2.b.",
            children: [],
          },
          {
            term: "Sovrum",
            termid: "#A.V.2.c.",
            children: [],
          },
          {
            term: "Vardagsrum",
            termid: "#A.V.2.d.",
            children: [],
          },
        ],
      },
      {
        term: "Uppvärmning",
        termid: "#A.V.3.",
        children: [
          {
            term: "Öppen eldstad",
            termid: "#A.V.3.a.",
            children: [],
          },
          {
            term: "Öppen spis",
            termid: "#A.V.3.b.",
            children: [],
          },
          {
            term: "Rökugn",
            termid: "#A.V.3.c.",
            children: [],
          },
          {
            term: "Järnspis",
            termid: "#A.V.3.d.",
            children: [],
          },
          {
            term: "Kakelugn",
            termid: "#A.V.3.e.",
            children: [],
          },
          {
            term: "Bakugn",
            termid: "#A.V.3.f.",
            children: [],
          },
          {
            term: "Ved",
            termid: "#A.V.3.g.",
            children: [],
          },
        ],
      },
      {
        term: "Fast inredning, möblering och bäddar",
        termid: "#A.V.8.",
        children: [
          {
            term: "Fast inredning",
            termid: "#A.V.8.a.",
            children: [],
          },
          {
            term: "Möblering",
            termid: "#A.V.8.b.",
            children: [],
          },
          {
            term: "Liggplats och bädd",
            termid: "#A.V.8.c.",
            children: [
              {
                term: "Sängkläder",
                termid: "#A.V.8.c.i.",
                children: [],
              },
            ],
          },
        ],
      },
      {
        term: "Dekoration",
        termid: "#A.V.9.",
        children: [],
      },
      {
        term: "Redskap för matlagning",
        termid: "#A.V.10.",
        children: [
          {
            term: "Skål och tallrik",
            termid: "#A.V.10.a.",
            children: [],
          },
          {
            term: "Matbestick",
            termid: "#A.V.10.b.",
            children: [],
          },
          {
            term: "Dryckeskärl",
            termid: "#A.V.10.c.",
            children: [],
          },
          {
            term: "Förvaringskärl",
            termid: "#A.V.10.d.",
            children: [],
          },
        ],
      },
      {
        term: "Korgar, askar och skrin",
        termid: "#A.V.11.",
        children: [],
      },
      {
        term: "Skrivdon",
        termid: "#A.V.12.",
        children: [],
      },
      {
        term: "Gränser",
        termid: "#A.VI.",
        children: [
          {
            term: "Gränsmärken",
            termid: "#A.VI.1.",
            children: [],
          },
          {
            term: "Hägnader",
            termid: "#A.VI.2.",
            children: [],
          },
        ],
      },
      {
        term: "Fornminnen",
        termid: "#A.VII.",
        children: [
          {
            term: "Fasta fornlämningar",
            termid: "#A.VII.1.",
            children: [
              {
                term: "Offerplatser",
                termid: "#A.VII.1.a.",
                children: [],
              },
              {
                term: "Run- och bautastenar",
                termid: "#A.VII.1.b.",
                children: [],
              },
              {
                term: "Offerkast",
                termid: "#A.VII.1.c.",
                children: [],
              },
              {
                term: "Gravhög",
                termid: "#A.VII.1.d.",
                children: [],
              },
            ],
          },
          {
            term: "Fornfynd",
            termid: "#A.VII.2.",
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
    termid: "#N.",
    children: [
      {
        term: "Dans",
        termid: "#N.VII.",
        children: [],
      },
      {
        term: "Folklig drama",
        termid: "#N.II.",
        children: [
          {
            term: "Maskering",
            termid: "#N.II.2.",
            children: [],
          },
          {
            term: "Stjärngossespel",
            termid: "#N.II.1.",
            children: [],
          },
          {
            term: "Utklädning",
            termid: "#N.II.3.",
            children: [],
          },
        ],
      },
      {
        term: "Idrott och tävlingslekar",
        termid: "#N.I.",
        children: [],
      },
      {
        term: "Leksaker",
        termid: "#N.IX.",
        children: [],
      },
      {
        term: "Räkneramsor",
        termid: "#N.V.",
        children: [],
      },
      {
        term: "Sällskapslekar utan sång",
        termid: "#N.III.",
        children: [],
      },
      {
        term: "Sånglekar",
        termid: "#N.VI.",
        children: [],
      },
      {
        term: "Särskilda barnlekar",
        termid: "#N.IV.",
        children: [],
      },
      {
        term: "Spel, vadhållning och lottning",
        termid: "#N.VIII.",
        children: [
          {
            term: "Kortspel",
            termid: "#N.VIII.1.",
            children: [],
          },
          {
            term: "Tärningsspel",
            termid: "#N.VIII.2.",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Naturen",
    termid: "#F.",
    children: [
      {
        term: "Djur",
        termid: "#F.IV.",
        children: [
          {
            term: "Blötdjur",
            termid: "#F.IV.10.",
            children: [],
          },
          {
            term: "Däggdjur",
            termid: "#F.IV.1.",
            children: [
              {
                term: "Björn",
                termid: "#F.IV.1.a.",
                children: [],
              },
              {
                term: "Varg",
                termid: "#F.IV.1.b.",
                children: [],
              },
            ],
          },
          {
            term: "Fåglar",
            termid: "#F.IV.2.",
            children: [],
          },
          {
            term: "Fiskar",
            termid: "#F.IV.5.",
            children: [],
          },
          {
            term: "Groddjur",
            termid: "#F.IV.4.",
            children: [],
          },
          {
            term: "Insekter",
            termid: "#F.IV.6.",
            children: [],
          },
          {
            term: "Kräftdjur",
            termid: "#F.IV.8.",
            children: [],
          },
          {
            term: "Kräldjur",
            termid: "#F.IV.3.",
            children: [],
          },
          {
            term: "Maskdjur",
            termid: "#F.IV.9.",
            children: [],
          },
          {
            term: "Spindeldjur",
            termid: "#F.IV.7.",
            children: [],
          },
        ],
      },
      {
        term: "Himlen och väderleken",
        termid: "#F.I.",
        children: [
          {
            term: "Åska",
            termid: "#F.I.10.",
            children: [],
          },
          {
            term: "Himlavalv",
            termid: "#F.I.1.",
            children: [],
          },
          {
            term: "Kometer og meteorer",
            termid: "#F.I.5.",
            children: [],
          },
          {
            term: "Måne",
            termid: "#F.I.2.",
            children: [],
          },
          {
            term: "Moln",
            termid: "#F.I.7.",
            children: [],
          },
          {
            term: "Nederbörd, käle, is",
            termid: "#F.I.8.",
            children: [],
          },
          {
            term: "Norrsken",
            termid: "#F.I.12.",
            children: [],
          },
          {
            term: "Regnbåge",
            termid: "#F.I.11.",
            children: [],
          },
          {
            term: "Sol",
            termid: "#F.I.3.",
            children: [],
          },
          {
            term: "Stjärnor",
            termid: "#F.I.4.",
            children: [],
          },
          {
            term: "Väderlek",
            termid: "#F.I.9.",
            children: [
              {
                term: "Vädervarsel",
                termid: "#F.I.9.a.",
                children: [],
              },
            ],
          },
          {
            term: "Vind",
            termid: "#F.I.6.",
            children: [],
          },
        ],
      },
      {
        term: "Särskilda naturbildningar",
        termid: "#F.II.",
        children: [
          {
            term: "Berg, kullar och åsar",
            termid: "#F.II.1.",
            children: [],
          },
          {
            term: "Hav, sjöar, vattendrag",
            termid: "#F.II.3.",
            children: [],
          },
          {
            term: "Källor",
            termid: "#F.II.4.",
            children: [],
          },
          {
            term: "Skog och lund",
            termid: "#F.II.5.",
            children: [],
          },
          {
            term: "Stenar",
            termid: "#F.II.2.",
            children: [],
          },
        ],
      },
      {
        term: "Växter",
        termid: "#F.III.",
        children: [
          {
            term: "Kultiverade växter",
            termid: "#F.III.3.",
            children: [],
          },
          {
            term: "Medicinskt och magiskt bruk av planter",
            termid: "#F.III.6.",
            children: [],
          },
          {
            term: "Träd",
            termid: "#F.III.2.",
            children: [],
          },
          {
            term: "Växter för mat för djur",
            termid: "#F.III.5.",
            children: [],
          },
          {
            term: "Växter för mat och dryck för människor",
            termid: "#F.III.4.",
            children: [],
          },
          {
            term: "Vilda växter",
            termid: "#F.III.1.",
            children: [],
          },
        ],
      },
    ],
  },
  {
    term: "Läkekonst",
    termid: "#G.",
    children: [
      {
        term: "Bot / kur",
        termid: "#G.II.",
        children: [
          {
            term: "Bot med magiska botemedel",
            termid: "#G.II.3.",
            children: [],
          },
          {
            term: "Bot med magiska handlingar",
            termid: "#G.II.1.",
            children: [],
          },
          {
            term: "Växtmedicin",
            termid: "#G.II.4.",
            children: [],
          },
        ],
      },
      {
        term: "Diagnostiska åtgärder",
        termid: "#G.I.",
        children: [
          {
            term: "Mätning",
            termid: "#G.I.2.",
            children: [],
          },
          {
            term: "Smöjning",
            termid: "#G.I.3.",
            children: [],
          },
          {
            term: "Stöpning",
            termid: "#G.I.1.",
            children: [],
          },
        ],
      },
      {
        term: "Helbrädgelse",
        termid: "#G.IV.",
        children: [],
      },
      {
        term: "Sjukdomar",
        termid: "#G.V.",
        children: [
          {
            term: "Barnsjukdomar",
            termid: "#G.V.13.",
            children: [],
          },
          {
            term: "Benbrott",
            termid: "#G.V.5.",
            children: [],
          },
          {
            term: "Djurs sjukdomar",
            termid: "#G.V.14.",
            children: [],
          },
          {
            term: "Engelska sjukan",
            termid: "#G.V.1.",
            children: [],
          },
          {
            term: "Epilepsi",
            termid: "#G.V.2.",
            children: [],
          },
          {
            term: "Gikt",
            termid: "#G.V.6.",
            children: [],
          },
          {
            term: "Kolera",
            termid: "#G.V.10.",
            children: [],
          },
          {
            term: "Ormbett",
            termid: "#G.V.4.",
            children: [],
          },
          {
            term: "Polio",
            termid: "#G.V.12.",
            children: [],
          },
          {
            term: "Sjukdomar från underjordiska",
            termid: "#G.V.7.",
            children: [],
          },
          {
            term: "Spanska sjukan",
            termid: "#G.V.8.",
            children: [],
          },
          {
            term: "Tandvärk",
            termid: "#G.V.3.",
            children: [],
          },
          {
            term: "Tuberkulos",
            termid: "#G.V.9.",
            children: [],
          },
          {
            term: "Tyfus",
            termid: "#G.V.11.",
            children: [],
          },
        ],
      },
      {
        term: "Skolmedicin och apotekare",
        termid: "#G.III.",
        children: [],
      },
    ],
  },
  {
    term: "Tid och tidsindelning",
    termid: "#H.",
    children: [
      {
        term: "Årets gång",
        termid: "#H.I.",
        children: [
          {
            term: "År",
            termid: "#H.I.5.",
            children: [],
          },
          {
            term: "Årstider",
            termid: "#H.I.4.",
            children: [],
          },
          {
            term: "Døgn",
            termid: "#H.I.1.",
            children: [],
          },
          {
            term: "Kalendern",
            termid: "#H.I.6.",
            children: [],
          },
          {
            term: "Månader",
            termid: "#H.I.3.",
            children: [],
          },
          {
            term: "Veckodagar",
            termid: "#H.I.2.",
            children: [],
          },
        ],
      },
      {
        term: "Merkedager og högtider",
        termid: "#H.II.",
        children: [
          {
            term: "Höst- och vinterfester",
            termid: "#H.II.2.",
            children: [
              {
                term: "Advent",
                termid: "#H.II.2.e.",
                children: [],
              },
              {
                term: "Alla Helgons Dag",
                termid: "#H.II.2.a.",
                children: [],
              },
              {
                term: "Alla hjärtans dag",
                termid: "#H.II.2.o.",
                children: [],
              },
              {
                term: "Anders",
                termid: "#H.II.2.d.",
                children: [],
              },
              {
                term: "Halloween",
                termid: "#H.II.2.b.",
                children: [],
              },
              {
                term: "Jul",
                termid: "#H.II.2.h.",
                children: [
                  {
                    term: "Julafton",
                    termid: "#H.II.2.h.i.",
                    children: [],
                  },
                  {
                    term: "Julbock och julget",
                    termid: "#H.II.2.h.v.",
                    children: [],
                  },
                  {
                    term: "Juldagen",
                    termid: "#H.II.2.h.iii.",
                    children: [],
                  },
                  {
                    term: "Julgåvor",
                    termid: "#H.II.2.h.ix.",
                    children: [],
                  },
                  {
                    term: "Julgran",
                    termid: "#H.II.2.h.vii.",
                    children: [],
                  },
                  {
                    term: "Julnatten",
                    termid: "#H.II.2.h.ii.",
                    children: [],
                  },
                  {
                    term: "Jultomten",
                    termid: "#H.II.2.h.viii.",
                    children: [],
                  },
                  {
                    term: "Staffansritt",
                    termid: "#H.II.2.h.x.",
                    children: [],
                  },
                  {
                    term: "Varsel och spådomar vid jul",
                    termid: "#H.II.2.h.iv.",
                    children: [],
                  },
                ],
              },
              {
                term: "Kyndelsmässa",
                termid: "#H.II.2.n.",
                children: [],
              },
              {
                term: "Lucia",
                termid: "#H.II.2.f.",
                children: [],
              },
              {
                term: "Mårten",
                termid: "#H.II.2.c.",
                children: [],
              },
              {
                term: "Nyårsafton",
                termid: "#H.II.2.i.",
                children: [],
              },
              {
                term: "Nyårsdagen",
                termid: "#H.II.2.j.",
                children: [],
              },
              {
                term: "Skottårsdagen",
                termid: "#H.II.2.p.",
                children: [],
              },
              {
                term: "Tjugondedag Knut",
                termid: "#H.II.2.m.",
                children: [],
              },
              {
                term: "Tomas",
                termid: "#H.II.2.g.",
                children: [],
              },
              {
                term: "Trettondagen",
                termid: "#H.II.2.k.",
                children: [],
              },
            ],
          },
          {
            term: "Särskilda festseder",
            termid: "#H.II.1.",
            children: [
              {
                term: "Årseldar",
                termid: "#H.II.1.a.",
                children: [],
              },
              {
                term: "Festmat",
                termid: "#H.II.1.e.",
                children: [],
              },
              {
                term: "Källdrickning",
                termid: "#H.II.1.b.",
                children: [],
              },
              {
                term: "Larm och skjutning",
                termid: "#H.II.1.c.",
                children: [],
              },
            ],
          },
          {
            term: "Vår- och sommarfester",
            termid: "#H.II.3.",
            children: [
              {
                term: "1. maj",
                termid: "#H.II.3.h.",
                children: [],
              },
              {
                term: "Fastlag",
                termid: "#H.II.3.b.",
                children: [],
              },
              {
                term: "Första april",
                termid: "#H.II.3.f.",
                children: [],
              },
              {
                term: "Kristi Himmelfärdsdag",
                termid: "#H.II.3.k.",
                children: [],
              },
              {
                term: "Midsommar / St. Hans",
                termid: "#H.II.3.n.",
                children: [],
              },
              {
                term: "Nationaldagen",
                termid: "#H.II.3.j.",
                children: [],
              },
              {
                term: "Påsk",
                termid: "#H.II.3.c.",
                children: [
                  {
                    term: "Långfredag",
                    termid: "#H.II.3.c.iii.",
                    children: [],
                  },
                  {
                    term: "Palmsöndag",
                    termid: "#H.II.3.c.i.",
                    children: [],
                  },
                  {
                    term: "Påskafton",
                    termid: "#H.II.3.c.iv.",
                    children: [],
                  },
                  {
                    term: "Påskdagen",
                    termid: "#H.II.3.c.v.",
                    children: [],
                  },
                  {
                    term: "Skärtorsdag",
                    termid: "#H.II.3.c.ii.",
                    children: [],
                  },
                ],
              },
              {
                term: "Pingst",
                termid: "#H.II.3.l.",
                children: [],
              },
              {
                term: "Trefaldighetsdag",
                termid: "#H.II.3.m.",
                children: [],
              },
              {
                term: "Valborgsmässa",
                termid: "#H.II.3.g.",
                children: [],
              },
              {
                term: "Vårfrudagen",
                termid: "#H.II.3.a.",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    term: "Klokskap och svartkonst",
    termid: "#I.",
    children: [
      {
        term: "Förebud",
        termid: "#I.VI.",
        children: [],
      },
      {
        term: "Formler",
        termid: "#I.XII.",
        children: [],
      },
      {
        term: "Läkekonst- och svartkonstböcker",
        termid: "#I.VII.",
        children: [
          {
            term: "Berättelser om böcker",
            termid: "#I.VII.2.",
            children: [],
          },
          {
            term: "Faktiska böcker",
            termid: "#I.VII.1.",
            children: [],
          },
        ],
      },
      {
        term: "Magiska ting",
        termid: "#I.VIII.",
        children: [
          {
            term: "Amuletter",
            termid: "#I.VIII.6.",
            children: [],
          },
          {
            term: "Djurdelar",
            termid: "#I.VIII.5.",
            children: [],
          },
          {
            term: "Dragdocka",
            termid: "#I.VIII.2.",
            children: [],
          },
          {
            term: "Magiska kroppsdelar och kroppsvätskor",
            termid: "#I.VIII.4.",
            children: [],
          },
          {
            term: "Magiska ting från kyrkan",
            termid: "#I.VIII.3.",
            children: [],
          },
          {
            term: "Magiska ting från naturen",
            termid: "#I.VIII.7.",
            children: [],
          },
          {
            term: "Trummor",
            termid: "#I.VIII.1.",
            children: [],
          },
        ],
      },
      {
        term: "Personer med övernaturlig förmåga",
        termid: "#I.X.",
        children: [
          {
            term: "Häxor",
            termid: "#I.X.2.",
            children: [
              {
                term: "Blåkullefärder",
                termid: "#I.X.2.a.",
                children: [],
              },
              {
                term: "Magisk skadegörelse",
                termid: "#I.X.2.b.",
                children: [],
              },
              {
                term: "Tjuvmjölkande väsen",
                termid: "#I.X.2.d.",
                children: [],
              },
              {
                term: "Tjuvmjölkning",
                termid: "#I.X.2.c.",
                children: [],
              },
            ],
          },
          {
            term: "Kloka, läkekunniga",
            termid: "#I.X.1.",
            children: [
              {
                term: "Sätta bort och förgöra",
                termid: "#I.X.1.a.",
                children: [],
              },
              {
                term: "Skydd mot trolldom",
                termid: "#I.X.1.e.",
                children: [],
              },
              {
                term: "Släcka eld",
                termid: "#I.X.1.d.",
                children: [],
              },
              {
                term: "Stämma och mana",
                termid: "#I.X.1.b.",
                children: [],
              },
              {
                term: "Synsk",
                termid: "#I.X.1.f.",
                children: [],
              },
              {
                term: "Uppenbara tjuv och tjuvgods",
                termid: "#I.X.1.c.",
                children: [],
              },
            ],
          },
          {
            term: "Mästerskyttar",
            termid: "#I.X.5.",
            children: [],
          },
          {
            term: "Mästerspelmän",
            termid: "#I.X.6.",
            children: [],
          },
          {
            term: "Präster",
            termid: "#I.X.4.",
            children: [
              {
                term: "Wittenbergsskolan",
                termid: "#I.X.4.a.",
                children: [],
              },
            ],
          },
          {
            term: "Trollkarlar",
            termid: "#I.X.3.",
            children: [],
          },
        ],
      },
      {
        term: "Särskilda aktiviteter",
        termid: "#I.III.",
        children: [],
      },
      {
        term: "Särskilda platser",
        termid: "#I.II.",
        children: [],
      },
      {
        term: "Särskilda tidpunkter",
        termid: "#I.I.",
        children: [],
      },
      {
        term: "Skyddsmagi",
        termid: "#I.V.",
        children: [],
      },
      {
        term: "Spådomar och önskningar",
        termid: "#I.IV.",
        children: [],
      },
    ],
  },

  {
    term: "Sagor, gåtor och ordspråk",
    termid: "#L.",
    children: [
      {
        term: "Anekdoter och skämthistorier",
        termid: "#L.III.",
        children: [],
      },
      {
        term: "Böner",
        termid: "#L.VII.",
        children: [],
      },
      {
        term: "Djurspråk, växters och föremåls tal",
        termid: "#L.II.",
        children: [],
      },
      {
        term: "Gåtor",
        termid: "#L.IV.",
        children: [],
      },
      {
        term: "Ordspråk, ordstäv och talesätt",
        termid: "#L.V.",
        children: [],
      },
      {
        term: "Rim och ramsor",
        termid: "#L.VI.",
        children: [
          {
            term: "Uträkningsramsor",
            termid: "#L.VI.1.",
            children: [],
          },
        ],
      },
      {
        term: "Sagor",
        termid: "#L.I.",
        children: [
          {
            term: "Den dumme djävulen",
            termid: "#L.I.5.",
            children: [],
          },
          {
            term: "Djursagor",
            termid: "#L.I.1.",
            children: [],
          },
          {
            term: "Formelartade sagor",
            termid: "#L.I.8.",
            children: [],
          },
          {
            term: "Legendsagor",
            termid: "#L.I.3.",
            children: [],
          },
          {
            term: "Lögnsagor",
            termid: "#L.I.7.",
            children: [],
          },
          {
            term: "Novellsagor",
            termid: "#L.I.4.",
            children: [],
          },
          {
            term: "Särskilda sagoberättare",
            termid: "#L.I.10.",
            children: [],
          },
          {
            term: "Skämtsagor",
            termid: "#L.I.6.",
            children: [],
          },
          {
            term: "Undersagor",
            termid: "#L.I.2.",
            children: [],
          },
          {
            term: "Ursprungssagor",
            termid: "#L.I.9.",
            children: [],
          },
        ],
      },
      {
        term: "Vits och skämt",
        termid: "#L.VIII.",
        children: [],
      },
    ],
  },
  {
    term: "Minoriteter",
    termid: "#P.",
    children: [
      {
        term: "Berättelser om minoriteter",
        termid: "#P.II.",
        children: [
          {
            term: "Finnar",
            termid: "#P.II.5.",
            children: [],
          },
          {
            term: "Judar",
            termid: "#P.II.4.",
            children: [],
          },
          {
            term: "Kvener",
            termid: "#P.II.6.",
            children: [],
          },
          {
            term: "Resande",
            termid: "#P.II.3.",
            children: [],
          },
          {
            term: "Romer",
            termid: "#P.II.2.",
            children: [],
          },
          {
            term: "Samer",
            termid: "#P.II.1.",
            children: [],
          },
        ],
      },
      {
        term: "Minoritetskultur",
        termid: "#P.I.",
        children: [
          {
            term: "Finnar",
            termid: "#P.I.5.",
            children: [],
          },
          {
            term: "Judar",
            termid: "#P.I.4.",
            children: [],
          },
          {
            term: "Kvener",
            termid: "#P.I.6.",
            children: [],
          },
          {
            term: "Resande",
            termid: "#P.I.3.",
            children: [],
          },
          {
            term: "Romer",
            termid: "#P.I.2.",
            children: [],
          },
          {
            term: "Samer",
            termid: "#P.I.1.",
            children: [],
          },
        ],
      },
    ],
  },

  {
    term: "Språk",
    termid: "#O.",
    children: [
      {
        term: "Dialekter",
        termid: "#O.I.",
        children: [],
      },
      {
        term: "Djurnamn",
        termid: "#O.IV.",
        children: [
          {
            term: "Konamn",
            termid: "#O.IV.a.",
            children: [],
          },
        ],
      },
      {
        term: "Ord och ordförklaringar",
        termid: "#O.II.",
        children: [],
      },
      {
        term: "Ortnamn",
        termid: "#O.III.",
        children: [],
      },
    ],
  },
];
