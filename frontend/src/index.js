import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop completed with undelivered notifications error
const resizeObserverErrorLabel = "ResizeObserver loop completed with undelivered notifications";
const resizeObserverLimitErrorLabel = "ResizeObserver loop limit exceeded";

window.addEventListener("error", (e) => {
  if (e.message === resizeObserverErrorLabel || e.message === resizeObserverLimitErrorLabel) {
    e.stopImmediatePropagation();
    const overlay = document.getElementById("webpack-dev-server-client-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  }
});

if (window.ResizeObserver) {
  const RO = window.ResizeObserver;
  window.ResizeObserver = class extends RO {
    constructor(callback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          callback(entries, observer);
        });
      });
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
