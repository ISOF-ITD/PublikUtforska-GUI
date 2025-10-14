import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";

const DEFAULT_LICENSE = "https://creativecommons.org/licenses/by-nd/2.5/se/";

// Map CC codes to Swedish names (used if `label` is missing)
const CC_NAMES_SV = {
  "by": "Erkännande",
  "by-sa": "Erkännande–Dela lika",
  "by-nd": "Erkännande–Inga bearbetningar",
  "by-nc": "Erkännande–Icke-kommersiell",
  "by-nc-sa": "Erkännande–Icke-kommersiell–Dela lika",
  "by-nc-nd": "Erkännande–Icke-kommersiell–Inga bearbetningar",
};

// derive metadata from a CC URL like
// https://creativecommons.org/licenses/by-nd/2.5/se/
function parseCcUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // ['licenses','by-nd','2.5','se']
    if (parts[0] !== "licenses") return null;
    const code = parts[1];
    const version = parts[2];
    const locale = parts[3] || "deed"; // fallback
    return { code, version, locale };
  } catch {
    return null;
  }
}

function defaultBadge({ code, version, locale }) {
  return `https://i.creativecommons.org/l/${code}/${version}/${locale}/88x31.png`;
}

export default function License({ data, className = "" }) {
  const licenseUrl = data?.copyrightlicense || DEFAULT_LICENSE;
  const cfg = config.siteOptions?.copyrightContent?.[licenseUrl];

  if (typeof cfg === "string" && cfg.trim().startsWith("<")) {
    return (
      <div className={`h-full ${className}`}>
        <div
          className="flex h-full items-start gap-3 bg-gray-50 rounded p-3 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: cfg }}
        />
      </div>
    );
  }

  const metaFromCfg = typeof cfg === "object" && cfg;
  const parsed = parseCcUrl(licenseUrl);

  const code = metaFromCfg?.code || parsed?.code;
  const version = metaFromCfg?.version || parsed?.version;
  const locale = metaFromCfg?.locale || parsed?.locale || "deed";
  const label =
    metaFromCfg?.label ||
    (code && version
      ? `Creative Commons ${
          CC_NAMES_SV[code] || code.toUpperCase()
        } ${version}${locale === "se" ? " Sverige" : ""}`
      : "Creative Commons-licens");

  const badgeSrc =
    metaFromCfg?.badge || (parsed && defaultBadge({ code, version, locale }));

  return (
    <div className="flex flex-col items-start justify-center gap-2 bg-gray-50 text-gray-700 rounded max-w-fit p-3 w-full lg:w-1/3 border border-solid border-gray-300">
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

      <span className="text-gray-700">Detta verk är licensierat under:</span>
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
