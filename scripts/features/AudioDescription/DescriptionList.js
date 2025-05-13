import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import InstructionBox from "./InstructionBox";
import ListPlayButton from "./ListPlayButton";

function DescriptionList({ item, recordId, audioTitle, onEditDesc, highlightData }) {
  function parseTimeString(timeString = "00:00") {
    try {
      const parts = timeString.split(":").map(Number).reverse();
      let seconds = 0;
      if (parts[0]) seconds += parts[0];
      if (parts[1]) seconds += parts[1] * 60;
      if (parts[2]) seconds += parts[2] * 3600;
      return seconds;
    } catch (e) {
      return 0;
    }
  }

  const descriptions = item.description || [];
  const sortedDescriptions = [...descriptions].sort(
    (a, b) => parseTimeString(a.start) - parseTimeString(b.start)
  );

  if (!descriptions.length) {
    return (
      <div className="text-gray-600 text-sm p-6 bg-gray-50 rounded-lg">
        <InstructionBox />
        <p className="text-center mt-4">
        Det finns inga beskrivningar ännu. <br/>
        Var den första att bidra!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <InstructionBox />
      <table className="w-full table-auto border-collapse text-xs mb-2">
        <thead>
          <tr>
            <th
              colSpan="5"
              className="text-left bg-gray-200 py-3 px-4 font-semibold"
              scope="colgroup"
            >
              Innehållsbeskrivningar
            </th>
          </tr>
          <tr className="border-b border-gray-300">
            <th scope="col" className="py-3 px-4">
              Starttid
            </th>
            <th scope="col" className="py-3 px-4">
              Beskrivning
            </th>
            <th scope="col" className="py-3 px-4">
              Termer
            </th>
            <th scope="col" className="py-3 px-4 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {sortedDescriptions.map((desc, index) => {
            const isHighlighted = highlightData.some(
              (hit) => hit._source.start === desc.start
            );
            return (
              <tr
                key={index}
                className="odd:bg-white even:bg-gray-100 border-b last:border-b-0 border-gray-200"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <ListPlayButton
                      media={item}
                      recordId={recordId}
                      recordTitle={audioTitle}
                      startTime={parseTimeString(desc.start)}
                      isSubList
                    />
                    <span className="ml-2 font-mono">{desc.start}</span>
                  </div>
                </td>
                <td
                  className={`py-3 px-4 ${
                    isHighlighted ? "bg-yellow-200" : ""
                  }`}
                >
                  {desc.text}
                </td>
                <td className="py-3 px-4 flex gap-2 flex-wrap gap-y-3">
                  {desc.terms?.map((termObj) => (
                    <div key={termObj?.termid}>
                      <span className="bg-isof text-white rounded-xl px-2 py-1 whitespace-nowrap">
                        #{termObj.term}
                      </span>
                    </div>
                  ))}
                </td>
                <td className="py-3 px-4 text-right">
                  <a
                    type="button"
                    className="text-isof hover:cursor-pointer hover:text-darker-isof hover:bg-gray-100 rounded-md px-2 py-1 flex gap-1 items-center justify-end transition-colors"
                    onClick={() => onEditDesc(desc)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    <span className="underline">Ändra</span>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DescriptionList;
