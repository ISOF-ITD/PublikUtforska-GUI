import logoIsof from '../../img/logotyp-isof.svg';

export default function Footer() {
  const isofHomepageLabel = 'Institutet for sprak och folkminnen - hemsida';

  return (
    <aside
      aria-label="ISOF lank"
      className="absolute top-5 right-0 lg:right-2.5 z-[1000] pointer-events-auto hidden md:block"
    >
      <div className="p-2 bg-neutral-50 bg-opacity-85">
        <a
          href="https://www.isof.se/"
          aria-label={isofHomepageLabel}
          rel="noopener noreferrer"
          title={isofHomepageLabel}
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
    </aside>
  );
}
