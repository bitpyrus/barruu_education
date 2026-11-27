/**
 * Renders lesson markdown: paragraphs, bullet lists, **bold**, *italic*,
 * $inline$ and $$display$$ math. All text is HTML-escaped by the shared
 * renderer before any markup is added.
 */
import 'katex/dist/katex.min.css';
import { renderInlineMarkdown } from './markdown';
import { cn } from './cn';

export function Rich({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const blocks = text.split(/\n{2,}/);
  return (
    <div dir="auto" className={cn('space-y-3 leading-relaxed', className)}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5">
              {lines.map((l, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(l.replace(/^\s*[-•]\s+/, '')) }} />)}
            </ul>
          );
        }
        const isDisplay = /^\s*\$\$[\s\S]*\$\$\s*$/.test(b);
        return (
          <p key={i} className={cn(isDisplay && 'text-center overflow-x-auto py-1')}
             dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(lines.join(' ')) }} />
        );
      })}
    </div>
  );
}

export function RichInline({ text, className }: { text: string; className?: string }) {
  return <span dir="auto" className={className} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />;
}
