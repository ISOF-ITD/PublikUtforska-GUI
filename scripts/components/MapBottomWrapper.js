// import LocalLibraryView from './views/LocalLibraryView';
import TranscribeButton from './views/TranscribeButton';
import { l } from '../lang/Lang';

export default function MapBottomWrapper() {
  return (
    <div className="map-bottom-wrapper">
      <div className="popup-wrapper">
        <TranscribeButton
          className="button popup-open-button map-bottom-control map-floating-control visible"
          label={l('Skriv av slumpmässig uppteckning')}
          random
        />
      </div>
      {/* not working at the moment */}
      {/* <div className="popup-wrapper">
        <LocalLibraryView
          headerText={l('Mina sägner')}
        />
      </div> */}
    </div>
  );
}
