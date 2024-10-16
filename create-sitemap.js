/* eslint-disable no-restricted-syntax */

const axios = require('axios');
const fs = require('fs');

// Gemensamma API-parametrar som ett objekt
const API_PARAMS = {
  type: 'arkiv',
  categorytypes: 'tradark',
  publishstatus: 'published',
  has_media: 'true',
  add_aggregations: 'false',
  transcriptionstatus: 'published,accession',
};

// Funktion för att omvandla objekt till query-string
function createQueryString(params) {
  return new URLSearchParams(params).toString();
}

// Bygg query-string från API_PARAMS
const queryString = createQueryString(API_PARAMS);

// URLs
const SOCKEN_URL = `https://garm.isof.se/folkeservice/api/es/socken/?${queryString}`;
const RECORDS_URL = `https://garm.isof.se/folkeservice/api/es/documents/?${queryString}&size=10000&socken_id=`; // socken_id läggs till senare
const SITEMAP_BASE_URL = 'https://sok.folke.isof.se/#/records/';

// Sitemap limits
const MAX_URLS_PER_SITEMAP = 50000;
const MAX_SITEMAP_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Set för att undvika dubbletter
const recordSet = new Set(); 

// Funktion för att hämta socknar
async function fetchSocknar() {
  console.log('Fetching socknar...');
  try {
    const response = await axios.get(SOCKEN_URL);
    const socknar = response.data.data.map((socken) => socken.id); // Extraherar alla socken-id
    console.log(`Found ${socknar.length} socknar.`);
    return socknar;
  } catch (error) {
    console.error('Error fetching socknar:', error);
    return [];
  }
}

// Funktion för att hämta records för en given socken
async function fetchRecordsBySocken(sockenId) {
  console.log(`Fetching records for socken_id: ${sockenId}...`);
  try {
    const response = await axios.get(`${RECORDS_URL}${sockenId}`);
    console.log(`Fetched ${response.data.data.length} records for socken_id: ${sockenId}`);
    return response.data.data; // Returnerar listan av records för sockenId
  } catch (error) {
    console.error(`Error fetching records for socken ${sockenId}:`, error);
    return [];
  }
}

// Funktion för att konvertera tid till ett läsbart format (mm:ss)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Funktion för att konvertera tid (i sekunder) till ett specifikt klockslag (HH:mm)
function formatEndTime(remainingSeconds) {
  const endTime = new Date(
    Date.now() + remainingSeconds * 1000,
  ); // Lägg till sekunderna till nuvarande tid
  const hours = endTime.getHours().toString().padStart(2, '0'); // Få timmar (0-padded)
  const minutes = endTime.getMinutes().toString().padStart(2, '0'); // Få minuter (0-padded)
  return `${hours}:${minutes}`; // Returnerar i HH:mm-format
}

// Funktion för att initiera sitemap index-fil
function initSitemapIndex() {
  const sitemapIndexPath = 'sitemap-index.xml';
  const sitemapIndexHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  fs.writeFileSync(sitemapIndexPath, sitemapIndexHeader);
  console.log(`Initialized sitemap index file: ${sitemapIndexPath}`);
}

// Funktion för att uppdatera sitemap index-fil med ny sitemap-fil
function updateSitemapIndex(sitemapFile) {
  const sitemapIndexPath = 'sitemap-index.xml';
  const sitemapEntry = `  <sitemap>\n    <loc>https://sok.folke.isof.se/${sitemapFile}</loc>\n  </sitemap>\n`;
  fs.appendFileSync(sitemapIndexPath, sitemapEntry);
  console.log(`Updated sitemap index with: ${sitemapFile}`);
}

// Funktion för att avsluta sitemap index-fil
function closeSitemapIndex() {
  const sitemapIndexPath = 'sitemap-index.xml';
  fs.appendFileSync(sitemapIndexPath, '</sitemapindex>');
  console.log(`Closed sitemap index file: ${sitemapIndexPath}`);
}

// Funktion för att skapa sitemaps löpande under processen
async function createSitemaps() {
  const socknar = await fetchSocknar();
  let sitemapCount = 1;
  let currentUrlCount = 0;
  let currentFileSize = 0;
  let currentSitemapPath = `sitemap${sitemapCount}.xml`;

  // Spara starttiden för beräkning av tidsuppskattning
  const startTime = Date.now();

  // Initiera sitemap index-fil i början
  initSitemapIndex();

  // Funktion för att skapa ny sitemap-fil
  const initNewSitemap = () => {
    currentSitemapPath = `sitemap${sitemapCount}.xml`;
    fs.writeFileSync(currentSitemapPath, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
    updateSitemapIndex(currentSitemapPath); // Lägg till den nya sitemap-filen i index
    console.log(`Created new sitemap file: ${currentSitemapPath}`);
    currentUrlCount = 0;
    currentFileSize = Buffer.byteLength('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n', 'utf8');
  };

  // Funktion för att stänga en sitemap-fil
  const closeCurrentSitemap = () => {
    fs.appendFileSync(currentSitemapPath, '</urlset>');
    console.log(`Closed sitemap file: ${currentSitemapPath}`);
  };

  // Initiera den första sitemap-filen
  initNewSitemap();

  let recordsCollectedCount = 0;
  let sockenCount = 0;
  const totalSocknar = socknar.length;

  for (const sockenId of socknar) {
    const records = await fetchRecordsBySocken(sockenId);

    for (const record of records) {
      const recordId = record._source.id;

      // Kontrollera om record redan är tillagd
      if (!recordSet.has(recordId)) {
        recordSet.add(recordId); // Lägg till recordId i set
        const url = `  <url>\n    <loc>${SITEMAP_BASE_URL}${recordId}</loc>\n  </url>\n`;
        const urlSize = Buffer.byteLength(url, 'utf8');

        // Kontrollera om vi behöver stänga filen och skapa en ny
        if (
          currentUrlCount + 1 > MAX_URLS_PER_SITEMAP
          || currentFileSize + urlSize > MAX_SITEMAP_SIZE_BYTES
        ) {
          closeCurrentSitemap();
          sitemapCount += 1;
          initNewSitemap();
        }

        // Skriv URL till den nuvarande sitemap-filen
        fs.appendFileSync(currentSitemapPath, url);
        currentUrlCount += 1;
        currentFileSize += urlSize;
        recordsCollectedCount += 1;
      }
    }

    // Logga progress (procent, antal socknar/records, och tidsuppskattning)
    sockenCount += 1;
    const percentComplete = ((sockenCount / totalSocknar) * 100).toFixed(2);

    // Beräkna tidsuppskattning
    const elapsedTime = (Date.now() - startTime) / 1000; // Tidsåtgång i sekunder
    const estimatedTotalTime = elapsedTime / (sockenCount / totalSocknar); // Total uppskattad tid
    const remainingTime = estimatedTotalTime - elapsedTime; // Återstående tid

    // Logga framsteg, tidsuppskattning och förväntat avslutningsklockslag
    console.log(`Progress: ${sockenCount}/${totalSocknar} socknar processed (${percentComplete}% complete).`);
    console.log(`Total unique records so far: ${recordsCollectedCount}. Estimated time remaining: ${formatTime(remainingTime)} (${formatEndTime(remainingTime)}).`);
  }

  // Avsluta sista sitemap-filen
  closeCurrentSitemap();
  console.log('Individual sitemap files created successfully.');

  // Avsluta sitemap index-fil
  closeSitemapIndex();
}

// Kör funktionen för att skapa sitemaps
createSitemaps();
