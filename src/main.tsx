import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  PreferencesProvider,
  RadarProvider,
} from "./components/RadarProvider.tsx";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@xyflow/react/dist/style.css";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Falta el elemento raíz");
createRoot(root).render(
  <StrictMode>
    <PreferencesProvider>
      <RadarProvider>
        <App />
      </RadarProvider>
    </PreferencesProvider>
  </StrictMode>,
);
