import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import setupAxiosInterceptors from './utils/axiosConfig';
import { pdfjs } from 'react-pdf'; // Import pdfjs

// Configure pdf.js globally
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
// Point to locally hosted fonts
pdfjs.GlobalWorkerOptions.standardFontDataUrl = `/standard_fonts/`; 

// Initialize axios interceptors for authentication
setupAxiosInterceptors();

// For development/testing purposes, uncomment this line to clear localStorage on app start
// This helps test the authentication flow
// localStorage.clear();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
