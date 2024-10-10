// TODO: indexera allt och inte bara one_records. det finns contents och headwords som kan vara intressanta
// one_accession_row: alla
// one_records: bara de transkriberade

// men då måste vi börja använda:
// https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
// för att inte höja index_max_result_window (https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window) ännu mer, som nu är inställt på 50000
// den ändringen bör då göras 

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Bas-URL för att hämta dokumenten
const BASE_URL = 'https://garm.isof.se/folkeservice/api/es/documents/?type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&add_aggregations=false&recordtype=one_record&transcriptionstatus=published';
// const BASE_URL = 'https://garm.isof.se/folkeservice/api/es/documents/?type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&add_aggregations=false';
// Bas-URL för sitemap-länkarna
const SITEMAP_BASE_URL = 'https://sok.folke.isof.se/#/records/';

// Konstanter för sitemap-begränsningar
const MAX_URLS_PER_SITEMAP = 50000;
const MAX_SITEMAP_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Funktion för att hämta dokument
async function fetchDocuments(size, from = 0) {
    try {
        console.log(`Fetching documents: Size = ${size}, From = ${from}`);
        
        const response = await axios.get(`${BASE_URL}&size=${size}&from=${from}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

// Funktion för att skapa sitemap index och individuella sitemaps i XML-format
async function createSitemapIndexAndSitemaps() {
    let from = 0;
    const size = 500;
    let sitemapCount = 1;
    let currentUrlCount = 0;
    let currentFileSize = 0;
    const sitemapFiles = [];
    let currentSitemapPath = `sitemap${sitemapCount}.xml`;

    // Funktion för att initiera en ny sitemap-fil
    const initNewSitemap = () => {
        currentSitemapPath = `sitemap${sitemapCount}.xml`;
        sitemapFiles.push(currentSitemapPath);
        fs.writeFileSync(currentSitemapPath, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
        console.log(`Created new sitemap file: ${currentSitemapPath}`);
        currentUrlCount = 0;
        currentFileSize = Buffer.byteLength('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n', 'utf8');
    };

    // Funktion för att avsluta en sitemap-fil
    const closeCurrentSitemap = () => {
        fs.appendFileSync(currentSitemapPath, '</urlset>');
        console.log(`Closed sitemap file: ${currentSitemapPath}`);
    };

    // Initiera den första sitemap-filen
    initNewSitemap();

    while (true) {
        const documents = await fetchDocuments(size, from);

        if (documents.length === 0) {
            break;
        }

        for (const doc of documents) {
            if (doc._source.id) {
                const url = `  <url>\n    <loc>${SITEMAP_BASE_URL}${doc._source.id}</loc>\n  </url>\n`;
                const urlSize = Buffer.byteLength(url, 'utf8');

                // Kontrollera om vi når någon av begränsningarna
                if (
                    currentUrlCount + 1 > MAX_URLS_PER_SITEMAP ||
                    currentFileSize + urlSize > MAX_SITEMAP_SIZE_BYTES
                ) {
                    // Avsluta den nuvarande sitemap-filen och initiera en ny
                    closeCurrentSitemap();
                    sitemapCount += 1;
                    initNewSitemap();
                }

                // Lägg till URL:en i den aktuella sitemap-filen
                fs.appendFileSync(currentSitemapPath, url);
                currentUrlCount += 1;
                currentFileSize += urlSize;
            }
        }

        from += size;
    }

    // Avsluta den sista sitemap-filen
    closeCurrentSitemap();

    console.log('Individual sitemap files created successfully.');

    // Skapa sitemap_index.xml
    const sitemapIndexPath = 'sitemap_index.xml';
    const sitemapIndexContent = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];
    sitemapFiles.forEach(file => {
        sitemapIndexContent.push(`  <sitemap>\n    <loc>https://sok.folke.isof.se/${file}</loc>\n  </sitemap>`);
    });
    sitemapIndexContent.push('</sitemapindex>');

    // Skriv sitemap index till fil
    fs.writeFileSync(sitemapIndexPath, sitemapIndexContent.join('\n'));
    console.log(`Sitemap index file created: ${sitemapIndexPath}`);
}

createSitemapIndexAndSitemaps();
