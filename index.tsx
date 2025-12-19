
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro ao iniciar React:", error);
    container.innerHTML = `<div style="padding: 20px; color: white; text-align: center;">Erro crítico: ${error}</div>`;
  }
}
