import classNames from 'classnames';
import PropTypes from 'prop-types';
import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { l } from '../../lang/Lang';
import { IconButton } from '../IconButton';

const baseRailClassName = 'absolute right-8 top-0 z-[3100] flex items-start gap-2';
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
  );
}

HeaderActions.propTypes = {
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  closeTone: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
};
