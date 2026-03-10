import classNames from 'classnames';
import PropTypes from 'prop-types';
import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../lang/Lang';
import { IconButton } from '../IconButton';
import folkeWhiteLogo from '../../../img/folke-white.svg';
import IsofLogoWhite from '../../../img/Isof_logotyp_vit.png';

const baseRailClassName = 'absolute left-4 right-4 top-0 z-[3100] flex items-center justify-between lg:left-auto lg:right-8 lg:justify-start lg:items-start';
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

  return (
    <div className={classNames(baseRailClassName, className)}>
      <img
        src={folkeWhiteLogo}
        alt={l('Folkelogga')}
        className="h-8 w-auto pt-2 md:pt-1 lg:hidden"
      />
      <div className="flex items-start gap-2">
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
