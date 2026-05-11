import React from "react";
import PropTypes from "prop-types";
import { resolveLicense } from "../utils/licenseUtils";

export default function License({ data, className = "" }) {
  const license = resolveLicense(data);

  if (license.type === "html") {
    return (
      <div className={`h-full ${className}`}>
        <div
          className="flex h-full items-start gap-3 bg-surface-muted rounded p-3 text-sm text-body"
          dangerouslySetInnerHTML={{ __html: license.html }}
        />
      </div>
    );
  }

  // type === "cc"
  const { licenseUrl, badgeSrc, label } = license;

  return (
    <div
      className={`flex flex-col items-start justify-center gap-2 bg-surface-muted text-body rounded max-w-full p-3 w-full lg:w-1/3 border border-solid border-border ${className}`}
    >
      {badgeSrc ? (
        <a
          href={licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          aria-label="Öppna licens i nytt fönster"
        >
          <img
            src={badgeSrc}
            alt="Creative Commons-licens"
            className="w-28"
            loading="lazy"
          />
        </a>
      ) : null}

      <span className="text-body">Detta verk är licensierat under:</span>
      <a
        href={licenseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline"
      >
        {label}
      </a>
    </div>
  );
}

License.propTypes = {
  data: PropTypes.shape({
    copyrightlicense: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
};
