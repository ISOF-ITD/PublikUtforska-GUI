import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

export default function Disclaimer() {
  return (
    <div className="row">
      <div className="eleven columns disclaimer">
        <small>
          <i>
            <b>Information till läsaren:</b>
            {' '}
            Denna arkivhandling kan innehålla fördomar och språkbruk från en annan tid.
            Delar av Isofs äldre arkivmaterial kan vara svårt att närma sig och använda
            då det återspeglar det vi idag upplever som fördomsfulla synsätt och ett
            språkbruk som kan väcka anstöt.
            {' '}
            <a
              href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna"
              target="_blank"
              rel="noreferrer"
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              Läs mer om Fördomar och äldre språkbruk i samlingarna.
              &nbsp;
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </a>
          </i>
        </small>
      </div>
    </div>
  );
}
