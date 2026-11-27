/**
 * Safe inline markdown + KaTeX renderer for lesson text.
 * HTML is escaped FIRST; only a fixed set of markup is then added.
 * Supports **bold**, *italic*, `code`, https links, $inline$ and $$display$$ math.
 */
import katex from 'katex';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function applyTextMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_m, label: string, url: string) =>
      `<a href="${url.replace(/"/g, '%22')}" target="_blank" rel="noopener noreferrer">${label}</a>`);
}

const unescapeDollars = (t: string) => t.replace(/\\\$/g, '$');

// $$…$$ display math (single newlines allowed), $…$ inline math; \$ is a literal dollar.
const MATH_RE = /(?<!\\)\$\$((?:[^\n]|\n(?!\n))+?)(?<!\\)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;

export function renderInlineMarkdown(text: string): string {
  if (!text) return '';
  const parts: string[] = [];
  let last = 0;
  for (const m of text.matchAll(MATH_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(applyTextMarkdown(unescapeDollars(text.slice(last, idx))));
    const display = m[0].startsWith('$$');
    const latex = (display ? m[1] : m[2]) ?? '';
    parts.push(katex.renderToString(latex.trim(), { throwOnError: false, displayMode: display, trust: false }));
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push(applyTextMarkdown(unescapeDollars(text.slice(last))));
  return parts.join('');
}
