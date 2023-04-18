import LocalLibraryView from '../../ISOF-React-modules/components/views/LocalLibraryView';
import TranscribeButton from '../../ISOF-React-modules/components/views/TranscribeButton';

export default function MapBottomWrapper() {
  return (
    <div className="map-bottom-wrapper">
      <div className="popup-wrapper">
        <TranscribeButton
          className="popup-open-button map-bottom-control map-floating-control visible"
          label={l('Skriv av slumpmässig uppteckning')}
          random
        />
      </div>
      <div className="popup-wrapper">
        <LocalLibraryView
          headerText={l('Mina sägner')}
        />
      </div>
    </div>
  );
}
