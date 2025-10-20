import classNames from "classnames";
import config from "../../../config";
import { StatusIndicator } from "../../../features/RecordTextPanel/ui/TranscriptionStatusIndicator";
import { computeStatus } from "../../../features/RecordTextPanel/utils/computeStatus,js";

export default function TranscriptionThumbnails({
  thumbnailContainerRef,
  pages,
  navigatePages,
  currentPageIndex,
}) {
  return (
    <div
      className="flex gap-2 py-2 overflow-x-auto"
      ref={thumbnailContainerRef}
      aria-label="Bildminiatyrer"
      role="listbox"
      aria-activedescendant={`thumb-${currentPageIndex}`}
    >
      {pages.map((page, index) => {
        if (!page?.source || page.source.includes(".pdf")) return null;

        const selected = index === currentPageIndex;
        const status = computeStatus(page);

        return (
          <div
            key={index}
            id={`thumb-${index}`}
            type="button"
            onClick={() => navigatePages(index)}
            className="relative cursor-pointer select-none outline-none scroll-m-2"
            role="option"
            aria-selected={selected}
            title={status?.label || undefined}
          >
            <div
              className={classNames(
                "relative rounded-md overflow-hidden border-solid border-3",
                selected
                  ? "border-isof"
                  : "border-transparent hover:border-blue-500 focus-visible:border-blue-500",
                "transition-shadow"
              )}
            >
              <StatusIndicator status={status} />

              <img
                src={`${config.imageUrl}${page.source}`}
                alt={`Miniatyr ${index + 1}`}
                className="block w-36 object-cover"
                loading="lazy"
              />
            </div>

            <div className="mt-2 text-center text-gray-600">
              {`${index + 1} av ${pages.length}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
