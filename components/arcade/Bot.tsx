// The Agent-A-Thon pixel bot from the marketing artwork, as an inline SVG.
const RECTS: [number, number, number, number][] = [
  [292, 82, 315, 110], [82, 192, 210, 102], [607, 192, 210, 102], [82, 294, 106, 315], [712, 294, 105, 315],
  [82, 503, 735, 106], [292, 609, 106, 102], [502, 609, 106, 102], [82, 711, 211, 108], [607, 711, 210, 108],
];
export const EYES: [number, number, number, number][] = [[292, 347, 106, 105], [502, 347, 106, 105]];

export function BotRects({ withEyes = true }: { withEyes?: boolean }) {
  return (
    <>
      {RECTS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
      {withEyes && EYES.map(([x, y, w, h], i) => <rect key={`e${i}`} x={x} y={y} width={w} height={h} />)}
    </>
  );
}

export default function Bot({ color = "#E5333D", size = 44, className }: { color?: string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="82 82 735 737" shapeRendering="crispEdges" aria-hidden="true">
      <g fill={color}><BotRects /></g>
    </svg>
  );
}
