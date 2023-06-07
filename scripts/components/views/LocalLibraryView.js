import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import PropTypes from 'prop-types';
import config from '../../config';

// TODO: enter correct paths
import DropdownMenu from '../../../ISOF-React-modules/components/controls/DropdownMenu';
import ShareButton from '../../../ISOF-React-modules/components/controls/ShareButtons';
import ElementNotificationMessage from '../../../ISOF-React-modules/components/controls/ElementNotificationMessage';

import localLibrary from '../../../ISOF-React-modules/utils/localLibrary';

import clipboard from '../../../ISOF-React-modules/utils/clipboard';

// Main CSS: ui-components/local-library.less

export default function LocalLibraryView({ headerText }) {
  LocalLibraryView.propTypes = {
    headerText: PropTypes.string,
  };

  LocalLibraryView.defaultProps = {
    headerText: 'Mina sparade uppteckningar',
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const savedRecords = useRef([]);
  const shareButtonsRef = useRef();
  const elementNotificationRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (savedRecords.current.length === 0 && localLibrary.list().length > 0 && elementNotificationRef.current) {
      elementNotificationRef.current.show();
    }

    savedRecords.current = localLibrary.list();
  }, []);

  const itemClickHandler = (event) => {
    event.stopPropagation();
    navigate(`/places/${event.currentTarget.dataset.id}`);
  };

  const dropdownOpenHandler = () => {
    setDropdownOpen(true);
    shareButtonsRef.current.initialize();
  };

  const itemRemoveButtonClickHander = (event) => {
    event.stopPropagation();
    localLibrary.remove(event.currentTarget.dataset.id);
    // To refresh the component
    savedRecords.current = [...savedRecords.current];
  };

  const copyLinkClickHandler = (event) => {
    if (clipboard.copy(event.currentTarget.dataset.url)) {
      if (window.eventBus) {
        window.eventBus.dispatch('popup-notification.notify', null, l('Länk till dina sägner har kopierats.'));
      }
    }
  };

  const items = savedRecords.current && savedRecords.current.length > 0 ? savedRecords.current.map((item, index) => (
    <a key={index} data-id={item.id} onClick={itemClickHandler} className="item">
      {item.title}
      <div title="stäng" className="close-button" data-id={item.id} onClick={itemRemoveButtonClickHander} />
      {item.place && <span className="u-pull-right">{item.place}</span>}
    </a>
  )) : <h3 className="text-center">{l('Inga sparade sägner')}</h3>;

  const legendIds = savedRecords.current.map((item) => item.id).join(',');
  const shareLink = `places/record_ids/${legendIds}`;

  const footerContent = (
    <div className="drowdown-footer">
      <ShareButton ref={shareButtonsRef} hideLink manualInit path={`${config.siteUrl}#/${shareLink}`} text={l('Några intressanta sägner på sägenkartan: ')} />
      <a className="u-pull-right u-cursor-pointer" onClick={copyLinkClickHandler} data-url={`${config.siteUrl}#/${shareLink}`}>{l('Kopiera länk')}</a>
    </div>
  );

  return (
    <div className="local-library-wrapper map-bottom-control">
      <ElementNotificationMessage
        ref={elementNotificationRef}
        placement="above"
        placementOffsetX="27"
        placementOffsetY="-62"
        messageId="myLegendsNotification"
        forgetAfterClick
        manuallyOpen
        closeTrigger="click"
        message={l('Klicka här för att visa lista över dina sparade sägner.')}
      >
        <DropdownMenu
          className={`map-floating-control map-floating-button visible library-open-button has-footer${savedRecords.current && savedRecords.current.length > 0 ? ' has-items' : ''}`}
          dropdownDirection="up"
          height="500px"
          footerContent={footerContent}
          headerText={headerText}
          onOpen={dropdownOpenHandler}
        >
          {items}
        </DropdownMenu>
      </ElementNotificationMessage>
    </div>
  );
}
