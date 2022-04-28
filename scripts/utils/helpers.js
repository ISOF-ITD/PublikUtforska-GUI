export function pageFromTo(item) {
    let text = `${item._source.archive.page}`;
    if (item._source.archive.total_pages > 1) {
        const toPage = parseInt(item._source.archive.page) + (item._source.archive.total_pages - 1);
        text = text + `-${toPage}`
    }
    return text;
}