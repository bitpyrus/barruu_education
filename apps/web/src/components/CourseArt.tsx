/**
 * Original course illustrations, drawn as inline SVG so they ship inside the
 * bundle (and inside course packages) with no remote images.
 */
import type { Course } from '@barruu/engine';

export function CourseArt({ course, className }: { course: Pick<Course, 'illustration' | 'color'>; className?: string }) {
  const c = course.color;
  return (
    // The flat colour fills any frame; the drawing itself is never cropped.
    <div className={className} style={{ backgroundColor: c, backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1.6px, transparent 1.7px)', backgroundSize: '22px 22px' }}>
    <svg viewBox="0 0 320 200" className="h-full w-full" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {ART[course.illustration]?.() ?? ART.generic()}
    </svg>
    </div>
  );
}

const W = '#ffffff';

const ART: Record<string, () => React.ReactNode> = {
  area: () => (
    <g>
      {/* L-shaped garden tiled with unit squares next to an equal-area square */}
      {[[60, 120], [80, 120], [100, 120], [120, 120], [140, 120], [160, 120], [60, 100], [60, 80], [60, 60]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 2} y={y + 2} width="16" height="16" rx="3" fill={W} opacity="0.9" />
      ))}
      <path d="M60 140 L180 140 L180 120 L80 120 L80 60 L60 60 Z" fill="none" stroke={W} strokeWidth="3" strokeLinejoin="round" />
      <rect x="200" y="80" width="60" height="60" fill="none" stroke={W} strokeWidth="3" />
      {[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => <rect key={`s${i}${j}`} x={202 + i * 20} y={82 + j * 20} width="16" height="16" rx="3" fill={W} opacity="0.35" />))}
      <circle cx="260" cy="80" r="7" fill={W} />
      <path d="M190 40 l12 -12 l12 12" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </g>
  ),
  function: () => (
    <g fill="none" stroke={W} strokeLinecap="round">
      <line x1="30" y1="150" x2="290" y2="150" strokeWidth="2" opacity="0.6" />
      <line x1="160" y1="20" x2="160" y2="180" strokeWidth="2" opacity="0.6" />
      <path d="M70 30 Q160 270 250 30" strokeWidth="4" />
      <path d="M90 40 Q160 200 230 40" strokeWidth="2.5" strokeDasharray="6 7" opacity="0.6" />
      <circle cx="160" cy="150" r="8" fill={W} />
    </g>
  ),
  pendulum: () => (
    <g stroke={W} strokeLinecap="round" fill="none">
      <line x1="110" y1="30" x2="210" y2="30" strokeWidth="5" />
      <path d="M95 140 A110 110 0 0 0 225 140" strokeWidth="2" strokeDasharray="5 7" opacity="0.7" />
      <line x1="160" y1="30" x2="205" y2="140" strokeWidth="3" />
      <circle cx="205" cy="140" r="17" fill={W} />
      <line x1="160" y1="30" x2="115" y2="140" strokeWidth="2" opacity="0.35" />
      <circle cx="115" cy="140" r="17" fill={W} opacity="0.3" stroke="none" />
    </g>
  ),
  sorting: () => (
    <g fill={W}>
      {[50, 90, 40, 120, 70, 140, 100].map((h, i) => (
        <rect key={i} x={60 + i * 30} y={170 - h} width="20" height={h} rx="4" opacity={i === 3 || i === 4 ? 1 : 0.55} />
      ))}
      <path d="M152 32 q22 -14 44 0" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" />
      <path d="M190 26 l7 6 -9 3" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  generic: () => (
    <g fill="none" stroke={W} strokeWidth="4">
      <circle cx="130" cy="100" r="40" />
      <rect x="160" y="70" width="70" height="70" rx="6" />
    </g>
  ),
};
