import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/cormorant-garamond/index.css';
import '@fontsource-variable/manrope/index.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/puzzles.css';
import { App } from './App';
import { installAudioUnlock } from './audio/engine';

installAudioUnlock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service worker: caches only the public app shell. Never API responses or media.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
