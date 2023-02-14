export function pageFromTo(item) {
    let text = `${item._source.archive.page}`;
    if (item._source.archive.total_pages > 1) {
        const toPage = parseInt(item._source.archive.page) + (item._source.archive.total_pages - 1);
        text = text + `-${toPage}`
    }
    return text;
}

export function getTitle(title, contents) {
    switch (!!title) {
        case true:
            return title;
            break;
        default:
            if(contents) {
                if(contents.length > 300) {
                    return `[${contents.substring(0,284)} ${'(FÖRKORTAD TITEL)'}]`;
                } else {
                    return `[${contents}]`;
                }
            } else {
                return null;
            }
    }
}

// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function makeArchiveIdHumanReadable(str) {
    // Matcha första delen av strängen som inte är en siffra (bokstäver)
    // och andra delen som är en siffra (0 eller flera siffror)
    const [letterPart, numberPart = ''] = str.match(/^(\D*)(\d+)?/).slice(1);
  
    // Stora bokstäver för den första delen och ta bort alla nollor i början av den andra delen
    const parts = [
        letterPart.toUpperCase(),
        numberPart.replace(/^0+/, '')
    ];

    // Returnera en sträng med båda delarna separerade med ett mellanslag
    return parts.join(' ');
  }