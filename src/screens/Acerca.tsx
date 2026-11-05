import { Mascot } from "../components/art.tsx";
import { useIdioma } from "../components/IdiomaProvider.tsx";
import { AvisoRevision } from "../components/SelectorIdioma.tsx";
import { Titulo, Volver } from "../components/ui.tsx";

export function Acerca() {
  const { t } = useIdioma();
  return (
    <div className="hoja hoja-estrecha">
      <Volver href="#/">{t("nav.inicio")}</Volver>
      <div className="acerca-cabecera">
        <Mascot mood="hello" size={110} />
        <Titulo>{t("inicio.acerca")}</Titulo>
      </div>
      <AvisoRevision />
      <p>{t("acerca.p1")}</p>
      <p>{t("acerca.p2")}</p>
      <h2>{t("acerca.notaTitulo")}</h2>
      <p>{t("acerca.nota")}</p>
      <p>{t("acerca.creado")}</p>
    </div>
  );
}
