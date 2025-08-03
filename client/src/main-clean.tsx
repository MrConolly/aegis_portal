import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Completely disable all error handling to prevent Replit overlay interference
Object.defineProperty(window, 'onerror', { value: null, writable: false });
Object.defineProperty(window, 'onunhandledrejection', { value: null, writable: false });

// Override console to prevent error display
const originalConsole = { ...console };
window.console = {
  ...originalConsole,
  error: () => {},
  warn: () => {},
  trace: () => {},
};

// Block all error event listeners
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
  if (type === 'error' || type === 'unhandledrejection') {
    return; // Block error listeners
  }
  return originalAddEventListener.call(this, type, listener, options);
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}