import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

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
    container.innerHTML = `<div style="padding: 20px; color: white; text-align: center; background: #020617; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h1 style="color: #f43f5e; font-weight: 900; margin-bottom: 10px;">Erro de Inicialização</h1>
      <p style="color: #94a3b8; max-width: 400px; font-size: 14px;">${error instanceof Error ? error.message : String(error)}</p>
      <button onclick="location.reload()" style="margin-top: 20px; background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Recarregar Aplicação</button>
    </div>`;
  }
}