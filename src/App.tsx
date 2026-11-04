import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ClassScreen } from "./screens/ClassScreen.tsx";
import { PreferencesPanel } from "./components/PreferencesPanel.tsx";
import { useRadar } from "./components/RadarProvider.tsx";
import { ErrorBoundary, Notice, SyntheticBadge } from "./components/ui.tsx";

// Cada pantalla pesada se carga al entrar en ella.
const StudentDiagnosticScreen = lazy(() =>
  import("./screens/StudentDiagnosticScreen.tsx").then((m) => ({
    default: m.StudentDiagnosticScreen,
  })),
);
const PracticeScreen = lazy(() =>
  import("./screens/PracticeScreen.tsx").then((m) => ({
    default: m.PracticeScreen,
  })),
);
const TeacherScreen = lazy(() =>
  import("./screens/TeacherScreen.tsx").then((m) => ({
    default: m.TeacherScreen,
  })),
);
const PlansScreen = lazy(() =>
  import("./screens/PlansScreen.tsx").then((m) => ({ default: m.PlansScreen })),
);
const ActivitiesScreen = lazy(() =>
  import("./screens/ActivitiesScreen.tsx").then((m) => ({
    default: m.ActivitiesScreen,
  })),
);
const BenchmarkScreen = lazy(() =>
  import("./screens/BenchmarkScreen.tsx").then((m) => ({
    default: m.BenchmarkScreen,
  })),
);

const ROUTES = [
  { id: "clase", label: "Clase", icon: "◎", group: "Demo", Screen: ClassScreen },
  { id: "diagnostico", label: "Diagnóstico", icon: "◈", group: "Alumno", Screen: StudentDiagnosticScreen },
  { id: "practica", label: "Práctica", icon: "✎", group: "Alumno", Screen: PracticeScreen },
  { id: "docente", label: "Panel de clase", icon: "⌘", group: "Docente", Screen: TeacherScreen },
  { id: "planes", label: "Planes", icon: "⇄", group: "Docente", Screen: PlansScreen },
  { id: "actividades", label: "Actividades", icon: "❖", group: "Docente", Screen: ActivitiesScreen },
  { id: "benchmark", label: "Benchmark", icon: "▤", group: "Evidencia", Screen: BenchmarkScreen },
] as const;

type RouteId = (typeof ROUTES)[number]["id"];

function routeFromHash(): RouteId {
  const id = window.location.hash.replace(/^#\/?/, "");
  return ROUTES.find((route) => route.id === id)?.id ?? "clase";
}

function useRoute(): RouteId {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const change = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  const { notice, dismissNotice, canPersist, resetAll } = useRadar();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const current = ROUTES.find((item) => item.id === route) ?? ROUTES[0];
  const { Screen } = current;
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Al navegar, el foco va al título para que teclado y lector sigan el cambio.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const timer = setTimeout(
      () => main.current?.querySelector<HTMLElement>("#page-title")?.focus(),
      50,
    );
    document.title = `${current.label} · RADAR`;
    return () => clearTimeout(timer);
  }, [current.label]);

  return (
    <div className="shell">
      <a className="skip-link" href="#contenido" onClick={(event) => {
        event.preventDefault();
        main.current?.focus();
      }}>
        Saltar al contenido
      </a>
      <aside>
        <a className="brand" href="#/clase">
          <span className="logo" aria-hidden="true">◉</span> RADAR
          <span className="brand-dot" aria-hidden="true">.</span>
        </a>
        <nav aria-label="Principal">
          {ROUTES.map((item, index) => (
            <div key={item.id} className="nav-item">
              {ROUTES[index - 1]?.group !== item.group && (
                <div className="workspace-label">{item.group}</div>
              )}
              <a
                href={`#/${item.id}`}
                className={item.id === route ? "active" : ""}
                aria-current={item.id === route ? "page" : undefined}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </a>
            </div>
          ))}
        </nav>
        <div className="aside-note">
          <span className="status-dot" aria-hidden="true" /> Motor en el navegador
          <p>Sin servidor, cuentas ni servicios de IA.</p>
        </div>
      </aside>
      <main ref={main} id="contenido" tabIndex={-1}>
        <header>
          <div>
            RADAR <span aria-hidden="true">/</span> {current.group} <span aria-hidden="true">/</span> {current.label}
          </div>
          <div className="header-actions">
            <SyntheticBadge />
            <button type="button" className="secondary" onClick={() => setPreferencesOpen(true)}>
              Accesibilidad
            </button>
          </div>
        </header>
        <div className="content">
          {notice !== null && (
            <Notice tone="warning">
              {notice}{" "}
              <button type="button" className="text-button" onClick={dismissNotice}>
                Entendido
              </button>
            </Notice>
          )}
          {!canPersist && (
            <Notice tone="warning">
              Este navegador no permite guardar: el progreso se perderá al recargar.
            </Notice>
          )}
          <ErrorBoundary key={route} onReset={resetAll}>
            <Suspense fallback={<p role="status">Cargando…</p>}>
              <Screen />
            </Suspense>
          </ErrorBoundary>
          <footer>
            RADAR · Hacer visible el aprendizaje.
            <span>Prototipo experimental · Hack4Edu 2026 · Sin validación educativa</span>
          </footer>
        </div>
      </main>
      <PreferencesPanel open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </div>
  );
}
