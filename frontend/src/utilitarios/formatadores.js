export const digitos = (valor, limite) =>
  String(valor || "")
    .replace(/\D/g, "")
    .slice(0, limite);
export const formatarCnpj = (valor) =>
  digitos(valor, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
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
  const separacao = n.length > 10 ? 5 : 4;
  return `(${n.slice(0, 2)}) ${local.slice(0, separacao)}${local.length > separacao ? `-${local.slice(separacao)}` : ""}`;
};
export const formatarContato = (valor) =>
  /^[\d\s()+-]*$/.test(valor) ? formatarTelefone(valor) : valor;
export const somenteDominio = (valor) =>
  String(valor || "").replace(/^https?:\/\//i, "");
export const urlDoSite = (valor) =>
  valor ? `https://${somenteDominio(valor).trim()}` : "";
