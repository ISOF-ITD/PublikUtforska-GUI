import { createContext, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

export const NavigationContext = createContext([]);

function NavigationContextProvider({ children }) {
  NavigationContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const [navigationHistory, setNavigationHistory] = useState([]);

  const previousNavigation = navigationHistory[navigationHistory.length - 2];

  const addToNavigationHistory = (type, id) => {
    setNavigationHistory([...navigationHistory, { type, id }]);
  };

  const removeLatestFromNavigationHistory = () => {
    setNavigationHistory(navigationHistory.slice(0, -2));
  };

  const clearNavigationHistory = () => {
    setNavigationHistory([]);
  };

  const memo = useMemo(() => ({
    previousNavigation,
    addToNavigationHistory,
    removeLatestFromNavigationHistory,
    clearNavigationHistory,
  }), [navigationHistory]);

  return (
    <NavigationContext.Provider value={memo}>
      {children}
    </NavigationContext.Provider>
  );
}

export default NavigationContextProvider;
