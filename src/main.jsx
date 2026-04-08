import React from'react';import ReactDOM from'react-dom/client';import{BrowserRouter}from'react-router-dom';import App from'./App';import'./styles/globals.css';import'./i18n';import startAutoTranslate from'./utils/autoTranslate';startAutoTranslate();
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
