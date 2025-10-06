import { createContext, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

export const NavigationContext = createContext({
  previousNavigation: null,
  addToNavigationHistory: () => {},
  removeLatestFromNavigationHistory: () => {},
  clearNavigationHistory: () => {},
});

function NavigationContextProvider({ children }) {
  NavigationContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const [navigationHistory, setNavigationHistory] = useState([]);

  const previousNavigation = navigationHistory.length >= 2
    ? navigationHistory[navigationHistory.length - 2]
    : null;

  const addToNavigationHistory = (path) => {
    setNavigationHistory((prev) => [...prev, path]);
  };

  const removeLatestFromNavigationHistory = () => {
    setNavigationHistory((prev) => prev.slice(0, -2));
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
