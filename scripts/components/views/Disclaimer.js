import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

export default function Disclaimer({ showMeankieliDisclaimer = false }) {
  return (
    <aside
      role="note"
      aria-label="Information till läsaren"
      className=""
    >
      <div className="rounded-md px-4 py-3">
        {showMeankieliDisclaimer && (
          <div className="border-0 border-l-4 border-l-lighter-isof border-solid pl-3 mb-3">
            <p className="text-sm leading-6 text-darker-isof italic">
              <strong className="not-italic font-semibold">
                Information till läsaren:
              </strong>
              {' '}
              När insamlingarna gjordes hade meänkieli ännu inte fått status som
              ett eget minoritetsspråk, det skedde genom ett riksdagsbeslut år
              2000. Därför benämns det som idag kallas för meänkieli ofta som
              finska i accessionerna.
            </p>
          </div>
        )}
        <div className="border-0 border-l-4 border-l-lighter-isof border-solid pl-3 mb-3">
          <p className="text-sm leading-6 text-darker-isof italic">
            <strong className="not-italic font-semibold">
              Information till läsaren:
            </strong>
            {' '}
            Denna arkivhandling kan innehålla fördomar och språkbruk från en
            annan tid. Delar av Isofs äldre arkivmaterial kan vara svårt att
            närma sig och använda då det återspeglar det vi idag upplever som
            fördomsfulla synsätt och ett språkbruk som kan väcka anstöt.
            {' '}
            <a
              href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm text-isof font-medium underline underline-offset-4 decoration-isof hover:decoration-darker-isof focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 lg:whitespace-nowrap"
            >
              Läs mer om Fördomar och äldre språkbruk i samlingarna
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              <span className="sr-only">(öppnas i ny flik)</span>
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}

Disclaimer.propTypes = {
  showMeankieliDisclaimer: PropTypes.bool,
};
