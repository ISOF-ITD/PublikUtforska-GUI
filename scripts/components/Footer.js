import logoIsof from "../../img/logotyp-isof.svg";

export default function Footer() {
  return (
    <footer role="contentinfo">
      <div className="logo">
        <div className="p-2 bg-neutral-50 bg-opacity-85">
          <a
            href="https://www.isof.se/"
            aria-label="Institutet för språk och folkminnen – hemsida"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              src={logoIsof}
              alt="Isof"
              className="w-28 block h-auto"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
