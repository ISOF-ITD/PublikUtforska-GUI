import config from '../config';
import { l } from '../lang/Lang';
import archiveLogoIsof from '../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../img/archive-logo-ikos.png';

export function pageFromTo(input = {}) {
  const page = input?._source?.archive?.page;
  const totalPages = input?._source?.archive?.total_pages;

  if (page == null) return "";

  const start = parseInt(page, 10);
  // If start isn't a number (e.g. "A10"), just return the original page.
  if (Number.isNaN(start)) return String(page);

  if (parseInt(totalPages, 10) > 1) {
    const toPage = start + (parseInt(totalPages, 10) - 1);
    return `${start}-${toPage}`;
  }
  return `${start}`;
}

// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function makeArchiveIdElementHumanReadable(str, archiveOrg = null) {
  // Matcha första delen av strängen som inte är en siffra (bokstäver)
  // och andra delen som är minst en siffra (0 eller flera siffror)
  // och behåll alla tecken efter siffran/siffrorna i andra delen
  if (!str) return '';
  const match = str.match(/^(\D*)([0-9:]+.*)?/);

  // Om ingen matchning hittades, returnera en tom sträng
  if (!match) return '';

  let [letterPart = '', numberPart = ''] = match.slice(1);

  //Vid behov lägg till prefix för arkiv om inga bokstäver i accessionsnummer (letterPart == '')
  let prefix = '';

  // OBS: Delen efter kolon ingår i accessionsnummer

  // inga dubbla bokstavsprefix (prefix + letterPart) hanteras genom:
  // 1. Arkivort Göteborg ska inte få prefix då prefix ingår i id, d.v.s har letterpart
  // 2. För övriga arkivorter: 
  //    Får prefix enligt ortens regler
  //    Om numberpart inte tom så sätts letterpart till tom sträng
  if (archiveOrg === 'Lund') {
    // Visa alltid bokstavsprefix/letterpart - fråga AFG!
    // if (numberPart && numberPart.length > 0) letterPart = ''
    prefix = 'DAL';
  }
  if (archiveOrg === 'Umeå') {
    if (numberPart && numberPart.length > 0) letterPart = ''
    // getFirstNonAlpha(str) {
    for (var i = 0; i<str.length;i++) {
      if (!isNaN(str[i])) {
        break;
      }
    }
    // return false;
    if (i < str.length) {
      // Non numeric exists
      var numericPart = str.substring(i);
      var numericId = parseInt(numericPart)
      if (numericId < 1166) {
        prefix = 'FFÖN';
      } else {
        prefix = 'DAUM';
      }
    }
  }
  if (archiveOrg === 'Uppsala') {
    // ULMA -> 39080
    // SOFI 39081 – 39383
    // DFU 39384 ->
    prefix = "ULMA";
    // getFirstNonAlpha(str)
    let i = 0;
    for (; i < str.length; i += 1) {
      if (!isNaN(str[i])) {
        break;
      }
    }
    // return false;
    if (i < str.length) {
      // Non numeric exists
      var numericPart = str.substring(i);
      var numericId = parseInt(numericPart)
      if (numericId >= 39081 && numericId <= 39383) {
        prefix = 'SOFI';
      }
      if (numericId > 39383) {
        prefix = 'DFU';
      }
      if (numberPart && numberPart.length > 0) {
        // Alla med letterPart som ljud ska alltid ha prefix ULMA
        if (letterPart.toLowerCase().includes('b') || letterPart.toLowerCase().includes('gr') || letterPart.toLowerCase().includes('ss')) {
          prefix = 'ULMA';
        }
        // Visa alltid bokstavsprefix/letterpart
        //letterPart = ''
      }
    }
  }

  // Omvandla bokstäver till versaler och ta bort inledande nollor
  const parts = [
    prefix,
    letterPart.toUpperCase(),
    String(numberPart || '').replace(/^0+/, ''),
  ];

  // Returnera en sträng med båda delarna separerade med ett mellanslag
  return parts.join(' ').trim();
}

// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function makeArchiveIdHumanReadable(str, archiveOrg = null) {
  // Kontrollera att str är definierad
  if (!str) return '';

  // Loopa över alla accessionsnummer utifall det finns flera accessionsnummer med separator semikolon ';'
  return str
    .split(';')
    .map(p => makeArchiveIdElementHumanReadable(p.trim(), archiveOrg))
    .filter(Boolean)
    .join('; ');
}

// OBS: om `highlight` skickas medså innehåller return-strängen HTML-taggar
// använd då `dangerouslySetInnerHTML`!
export function getTitle(title, contents, archive, highlight) {
  // om det finns en träff i `title`, visa med highlight
  if (highlight?.title) {
    const highlightedTitle = highlight.title[0];
    return highlightedTitle;
  }
  // annars, testa med `title`
  if (title) {
    return title;
  }
  // om det finns träff i `contents`, visa med highlight
  if (highlight?.contents) {
    // här behövs ingen teckenbegräsning eftersom es-api levererar highlights
    // med max 300 tecken
    const highlightedContents = highlight.contents[0].replace(/\r/g, ' ');
    return `[${highlightedContents}]`;
  }
  // annars, testa med `contents`, och förkorta om nödvändigt
  if (contents) {
    if (contents.length > 300) {
      return `[${contents.substring(0, 282).replace(/\r/g, ' ')} ${' (FÖRKORTAD TITEL)'}]`;
    }
    return `[${contents.replace(/\r/g, ' ')}]`;
  }
  if (archive) {
    // Default fallback for title to archive id and pages if archive.page exists
    const humanReadableId = makeArchiveIdHumanReadable(archive.archive_id, archive.archive_org);
    const pageInfo = archive.page ? `:${pageFromTo({ _source: { archive } })}` : '';
    return `${humanReadableId}${pageInfo}`;
  }
  return null;
}


export function removeUnderscoresBeforeFirstNumber(input = ''){
  // Replace all underscores before the first number
  return input.replace(/^([^0-9]*)_+/g, '$1');
}

export function getSegmentTitle(mediaItems) {
  /* Funktion för att skapa titel för segment
  Input: mediaItems (array av mediaItem objekt som hör till segmentet)

  Regler:
  1. Sida X eller Sidor X-Y (från pagenumber eller source) för första och sista mediaitem
  2. Titel från första mediaitem (om finns)
  3. Om transcriptionstatus = readytotranscribe lägg till "kan skrivas av"
  */
  if (!mediaItems || mediaItems.length === 0) return '';

  let title = '';
  let startpage = '';
  let endpage = '';
  if (mediaItems[0].pagenumber && mediaItems[0].pagenumber.trim()) {
    startpage = mediaItems[0].pagenumber.trim();
  }
  if (startpage === '') {
    if (mediaItems[0].source) {
      startpage = String(
        parseInt(mediaItems[0].source.split("_").pop().split(".")[0], 10)
      );
    }
  }
  if (mediaItems[mediaItems.length - 1].pagenumber && mediaItems[mediaItems.length - 1].pagenumber.trim()) {
    endpage = mediaItems[mediaItems.length - 1].pagenumber.trim();
  }
  if (endpage === '') {
    if (mediaItems[mediaItems.length - 1].source) {
      endpage = String(
        parseInt(mediaItems[mediaItems.length - 1].source.split("_").pop().split(".")[0], 10)
      );
    }
  }
  if (mediaItems.length === 1) {
    title = `Sida ${startpage}`;
  } else {
    title = `Sidor ${startpage}-${endpage}`;
  }
  if (mediaItems[0].title && mediaItems[0].title.trim()) {
    title += (mediaItems[0].title ? ` ${mediaItems[0].title}` : '');
  }
  if (mediaItems[0].transcriptionstatus && mediaItems[0].transcriptionstatus === 'readytotranscribe') {
    title = title + ' kan skrivas av';
  }
  return title;
}

/* Funktion för att skapa titel för ljudfil

Mediafil Titel
1.	Registrerad titel (records_media.title)
2.a	Om arkiv AFU: records.content (Bara om en fil på accessionsraden?)
	Många eller alla?
2.b	Om arkiv AFG: Rad i innehåll (records.content) med match på filnamn
-	ca 900 med detta mönster
-	Första “ordet” med mönster (### ? R) där
	# = Accessionsnummer med (optional prefix?) och siffror
	? = Bokstav, t.ex. sida
	Valfri siffra oftast i romersk form (I, II, III)
2.c Om arkiv DAL: Textsegment i innehåll (records.content) med match på filnamn
 - Ca 6400?
 - Tag bort " ", "_m" i filnamn
 - Behåll bara två första ord om fler ord än 2 i filnamn
 Annars:
 a. informant?
 b. titel = titel_allt[1-80]?
 Exempel acc_nr_ny: "s00023 ; s00024 ;"
 Exempel filnamn: "S 24A_m.MP3", "s 1000a ålem smål.mp3"
 Exempel innehåll: S17A: Malt. Mara och varulv. S17B: Bäckahästen. Brygd. S18A: Brygd
  3.	Om de finns: Informanter(er), insamlingsår
4.	Text: "Inspelning"

*/
export function getAudioTitle(title, contents, archiveOrg, archiveName, fileName, year, persons) {
  function basenameNoExt(p) {
  return p.split('/').pop().replace(/\.[^/.]+$/, '');
}
  function normalizeUppsalaIdFromRowId(token) {
  // Accepts: "Gr3702:b2", "Gr3703:A", "Bd1222:b", "Bd1222b", "ULMA39081a2" etc.
  const t = token.trim().replace(/\s+/g, '');
  // Pattern with optional ":" before the trailing letter/number
  let m = t.match(/^([A-Za-z]+)(\d+)\s*:?([A-Za-z])(\d*)$/i);
  if (!m) {
    // Already concatenated form like "Bd1222b"
    m = t.match(/^([A-Za-z]+)(\d+)([A-Za-z])(\d*)$/i);
  }
  if (!m) return null;
  const [, letters, digits, letter, num] = m;
  return `${letters}${digits}${letter.toLowerCase()}${num || ''}`;
}

// helper: pull "Gr3702A2" out of the filename and normalize -> "Gr3702a2"
function extractUppsalaIdFromFilename(fileName) {
  const base = basenameNoExt(fileName).replace(/\s+/g, '');
  // Normalize separators to underscores so we can split on them
  const norm = base.replace(/[-:]/g, '_');

  // Try token-by-token first
  const toks = removeUnderscoresBeforeFirstNumber(norm).split('_');
  for (const tk of toks) {
    // “Gr3702a2” or “Gr3702:a2” already normalized by removing separators
    let m = tk.match(/^([A-Za-z]+)(\d+)([A-Za-z])(\d*)$/i);
    if (!m) m = tk.match(/^([A-Za-z]+)_?(\d+):?([A-Za-z])(\d*)$/i);
    if (m) {
      const [, letters, digits, letter, num] = m;
      return `${letters}${digits}${letter.toLowerCase()}${num || ''}`;
    }
  }
  let m = norm.match(/([A-Za-z]+)_?(\d+)[:_]?([A-Za-z])(\d*)/i)
       || norm.replace(/_/g, '').match(/([A-Za-z]+)(\d+)([A-Za-z])(\d*)/i);
  if (m) {
    const [, letters, digits, letter, num] = m;
    return `${letters}${digits}${letter.toLowerCase()}${num || ''}`;
  }
  return null;
}
  if (title?.trim()) {
    return title;
  }
      if (contents) {
        if (contents.length > 0) {
          // If no archiveOrg use archive name 
          if (!archiveOrg && archiveName) {
            if (archiveName.includes('AFG')) {
              archiveOrg = 'Göteborg';
            }
            if (archiveName.includes('Lund') || archiveName.includes('DAL')) {
              archiveOrg = 'Lund';
            }
            if (archiveName.includes('AFU')) {
              archiveOrg = 'Uppsala';
            }
            if (archiveName.includes('Umeå')) {
              archiveOrg = 'Umeå';
            }
          }
// Set audio title according to archive patterns using archiveOrg
// --- inside getAudioTitle, in the Uppsala block, replace that whole section with: ---
if (archiveOrg === 'Uppsala') {
  // Normalize line breaks, allow both '|' and newline delims, and the '->' form.
  const cleanContent = contents
    .replace(/\r\n?/g, '\n')
    .replace(/\n\n+/g, '\n');

  // Prefer pipe if present, else split on newlines, else treat as one row
  const contentRows = cleanContent.includes('|')
    ? cleanContent.split('|')
    : (cleanContent.includes('\n') ? cleanContent.split('\n') : [cleanContent]);

  const fileId = extractUppsalaIdFromFilename(fileName); // e.g. "Gr3703b2"

  // Try to find a matching row
  for (let i = 0; i < contentRows.length; i += 1) {
    const row = contentRows[i].trim();
    if (!row) continue;

    // Support both formats:
    //  a) "Gr3703:b2 (00:00) …"
    //  b) "Tidsangivet innehåll -> Gr3703:b2 (00:00) …"
    let rowToken = null;
    let rowDesc = null;

    // b) Arrow form
    const arrow = row.match(/->\s*([A-Za-z]+)\s*:?(\d+)\s*([A-Za-z])(\d*)\s*(.*)$/i);
    if (arrow) {
      const [, letters, digits, letter, num, after] = arrow;
      rowToken = `${letters}${digits}:${letter}${num || ''}`; // keep ':' for display
      rowDesc = after?.trim() || '';
    } else {
      // a) First token is the id, rest is the description
      const parts = row.split(/\s+/);
      if (parts.length) {
        rowToken = parts[0];
        rowDesc = parts.slice(1).join(' ');
      }
    }

    if (!rowToken) continue;

    // Normalize for comparison
    const normRowId = (() => {
      // accept "Gr3703:b2" or "Gr3703b2"
      const t = rowToken.replace(/\s*/g, '');
      const collapsed = t.replace(/[_:]/g, '');
      const m = collapsed.match(/^([A-Za-z]+)(\d+)([A-Za-z])(\d*)$/i);
      if (!m) return null;
      const [, letters, digits, letter, num] = m;
      return `${letters}${digits}${letter.toLowerCase()}${num || ''}`;
    })();

    if (fileId && normRowId && normRowId.toLowerCase() === fileId.toLowerCase()) {
      // keep a human-friendly token with ':' if present
      const displayToken = rowToken
        .replace(/\s*/g, '')
        .replace(/[_:]/g, '')
        .replace(/^([A-Za-z]+\d+)([A-Za-z]\d*)$/i, '$1:$2');
      return `${displayToken}: ${rowDesc}`.trim();
    }
  }

  // No exact row match (or no fileId). Use a collision-proof fallback:
  const base = basenameNoExt(fileName || '');
  const short = contents.length > 100 ? contents.substring(0, 84) + ' (FÖRKORTAD TITEL)' : contents;
  return `[${base} → ${short}]`;
}
          // SVN isof/kod/databasutveckling/alltiallo/accessionsregister/statusAccessionsregister.sql:
          // -- Find titel_allt types by DAG acc_nr_ny_prefix iod:
          if (archiveOrg === 'Göteborg') {
            // Clean different row breaks:
            const cleanContent = contents.replace(/\r\r/g, '\n').replace(/\r\n/g, '\n').replace(/\n\n/g, '\n');
            const contentRows = cleanContent.split('\n');
            for (let i = 0; i < contentRows.length; i++) {
              // console.log(contentRows[i]);
              // Get first element delineated by () or [] which is an archive id that often match the filename:
              let elements = contentRows[i].split(')');
              if (contentRows[i].charAt(0) === '[') {
                elements = contentRows[i].split(']');
              }
              if (elements.length > 0) {
                let fileId = elements[0];
                if (fileId.length > 1) {
                  // Clean unwanted characters:
                  fileId = fileId.replace(/\[/g, '').replace(/\(/g, '').replace(/ /g, '');
                  // Clean filename accordning to pattern in content field:
                  fileId = fileId.replace('III', '3').replace('II', '2').replace('I', '1');
                  const filenameParts = fileName?.split('/');
                  if (filenameParts) {
                    // Clean filename accordning to pattern in content field:
                    let cleanFilename = filenameParts[filenameParts.length - 1].replace('.mp3', '').replace('.MP3', '').replace('III', '3').replace('II', '2')
                      .replace('I', '1');
                    // Remove letter prefix and leading zeros
                    // How to identify and remove other existing extensions?
                    cleanFilename = cleanFilename.replace('SK', '').replace(/^0+/, "");
                    // Match archive id with filename:
                    if (fileId === cleanFilename) {
                      return contentRows[i];
                    }
                  }
                }
              }
            }
          }
          // SVN isof/kod/databasutveckling/alltiallo/accessionsregister/statusAccessionsregister.sql:
          // -- Find titel_allt types by DAL acc_nr_ny_prefix "s"+ one character (to compare hits with number as second character to letters as second character):
          if (archiveOrg === 'Lund') {
            // Clean different row breaks:
            const cleanContent = contents.replace(/\r\n/g, '\n').replace(/\n\n/g, '\n');
            const contentRows = cleanContent.split(':');

            // Loop until next last segment
            for (let i = 0; i < contentRows.length - 1; i += 1) {
              // Get all words from next element except first element delineated by " ":
              const thisSegment = contentRows[i].split(' ');
              const nextSegment = contentRows[i + 1].split(' ');
              // Last word in segment + all but last word in next segment
              const thisSegmentFileId = thisSegment[thisSegment.length - 1];
              const thisSegmentContent = nextSegment.slice(0, -1).join(' ');
              if (thisSegmentFileId.length > 0) {
                const fileId = thisSegmentFileId;
                // Clean unwanted characters:
                const cleanFilename = (fileName || '').replace(/\s+/g, '');
                // Match archive id with filename:
                if (cleanFilename.includes(fileId)) {
                  const fileTitle = `${thisSegmentFileId}: ${thisSegmentContent}`;
                  return fileTitle;
                }
              }
            }
          }
        }
      }
      if (persons) {
        let personbasedTitle = '';
        for (let i = 0; i < persons.length; i += 1) {
          if (['i', 'informant'].includes(persons[i].relation)) {
            let name = '';
            let birthYear = '';
            if (persons[i].name) {
              name = persons[i].name;
              if (persons[i].birthyear) {
                birthYear = ` född ${persons[i].birthyear}`;
              }
              personbasedTitle = personbasedTitle + name + birthYear;
              if (i < persons.length - 1) {
                personbasedTitle = personbasedTitle + ', ';
              }
            }
          }
        }
        if (personbasedTitle) {
          if (personbasedTitle.length > 0) {
            let yearString = '';
            if (year) {
              yearString = year.substring(0, 4);
            }
            personbasedTitle = `${personbasedTitle} intervju ${yearString}`;
          }
          if (personbasedTitle.length > 0) {
            return personbasedTitle;
          }
        }
      }
      return l('Inspelning');
  }


// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function getArchiveName(archiveOrg) {
  // Standard är Göteborg då Göteborgsposter skapades då archive_org inte fanns
  let archiveName = 'Institutet för språk och folkminnen, Göteborg'

  if (archiveOrg === 'Lund') {
    archiveName = 'Institutet för språk och folkminnen, Lund'
  }
  if (archiveOrg === 'Göteborg') {
    archiveName = 'Institutet för språk och folkminnen, Göteborg'
  }
  if (archiveOrg === 'Umeå') {
    archiveName = 'Institutet för språk och folkminnen, Umeå'
  }
  if (archiveOrg === 'Uppsala') {
    archiveName = 'Institutet för språk och folkminnen, Uppsala'
  }
  // Icke isof
  if (archiveOrg === 'NFS') {
    archiveName = 'Norsk folkeminnesamling'
  }
  if (archiveOrg === 'SLS') {
    archiveName = 'Svenska litteratursällskapet i Finland (SLS)'
  }
    
  return archiveName;
}

export function getArchiveLogo(archive) {
  const archiveLogos = {};

  archiveLogos['Dialekt-, namn- och folkminnesarkivet i Göteborg'] = archiveLogoIsof;
  archiveLogos['Dialekt- och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
  archiveLogos['Dialekt och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
  archiveLogos.DAG = 'img/archive-logo-isof.png';
  // Needs to be shrinked. By css?
  // archiveLogos['Norsk folkeminnesamling'] = 'img/UiO_Segl_A.png';
  archiveLogos['Norsk folkeminnesamling'] = archiveLogoIkos;
  archiveLogos.NFS = archiveLogoIkos;
  archiveLogos.DFU = archiveLogoIkos;
  // archiveLogos['SLS'] = SlsLogga;
  // archiveLogos['Svenska litteratursällskapet i Finland (SLS)'] = SlsLogga;

  return (
    archiveLogos[archive]
      ? config.appUrl + archiveLogos[archive]
      : config.appUrl + archiveLogos.DAG
  );
}

// används inte i nuläget, istället används getRecordsCountLocation
// i loaders på routen
export function getRecordsFetchLocation(params = {}) {
  const url = `${config.apiUrl}documents/`;
  let paramStrings = [];
  if (params.record_ids) { // Hämtar bara vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const queryParams = { ...config.requiredParams, ...params };

    // Anpassa params till ES Djangi api
    if (queryParams.search) {
      if (queryParams.search_field === 'person') {
        queryParams.person = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === 'place') {
        queryParams.place = queryParams.search;
        delete queryParams.search;
      }
      delete queryParams.search_field;
      queryParams.search = queryParams.search ? encodeURIComponent(queryParams.search) : undefined;
    }
    paramStrings = toQueryString(queryParams);
  }

  const paramString = Array.isArray(paramStrings) ? paramStrings.join('&') : paramStrings;
  return `${url}?${paramString}`;
}

export function getRecordsCountLocation(params = {}) {
  const url = `${config.apiUrl}count/`;
  let paramStrings = [];
  if (params.record_ids) { // Hämtar bara vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
    );
    const queryParams = { ...config.requiredParams, ...filteredParams };

    // Anpassa params till ES Djangi api
    if (queryParams.search) {
      if (queryParams.search_field === 'person') {
        queryParams.person = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === 'place') {
        queryParams.place = queryParams.search;
        delete queryParams.search;
      }
      if (queryParams.search_field === "archive_id") {
        queryParams.archive_id = queryParams.search;
        delete queryParams.search;
      }
      delete queryParams.search_field;
      queryParams.search = queryParams.search ? encodeURIComponent(queryParams.search) : undefined;
    }
    paramStrings = toQueryString(queryParams);
  }

  const paramString = Array.isArray(paramStrings) ? paramStrings.join('&') : paramStrings;
  return `${url}?${paramString}`;
}

export function getRecordFetchLocation(recordId) {
  return `${config.apiUrl}document/${recordId}/`;
}

export function getPersonFetchLocation(personId) {
  return `${config.restApiUrl}persons/${personId}/`;
}

function cleanParams(params) {
  // Remove empty values
  const validEntries = Object
    .entries(params)
    .filter(([key, value]) => key && value !== null && value !== undefined);
  const validParams = Object.fromEntries(validEntries);
  return validParams;
}

function toQueryString(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const val = k === 'search' ? v : encodeURIComponent(v);
      return `${k}=${val}`;
    })
    .join('&');
}

export function getMapFetchLocation(params = {}) {
  const url = `${config.apiUrl}socken/`;
  let paramStrings = [];

  if (params.record_ids) { // Hämtar bara platser för vissa sägner
    paramStrings.push(`documents=${params.record_ids}`);
  } else {
    const newParams = { ...config.requiredParams, ...cleanParams(params) };

    // Anpassa params till ES Djangi api
    if (newParams.search) {
      if (newParams.search_field === 'person') {
        newParams.person = newParams.search;
        delete newParams.search;
      }
      if (newParams.search_field === 'place') {
        newParams.place = newParams.search;
        delete newParams.search;
      }
      delete newParams.search_field;
      newParams.search = newParams.search ? encodeURIComponent(newParams.search) : undefined;
    }
    paramStrings = toQueryString(newParams);
  }

  const paramString = Array.isArray(paramStrings) ? paramStrings.join('&') : paramStrings;
  return `${url}?${paramString}`;
}

export function getPlaceFetchLocation(placeId) {
  return `${config.restApiUrl}locations/${placeId}`;
}

export const getPlaceString = (places) => {
  // Check if the `places` argument is truthy and if the first element of the array exists
  if (!places || !places[0]) return '';

  // Destructure the properties `name`, `landskap`, and `fylke` from the first element of the `places` array
  const { name, landskap, fylke } = places[0];

  // Initialize a variable `placeString` with the value of `name`
  let placeString = name;

  // Check if either `landskap` or `fylke` is truthy
  if (landskap || fylke) {
    // If so, add a comma followed by the value of either `landskap` or `fylke` to `placeString`
    placeString += `, ${landskap || fylke}`;
  }

  // Return the final value of `placeString`
  return placeString;
};

// used for fetching number of subrecordmedias and transcribed subrecordmedias
// normally after the component has mounted
// it is normally called in the useEffect hook
export const fetchRecordMediaCount = async (functionScopeParams, setValue, setValueTranscribed) => {
  try {
    const qp = Object.entries(functionScopeParams)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const res = await fetch(`${config.apiUrl}mediacount/?${qp}`);
    if (!res.ok) throw new Error('Fel vid hämtning av antal sidor/filer');

    const json = await res.json();
    // Be resilient to shape changes
    const transcribed = Number(json?.data?.value ?? 0);
    const total = Number(json?.aggregations?.media_count?.doc_count ?? 0);

    setValueTranscribed(transcribed);
    setValue(total);
  } catch (err) {
    console.error(err);
  }
};

export function getTitleText(
  data,
  numberOfSubrecordsMedia,
  numberOfTranscribedSubrecordsMedia,
) {
  const transcriptionStatusElement = data.transcriptionstatus;
  // Let getTitle do the smart fallback work (title → contents → archive)
  const baseTitle = getTitle(
    data.title,
    data.contents,
    data.archive // pass archive too
  );
  if (
    [
      "undertranscription",
      "transcribed",
      "reviewing",
      "needsimprovement",
      "approved",
    ].includes(transcriptionStatusElement)
  ) {
    return l("Titel granskas");
  }

  if (
    transcriptionStatusElement === "readytotranscribe" &&
    data.transcriptiontype === "sida" &&
    Number(numberOfSubrecordsMedia) > 0
  ) {
    return `Sida ${getPages(data)} (${numberOfTranscribedSubrecordsMedia} ${l(
      numberOfTranscribedSubrecordsMedia === 1
        ? "sida avskriven"
        : "sidor avskrivna"
    )})`;
  }

  if (transcriptionStatusElement === "readytotranscribe") {
    // Use baseTitle if we have one; otherwise just the status text
    const statusLabel = l("Ej avskriven");
    return baseTitle ? `${baseTitle} (${statusLabel})` : statusLabel;
  }
  // Default: just show the best title we can construct
  return baseTitle || l("(Utan titel)");
}


export function getPages(data) {
  let pages = '';

  if (data?.archive?.page) {
    pages = data.archive.page;

    // Kontrollera om 'pages' inte är ett intervall och hantera det
    if (pages && String(pages).indexOf('-') === -1) {
      if (data.archive.total_pages) {
        // Rensa bort icke-numeriska tecken som "10a" och gör om till siffra
        if (typeof pages === 'string') {
          const m = pages.match(/\d+/); // take the first number only (e.g. "10a" -> 10)
          pages = m ? parseInt(m[0], 10) : NaN;
        }

        const totalPages = parseInt(data.archive.total_pages, 10);

        // Om det finns fler än en sida, skapa intervall
        if (Number.isFinite(pages) && Number.isFinite(totalPages) && totalPages > 1) {
          const endPage = pages + totalPages - 1;
          pages = `${pages}-${endPage}`;
        }
      }
    }
  }

  return pages;
}

export function getRecordtypeLabel(recordType) {
    if (recordType === 'one_accession_row') {
      return l('Accession');
    } else {
      return null
    }
}
