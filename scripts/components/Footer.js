import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import logoIsof from '../../img/logotyp-isof.svg';

export default function Footer() {
  return (
    <footer>
      <div className="logo">

        <div id="portal" className="isof-app-footer">
          <a
            href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke"
            target="_blank"
            className="normal"
            style={{ display: 'block' }}
            rel="noreferrer"
          >
            Om Folke
            &nbsp;
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        </div>
        <div id="Logo" className="isof-app-footer">
          <a href="https://www.isof.se/">
            {/* Institutet för språk och folkminnen */}
            <img
              src={logoIsof}
              alt="Institutet för språk och folkminnen"
              style={{
                background: '#005462',
                padding: '0.5rem',
              }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
