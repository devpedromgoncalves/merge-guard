import { useState, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom';
}

// Floating label shown on hover, positioned using fixed viewport coordinates
export function Tooltip({ label, children, position = 'top' }: TooltipProps) {
  const { isDark } = useTheme();
  // Pixel position of the tooltip bubble; null when hidden
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Computes the tooltip anchor position from the trigger element's bounding box
  const handleMouseEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = position === 'top' ? rect.top - 6 : rect.bottom + 6;
    setCoords({ x, y });
  };

  // Inline style object for the fixed-position bubble
  const tooltipStyle: React.CSSProperties = coords
    ? {
        position: 'fixed',
        left: coords.x,
        transform: 'translateX(-50%)' + (position === 'top' ? ' translateY(-100%)' : ''),
        top: coords.y,
        zIndex: 2147483647,
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        background: isDark ? '#3f3f46' : '#18181b',
        color: '#fafafa',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        pointerEvents: 'none'
      }
    : {};

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setCoords(null)}
    >
      {children}
      {coords && <span style={tooltipStyle}>{label}</span>}
    </div>
  );
}
