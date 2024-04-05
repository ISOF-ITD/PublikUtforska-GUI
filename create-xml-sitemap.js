const axios = require('axios');
const xmlbuilder = require('xmlbuilder');
const fs = require('fs');

const BASE_URL = 'https://frigg.isof.se/sagendatabas/api/es/documents/?mark_metadata=transcriptionstatus&type=arkiv&categorytypes=tradark&publishstatus=published&has_media=true&transcriptionstatus=published,accession&sort=archive.archive_id_row.keyword&order=asc';
const SITEMAP_BASE_URL = 'https://sok.folke.isof.se/#/records/';

async function fetchDocuments(size, from = 0) {
    try {
        // Log the fetch operation details
        console.log(`Fetching documents: Size = ${size}, From = ${from}`);
        
        const response = await axios.get(`${BASE_URL}&size=${size}&from=${from}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

async function createSitemap() {
    let from = 0;
    const size = 500;
    const urlSet = xmlbuilder.create('urlset', { version: '1.0', encoding: 'UTF-8' })
        .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    while (true) {
        const documents = await fetchDocuments(size, from);

        if (documents.length === 0) {
            break;
        }

        documents.forEach(doc => {
            if (doc._source.id) {
                urlSet.ele('url')
                    .ele('loc', `${SITEMAP_BASE_URL}${doc._source.id}`).up()
                    .ele('lastmod', new Date().toISOString().split('T')[0]).up()
                    .ele('changefreq', 'monthly').up()
                    .ele('priority', 0.5);
            }
        });

        from += size;
    }

    const xml = urlSet.end({ pretty: true });
    fs.writeFileSync('sitemap.xml', xml);
    console.log('Sitemap created successfully.');
}

createSitemap();
