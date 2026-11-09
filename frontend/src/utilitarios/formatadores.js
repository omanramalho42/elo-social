export const digitos = (valor, limite) =>
  String(valor || "")
    .replace(/\D/g, "")
    .slice(0, limite);
const palavrasDeLigacao = new Set(["da", "das", "de", "do", "dos", "e"]);
const siglas = new Set(["ONG", "ONGS", "CE", "SUS", "UNIFOR"]);
export const formatarNome = (valor) =>
  String(valor || "").replace(/\p{L}+/gu, (palavra, indice) => {
    const minuscula = palavra.toLocaleLowerCase("pt-BR");
    if (indice > 0 && palavrasDeLigacao.has(minuscula)) return minuscula;
    if (siglas.has(palavra.toLocaleUpperCase("pt-BR")))
      return palavra.toLocaleUpperCase("pt-BR");
    return minuscula[0].toLocaleUpperCase("pt-BR") + minuscula.slice(1);
  });
export const iniciarComMaiuscula = (valor) =>
  String(valor || "").replace(/\p{L}/u, (letra) =>
    letra.toLocaleUpperCase("pt-BR"),
  );
export const formatarCnpj = (valor) =>
  digitos(valor, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
export const cnpjValido = (valor) => {
  const numero = String(valor || "").replace(/\D/g, "");
  if (numero.length !== 14 || /^(\d)\1{13}$/.test(numero)) return false;
  const calcular = (base, pesos) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * pesos[indice],
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = calcular(numero.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  const segundo = calcular(numero.slice(0, 12) + primeiro, [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  return numero.endsWith(`${primeiro}${segundo}`);
};
export const gerarCnpjFicticio = () => {
  const base = `${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("")}0001`;
  const calcularDigito = (numeros, pesos) => {
    const soma = [...numeros].reduce(
      (total, numero, indice) => total + Number(numero) * pesos[indice],
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = calcularDigito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = calcularDigito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return formatarCnpj(`${base}${primeiro}${segundo}`);
};
export const formatarTelefone = (valor) => {
  const n = digitos(valor, 11);
  if (n.length <= 2) return n ? `(${n}` : "";
  const local = n.slice(2);
  const separacao = 5;
  return `(${n.slice(0, 2)}) ${local.slice(0, separacao)}${local.length > separacao ? `-${local.slice(separacao)}` : ""}`;
};
export const celularValido = (valor) =>
  /^[1-9]\d9\d{8}$/.test(String(valor || "").replace(/\D/g, ""));
export const formatarContato = (valor) =>
  /^[\d\s()+-]*$/.test(valor)
    ? formatarTelefone(valor)
    : String(valor || "").toLocaleLowerCase("pt-BR");
export const somenteDominio = (valor) =>
  String(valor || "").trim().replace(/^https?:\/\//i, "");
export const urlDoSite = (valor) => {
  const dominio = somenteDominio(valor);
  return dominio ? `https://${dominio}` : "";
};
