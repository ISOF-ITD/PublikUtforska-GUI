/* eslint-disable react/require-default-props */
import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

function DropdownMenu({
  manuallyClose = false,
  onOpen = null,
  dropdownHeight = '',
  dropdownWidth = '',
  dropdownDirection = '',
  className = '',
  label = '',
  keepOpen = false,
  headerText = '',
  containerType = '',
  footerContent = '',
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  const menuButtonClick = useCallback(() => {
    setMenuOpen((prevMenuOpen) => !prevMenuOpen, () => {
      if (menuOpen && onOpen) {
        onOpen();
      }
    });
  }, [menuOpen, onOpen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const windowClickHandler = useCallback((event) => {
    const componentEl = ReactDOM.findDOMNode(containerRef.current);
    if (!!componentEl && !componentEl.contains(event.target)) {
      closeMenu();
    }
  }, [closeMenu]);

  useEffect(() => {
    if (!manuallyClose) {
      document.getElementById('app').addEventListener('click', windowClickHandler);
    }
    return () => {
      document.getElementById('app').removeEventListener('click', windowClickHandler);
    };
  }, [manuallyClose, windowClickHandler]);

  const dropdownStyle = {};

  if (dropdownHeight) {
    dropdownStyle.height = dropdownHeight.indexOf('px') === -1 ? `${dropdownHeight}px` : dropdownHeight;
    dropdownStyle.maxHeight = dropdownHeight.indexOf('px') === -1 ? `${dropdownHeight}px` : dropdownHeight;
  }

  if (dropdownWidth) {
    dropdownStyle.width = dropdownWidth.indexOf('px') === -1 ? `${dropdownWidth}px` : dropdownWidth;
  }

  return (
    <div ref={containerRef} className={`dropdown-wrapper${dropdownDirection ? ` dropdown-direction-${dropdownDirection}` : ''}`}>
      <a tabIndex={0} className={`dropdown-link${className ? ` ${className}` : ''}`} onClick={menuButtonClick}>{label || ''}</a>
      <div
        className={`dropdown-container minimal-scrollbar dropdown-list${menuOpen || keepOpen ? ' open' : ''}${headerText ? ' has-header' : ''}${footerContent ? ' has-footer' : ''}`}
        style={dropdownStyle}
      >
        {
          headerText
          && (
          <div className="panel-heading dropdown-heading">
            <span className="heading-label">{headerText}</span>
          </div>
          )
        }
        <div className={`${containerType === 'text' ? 'text-container' : 'list-container'} minimal-scrollbar`}>
          {children}
        </div>
        {
          footerContent
          && (
          <div className="dropdown-footer">
            {footerContent}
          </div>
          )
        }
      </div>
    </div>
  );
}

DropdownMenu.propTypes = {
  manuallyClose: PropTypes.bool,
  onOpen: PropTypes.func,
  dropdownHeight: PropTypes.string,
  dropdownWidth: PropTypes.string,
  dropdownDirection: PropTypes.string,
  className: PropTypes.string,
  label: PropTypes.string,
  keepOpen: PropTypes.bool,
  headerText: PropTypes.string,
  containerType: PropTypes.string,
  footerContent: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default DropdownMenu;
