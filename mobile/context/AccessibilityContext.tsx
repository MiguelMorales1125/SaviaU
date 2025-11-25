import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AccessibilityContextType {
  grayscaleMode: boolean;
  toggleGrayscale: () => void;
  textScale: number;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  getScaledSize: (baseSize: number) => number;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  grayscaleMode: false,
  toggleGrayscale: () => {},
  textScale: 1,
  increaseTextSize: () => {},
  decreaseTextSize: () => {},
  resetTextSize: () => {},
  getScaledSize: (size: number) => size,
});

export const useAccessibility = () => useContext(AccessibilityContext);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [textScale, setTextScale] = useState(1);

  // Cargar preferencias guardadas
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedGrayscale = window.localStorage.getItem('accessibility_grayscale');
        const savedTextScale = window.localStorage.getItem('accessibility_textScale');
        
        if (savedGrayscale === 'true') setGrayscaleMode(true);
        if (savedTextScale) {
          const scale = parseFloat(savedTextScale);
          if (!isNaN(scale) && scale >= 0.8 && scale <= 1.5) {
            setTextScale(scale);
          }
        }
      }
    } catch (e) {
      console.error('Error loading accessibility preferences:', e);
    }
  }, []);

  const toggleGrayscale = () => {
    const newValue = !grayscaleMode;
    setGrayscaleMode(newValue);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('accessibility_grayscale', String(newValue));
      }
    } catch (e) {
      console.error('Error saving grayscale preference:', e);
    }
  };

  const increaseTextSize = () => {
    const newScale = Math.min(textScale + 0.1, 1.5);
    setTextScale(newScale);
    saveTextScale(newScale);
  };

  const decreaseTextSize = () => {
    const newScale = Math.max(textScale - 0.1, 0.8);
    setTextScale(newScale);
    saveTextScale(newScale);
  };

  const resetTextSize = () => {
    setTextScale(1);
    saveTextScale(1);
  };

  const saveTextScale = (scale: number) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('accessibility_textScale', String(scale));
      }
    } catch (e) {
      console.error('Error saving text scale preference:', e);
    }
  };

  const getScaledSize = (baseSize: number) => {
    return Math.round(baseSize * textScale);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        grayscaleMode,
        toggleGrayscale,
        textScale,
        increaseTextSize,
        decreaseTextSize,
        resetTextSize,
        getScaledSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
