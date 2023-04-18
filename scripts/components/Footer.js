import folkelogga from '../../img/folkelogga.svg';

export default function Footer() {
  return (
    <footer>
      <div className="logo">
        <div id="Logo" className="isof-app-header">
          <a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke">
            <img
              alt="Folke på Institutet för språk och folkminnen"
              className="sv-noborder"
              style={{ maxWidth: 326, maxHeight: 50 }}
              src={folkelogga}
            />
          </a>
        </div>
        <div id="portal" className="isof-app-header">
          <a
            href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke"
            target="_blank"
            className="normal"
            style={{ display: 'block' }}
            rel="noreferrer"
          >
            Om Folke
          </a>
        </div>
      </div>
    </footer>
  );
}
