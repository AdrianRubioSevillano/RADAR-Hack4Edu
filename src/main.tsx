import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ClaseProvider } from "./components/ClaseProvider.tsx";
import { IdiomaProvider } from "./components/IdiomaProvider.tsx";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Falta el elemento raíz");
createRoot(root).render(
  <StrictMode>
    <IdiomaProvider>
      <ClaseProvider>
        <App />
      </ClaseProvider>
    </IdiomaProvider>
  </StrictMode>,
);

// PWA: instalable y disponible sin conexión. Si no se puede registrar, la app sigue igual.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}
