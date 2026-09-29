import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Keep the TV composition legible in smaller 16:9 preview windows.
function fitPreview() {
  document.documentElement.style.setProperty('--tv-scale', Math.min(innerWidth / 1920, innerHeight / 1080));
}
fitPreview();
window.addEventListener('resize', fitPreview);
createRoot(document.getElementById('root')).render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('resize', fitPreview));
