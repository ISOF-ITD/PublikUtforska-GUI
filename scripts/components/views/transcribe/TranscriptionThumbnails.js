import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAsterisk,
  faCheck,
  faLock,
  faNewspaper,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import config from "../../../config";
import classNames from "classnames";

const getStatus = (page) => {
  if (!page.isSent && page.unsavedChanges) {
    return {
      key: "unsaved",
      label: "Sidan har redigerats",
      color: "bg-orange-500",
      icon: faAsterisk,
    };
  }
  if (page.isSent) {
    return {
      key: "sent",
      label: "Sidan har skickats",
      color: "bg-green-600",
      icon: faCheck,
    };
  }
  if (!page.isSent && page.transcriptionstatus === "transcribed") {
    return {
      key: "transcribed",
      label: "Sidan kontrolleras",
      color: "bg-gray-400",
      icon: faLock,
    };
  }
  if (!page.isSent && page.transcriptionstatus === "published") {
    return {
      key: "published",
      label: "Sidan har publicerats",
      color: "bg-isof",
      icon: faNewspaper,
    };
  }
  if (page.transcriptionstatus === "readytotranscribe") {
    return {
      key: "ready",
      label: "Sidan kan skrivas av",
      color: "bg-lighter-isof",
      icon: faPen,
    };
  }
  return null;
};

// Small that carries an icon and accessible label
const StatusDot = ({ status }) => {
  if (!status) return null;
  return (
    <div
      className={classNames(
        "absolute top-2 right-2 h-8 w-8 rounded-full",
        "flex items-center justify-center text-white shadow",
        "border-2 border-solid border-white",
        status.color
      )}
      title={status.label}
      aria-label={status.label}
    >
      {status.icon && <FontAwesomeIcon className="h-5" icon={status.icon} />}
      <span className="sr-only">{status.label}</span>
    </div>
  );
};

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
        const status = getStatus(page);

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
              <StatusDot status={status} />

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
