import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface TasteAnalysis {
  sweetness: number;
  bitterness: number;
  green: number;
  umami: number;
  astringency: number;
}

interface InteractiveRadarChartProps {
  tasteAnalysis: TasteAnalysis;
  onTasteAnalysisChange: (newAnalysis: TasteAnalysis) => void;
  isInteractive?: boolean;
}

const CHART_SIZE = 289;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;
const MAX_RADIUS = 100;
const GRID_LEVELS = 4;
const HANDLE_SIZE = 10;

const TASTE_LABELS = [
  { key: 'sweetness', label: 'Sweetness', angle: -90 },
  { key: 'green', label: 'Green', angle: -18 },
  { key: 'bitterness', label: 'Bitterness', angle: 54 },
  { key: 'astringency', label: 'Astringency', angle: 126 },
  { key: 'umami', label: 'Umami', angle: 198 }
] as const;

export function InteractiveRadarChart({ 
  tasteAnalysis, 
  onTasteAnalysisChange, 
  isInteractive = true 
}: InteractiveRadarChartProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  
  // Refs for smooth dragging
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    dragKey: string | null;
    lastValue: number;
    animationFrame: number | null;
    axisX: number;
    axisY: number;
  }>({
    isDragging: false,
    dragKey: null,
    lastValue: 0,
    animationFrame: null,
    axisX: 0,
    axisY: 0
  });

  const getPointPosition = useCallback((angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: CENTER_X + radius * Math.cos(radian),
      y: CENTER_Y + radius * Math.sin(radian),
    };
  }, []);

  const getValueRadius = useCallback((value: number) => {
    const safeValue = Math.max(1, Math.min(10, value));
    return (safeValue / 10) * MAX_RADIUS;
  }, []);

  // Calculate all point positions
  const pointPositions = useMemo(() => {
    return TASTE_LABELS.map(({ key, angle }) => {
      const value = tasteAnalysis[key as keyof TasteAnalysis];
      const safeValue = typeof value === 'number' && !isNaN(value) ? value : 1;
      const radius = getValueRadius(safeValue);
      const position = getPointPosition(angle, radius);
      
      return {
        key,
        x: position.x,
        y: position.y,
        value: safeValue,
        angle
      };
    });
  }, [tasteAnalysis, getPointPosition, getValueRadius]);

  // Generate polygon path
  const polygonPath = useMemo(() => {
    const pathData = pointPositions
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ') + ' Z';
    return pathData;
  }, [pointPositions]);

  // Generate pentagon grid rings
  const gridRings = useMemo(() => {
    return Array.from({ length: GRID_LEVELS }, (_, i) => {
      const radius = ((i + 1) / GRID_LEVELS) * MAX_RADIUS;
      const points = TASTE_LABELS.map(({ angle }) => {
        const point = getPointPosition(angle, radius);
        return `${point.x},${point.y}`;
      }).join(' ');
      return points;
    });
  }, [getPointPosition]);

  // Generate axis lines
  const axisLines = useMemo(() => {
    return TASTE_LABELS.map(({ angle }) => {
      const endPoint = getPointPosition(angle, MAX_RADIUS);
      return { x1: CENTER_X, y1: CENTER_Y, x2: endPoint.x, y2: endPoint.y };
    });
  }, [getPointPosition]);

  // Smooth drag update function using requestAnimationFrame
  const updateDragValue = useCallback((clientX: number, clientY: number) => {
    if (!dragStateRef.current.isDragging || !svgRef.current || !dragStateRef.current.dragKey) return;

    const rect = svgRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to SVG center
    const mouseX = clientX - rect.left - CENTER_X;
    const mouseY = clientY - rect.top - CENTER_Y;
    
    // Project mouse position onto the axis
    const projectedDistance = mouseX * dragStateRef.current.axisX + mouseY * dragStateRef.current.axisY;
    
    // Clamp distance to valid range (0 to MAX_RADIUS)
    const clampedDistance = Math.max(0, Math.min(MAX_RADIUS, projectedDistance));
    
    // Convert to value (1-10), ensuring minimum of 1
    let newValue = Math.round((clampedDistance / MAX_RADIUS) * 10);
    newValue = Math.max(1, Math.min(10, newValue));
    
    // Only update if the change is significant enough to avoid jitter
    if (Math.abs(newValue - dragStateRef.current.lastValue) >= 1) {
      dragStateRef.current.lastValue = newValue;
      
      onTasteAnalysisChange({
        ...tasteAnalysis,
        [dragStateRef.current.dragKey!]: newValue
      });
    }
  }, [onTasteAnalysisChange, tasteAnalysis]);

  // Handle drag start with improved event handling
  const handleDragStart = useCallback((key: string, event: React.MouseEvent | React.TouchEvent) => {
    if (!isInteractive || !svgRef.current) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Find the corresponding taste label
    const tasteLabel = TASTE_LABELS.find(label => label.key === key);
    if (!tasteLabel) return;

    // Pre-calculate axis values for smooth dragging
    const radians = (tasteLabel.angle * Math.PI) / 180;
    const axisX = Math.cos(radians);
    const axisY = Math.sin(radians);
    
    // Set up drag state
    dragStateRef.current = {
      isDragging: true,
      dragKey: key,
      lastValue: tasteAnalysis[key as keyof TasteAnalysis],
      animationFrame: null,
      axisX,
      axisY
    };
    
    setIsDragging(key);
    
    // Smooth global event handlers
    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      // Cancel previous animation frame and request new one for smooth updates
      if (dragStateRef.current.animationFrame) {
        cancelAnimationFrame(dragStateRef.current.animationFrame);
      }
      
      dragStateRef.current.animationFrame = requestAnimationFrame(() => {
        updateDragValue(x, y);
      });
    };
    
    const handleEnd = () => {
      // Clean up drag state
      if (dragStateRef.current.animationFrame) {
        cancelAnimationFrame(dragStateRef.current.animationFrame);
      }
      
      dragStateRef.current = {
        isDragging: false,
        dragKey: null,
        lastValue: 0,
        animationFrame: null,
        axisX: 0,
        axisY: 0
      };
      
      setIsDragging(null);
      
      // Remove global event listeners
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('touchend', handleEnd);
      
      // Reset cursor and selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    
    // Prevent text selection and set cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    // Add global listeners for both mouse and touch
    document.addEventListener('mousemove', handleMove as EventListener, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
  }, [isInteractive, tasteAnalysis, updateDragValue]);

  // Handle point hover
  const handlePointHover = useCallback((key: string) => {
    if (!isDragging) {
      setHoveredPoint(key);
    }
  }, [isDragging]);

  const handlePointLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredPoint(null);
    }
  }, [isDragging]);

  // Calculate label positions (outside the chart)
  const labelPositions = useMemo(() => {
    return TASTE_LABELS.map(({ key, label, angle }) => {
      const labelRadius = MAX_RADIUS + 40;
      const point = getPointPosition(angle, labelRadius);
      
      // Adjust text anchor based on position
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (point.x < CENTER_X - 20) textAnchor = 'end';
      else if (point.x > CENTER_X + 20) textAnchor = 'start';
      
      return { key, label, x: point.x, y: point.y, textAnchor };
    });
  }, [getPointPosition]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (dragStateRef.current.animationFrame) {
        cancelAnimationFrame(dragStateRef.current.animationFrame);
      }
    };
  }, []);

  return (
    <div className="content-stretch flex flex-col gap-3 items-start justify-start relative size-full">
      <div className="font-['Syne:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#c2b7ab] text-[20px] tracking-[-1.6px] w-full">
        <p className="leading-[normal]">Taste Analysis</p>
      </div>
      
      <div className="flex justify-center items-center min-h-[320px] w-full">
        <div className="relative" style={{ width: `${CHART_SIZE}px`, height: `${CHART_SIZE}px` }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
            className="overflow-visible"
            style={{ touchAction: 'none' }} // Prevent default touch behaviors
          >
          {/* Grid pentagons */}
          {gridRings.map((points, index) => (
            <polygon
              key={`ring-${index}`}
              points={points}
              fill="none"
              stroke="#342209"
              strokeWidth="0.768"
              opacity={0.4}
            />
          ))}

          {/* Grid lines */}
          {axisLines.map(({ x1, y1, x2, y2 }, index) => (
            <line
              key={`axis-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#C2B7AB"
              strokeWidth="0.768"
              opacity={0.6}
            />
          ))}
          
          {/* Filled area */}
          <path
            d={polygonPath}
            fill="#7CB342"
            fillOpacity="0.36"
            stroke="#7CB342"
            strokeWidth="1.5"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(124, 179, 66, 0.2))',
              transition: isDragging ? 'none' : 'all 150ms ease-out',
              willChange: isDragging ? 'auto' : 'transform'
            }}
          />
          
          {/* Interactive points */}
          {pointPositions.map(({ key, x, y, value }) => {
            const isActive = isDragging === key || hoveredPoint === key;

            return (
              <g key={key}>
                {/* Larger invisible hit area for easier interaction */}
                {isInteractive && (
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="transparent"
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleDragStart(key, e)}
                    onTouchStart={(e) => handleDragStart(key, e)}
                    onMouseEnter={() => handlePointHover(key)}
                    onMouseLeave={handlePointLeave}
                  />
                )}
                
                {/* Visible point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? "6" : "5"}
                  fill="#FFF9F3"
                  stroke={isActive ? "#7CB342" : "#342209"}
                  strokeWidth={isActive ? "2" : "1"}
                  className="pointer-events-none"
                  style={{
                    filter: isActive 
                      ? 'drop-shadow(0 4px 8px rgba(124, 179, 66, 0.3))' 
                      : 'drop-shadow(0 2px 4px rgba(52, 34, 9, 0.1))',
                    transition: isDragging === key ? 'none' : 'all 150ms ease-out',
                    willChange: isDragging === key ? 'transform' : 'auto'
                  }}
                />

                {/* Value indicator - small text showing value */}
                {(isActive || isDragging === key) && (
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-[#342209] font-['Syne'] pointer-events-none select-none"
                    style={{
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {value}/10
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Labels */}
          {labelPositions.map(({ key, label, x, y, textAnchor }) => (
            <text
              key={`label-${key}`}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline="central"
              className="font-['Syne:Regular',_sans-serif] text-[13px] fill-[#342209] capitalize pointer-events-none select-none"
              style={{ fontSize: '13px' }}
            >
              {label.toLowerCase()}
            </text>
          ))}
          </svg>
        </div>
      </div>
    </div>
  );
}