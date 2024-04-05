const axios = require('axios');
const fs = require('fs');

// Bas-URL för att hämta dokumenten
// const BASE_URL = 'https://frigg.isof.se/sagendatabas/api/es/documents/?mark_metadata=transcriptionstatus&type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&transcriptionstatus=published,accession&sort=archive.archive_id_row.keyword&order=asc';
const BASE_URL = 'https://garm.isof.se/folkeservice/api/es/documents/?mark_metadata=transcriptionstatus&type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&add_aggregations=false&recordtype=one_record&transcriptionstatus=published';
// Bas-URL för sitemap-länkarna
const SITEMAP_BASE_URL = 'https://sok.folke.isof.se/#/records/';

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

// Funktion för att skapa sitemap i textformat
async function createTextSitemap() {
    let from = 0;
    const size = 500;
    let sitemapText = '';

    while (true) {
        const documents = await fetchDocuments(size, from);

        if (documents.length === 0) {
            break;
        }

        documents.forEach(doc => {
            if (doc._source.id) {
                sitemapText += `${SITEMAP_BASE_URL}${doc._source.id}\n`;
            }
        });

        from += size;
    }

    fs.writeFileSync('www/sitemap.txt', sitemapText);
    console.log('Text sitemap created successfully.');
}

createTextSitemap();
