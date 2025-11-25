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

  // Aplicar filtro de grises al body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (grayscaleMode) {
        document.documentElement.style.filter = 'grayscale(1)';
      } else {
        document.documentElement.style.filter = 'none';
      }
    }
  }, [grayscaleMode]);

  // Aplicar escala de texto al body usando zoom y transform para mejor compatibilidad
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      
      // Método 1: Cambiar el tamaño base de fuente (más semántico)
      root.style.fontSize = `${textScale * 100}%`;
      
      // Método 2: Añadir clase CSS personalizada para mayor control
      const styleId = 'accessibility-text-scale';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      // Aplicar estilos CSS globales con escalado
      styleElement.textContent = `
        * {
          --text-scale: ${textScale};
        }
        
        body, body * {
          font-size: calc(1rem * var(--text-scale)) !important;
        }
        
        /* Mantener tamaños relativos de headings */
        h1 { font-size: calc(2rem * var(--text-scale)) !important; }
        h2 { font-size: calc(1.5rem * var(--text-scale)) !important; }
        h3 { font-size: calc(1.25rem * var(--text-scale)) !important; }
        h4 { font-size: calc(1.125rem * var(--text-scale)) !important; }
        h5 { font-size: calc(1rem * var(--text-scale)) !important; }
        h6 { font-size: calc(0.875rem * var(--text-scale)) !important; }
        
        /* Textos pequeños */
        small, .text-sm { font-size: calc(0.875rem * var(--text-scale)) !important; }
        .text-xs { font-size: calc(0.75rem * var(--text-scale)) !important; }
        
        /* Textos grandes */
        .text-lg { font-size: calc(1.125rem * var(--text-scale)) !important; }
        .text-xl { font-size: calc(1.25rem * var(--text-scale)) !important; }
        .text-2xl { font-size: calc(1.5rem * var(--text-scale)) !important; }
        .text-3xl { font-size: calc(1.875rem * var(--text-scale)) !important; }
        .text-4xl { font-size: calc(2.25rem * var(--text-scale)) !important; }
      `;
    }
  }, [textScale]);

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
