import { useState } from "react";
import { Icon } from "../components/art.tsx";
import { useClase } from "../components/ClaseProvider.tsx";
import { TecladoNumerico } from "../components/TecladoNumerico.tsx";
import { Titulo, Volver } from "../components/ui.tsx";
import { comprobarPin, hashPin } from "../services/pin.ts";

export function Pin({ destino }: { destino: string }) {
  const { clase, actualizar, desbloquear } = useClase();
  const crear = clase.pinHash === null;
  const [pin, setPin] = useState("");
  const [primero, setPrimero] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const entrar = () => {
    desbloquear();
    window.location.hash = destino === "" ? "#/profesor" : destino;
  };

  const terminar = async (valor: string) => {
    setPin("");
    if (!crear) {
      if (await comprobarPin(valor, clase.pinHash)) entrar();
      else setMensaje("Ese PIN no es correcto. Prueba otra vez.");
      return;
    }
    if (primero === null) {
      setPrimero(valor);
      setMensaje(null);
    } else if (primero === valor) {
      const hash = await hashPin(valor);
      actualizar((c) => ({ ...c, pinHash: hash }));
      entrar();
    } else {
      setPrimero(null);
      setMensaje("Los dos PIN no coinciden. Empieza otra vez.");
    }
  };

  const pulsar = (tecla: string) => {
    if (!/^\d$/.test(tecla) || pin.length >= 4) return;
    const valor = pin + tecla;
    setPin(valor);
    if (valor.length === 4) void terminar(valor);
  };

  const titulo = !crear ? "Escribe tu PIN" : primero === null ? "Crea tu PIN de profesor" : "Repite tu PIN";

  return (
    <div className="hoja hoja-centrada hoja-pin">
      <Volver href="#/">Inicio</Volver>
      <span className="pausa-icono" aria-hidden="true"><Icon name="lock" size={44} /></span>
      <Titulo>{titulo}</Titulo>
      {crear && primero === null && <p>Son 4 números. Sirve para que solo tú veas la clase.</p>}
      <div className="pin-puntos" role="status" aria-label={`${pin.length} de 4 números escritos`}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? "lleno" : ""} />)}
      </div>
      <input
        className="pin-oculto"
        aria-label="PIN de 4 números"
        inputMode="numeric"
        type="password"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          const ultimo = e.target.value.slice(-1);
          if (e.target.value.length < pin.length) setPin(e.target.value);
          else pulsar(ultimo);
        }}
      />
      {mensaje !== null && <p className="pin-error" role="alert">{mensaje}</p>}
      <TecladoNumerico etiqueta="Teclado del PIN" onTecla={pulsar} onBorrar={() => setPin((v) => v.slice(0, -1))} />
    </div>
  );
}
