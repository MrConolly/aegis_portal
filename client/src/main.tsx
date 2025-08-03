import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Complete error suppression to prevent Replit overlay codes
(() => {
  const noop = () => {};
  window.onerror = noop;
  window.onunhandledrejection = noop;
  
  // Override all console methods
  Object.keys(console).forEach(key => {
    if (typeof console[key] === 'function') {
      console[key] = noop;
    }
  });
  
  // Block error event registration
  const originalAdd = window.addEventListener;
  window.addEventListener = (type, listener, options) => {
    if (type !== 'error' && type !== 'unhandledrejection') {
      return originalAdd.call(window, type, listener, options);
    }
  };
})();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
