import config from '../config';
import { l } from '../lang/Lang';
import archiveLogoIsof from '../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../img/archive-logo-ikos.png';

export function pageFromTo({ _source: { archive: { page, total_pages: totalPages } } }) {
  let text = ``;
  if (page) {
    text = `${page}`;
    if (totalPages > 1) {
      const toPage = parseInt(page, 10) + (totalPages - 1);
      text += `-${toPage}`;
    }
  }
  return text;
}

// Funktion för att splitta en sträng i två delar. e.g. "ifgh00010" blir "IFGH 10"
// OBS: kan inte hantera strängar som avviker fån mönstret "bokstäver + siffror"
export function makeArchiveIdElementHumanReadable(str, archiveOrg = null) {
  // Matcha första delen av strängen som inte är en siffra (bokstäver)
  // och andra delen som är minst en siffra (0 eller flera siffror)
  // och behåll alla tecken efter siffran/siffrorna i andra delen
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
    if ((i - 1) < str.length) {
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
    prefix = 'ULMA';
    i = str.length
    // getFirstNonAlpha(str) {
    for (var i = 0; i<str.length;i++) {
      if (!isNaN(str[i])) {
        break;
      }
    }
    // return false;
    if ((i - 1) < str.length) {
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
    numberPart.replace(/^0+/, ''),
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
  let idparts = str.split(';');
  let match = false;
  idparts.forEach((part, index) => {
    let trimmedPart = part.trim();
    // console.log("Part " + (index + 1) + ": " + trimmedPart);
    // Matcha första delen av strängen som inte är en siffra (bokstäver)
    // och andra delen som är minst en siffra (0 eller flera siffror)
    // och behåll alla tecken efter siffran/siffrorna i andra delen
    let matchpart = makeArchiveIdElementHumanReadable(trimmedPart, archiveOrg);
    if (match) {
      match = match + ';' + matchpart;
    } else {
      match = matchpart;
    }
  });
  // Returnera en sträng med alla delar
  return match;
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


export function removeUnderscoresBeforeFirstNumber(input) {
  // Replace all underscores before the first number
  return input.replace(/^([^0-9]*)_+/g, '$1');
}

/**
 * Returns a parced audio title for an item.
 * 
 * Behavior is preserved from the legacy implementation:
 * 1) If `title` is provided, return it.
 * 2) Else attempt org-specific parsing using `contents` + `fileName`:
 *    - Uppsala: rows are pipe-separated, IDs like "Gr3703:b2".
 *    - Göteborg: rows start with an ID in () or [] that mirrors the filename.
 *    - Lund: segments separated by ":"; ID is the last word before ":".
 * 3) Else build a person-based title (informants only).
 * 4) Else return localized fallback l("Inspelning").
 *
 * NOTE: Relies on an existing helper: removeUnderscoresBeforeFirstNumber().
 */

export function getAudioTitle(
  title,
  contents,
  archiveOrg,
  archiveName,
  fileName,
  year,
  persons
) {
  // ---------- Early exit when an explicit title already exists ----------
  if (title) return title;

  // ---------- Helpers (pure, local) ----------
  /** Accepts "Gr3702:a2", "Gr3703:b1", "Gr3711:A" etc. -> "Gr3702a2" */
  function normalizeUppsalaIdFromRowId(token) {
    const m = token.trim().match(/^(Gr\d+)\s*:?([A-Za-z])(\d*)$/i);
    if (!m) return null;
    const [, base, letter, num] = m;
    return `${base}${letter.toLowerCase()}${num || ""}`;
  }

  /** Pull "Gr3702A2" or "Gr_3702A2" out of filename -> "Gr3702a2" */
  function extractUppsalaIdFromFilename(fname) {
    const base = fname.split("/").pop().replace(/\.mp3$/i, "");
    const noSpaces = base.replace(/\s+/g, "");
    // Uses project-provided helper (kept as-is for compatibility)
    const collapsed = removeUnderscoresBeforeFirstNumber(noSpaces);
    const m = collapsed.match(/Gr_?(\d+)([A-Za-z])(\d*)/i);
    if (!m) return null;
    const [, nums, letter, num] = m;
    return `Gr${nums}${letter.toLowerCase()}${num || ""}`;
  }

  /** If archiveOrg is missing, infer from archiveName. */
  function deriveArchiveOrg(org, name) {
    if (org) return org;
    if (!name) return org;
    if (name.includes("AFG")) return "Göteborg";
    if (name.includes("Lund") || name.includes("DAL")) return "Lund";
    if (name.includes("AFU")) return "Uppsala";
    if (name.includes("Umeå")) return "Umeå";
    return org; // unchanged if no match
  }

  /** Uppsala-specific parsing (returns string or null). */
  function tryUppsalaTitle(rawContents, fname) {
    const clean = rawContents
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n\n/g, "\n");

    const rows = clean.split("|");
    const fileId = extractUppsalaIdFromFilename(fname); // e.g. "Gr3703b2"

    if (fileId) {
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i].trim();
        if (!row) continue;

        const parts = row.split(" ");
        const rowToken = parts[0]; // e.g. "Gr3703:b2"
        const rowDesc = parts.slice(1).join(" "); // e.g. "(00:00) Forts. …"

        const rowId = normalizeUppsalaIdFromRowId(rowToken);
        if (rowId && rowId.toLowerCase() === fileId.toLowerCase()) {
          const displayToken = rowToken.replace(/\s*/g, "");
          return `${displayToken} ${rowDesc}`.trim();
        }
      }
    }

    // Fallbacks
    if (rawContents.length > 100) {
      const fallbackId = fileId
        ? `${fileId.replace(/([A-Za-z])/, "$1:").toUpperCase()} `
        : "";
      return `[${fallbackId}${rawContents.substring(0, 84)} (FÖRKORTAD TITEL)]`;
    }
    return `[${rawContents}]`;
  }

  /** Göteborg-specific parsing (returns string or null). */
  function tryGoteborgTitle(rawContents, fname) {
    const clean = rawContents
      .replace(/\r\r/g, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\n\n/g, "\n");

    const rows = clean.split("\n");
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      let elements = row.split(")");
      if (row.charAt(0) === "[") elements = row.split("]");

      if (elements.length > 0) {
        let id = elements[0];
        if (id.length > 1) {
          id = id.replaceAll("[", "").replaceAll("(", "").replaceAll(" ", "");
          id = id.replace("III", "3").replace("II", "2").replace("I", "1");

          const parts = fname.split("/");
          if (parts) {
            let cleanFilename = parts[parts.length - 1]
              .replace(".mp3", "")
              .replace(".MP3", "")
              .replace("III", "3")
              .replace("II", "2")
              .replace("I", "1");

            cleanFilename = cleanFilename.replace("SK", "").replace(/^0+/, "");

            if (id === cleanFilename) return row;
          }
        }
      }
    }
    return null;
  }

  /** Lund-specific parsing (returns string or null). */
  function tryLundTitle(rawContents, fname) {
    const clean = rawContents.replace(/\r\n/g, "\n").replace(/\n\n/g, "\n");
    const segments = clean.split(":");

    for (let i = 0; i < segments.length - 1; i += 1) {
      const thisSeg = segments[i].split(" ");
      const nextSeg = segments[i + 1].split(" ");
      const id = thisSeg[thisSeg.length - 1];
      const content = nextSeg.slice(0, -1).join(" ");
      if (id && id.length > 0) {
        const cleanFilename = fname.replace(" ", "");
        if (cleanFilename.includes(id)) {
          return `${id}: ${content}`;
        }
      }
    }
    return null;
  }

  /** Person-based fallback */
  function buildPersonBasedTitle(people, y) {
    if (!people || !people.length) return "";

    let t = "";
    for (let i = 0; i < people.length; i += 1) {
      const p = people[i];
      if (["i", "informant"].includes(p?.relation)) {
        let name = "";
        let birth = "";
        if (p?.name) {
          name = p.name;
          if (p?.birthyear) birth = ` född ${p.birthyear}`;
          t = t + name + birth;
          if (i < people.length - 1) t = t + ", ";
        }
      }
    }
    if (!t) return "";

    let yearStr = "";
    if (y) yearStr = y.substring(0, 4);
    return `${t} intervju ${yearStr}`.trim();
  }

  // ---------- Content-driven title attempts ----------
  const hasContents = typeof contents === "string" && contents.length > 0;
  if (hasContents) {
    const org = deriveArchiveOrg(archiveOrg, archiveName);

    if (org === "Uppsala") {
      return tryUppsalaTitle(contents, fileName);
    }

    if (org === "Göteborg") {
      const got = tryGoteborgTitle(contents, fileName);
      if (got) return got;
    }

    if (org === "Lund") {
      const lund = tryLundTitle(contents, fileName);
      if (lund) return lund;
    }
  }

  // ---------- Person-based fallback ----------
  const personTitle = buildPersonBasedTitle(persons, year);
  if (personTitle) return personTitle;

  // ---------- Final fallback ----------
  return l("Inspelning");
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
  const paramStrings = [];
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

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key]) {
        paramStrings.push(`${key}=${queryParams[key]}`);
      }
    });
  }

  const paramString = paramStrings.join('&');

  return `${url}?${paramString}`;
}

export function getRecordsCountLocation(params = {}) {
  const url = `${config.apiUrl}count/`;
  const paramStrings = [];
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
      delete queryParams.search_field;
      queryParams.search = queryParams.search ? encodeURIComponent(queryParams.search) : undefined;
    }

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key]) {
        paramStrings.push(`${key}=${queryParams[key]}`);
      }
    });
  }

  const paramString = paramStrings.join('&');

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

export function getMapFetchLocation(params = {}) {
  const url = `${config.apiUrl}socken/`;
  const paramStrings = [];

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

    Object.keys(newParams).forEach((key) => {
      if (newParams[key]) {
        paramStrings.push(`${key}=${newParams[key]}`);
      }
    });
  }

  const paramString = paramStrings.join('&');

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
    const queryParams = { ...functionScopeParams };
    const queryParamsString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const response = await fetch(`${config.apiUrl}mediacount/?${queryParamsString}`);
    if (response.ok) {
      const json = await response.json();
      setValueTranscribed(json.data.value);
      setValue(json.aggregations.media_count.doc_count);
    } else {
      throw new Error('Fel vid hämtning av antal sidor/filer');
    }
  } catch (error) {
    console.error(error);
  }
};

export function getTitleText(
  data,
  numberOfSubrecordsMedia,
  numberOfTranscribedSubrecordsMedia,
) {
  let titleText;
  const transcriptionStatusElement = data.transcriptionstatus;

  if (['undertranscription', 'transcribed', 'reviewing', 'needsimprovement', 'approved'].includes(transcriptionStatusElement)) {
    titleText = 'Titel granskas';
  } else if (data.transcriptionstatus === 'readytotranscribe' && data.transcriptiontype === 'sida' && numberOfSubrecordsMedia > 0) {
    titleText = `Sida ${getPages(data)} (${numberOfTranscribedSubrecordsMedia} ${l(
      numberOfTranscribedSubrecordsMedia === 1 ? 'sida avskriven' : 'sidor avskrivna',
    )})`;
  } else if (data.transcriptionstatus === 'readytotranscribe') {
    titleText = 'Ej avskriven';
    if (data.title) {
      titleText = `${getTitle(data.title, data.contents)} (${titleText})`;
    }
  } else {
    titleText = getTitle(data.title, data.contents);
  }

  return titleText || l('(Utan titel)');
}

export function getPages(data) {
  let pages = '';

  if (data?.archive?.page) {
    pages = data.archive.page;

    // Kontrollera om 'pages' inte är ett intervall och hantera det
    if (pages && pages.indexOf('-') === -1) {
      if (data.archive.total_pages) {
        // Rensa bort icke-numeriska tecken som "10a" och gör om till siffra
        if (typeof pages === 'string') {
          pages = pages.replace(/\D/g, '');
          pages = parseInt(pages, 10);
        }

        const totalPages = parseInt(data.archive.total_pages, 10);

        // Om det finns fler än en sida, skapa intervall
        if (totalPages > 1) {
          const endPage = pages + totalPages - 1;
          pages = `${pages}-${endPage}`;
        }
      }
    }
  }

  return pages;
}

export function getRecordtypeLabel(recordType) {
  switch (recordType) {
    case 'one_accession_row':
      return l('Accession');
    case 'one_record':
      return l('Uppteckning');
    default:
      return null; // eller en standardetikett om det behövs, t.ex. l('Okänd')
  }
}
