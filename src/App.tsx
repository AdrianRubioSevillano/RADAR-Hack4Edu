import { Suspense, lazy, useEffect, useRef, useState } from "react";
import logo from "./assets/radar-logo.png";
import mark from "./assets/radar-mark.png";
import { Icon } from "./components/art.tsx";
import { PreferencesPanel } from "./components/PreferencesPanel.tsx";
import { useRadar } from "./components/RadarProvider.tsx";
import { ErrorBoundary, Notice } from "./components/ui.tsx";
import { ClassScreen } from "./screens/ClassScreen.tsx";

// Cada pantalla pesada se carga al entrar en ella.
const StudentDiagnosticScreen = lazy(() =>
  import("./screens/StudentDiagnosticScreen.tsx").then((m) => ({ default: m.StudentDiagnosticScreen })),
);
const PracticeScreen = lazy(() =>
  import("./screens/PracticeScreen.tsx").then((m) => ({ default: m.PracticeScreen })),
);
const TeacherScreen = lazy(() =>
  import("./screens/TeacherScreen.tsx").then((m) => ({ default: m.TeacherScreen })),
);
const PlansScreen = lazy(() =>
  import("./screens/PlansScreen.tsx").then((m) => ({ default: m.PlansScreen })),
);
const ActivitiesScreen = lazy(() =>
  import("./screens/ActivitiesScreen.tsx").then((m) => ({ default: m.ActivitiesScreen })),
);
const BenchmarkScreen = lazy(() =>
  import("./screens/BenchmarkScreen.tsx").then((m) => ({ default: m.BenchmarkScreen })),
);

type Mode = "teacher" | "student";

const ROUTES = [
  { id: "clase", label: "Mi clase", icon: "class", mode: "teacher", Screen: ClassScreen },
  { id: "docente", label: "Radar", icon: "radar", mode: "teacher", Screen: TeacherScreen },
  { id: "planes", label: "Planes", icon: "plans", mode: "teacher", Screen: PlansScreen },
  { id: "actividades", label: "Actividades", icon: "activities", mode: "teacher", Screen: ActivitiesScreen },
  { id: "benchmark", label: "Evidencia", icon: "evidence", mode: "teacher", Screen: BenchmarkScreen },
  { id: "diagnostico", label: "Diagnóstico", icon: "student", mode: "student", Screen: StudentDiagnosticScreen },
  { id: "practica", label: "Práctica", icon: "practice", mode: "student", Screen: PracticeScreen },
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
  const mode: Mode = current.mode;
  const items = ROUTES.filter((item) => item.mode === mode);
  const { Screen } = current;
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Al navegar, el foco va al título para que teclado y lector sigan el cambio.
  useEffect(() => {
    document.title = `${current.label} · RADAR`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const timer = setTimeout(
      () => main.current?.querySelector<HTMLElement>("#page-title")?.focus(),
      60,
    );
    return () => clearTimeout(timer);
  }, [current.label]);

  const links = items.map((item) => (
    <a
      key={item.id}
      href={`#/${item.id}`}
      className={item.id === route ? "active" : ""}
      aria-current={item.id === route ? "page" : undefined}
    >
      <Icon name={item.icon} /> <span>{item.label}</span>
    </a>
  ));

  return (
    <div className="shell" data-world={mode}>
      <a
        className="skip-link"
        href="#contenido"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="topbar">
        <a className="brand" href="#/clase" aria-label="RADAR, ir a Mi clase">
          <img className="brand-full" src={logo} alt="" width="86" height="70" />
          <img className="brand-mark" src={mark} alt="" width="46" height="43" />
        </a>
        <nav className="mode-switch" aria-label="Modo">
          <a href="#/clase" aria-current={mode === "teacher" ? "true" : undefined}>Docente</a>
          <a href="#/diagnostico" aria-current={mode === "student" ? "true" : undefined}>Alumno</a>
        </nav>
        <nav className="main-nav" aria-label="Principal">{links}</nav>
        <div className="top-actions">
          <span className="synthetic-tag" title="Todos los alumnos y respuestas de esta demo son ficticios">
            Datos sintéticos
          </span>
          <button type="button" className="btn btn-ghost" aria-label="Accesibilidad" onClick={() => setPreferencesOpen(true)}>
            <Icon name="access" /> <span>Accesibilidad</span>
          </button>
        </div>
      </header>
      <main ref={main} id="contenido" tabIndex={-1}>
        <div className="content">
          {notice !== null && (
            <Notice tone="warning">
              {notice}{" "}
              <button type="button" className="link" onClick={dismissNotice}>Entendido</button>
            </Notice>
          )}
          {!canPersist && (
            <Notice tone="warning">
              Este navegador no permite guardar: el progreso se perderá al recargar.
            </Notice>
          )}
          <ErrorBoundary key={route} onReset={resetAll}>
            <Suspense fallback={<p role="status" className="loading">Cargando…</p>}>
              <Screen />
            </Suspense>
          </ErrorBoundary>
        </div>
        <footer>
          <span>RADAR · Hack4Edu 2026</span>
          <span>Prototipo experimental, sin validación educativa. Se ejecuta en tu navegador: sin servidor, cuentas ni IA externa.</span>
        </footer>
      </main>
      <nav className="tabbar" aria-label="Principal móvil">{links}</nav>
      <PreferencesPanel open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </div>
  );
}
