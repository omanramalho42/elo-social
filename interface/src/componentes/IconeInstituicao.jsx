import { useState } from "react";

const iconeArea = (area) =>
  ({
    Educação: "▤",
    "Assistência social": "♡",
    "Meio ambiente": "♧",
    Saúde: "+",
    Cultura: "✳",
  })[area] || "↗";
// Logos locais identificadas pelo site oficial, sem depender do ID no banco.
const logos = {
  "https://projetoreviva.vercel.app": "/logos/projeto-reviva.png",
};
export default function IconeInstituicao({ ong, classe }) {
  const [falhou, definirFalha] = useState(false);
  const logo = logos[ong.site?.replace(/\/$/, "")];
  return logo && !falhou ? (
    <span className={`${classe} logo-instituicao`}>
      <img
        src={logo}
        alt={`Logo de ${ong.nome}`}
        onError={() => definirFalha(true)}
      />
    </span>
  ) : (
    <span className={classe}>{iconeArea(ong.area)}</span>
  );
}
