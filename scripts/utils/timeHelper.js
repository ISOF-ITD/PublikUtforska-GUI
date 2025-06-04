// Funktion för att konvertera tid till ett läsbart format (mm:ss)
export const secondsToMMSS = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(
    2,
    "0"
  )}`;
