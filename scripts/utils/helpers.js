import config from '../config';

export function pageFromTo({ _source: { archive: { page, total_pages: totalPages } } }) {
  let text = `${page}`;
  if (totalPages > 1) {
    const toPage = parseInt(page, 10) + (totalPages - 1);
    text += `-${toPage}`;
  }
  return text;
}

export function getTitle(title, contents) {
  switch (!!title) {
    case true:
      return title;
    default:
      if (contents) {
        if (contents.length > 300) {
          return `[${contents.substring(0, 284)} ${'(FÖRKORTAD TITEL)'}]`;
        }
        return `[${contents}]`;
      }
      return null;
  }
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
export function getAudioTitle(title, contents, archiveName, fileName, year, persons) {
  // console.log(title);
  switch (!!title) {
    case true:
      return title;
    default:
      if (contents) {
        if (contents.length > 0) {
          if (archiveName.includes('AFU')) {
            if (contents.length > 100) {
              return `[${contents.substring(0, 84)} ${'(FÖRKORTAD TITEL)'}]`;
            }
            return `[${contents}]`;
          }
          // SVN isof/kod/databasutveckling/alltiallo/accessionsregister/statusAccessionsregister.sql:
          // -- Find titel_allt types by DAG acc_nr_ny_prefix iod:
          if (archiveName.includes('AFG')) {
            // Clean different row breaks:
            const cleanContent = contents.replace(/\r\n/g, '\n').replace(/\n\n/g, '\n');
            const contentRows = cleanContent.split('\n');
            for (let i = 0; i < contentRows.length; i++) {
              // console.log(contentRows[i]);
              // Get first element delineated by () or [] which is an archive id that often match the filename:
              const elements = contentRows[i].split(')');
              if (contentRows[i].charAt(0) === '[') {
                const elements = contentRows[i].split(']');
              }
              if (elements.length > 0) {
                let fileId = elements[0];
                if (fileId.length > 1) {
                  // Clean unwanted characters:
                  fileId = fileId.replace('(', '').replace(' ', '');
                  const filenameParts = fileName.split('/');
                  if (filenameParts) {
                    // Clean filename accordning to pattern in content field:
                    let cleanFilename = filenameParts[filenameParts.length - 1].replace('.mp3', '').replace('.MP3', '').replace('I', '1').replace('II', '2')
                      .replace('III', '3');
                    // How to identify and remove other existing extensions?
                    cleanFilename = cleanFilename.replace('SK', '');
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
          if (archiveName.includes('Lund') || archiveName.includes('DAL')) {
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
              if (person[i].birthyear) {
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
export function makeArchiveIdHumanReadable(str) {
  // Kontrollera att str är definierad
  if (!str) return '';
  // Matcha första delen av strängen som inte är en siffra (bokstäver)
  // och andra delen som är minst en siffra (0 eller flera siffror)
  // och behåll alla tecken efter siffran/siffrorna i andra delen
  const match = str.match(/^(\D*)([0-9:]+.*)?/);

  // Om ingen matchning hittades, returnera en tom sträng
  if (!match) return '';

  const [letterPart = '', numberPart = ''] = match.slice(1);

  // Omvandla bokstäver till versaler och ta bort inledande nollor
  const parts = [
    letterPart.toUpperCase(),
    numberPart.replace(/^0+/, ''),
  ];

  // Returnera en sträng med båda delarna separerade med ett mellanslag
  return parts.join(' ');
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
