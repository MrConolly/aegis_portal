import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Production-ready entry point with zero error handling to prevent dev environment issues
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}