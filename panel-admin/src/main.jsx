import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SesionProvider } from './api/sesion.jsx';
import './styles.css';
if (import.meta.env.DEV) import('./components/DemoBar.css');

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/admin/">
    <SesionProvider>
      <App />
    </SesionProvider>
  </BrowserRouter>,
);
