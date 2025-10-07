// Funktion för att konvertera tid till ett läsbart format (mm:ss)
export const secondsToMMSS = (sec) => {
  const n = Number(sec);
  if (!Number.isFinite(n)) return "";
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
};
