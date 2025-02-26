import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import logoIsof from '../../img/logotyp-isof.svg';

export default function Footer() {
  return (
    <footer>
      <div className="logo">

        <div id="portal" className="isof-app-footer">
          {/* Om Folke behövs inte längre, eftersom vi har kontext-fönstret nu */}
          {/* <a
            href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke"
            target="_blank"
            className="normal"
            style={{ display: 'block' }}
            rel="noreferrer"
          >
            Om Folke
            &nbsp;
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a> */}
          <a href="https://www.isof.se/">
            {/* Institutet för språk och folkminnen */}
            <img
              src={logoIsof}
              alt="Institutet för språk och folkminnen"
              width="116"
              height="80"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
