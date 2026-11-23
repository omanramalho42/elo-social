export function deveAbrirSaude(evento) {
  if (!evento.shiftKey || evento.ctrlKey || evento.altKey || evento.metaKey || evento.repeat || evento.isComposing || evento.defaultPrevented || evento.key?.toLowerCase() !== "s") return false;
  const alvo = evento.target;
  return !alvo?.isContentEditable && !alvo?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]');
}
