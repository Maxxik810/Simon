import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

// Heebo is bundled with the app (no Google Fonts) so it also works offline.
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';

import './styles/tokens.css';
import './styles/global.css';

import App from './App';

// Install the service worker for offline play. No onNeedRefresh handler:
// an update waits until the app is fully closed and never reloads a game (ADR-6).
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
