import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { initialLanguageReady } from './i18n';
import startAutoTranslate from './utils/autoTranslate';

startAutoTranslate();

const render = () => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);

// English visitors render immediately (their table is in the main bundle).
// French/Arabic visitors wait for their one extra chunk so the first paint is
// already in their language instead of flashing English.
initialLanguageReady.then(render).catch(render);
