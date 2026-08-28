/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';
import contactButtonClassName from './contactButtonClassName';

const inlineButtonClassName = [
  'm-0 inline-flex min-h-11 items-center rounded-md border border-border',
  'bg-surface px-4 py-2 font-semibold text-body shadow-sm',
  'hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
].join(' ');

export default function ContributeInfoButton({
  title = '',
  type,
  country = undefined,
  id = undefined,
  variant = 'header',
}) {
  const { pathname } = useLocation();

  const contributeinfoButtonClick = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.contributeinfo', {
        url: `${config.siteUrl}${pathname}`,
        title,
        type,
        country,
        appUrl: config.appUrl,
        id,
      });
    }
  };

  return (
    <button
      className={variant === 'inline' ? inlineButtonClassName : contactButtonClassName}
      onClick={contributeinfoButtonClick}
      type="button"
      aria-haspopup="dialog"
    >
      {l('Komplettera eller rätta en uppgift, ställ en fråga eller lämna en synpunkt.')}
    </button>
  );
}

ContributeInfoButton.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
  country: PropTypes.string,
  id: PropTypes.string,
  variant: PropTypes.oneOf(['header', 'inline']),
};
