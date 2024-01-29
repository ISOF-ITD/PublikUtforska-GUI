
export default function SearchFilterButton({
    handleFilterChange, text, categories, categoryId, pictureTotal
}) {

    return (
        <div
            className={`search-filter${categories?.includes(categoryId) ? ' checked' : ''}`}
        >
            <div className="input-wrapper">
                <input
                    type="checkbox"
                    id={categoryId}
                    checked={categories?.includes(categoryId)}
                    onChange={handleFilterChange}
                    data-filter={categoryId}
                    aria-checked={categories?.includes(categoryId)}
                />
                <svg viewBox="0 0 200 200" width="1.25em" height="1.25em" xmlns="http://www.w3.org/2000/svg" className="icon" role="img" aria-hidden="true">
                    <path d="M132.639 63.231l-48.974 53.26l-17.569-13.51l-12.191 15.855c22.199 17.07 30.128 26.802 38.284 17.932l55.172-60l-14.722-13.537z" />
                </svg>
            </div>
            <label
                className="search-filter-label"
                htmlFor={categoryId}
            >
                {l(text)}
                {' '}
                {`(${pictureTotal?.value || 0})`}
            </label>
        </div >
    )
}
