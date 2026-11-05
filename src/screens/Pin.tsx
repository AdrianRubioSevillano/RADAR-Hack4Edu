import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { TecladoNumerico } from "../components/TecladoNumerico.tsx";
import { Titulo, Volver } from "../components/ui.tsx";
import { comprobarPin, hashPin } from "../services/pin.ts";
import { estadoInicialPin, eventoDeTecla, pasoPin, type EventoPin } from "../services/pinFlujo.ts";

export function Pin({ destino }: { destino: string }) {
  const { clase, actualizar, desbloquear } = useClase();
  const { t } = useIdioma();
  const [estado, setEstado] = useState(() => estadoInicialPin(clase.pinHash !== null));
  // La referencia evita leer un estado antiguo si se teclea muy deprisa.
  const actual = useRef(estado);
  const pinHash = useRef(clase.pinHash);
  pinHash.current = clase.pinHash;

  const entrar = useCallback(() => {
    desbloquear();
    window.location.hash = destino === "" ? "#/profesor" : destino;
  }, [desbloquear, destino]);

  const enviar = useCallback(
    (evento: EventoPin) => {
      const { estado: nuevo, accion } = pasoPin(actual.current, evento);
      actual.current = nuevo;
      setEstado(nuevo);
      if (accion?.tipo === "guardar") {
        void hashPin(accion.pin).then((hash) => {
          actualizar((c) => ({ ...c, pinHash: hash }));
          entrar();
        });
      } else if (accion?.tipo === "comprobar") {
        void comprobarPin(accion.pin, pinHash.current).then((bien) => {
          if (bien) entrar();
          else enviar({ tipo: "incorrecto" });
        });
      }
    },
    [actualizar, entrar],
  );

  // El teclado físico funciona esté donde esté el foco.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const evento = eventoDeTecla(e.key);
      if (evento === null) return;
      e.preventDefault();
      enviar(evento);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [enviar]);

  const crear = estado.modo === "crear";
  const titulo = t(!crear ? "pin.escribe" : estado.primero === null ? "pin.crea" : "pin.repite");

  return (
    <div className="hoja hoja-centrada hoja-pin">
      <Volver href="#/">{t("nav.inicio")}</Volver>
      <span className="pausa-icono" aria-hidden="true"><Icon name="lock" size={44} /></span>
      <Titulo>{titulo}</Titulo>
      {crear && estado.primero === null && <p>{t("pin.explicacion")}</p>}
      <div className="pin-puntos" role="status" aria-label={t("pin.estado", { n: estado.digitos.length })}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < estado.digitos.length ? "lleno" : ""} />)}
      </div>
      {estado.mensaje !== null && <p className="pin-error" role="alert">{t(estado.mensaje)}</p>}
      <TecladoNumerico etiqueta={t("pin.teclado")} onTecla={(digito) => enviar({ tipo: "digito", digito })} onBorrar={() => enviar({ tipo: "borrar" })} />
    </div>
  );
}
