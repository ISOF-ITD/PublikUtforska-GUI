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