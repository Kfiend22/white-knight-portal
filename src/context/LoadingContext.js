import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

// Create the context
const LoadingContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

// Create a provider component
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Use a ref to track the number of active loading requests
  const loadingCounter = useRef(0);

  const startLoading = useCallback(() => {
    loadingCounter.current += 1;
    // Use a timeout to avoid flickering if loading starts and stops very quickly
    const timerId = setTimeout(() => {
      if (loadingCounter.current > 0) {
        setIsLoading(true);
      }
    }, 100); // Small delay before showing spinner

    // Return a function to clear the timeout if stopLoading is called before it fires
    return () => clearTimeout(timerId);
  }, []);

  const stopLoading = useCallback((clearTimeoutFunc) => {
    // Clear the timeout if it hasn't fired yet
    if (clearTimeoutFunc) {
      clearTimeoutFunc();
    }

    if (loadingCounter.current > 0) {
      loadingCounter.current -= 1;
    }

    if (loadingCounter.current === 0) {
      setIsLoading(false);
    }
  }, []);

  // More robust start/stop pair to handle the timeout clearing
  const requestLoading = useCallback(() => {
    const clearTimeoutFunc = startLoading();
    return () => stopLoading(clearTimeoutFunc);
  }, [startLoading, stopLoading]);


  const value = { isLoading, startLoading: requestLoading }; // Expose the paired function

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Create a custom hook to use the loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
