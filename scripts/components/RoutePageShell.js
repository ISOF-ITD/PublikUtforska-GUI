import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import {
  useEffect, useRef,
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import FolkeLogo from '../../img/folke-white.svg';
import headerBack from '../../img/header-back.gif';
import IsofLogoWhite from '../../img/logotyp-isof-vit.svg';
import { l } from '../lang/Lang';
import { createResultLocation } from '../utils/routeHelper';

export default function RoutePageShell({ children }) {
  const location = useLocation();
  const pageRef = useRef(null);
  const resultLocation = createResultLocation(
    location.pathname,
    location.search,
  );

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      pageRef.current?.scrollTo({ top: 0 });
      pageRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [location.pathname]);

  return (
    <section
      ref={pageRef}
      id="route-page-content"
      className="route-page fixed inset-0 z-[1600] overflow-y-auto overflow-x-hidden bg-surface pb-24 text-body print:static print:overflow-visible"
      tabIndex={-1}
    >
      <header
        className="z-[1700] bg-primary text-[var(--color-text-inverted)]"
        style={{
          backgroundImage: `var(--image-header-back-tint), url(${headerBack})`,
          backgroundPosition: 'center top',
        }}
      >
        <div className="mx-auto box-border flex min-h-16 w-full items-center gap-4 px-4 py-2 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img
              src={FolkeLogo}
              alt={l('Folkelogga')}
              className="h-10 w-auto shrink-0 object-contain"
            />
            <span aria-hidden className="h-6 w-px shrink-0 bg-white/30 max-[480px]:hidden" />
            <a
              href="https://www.isof.se"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-[480px]:hidden"
              aria-label={l('Öppna Institutet för språk och folkminnens webbplats i nytt fönster')}
            >
              <img
                src={IsofLogoWhite}
                alt={l('Institutet för språk och folkminnen')}
                className="h-10 w-auto shrink-0 object-contain"
              />
            </a>
          </div>
          <Link
            to={resultLocation}
            replace
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm px-1 py-2 !text-white underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white print:hidden"
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            <span>{l('Till sökresultaten')}</span>
          </Link>
        </div>
      </header>
      <div className="route-page-content mx-auto min-h-[calc(100vh-4rem)] w-full px-5 pb-8">
        {children}
      </div>
    </section>
  );
}

RoutePageShell.propTypes = {
  children: PropTypes.node.isRequired,
};
