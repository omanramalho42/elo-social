export function validarLocalizacao(latitude, longitude) {
  const valores = [latitude, longitude].map((valor) => String(valor ?? "").trim());
  if (valores.some((valor) => valor === ""))
    return { valida: false, mensagem: "Falta localizar a ONG: selecione o endereço no mapa ou preencha latitude e longitude." };
  const [lat, lon] = valores.map((valor) => /^-?\d+(?:[.,]\d+)?$/.test(valor) ? Number(valor.replace(",", ".")) : NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -4.1 || lat > -3.6 || lon < -38.8 || lon > -38.3)
    return { valida: false, mensagem: "Use coordenadas na região de Fortaleza: latitude de -4,1 a -3,6 e longitude de -38,8 a -38,3." };
  return { valida: true, lat, lon, mensagem: "Localização preenchida. Confira se o ponto corresponde ao endereço da ONG antes de aprovar." };
}
