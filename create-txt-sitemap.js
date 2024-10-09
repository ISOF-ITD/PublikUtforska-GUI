// TODO: indexera allt och inte bara one_records. det finns contents och headwords som kan vara intressanta
// one_accession_row: alla
// one_records: bara de transkriberade

// men då måste vi börja använda:
// https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
// för att inte höja index_max_result_window (https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window) ännu mer, som nu är inställt på 50000
// den ändringen bör då göras 
const axios = require('axios');
const fs = require('fs');

// Bas-URL för att hämta dokumenten
const BASE_URL = 'https://garm.isof.se/folkeservice/api/es/documents/?type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&add_aggregations=false&recordtype=one_record&transcriptionstatus=published';
// const BASE_URL = 'https://garm.isof.se/folkeservice/api/es/documents/?type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&add_aggregations=false';
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
    const filePath = 'www/sitemap.txt';

    // Tömmer eller tar bort filen om den finns
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Alternativt, använd fs.writeFileSync(filePath, '') för att bara tömma filen
        console.log('Existing sitemap file removed.');
    }

    while (true) {
        const documents = await fetchDocuments(size, from);

        if (documents.length === 0) {
            break;
        }

        documents.forEach(doc => {
            if (doc._source.id) {
                // Lägger till varje URL i filen en i taget
                fs.appendFileSync(filePath, `${SITEMAP_BASE_URL}${doc._source.id}\n`);
            }
        });

        from += size;
    }

    console.log('Text sitemap created successfully.');
}

createTextSitemap();
