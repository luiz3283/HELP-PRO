import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for startup crashes
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="color: #ef4444; background: #000; padding: 20px; font-family: monospace; height: 100vh; overflow: auto;">
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Opa! Ocorreu um erro.</h2>
        <p style="margin-bottom: 0.5rem;"><strong>Erro:</strong> ${message}</p>
        <p style="color: #71717a; font-size: 0.8rem;">Em: ${source}:${lineno}</p>
        <p style="margin-top: 1rem; color: #fbbf24;">Se você subiu os arquivos .tsx direto para a hospedagem, isso não vai funcionar. É necessário rodar o comando 'build' antes.</p>
      </div>
    `;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);