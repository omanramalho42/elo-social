import type { ReactNode } from "react";

export default function EstruturaRaiz({
  children: conteudo,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{conteudo}</body>
    </html>
  );
}
