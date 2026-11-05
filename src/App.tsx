import { useEffect, useRef, useState } from "react";
import mark from "./assets/radar-mark.png";
import { Avatar, Icon } from "./components/art.tsx";
import { useClase } from "./components/ClaseProvider.tsx";
import { useIdioma } from "./components/IdiomaProvider.tsx";
import { SelectorIdiomaCompacto } from "./components/SelectorIdioma.tsx";
import { ErrorBoundary } from "./components/ui.tsx";
import { Acerca } from "./screens/Acerca.tsx";
import { Ajustes } from "./screens/Ajustes.tsx";
import { DetalleAlumnoPantalla } from "./screens/DetalleAlumno.tsx";
import { ElegirAlumno } from "./screens/ElegirAlumno.tsx";
import { Inicio } from "./screens/Inicio.tsx";
import { MiClase } from "./screens/MiClase.tsx";
import { MisTests } from "./screens/MisTests.tsx";
import { Pin } from "./screens/Pin.tsx";
import { Practica } from "./screens/Practica.tsx";
import { TestPantalla } from "./screens/TestPantalla.tsx";
import { alumnoPorId, type Alumno } from "./services/clase.ts";
import { PRESENTACION_BASE, atributosDe, presentacionDe, type Presentacion } from "./services/perfiles.ts";
import { cierraSesionProfesor, enlace, esRutaProfesor, leerRuta, rutaPermitida, type Ruta } from "./services/rutas.ts";
import { tituloPestana } from "./services/titulos.ts";

function useHash(): string {
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));
  useEffect(() => {
    const cambio = () => setHash(window.location.hash);
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);
  return hash;
}

function Marca() {
  const { t } = useIdioma();
  return (
    <a className="marca" href="#/" aria-label={t("app.inicioAria")}>
      <img src={mark} alt="" width="44" height="44" />
      <span aria-hidden="true">RADAR</span>
    </a>
  );
}

function BarraProfesor({ ruta }: { ruta: Ruta }) {
  const { bloquear } = useClase();
  const { t } = useIdioma();
  const actual = ruta.nombre === "ajustes" ? "ajustes" : "clase";
  return (
    <header className="barra barra-profesor">
      <Marca />
      <nav aria-label={t("nav.profesor")}>
        <a href={enlace("profesor")} aria-current={actual === "clase" ? "page" : undefined}>{t("nav.miClase")}</a>
        <a href={enlace("profesor", "ajustes")} aria-current={actual === "ajustes" ? "page" : undefined}>{t("nav.ajustes")}</a>
      </nav>
      <SelectorIdiomaCompacto />
      <a className="barra-salir" href="#/" onClick={bloquear}><Icon name="exit" /> {t("nav.salir")}</a>
    </header>
  );
}

function BarraAlumno({ alumno }: { alumno: Alumno }) {
  const { t } = useIdioma();
  return (
    <header className="barra barra-alumno">
      <Marca />
      <span className="barra-nombre"><Avatar index={alumno.avatar} size={40} /> {alumno.nombre}</span>
      <SelectorIdiomaCompacto />
      <a className="barra-salir" href={enlace("alumno")}><Icon name="exit" /> {t("nav.noSoyYo")}</a>
    </header>
  );
}

function Contenido({ ruta, presentacion }: { ruta: Ruta; presentacion: Presentacion }) {
  switch (ruta.nombre) {
    case "inicio":
      return <Inicio />;
    case "acerca":
      return <Acerca />;
    case "alumnos":
      return <ElegirAlumno />;
    case "alumno":
      return <MisTests alumnoId={ruta.alumnoId} presentacion={presentacion} />;
    case "test":
      return <TestPantalla alumnoId={ruta.alumnoId} testId={ruta.testId} presentacion={presentacion} />;
    case "practica":
      return <Practica alumnoId={ruta.alumnoId} testId={ruta.testId} subId={ruta.subId} presentacion={presentacion} />;
    case "pin":
      return <Pin destino={ruta.destino} />;
    case "profesor":
      return <MiClase />;
    case "ajustes":
      return <Ajustes />;
    case "detalle":
      return <DetalleAlumnoPantalla alumnoId={ruta.alumnoId} />;
  }
}

function alumnoDeRuta(ruta: Ruta): string | null {
  return ruta.nombre === "alumno" || ruta.nombre === "test" || ruta.nombre === "practica" ? ruta.alumnoId : null;
}

// Separada del hash para que los tests puedan pintar cualquier ruta.
export function Vista({ hash }: { hash: string }) {
  const { clase, profesorDesbloqueado, bloquear } = useClase();
  const { t } = useIdioma();
  const ruta = rutaPermitida(leerRuta(hash), profesorDesbloqueado, hash);
  const alumnoId = alumnoDeRuta(ruta);
  const alumno = alumnoId === null ? undefined : alumnoPorId(clase, alumnoId);
  const presentacion = alumno === undefined ? PRESENTACION_BASE : presentacionDe(alumno.ayudas, clase.curso);
  const enTarea = ruta.nombre === "test" || ruta.nombre === "practica";
  const mundo = esRutaProfesor(ruta) ? "profesor" : ruta.nombre === "inicio" ? "inicio" : "alumno";
  const principal = useRef<HTMLElement>(null);
  const modoAlumno = cierraSesionProfesor(ruta);
  const pestana = tituloPestana(ruta, clase, t);

  useEffect(() => {
    if (modoAlumno) bloquear();
  }, [modoAlumno, bloquear]);

  useEffect(() => {
    document.title = pestana;
  }, [pestana]);

  // Las ayudas del alumno se aplican a toda la página, y se retiran al salir.
  const atributos = JSON.stringify(atributosDe(presentacion));
  useEffect(() => {
    const raiz = document.documentElement;
    Object.entries(JSON.parse(atributos) as Record<string, string>).forEach(([k, v]) => raiz.setAttribute(k, v));
  }, [atributos]);

  // Al cambiar de pantalla, el foco va al título: lo que lee un lector de pantalla.
  useEffect(() => {
    const titulo = document.getElementById("titulo");
    titulo?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="marco" data-mundo={mundo}>
      <a className="saltar" href="#principal" onClick={(e) => { e.preventDefault(); principal.current?.focus(); }}>{t("app.saltar")}</a>
      {esRutaProfesor(ruta) && <BarraProfesor ruta={ruta} />}
      {alumno !== undefined && !enTarea && <BarraAlumno alumno={alumno} />}
      <main id="principal" ref={principal} tabIndex={-1}>
        <ErrorBoundary key={hash} onReset={() => { window.location.hash = "#/"; }}>
          <Contenido ruta={ruta} presentacion={presentacion} />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return <Vista hash={useHash()} />;
}
