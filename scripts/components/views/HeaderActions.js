import classNames from 'classnames';
import PropTypes from 'prop-types';
import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../lang/Lang';
import { IconButton } from '../IconButton';
import folkeWhiteLogo from '../../../img/folke-white.svg';
import IsofLogoWhite from '../../../img/logotyp-isof-vit.svg';

const baseRailClassName = 'absolute left-4 right-4 top-0 z-[3100] flex items-center justify-between pt-2 lg:left-auto lg:right-8 lg:justify-start lg:items-start';
const backSlotClassName = 'h-6 w-6 flex items-start justify-center';

export default function HeaderActions({
  showBack = false,
  onBack,
  onClose,
  closeTone = 'light',
  className,
}) {
  const lightFocusClassName = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  const closeFocusClassName = closeTone === 'dark'
    ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'
    : lightFocusClassName;
  const mobileLogoGroup = (
    <div className="flex min-w-0 flex-1 items-center gap-2 pt-2 md:pt-1 lg:hidden">
      <img
        src={folkeWhiteLogo}
        alt={l('Folkelogga')}
        className="h-12 w-auto shrink-0 object-contain"
      />
      <span aria-hidden className="h-6 w-px shrink-0 bg-white/30" />
      <a
        href="https://www.isof.se"
        target="_blank"
        rel="noopener noreferrer"
        className={classNames(
          'inline-flex min-w-0 items-center rounded-sm',
          lightFocusClassName,
        )}
        aria-label={l('\u00d6ppna Institutet f\u00f6r spr\u00e5k och folkminnens webbplats i nytt f\u00f6nster')}
        title={l('Institutet f\u00f6r spr\u00e5k och folkminnen')}
      >
        <img
          src={IsofLogoWhite}
          alt={l('Institutet f\u00f6r spr\u00e5k och folkminnen')}
          className="h-12 w-auto shrink-0 object-contain"
        />
      </a>
    </div>
  );

  return (
    <div className={classNames(baseRailClassName, className)}>
      {mobileLogoGroup}
      <div className="ml-auto flex shrink-0 items-start gap-2">
        <div className={backSlotClassName}>
          {showBack && (
            <IconButton
              icon={faArrowLeft}
              label={l('G\u00e5 tillbaka')}
              tone="light"
              onClick={onBack}
              size="sm"
              className={classNames('!mt-0', lightFocusClassName)}
              data-route-popup-header-action="back"
            />
          )}
        </div>
        <IconButton
          icon={faXmark}
          label={l('St\u00e4ng')}
          tone={closeTone}
          onClick={onClose}
          size="sm"
          className={classNames('!mt-0', closeFocusClassName)}
          data-route-popup-header-action="close"
        />
      </div>
    </div>
  );
}

HeaderActions.propTypes = {
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  closeTone: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
};
