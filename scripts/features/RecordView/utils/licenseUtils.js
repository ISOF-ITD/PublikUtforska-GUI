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

export const DEFAULT_LICENSE = 'https://creativecommons.org/licenses/by/4.0/deed.sv';

// Map CC codes to Swedish names (used if `label` is missing)
export const CC_NAMES_SV = {
  by: 'Erkännande',
  'by-sa': 'Erkännande–Dela lika',
  'by-nd': 'Erkännande–Inga bearbetningar',
  'by-nc': 'Erkännande–Icke-kommersiell',
  'by-nc-sa': 'Erkännande–Icke-kommersiell–Dela lika',
  'by-nc-nd': 'Erkännande–Icke-kommersiell–Inga bearbetningar',
};

export function getCcIconKeys(code) {
  return code ? ['cc', ...code.split('-')] : [];
}

export function getCcBadgeText(code, version) {
  return code && version ? `CC ${code.toUpperCase()} ${version}` : null;
}

export function getLicenseConfig(licenseUrl) {
  const copyrightContent = config.siteOptions?.copyrightContent || {};
  const licenseUrlWithTrailingSlash = licenseUrl.endsWith('/')
    ? licenseUrl
    : `${licenseUrl}/`;

  return copyrightContent[licenseUrl] || copyrightContent[licenseUrlWithTrailingSlash];
}

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

/**
 * Centralized license resolution.
 *
 * Returns an object like:
 *   - { type: "html", html, licenseUrl }
 *   - { type: "cc", licenseUrl, label, badgeIconKeys, badgeText }
 */
export function resolveLicense(data) {
  const licenseUrl = data?.copyrightlicense || DEFAULT_LICENSE;
  const cfg = getLicenseConfig(licenseUrl);

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

  const label = metaFromCfg?.label
    || (code && version
      ? `Creative Commons ${
        CC_NAMES_SV[code] || code.toUpperCase()
      } ${version}${locale === 'se' ? ' Sverige' : ''}`
      : 'Creative Commons-licens');

  return {
    type: "cc",
    licenseUrl,
    label,
    badgeIconKeys: getCcIconKeys(code),
    badgeText: getCcBadgeText(code, version),
  };
}
