import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreativeCommons,
  faCreativeCommonsBy,
  faCreativeCommonsNc,
  faCreativeCommonsNd,
  faCreativeCommonsSa,
} from '@fortawesome/free-brands-svg-icons';
import { resolveLicense } from '../utils/licenseUtils';

const CC_BADGE_ICONS = {
  cc: faCreativeCommons,
  by: faCreativeCommonsBy,
  nc: faCreativeCommonsNc,
  nd: faCreativeCommonsNd,
  sa: faCreativeCommonsSa,
};

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
  const {
    licenseUrl,
    badgeIconKeys,
    badgeText,
    label,
  } = license;
  const badgeIcons = badgeIconKeys
    .map((key) => CC_BADGE_ICONS[key])
    .filter(Boolean);

  return (
    <div
      className={`flex flex-col items-start justify-center gap-2 bg-surface-muted text-body rounded max-w-full p-3 border border-solid border-border ${className}`}
    >
      {badgeIcons.length ? (
        <a
          href={licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 !text-body font-bold leading-none no-underline hover:!text-body hover:no-underline visited:!text-body"
          aria-label={`Öppna licens: ${label}`}
        >
          {badgeIcons.map((icon) => (
            <FontAwesomeIcon
              key={icon.iconName}
              icon={icon}
              aria-hidden="true"
            />
          ))}
          {badgeText ? (
            <span className="ml-2">{badgeText}</span>
          ) : null}
        </a>
      ) : null}

      <span className="text-body">Detta verk är licensierat under:</span>
      <a
        href={licenseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="!text-body underline hover:!text-body hover:no-underline visited:!text-body"
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
