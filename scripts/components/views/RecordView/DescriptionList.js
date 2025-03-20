import React from "react";
import ListPlayButton from "../ListPlayButton";

function DescriptionList({ item, recordId, audioTitle }) {
  function parseTimeString(timeString = "00:00") {
    const parts = timeString.split(":").map(Number).reverse();
    let seconds = 0;
    if (parts[0]) seconds += parts[0]; // seconds
    if (parts[1]) seconds += parts[1] * 60; // minutes
    if (parts[2]) seconds += parts[2] * 3600; // hours
    return seconds;
  }

  const descriptions = item.description || [];
  const sortedDescriptions = [...descriptions].sort(
    (a, b) => parseTimeString(a.start) - parseTimeString(b.start)
  );

  if (!descriptions.length) {
    return (
      <p className="italic py-4 px-2">Inga innehållsbeskrivningar att visa.</p>
    );
  }

  return (
    <table className="w-full table-auto border-collapse text-xs mb-2">
      <thead>
        <tr>
          <th
            colSpan="5"
            className="text-left bg-gray-200 py-2 px-4 font-semibold"
          >
            Innehållsbeskrivningar
          </th>
        </tr>
        <tr className="border-b border-gray-300">
          <th className="py-2 px-4">Starttid</th>
          <th className="py-2 px-4">Beskrivning</th>
          <th className="py-2 px-4">Termer</th>
          <th className="py-2 px-4 text-right"></th>
        </tr>
      </thead>
      <tbody>
        {sortedDescriptions.map((desc, index) => (
          <tr
            key={index}
            className="odd:bg-white even:bg-gray-100 border-b last:border-b-0 border-gray-200"
          >
            <td className="py-2 px-4">
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
            <td className="py-2 px-4">{desc.text}</td>
            <td className="py-2 px-4 flex gap-2 flex-wrap">
              {desc.terms?.map((termObj) => (
                <div key={termObj?.termid}>
                  <span className="bg-isof text-white rounded-xl px-2 py-1 whitespace-nowrap">
                    #{termObj.term}
                  </span>
                </div>
              ))}
            </td>
            <td className="py-2 px-4 text-right">
              {/* You can implement an "edit" button here if needed */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DescriptionList;
