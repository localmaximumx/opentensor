import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import 'katex/dist/katex.min.css';
import './index.css';
import { initPalette } from './services/paletteService';

// Initialize color palette (defaults to the new Cyber Indigo palette, original preserved)
initPalette();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
