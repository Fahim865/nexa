/** Browser-only helpers for document and utility tools. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function markdownToSafeHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let list: "ul" | "ol" | null = null;
  let codeLines: string[] | null = null;
  const endList = () => { if (list) { blocks.push(`</${list}>`); list = null; } };
  const endCode = () => { if (codeLines) { blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`); codeLines = null; } };
  for (const line of lines) {
    if (line.startsWith("```")) { if (codeLines) endCode(); else { endList(); codeLines = []; } continue; }
    if (codeLines) { codeLines.push(line); continue; }
    if (!line.trim()) { endList(); continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) { endList(); const level = heading[1].length; blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    if (/^>\s?/.test(line)) { endList(); blocks.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`); continue; }
    const unordered = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const nextList = ordered ? "ol" : "ul";
      if (list !== nextList) { endList(); list = nextList; blocks.push(`<${list}>`); }
      blocks.push(`<li>${inlineMarkdown((unordered ?? ordered)![1])}</li>`);
      continue;
    }
    endList();
    blocks.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  endList(); endCode();
  return blocks.join("\n");
}

export function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function decodeBase64Utf8(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function generatePassword(length: number, enabled: { upper: boolean; lower: boolean; number: boolean; symbol: boolean }) {
  const sets = {
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
    lower: "abcdefghijkmnopqrstuvwxyz",
    number: "23456789",
    symbol: "!@#$%^&*_-+=?",
  };
  const chosen = Object.entries(enabled).filter(([, active]) => active).map(([key]) => sets[key as keyof typeof sets]);
  if (!chosen.length) throw new Error("Choose at least one character set.");
  const all = chosen.join("");
  const random = new Uint32Array(length);
  crypto.getRandomValues(random);
  const required = chosen.map((set, index) => set[random[index] % set.length]);
  const remaining = Array.from(random.slice(required.length), (value) => all[value % all.length]);
  const password = [...required, ...remaining];
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = random[index] % (index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join("");
}
