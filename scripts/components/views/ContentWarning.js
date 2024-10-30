import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

export default function ContentWarning() {
  return (
    <div className="row">
      <div className="ten columns content-warning">
        <small>
          <i>
            <b>Information till läsaren:</b>
            &nbsp;
            Denna arkivhandling kan innehålla fördomar och ett
            språkbruk som speglar värderingar från en annan tid.
            Vissa delar av Isofs äldre arkivmaterial kan vara utmanande
            att ta del av och använda, eftersom det återspeglar
            synsätt och uttryckssätt som inte är vanliga i dagens samhälle.
            {' '}
            <a href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna" target="_blank" rel="noreferrer">
              Läs mer om Fördomar och äldre språkbruk i våra samlingar.
              &nbsp;
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </a>
          </i>
        </small>
      </div>
    </div>
  );
}
