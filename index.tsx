
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root para montar a aplicação.");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erro crítico na renderização:", error);
  rootElement.innerHTML = `
    <div style="background: #020617; color: #f43f5e; padding: 40px; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
      <div>
        <h1 style="font-weight: 900; margin-bottom: 10px;">ERRO DE CARREGAMENTO</h1>
        <p style="color: #94a3b8;">Houve um problema ao iniciar os módulos da aplicação no servidor.</p>
        <pre style="background: #0f172a; padding: 20px; border-radius: 10px; margin-top: 20px; font-size: 12px; color: #fb7185;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Tentar Novamente</button>
      </div>
    </div>
  `;
}
