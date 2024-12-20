import config from '../config';
import { l } from '../lang/Lang';
import archiveLogoIsof from '../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../img/archive-logo-ikos.png';

export function pageFromTo({ _source: { archive: { page, total_pages: totalPages } } }) {
  let text = `${page}`;
  if (totalPages > 1) {
    const toPage = parseInt(page, 10) + (totalPages - 1);
    text += `-${toPage}`;
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
  // console.log(title);
  switch (!!title) {
    case true:
      return title;
    default:
      if (contents) {
        if (contents.length > 0) {
          // If no archiveOrg use archive name 
          if (!archiveOrg) {
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
          if (archiveOrg === 'Uppsala') {
            // Clean different row breaks:
            let cleanContent = contents.replace(/\r\n/g, '\n').replace(/\n\n/g, '\n');
            // Currently the pipe delimiter is only used for Uppsala material
            let contentRows = cleanContent.split('|');

            // Loop until last segment
            for (let i = 0; i < contentRows.length; i += 1) {
              // Get parts delineated by first space " ":
              const delimiter = " "
              let elements = contentRows[i].trim().split(delimiter)
              let thisSegmentFileId = elements[0];
              let thisSegmentContent = elements.slice(1).join(delimiter);
              if (thisSegmentFileId.length > 0) {
                // Clean unwanted characters:
                let fileidElements = thisSegmentFileId.split(':')
                if (fileidElements.length > 1) {
                  // Clean unwanted numerals and dash
                  let cleanElement = fileidElements[1].replace(/[0-9]/g, '').replaceAll(":","").replaceAll("-","");
                  thisSegmentFileId = fileidElements[0] + cleanElement
                }
                let fileId = thisSegmentFileId.replaceAll(':', '');
                let filenameParts = fileName.split('/');
                if (filenameParts) {
                  // Clean filename accordning to pattern in content field:
                  let cleanFilename = filenameParts[filenameParts.length - 1].replace('.mp3', '').replace('.MP3', '')
                  cleanFilename = cleanFilename.replace(' D ', '').replace('D ', '').replace(' ', '');
                  // Remove trailing filename after underscore
                  cleanFilename = cleanFilename.split('_')[0];
                  // Match archive id with filename:
                  if (cleanFilename.toUpperCase().includes(fileId.toUpperCase())) {
                    if (thisSegmentFileId.slice(-1) === ':') {
                      // Remove colon as last character
                      thisSegmentFileId = thisSegmentFileId.slice(0, -1)
                    }
                    let fileTitle = `${thisSegmentFileId}: ${thisSegmentContent}`;
                    return fileTitle;
                  }
                }
              }
            }
            if (contents.length > 100) {
              return `[${contents.substring(0, 84)} ${'(FÖRKORTAD TITEL)'}]`;
            }
            return `[${contents}]`;
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
                  fileId = fileId.replaceAll('[', '').replaceAll('(', '').replaceAll(' ', '');
                  // Clean filename accordning to pattern in content field:
                  fileId = fileId.replace('III', '3').replace('II', '2').replace('I', '1');
                  const filenameParts = fileName.split('/');
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
                const cleanFilename = fileName.replace(' ', '');
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
            }
          }
        }
        if (personbasedTitle) {
          if (personbasedTitle.length > 0) {
            if (year) {
              personbasedTitle = `${personbasedTitle} intervju ${year.substring(0, 4)}`;
            }
          }
          if (personbasedTitle.length > 0) {
            return personbasedTitle;
          }
        }
      }
      return l('Inspelning');
  }
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
