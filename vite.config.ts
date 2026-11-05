import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

// Service worker con la lista exacta de archivos del build: tras la primera visita
// la app funciona entera sin conexión.
function serviceWorker(): Plugin {
  return {
    name: "radar-service-worker",
    apply: "build",
    generateBundle(_opciones, bundle) {
      const archivos = ["./", "./manifest.webmanifest", "./favicon.png", "./icono-192.png", "./icono-512.png", ...Object.keys(bundle).map((f) => `./${f}`)];
      const version = Object.keys(bundle).sort().join("|").length.toString(36) + Object.keys(bundle).length.toString(36) + (Object.keys(bundle).find((f) => f.endsWith(".js")) ?? "");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `const CACHE = ${JSON.stringify(`radar-${version}`)};
const ARCHIVOS = ${JSON.stringify(archivos)};
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r ?? fetch(e.request)));
});
`,
      });
    },
  };
}

export default defineConfig({
  // Rutas relativas: el build funciona en la raíz o en una subcarpeta estática.
  base: "./",
  plugins: [react(), tailwindcss(), serviceWorker()],
  // Un solo archivo a propósito: la app entera debe estar disponible sin conexión.
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
