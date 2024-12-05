import { Component } from 'react';
import { l } from '../../lang/Lang';

export default class SwitcherHelpTextOverlay extends Component {
  constructor(props) {
    // console.log('ContributeinfoOverlay');
    // debugger;
    super(props);

    this.closeButtonClickHandler = this.closeButtonClickHandler.bind(this);

    this.state = {
      visible: false,
    };

    if (window.eventBus) {
      window.eventBus.addEventListener('overlay.similarRecordsHelpText', (event) => {
        this.setState({
          visible: true,
          title: 'Title',
        });
      });
      window.eventBus.addEventListener('overlay.hide', (event) => {
        this.setState({
          visible: false,
        });
      });
    }
  }

  closeButtonClickHandler() {
    this.setState({
      visible: false,
    });
  }

  render() {
    const overlayContent = (
      <div>
        <p><strong>Liknande uppteckningar genereras genom att analysera innehållet i den valda uppteckningen och identifiera andra uppteckningar med liknande ord och teman.</strong></p>
        <p>
          När en uppteckning visas analyseras dess innehåll noggrant för att identifiera viktiga nyckelord och teman. Dessa identifierade element används sedan för
          att söka igenom databasen och hitta andra uppteckningar som delar liknande ämnen eller termer. Resultatet är en lista med uppteckningar som är relevanta och relaterade
          till den ursprungliga uppteckningen, vilket underlättar utforskning av liknande innehåll.
        </p>
      </div>
    );

    return (
      <div className={`overlay-container feedback-overlay-container${this.state.visible ? ' visible' : ''}`}>
        <div className="overlay-window">

          <div className="overlay-header">
            {l('Hur "Liknande uppteckningar" tas fram')}
            <button title="stäng" className="close-button white" onClick={this.closeButtonClickHandler} />
          </div>

          {overlayContent}

        </div>
      </div>
    );
  }
}
