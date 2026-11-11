import { randomInt } from "node:crypto";

// Somente para os registros temporários do ensaio integrado.
// O backend não depende de arquivos da interface, nem mesmo nos testes.
export function gerarCnpjFicticio() {
  const base = `${randomInt(100000000).toString().padStart(8, "0")}0001`;
  const digito = (numeros, pesos) => {
    const soma = [...numeros].reduce((total, numero, indice) =>
      total + Number(numero) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}
