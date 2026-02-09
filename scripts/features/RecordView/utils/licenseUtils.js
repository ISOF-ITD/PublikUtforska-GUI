import config from "../../../config";
import { getArchiveName, getPages } from "../../../utils/helpers";

export function buildCitation(data) {
  const {
    archive: { archive_id_display_search: archiveIdDisplaySearch, archive_org: archiveOrg },
  } = data;

  const pages = getPages(data);
  const idHuman = archiveIdDisplaySearch.join(", ");
  const orgName = getArchiveName(archiveOrg);

  // Example: "A123:45, s. 12–14, Arkivnamn"
  return `${idHuman}${pages ? `, s. ${pages}` : ""}, ${orgName}`;
}

export const DEFAULT_LICENSE =
  "https://creativecommons.org/licenses/by-nd/2.5/se/";

// Map CC codes to Swedish names (used if `label` is missing)
export const CC_NAMES_SV = {
  by: "Erkännande",
  "by-sa": "Erkännande–Dela lika",
  "by-nd": "Erkännande–Inga bearbetningar",
  "by-nc": "Erkännande–Icke-kommersiell",
  "by-nc-sa": "Erkännande–Icke-kommersiell–Dela lika",
  "by-nc-nd": "Erkännande–Icke-kommersiell–Inga bearbetningar",
};

// derive metadata from a CC URL like
// https://creativecommons.org/licenses/by-nd/2.5/se/
export function parseCcUrl(url) {
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

export function defaultBadge({ code, version, locale }) {
  if (!code || !version || !locale) return null;
  return `https://i.creativecommons.org/l/${code}/${version}/${locale}/88x31.png`;
}

/**
 * Centralized license resolution.
 *
 * Returns an object like:
 *   - { type: "html", html, licenseUrl }
 *   - { type: "cc", licenseUrl, label, badgeSrc }
 */
export function resolveLicense(data) {
  const licenseUrl = data?.copyrightlicense || DEFAULT_LICENSE;
  const cfg = config.siteOptions?.copyrightContent?.[licenseUrl];

  // Case 1: Config supplies raw HTML
  if (typeof cfg === "string" && cfg.trim().startsWith("<")) {
    return {
      type: "html",
      html: cfg,
      licenseUrl,
    };
  }

  // Case 2: Config / URL-based CC data
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

  return {
    type: "cc",
    licenseUrl,
    label,
    badgeSrc,
  };
}
