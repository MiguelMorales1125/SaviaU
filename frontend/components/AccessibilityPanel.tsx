import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    grayscaleMode,
    toggleGrayscale,
    textScale,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize,
  } = useAccessibility();

  const openScreenReader = () => {
    window.open('https://www.convertic.gov.co/641/w3-propertyvalue-15339.html', '_blank');
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="accessibility-button"
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
          <path d="M12 10v7" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 14l4-2 4 2" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Panel lateral */}
      {isOpen && (
        <>
          <div className="accessibility-overlay" onClick={() => setIsOpen(false)} />
          <div className="accessibility-panel">
            <div className="panel-header">
              <h2>Accesibilidad</h2>
              <button onClick={() => setIsOpen(false)} className="close-btn" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="panel-content">
              {/* Modo Escala de Grises */}
              <div className="option-card">
                <div className="option-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path d="M12 2v20" strokeWidth="2"/>
                  </svg>
                  <h3>Modo Escala de Grises</h3>
                </div>
                <p>Reduce la saturación de colores para facilitar la lectura</p>
                <button
                  onClick={toggleGrayscale}
                  className={`toggle-button ${grayscaleMode ? 'active' : ''}`}
                >
                  {grayscaleMode ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* Control de Tamaño de Texto */}
              <div className="option-card">
                <div className="option-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h3>Tamaño de Texto</h3>
                </div>
                <p>Actual: {Math.round(textScale * 100)}%</p>
                <div className="text-size-controls">
                  <button
                    onClick={decreaseTextSize}
                    disabled={textScale <= 0.8}
                    className="size-button"
                    aria-label="Reducir tamaño de texto"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Reducir</span>
                  </button>

                  <button onClick={resetTextSize} className="reset-button">
                    Restablecer
                  </button>

                  <button
                    onClick={increaseTextSize}
                    disabled={textScale >= 1.5}
                    className="size-button"
                    aria-label="Aumentar tamaño de texto"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Aumentar</span>
                  </button>
                </div>
              </div>

              {/* Lector de Pantalla */}
              <div className="option-card">
                <div className="option-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h3>Lector de Pantalla</h3>
                </div>
                <p>Descargar lector de texto del Gobierno de Colombia</p>
                <button onClick={openScreenReader} className="download-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Descargar Lector
                </button>
              </div>

              {/* Información adicional */}
              <div className="info-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.2"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>
                  Para navegadores, también puedes usar las teclas de acceso rápido:
                  <br />
                  <strong>Ctrl + (+/-)</strong> para ajustar el zoom de la página
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .accessibility-button {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #198754 0%, #157347 100%);
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(25, 135, 84, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 999;
          font-size: 16px !important;
          flex-shrink: 0;
        }

        .accessibility-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(25, 135, 84, 0.5);
        }

        .accessibility-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .accessibility-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(400px, 90vw);
          background: white;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
          font-size: 16px !important;
          overflow: hidden;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
          gap: 1rem;
        }

        .panel-header h2 {
          font-size: 24px !important;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          flex: 1;
          min-width: 0;
          word-wrap: break-word;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px !important;
          cursor: pointer;
          color: #64748b;
          padding: 0.5rem;
          line-height: 1;
          transition: color 0.2s;
          flex-shrink: 0;
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #0f172a;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1.5rem;
          min-height: 0;
        }

        .option-card {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 1.25rem;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .option-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .option-header svg {
          color: #198754;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
        }

        .option-header h3 {
          font-size: 18px !important;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          flex: 1;
          min-width: 0;
          word-wrap: break-word;
        }

        .option-card p {
          font-size: 14px !important;
          color: #64748b;
          margin: 0 0 1rem 0;
          line-height: 1.5;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .toggle-button {
          width: 100%;
          background: #e2e8f0;
          color: #475569;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .toggle-button.active {
          background: #198754;
          color: white;
        }

        .toggle-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .text-size-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .size-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: #198754;
          flex-shrink: 0;
        }

        .size-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .size-button svg {
          transition: transform 0.2s;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .size-button:not(:disabled):hover svg {
          transform: scale(1.1);
        }

        .size-button span {
          font-size: 12px !important;
          color: #64748b;
          white-space: nowrap;
        }

        .reset-button {
          background: #e2e8f0;
          color: #475569;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px !important;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .reset-button:hover {
          background: #cbd5e1;
        }

        .download-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          background: #198754;
          color: white;
          border: none;
          padding: 0.875rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px !important;
          flex-wrap: wrap;
          word-wrap: break-word;
          text-align: center;
        }

        .download-button svg {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }

        .download-button:hover {
          background: #157347;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
        }

        .info-card {
          display: flex;
          gap: 0.75rem;
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-top: 1rem;
          overflow: hidden;
        }

        .info-card svg {
          flex-shrink: 0;
          color: #64748b;
          width: 20px;
          height: 20px;
          margin-top: 2px;
        }

        .info-card p {
          font-size: 13px !important;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
          word-wrap: break-word;
          overflow-wrap: break-word;
          flex: 1;
          min-width: 0;
        }

        .info-card strong {
          color: #475569;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .accessibility-panel {
            width: 100%;
            max-width: 100vw;
          }

          .accessibility-button {
            bottom: 6rem;
            width: 56px;
            height: 56px;
          }

          .panel-header {
            padding: 1rem;
          }

          .panel-content {
            padding: 1rem;
          }

          .option-card {
            padding: 1rem;
          }

          .text-size-controls {
            justify-content: center;
          }

          .size-button span {
            font-size: 10px !important;
          }
        }

        @media (max-width: 400px) {
          .panel-header h2 {
            font-size: 20px !important;
          }

          .option-header h3 {
            font-size: 16px !important;
          }

          .download-button {
            padding: 0.75rem 1rem;
            font-size: 14px !important;
          }
        }

        /* Evitar que el escalado global afecte el panel */
        .accessibility-panel,
        .accessibility-panel * {
          font-size: inherit !important;
        }
      `}</style>
    </>
  );
}
