import React from 'react';

// Main CSS: ui-components/poupwindow.less

export default class RoutePopupWindow extends React.Component {
  constructor(props) {
    super(props);

    this.closeButtonClick = this.closeButtonClick.bind(this);
    this.closeButtonKeyUp = this.closeButtonKeyUp.bind(this);
    this.openButtonClickHandler = this.openButtonClickHandler.bind(this);
    this.openButtonKeyUpHandler = this.openButtonKeyUpHandler.bind(this);
    this.languageChangedHandler = this.languageChangedHandler.bind(this);
    this.showRoutePopup = this.showRoutePopup.bind(this);

    this.state = {
      windowOpen: false,
      manualOpen: false,
    };
  }

  closeButtonKeyUp(event) {
    if (event.keyCode == 13) {
      this.closeButtonClick(event);
    }
  }

  closeButtonClick() {
    const { onClose, children, manuallyOpenPopup } = this.props;
    if (children.props.manuallyOpenPopup || manuallyOpenPopup) {
      this.setState({
        windowOpen: false,
        manualOpen: false,
      });
    } else if (onClose) {
      // TODO: turn this component into a functional component
      // and use the useLocation hook instead of this:
      onClose(location);
    }
  }

  openButtonKeyUpHandler(event) {
    if (event.keyCode === 13) {
      this.openButtonClickHandler(event);
    }
  }

  openButtonClickHandler() {
    this.setState({
      windowOpen: true,
      manualOpen: true,
    });
  }

  languageChangedHandler() {
    this.forceUpdate();
  }

  showRoutePopup() {
    this.setState({
      windowOpen: false,
      manualOpen: true,
    });
  }

  componentDidMount() {
    if (window.eventBus) {
      window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler);
      window.eventBus.addEventListener('routePopup.show', this.showRoutePopup);
    }

    const { manuallyOpenPopup } = this.props;

    this.setState({
      windowOpen: !manuallyOpenPopup,
    });
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    const { children, disableAutoScrolling } = this.props;
    this.setState({
      windowOpen: Boolean(newProps.children) && !newProps.children.props.manuallyOpenPopup,
    });

    if (!newProps.children === children && !disableAutoScrolling) {
      this.refs.contentWrapper.scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    const { onHide } = this.props;
    if (window.eventBus) {
      window.eventBus.removeEventListener('Lang.setCurrentLang', this.languageChangedHandler);
    }
    if (onHide) {
      onHide();
    }
    if (window.eventBus) {
      window.eventBus.dispatch('popup.close');
    }
  }

  render() {
    const {
      closeButtonClick,
      closeButtonKeyUp,
      state: {
        windowOpen,
        manualOpen,
      },
      props: {
        children,
        closeButtonStyle,
        onShow,
        onHide,
      },
    } = this;

    if (windowOpen || manualOpen) {
      if (onShow) {
        onShow();
      }
      if (window.eventBus) {
        setTimeout(() => {
          window.eventBus.dispatch('popup.open');
        }, 100);
      }
    } else {
      if (onHide) {
        onHide();
      }
      if (window.eventBus) {
        setTimeout(() => {
          window.eventBus.dispatch('popup.close');
        }, 100);
      }
    }

    if (windowOpen || manualOpen) {
      // TODO: do we want to render the popup even if it's not visible?
      return (
        <div className={`popup-wrapper${windowOpen || manualOpen ? ' visible' : ''}`}>
          {
          // this.props.children && this.props.children.props.manuallyOpenPopup &&
					// <a className="popup-open-button map-floating-control map-bottom-control visible" onClick={this.openButtonClickHandler} onKeyUp={this.openButtonKeyUpHandler} tabIndex={0}><strong>{l(this.props.children.props.openButtonLabel)}</strong></a>
				}
          <div ref="contentWrapper" className="popup-content-wrapper">
            <div className="page-content">
              <a tabIndex={0} className={`close-button${closeButtonStyle == 'dark' ? '' : closeButtonStyle == 'white' ? ' white' : ' white'}`} onClick={closeButtonClick} onKeyUp={closeButtonKeyUp} />
              {children}
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}
