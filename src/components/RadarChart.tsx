import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '../imports/svg-zh5n73hemm';
import imgPolygon71 from "figma:asset/a90ee0fbddb6423958d4928f0bcb2c95238342c9.png";
import imgPolygon72 from "figma:asset/3d4c164c3f58eaf96e449c3c3259a3f46ddef421.png";
import imgPolygon73 from "figma:asset/24c2cf1a62292c5900d041d558d92c7029f6a27e.png";

interface RadarChartProps {
  values: {
    sweetness: number;
    bitterness: number;
    green: number;
    umami: number;
    astringency: number;
  };
  onChange: (taste: string, value: number) => void;
}

interface TooltipState {
  isVisible: boolean;
  x: number;
  y: number;
  value: number;
  label: string;
}

// Define the axes configuration with precise angles and positions
const axesConfig = [
  { 
    key: 'sweetness', 
    label: 'sweetness', 
    angle: -90, // Top
    baseX: 37, 
    baseY: 12.5,
    centerOffset: { x: 0, y: 32.5 }
  },
  { 
    key: 'green', 
    label: 'green', 
    angle: -18, // Top right
    baseX: 62, 
    baseY: 42.5,
    centerOffset: { x: -25, y: 2.5 }
  },
  { 
    key: 'bitterness', 
    label: 'bitterness', 
    angle: 54, // Bottom right
    baseX: 73, 
    baseY: 100,
    centerOffset: { x: -36, y: -55.5 }
  },
  { 
    key: 'astringency', 
    label: 'astringency', 
    angle: 126, // Bottom left
    baseX: 1, 
    baseY: 100,
    centerOffset: { x: 36, y: -55.5 }
  },
  { 
    key: 'umami', 
    label: 'umami', 
    angle: 198, // Left
    baseX: -1, 
    baseY: 39,
    centerOffset: { x: 38, y: 6.5 }
  }
];

export function RadarChart({ values, onChange }: RadarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    isVisible: false,
    x: 0,
    y: 0,
    value: 0,
    label: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [focusedHandle, setFocusedHandle] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Calculate position for a handle based on its value (0-10 scale)
  const getHandlePosition = useCallback((axisKey: string, value: number) => {
    const axis = axesConfig.find(a => a.key === axisKey);
    if (!axis) return { x: 37, y: 45 }; // fallback to center

    const centerX = 37;
    const centerY = 45;
    
    // Scale value from 0-10 to 0-1
    const normalizedValue = Math.max(0, Math.min(1, value / 10));
    
    // Calculate position along the spoke
    const deltaX = axis.centerOffset.x * normalizedValue;
    const deltaY = axis.centerOffset.y * normalizedValue;
    
    return {
      x: centerX + deltaX,
      y: centerY + deltaY
    };
  }, []);

  // Generate SVG path for the data polygon
  const generateDataPath = useCallback(() => {
    const points = axesConfig.map((axis) => {
      const value = values[axis.key as keyof typeof values];
      return getHandlePosition(axis.key, value);
    });

    if (points.length === 0) return '';

    let path = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += `L${points[i].x} ${points[i].y}`;
    }
    path += 'Z'; // Close the polygon

    return path;
  }, [values, getHandlePosition]);

  // Calculate value from mouse position along a specific spoke
  const calculateValueFromPosition = useCallback((mouseX: number, mouseY: number, axisKey: string) => {
    if (!chartRef.current) return 0;

    const rect = chartRef.current.getBoundingClientRect();
    const axis = axesConfig.find(a => a.key === axisKey);
    if (!axis) return 0;

    // Convert mouse position to chart coordinates
    const chartX = ((mouseX - rect.left) / rect.width) * 74;
    const chartY = ((mouseY - rect.top) / rect.height) * 90;

    const centerX = 37;
    const centerY = 45;

    // Calculate the distance along the spoke
    const deltaX = chartX - centerX;
    const deltaY = chartY - centerY;

    // Project the mouse position onto the spoke direction
    const spokeX = axis.centerOffset.x;
    const spokeY = axis.centerOffset.y;
    const spokeLength = Math.sqrt(spokeX * spokeX + spokeY * spokeY);

    if (spokeLength === 0) return 0;

    // Dot product to find projection
    const projection = (deltaX * spokeX + deltaY * spokeY) / (spokeLength * spokeLength);
    
    // Convert projection to 0-10 scale, clamping to valid range
    const value = Math.max(0, Math.min(10, projection * 10));
    
    return Math.round(value);
  }, []);

  // Handle mouse interactions
  const handleMouseDown = useCallback((axisKey: string, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragTarget(axisKey);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragTarget) return;

    const newValue = calculateValueFromPosition(event.clientX, event.clientY, dragTarget);
    onChange(dragTarget, newValue);
  }, [isDragging, dragTarget, calculateValueFromPosition, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
  }, []);

  // Handle tooltip display
  const handleCircleHover = useCallback((event: React.MouseEvent, axisKey: string, value: number) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const axis = axesConfig.find(a => a.key === axisKey);
    
    setTooltip({
      isVisible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top - 10,
      value,
      label: axis?.label || axisKey
    });
  }, []);

  const handleCircleLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Keyboard accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent, axisKey: string) => {
    const currentValue = values[axisKey as keyof typeof values];
    let newValue = currentValue;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        newValue = Math.min(10, currentValue + 1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        newValue = Math.max(0, currentValue - 1);
        break;
      case 'Home':
        newValue = 0;
        break;
      case 'End':
        newValue = 10;
        break;
      default:
        return; // Don't prevent default for other keys
    }

    event.preventDefault();
    onChange(axisKey, newValue);

    // Update tooltip for keyboard users
    if (handleRefs.current[axisKey]) {
      const rect = handleRefs.current[axisKey]!.getBoundingClientRect();
      const chartRect = chartRef.current?.getBoundingClientRect();
      if (chartRect) {
        setTooltip({
          isVisible: true,
          x: rect.left + rect.width / 2 - chartRect.left,
          y: rect.top - chartRect.top - 10,
          value: newValue,
          label: axesConfig.find(a => a.key === axisKey)?.label || axisKey
        });
      }
    }
  }, [values, onChange]);

  // Handle focus for keyboard users
  const handleFocus = useCallback((axisKey: string) => {
    setFocusedHandle(axisKey);
    const value = values[axisKey as keyof typeof values];
    const axis = axesConfig.find(a => a.key === axisKey);
    
    if (handleRefs.current[axisKey] && chartRef.current) {
      const rect = handleRefs.current[axisKey]!.getBoundingClientRect();
      const chartRect = chartRef.current.getBoundingClientRect();
      
      setTooltip({
        isVisible: true,
        x: rect.left + rect.width / 2 - chartRect.left,
        y: rect.top - chartRect.top - 10,
        value,
        label: axis?.label || axisKey
      });
    }
  }, [values]);

  const handleBlur = useCallback(() => {
    setFocusedHandle(null);
    setTooltip(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!dragTarget) return;
        const newValue = calculateValueFromPosition(e.clientX, e.clientY, dragTarget);
        onChange(dragTarget, newValue);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragTarget(null);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragTarget, calculateValueFromPosition, onChange]);

  return (
    <div className="bg-[#fff9f3] h-[289px] overflow-clip relative shrink-0 w-full">
      {/* Graph */}
      <div className="absolute contents translate-x-[-50%] translate-y-[-50%]" data-name="graph" style={{ top: "calc(50% + 5.151px)", left: "calc(50% + 0.013px)" }}>
        <div className="absolute size-[228.896px] translate-x-[-50%] translate-y-[-50%]" style={{ top: "calc(50% + 5.151px)", left: "calc(50% + 0.013px)" }}>
          <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 219 208">
              <path d={svgPaths.p3fb9bb00} id="Polygon 70" stroke="#342209" strokeWidth="0.768109" />
            </svg>
          </div>
        </div>
        <div className="absolute size-[178.201px] translate-x-[-50%] translate-y-[-50%]" style={{ top: "calc(50% + 5.151px)", left: "calc(50% + 0.013px)" }}>
          <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
            <img className="block max-w-none size-full" height="161.185" src={imgPolygon71} width="169.479" />
          </div>
        </div>
        <div className="absolute size-[125.202px] translate-x-[-50%] translate-y-[-50%]" style={{ top: "calc(50% + 4.767px)", left: "calc(50% - 0.371px)" }}>
          <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
            <img className="block max-w-none size-full" height="113.246" src={imgPolygon72} width="119.074" />
          </div>
        </div>
        <div className="absolute size-[80.651px] translate-x-[-50%] translate-y-[-50%]" style={{ top: "calc(50% + 4.767px)", left: "calc(50% - 0.371px)" }}>
          <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
            <img className="block max-w-none size-full" height="72.95" src={imgPolygon73} width="76.704" />
          </div>
        </div>
        <div className="absolute size-[228.896px] translate-x-[-50%] translate-y-[-50%]" style={{ top: "calc(50% + 5.151px)", left: "calc(50% + 0.013px)" }}>
          <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 219 208">
              <path d={svgPaths.p3ff0eb70} id="Star 37" stroke="#C2B7AB" strokeWidth="0.768109" />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute capitalize contents font-['Syne:Regular',_sans-serif] font-normal leading-[0] text-[#342209] text-[13px] text-nowrap translate-x-[-50%] translate-y-[-50%]" data-name="labels" style={{ top: "calc(50% - 2.211px)", left: "calc(50% - 4.161px)" }}>
        <div className="absolute" style={{ top: "calc(50% - 133.5px)", left: "calc(50% - 31px)" }}>
          <p className="leading-[normal] text-nowrap whitespace-pre">sweetness</p>
        </div>
        <div className="absolute" style={{ top: "calc(50% + 113.078px)", left: "calc(50% + 55px)" }}>
          <p className="leading-[normal] text-nowrap whitespace-pre">bitterness</p>
        </div>
        <div className="absolute" style={{ top: "calc(50% - 35.559px)", left: "calc(50% + 123.679px)" }}>
          <p className="leading-[normal] text-nowrap whitespace-pre">green</p>
        </div>
        <div className="absolute" style={{ top: "calc(50% - 35.5px)", left: "calc(50% - 167px)" }}>
          <p className="leading-[normal] text-nowrap whitespace-pre">umami</p>
        </div>
        <div className="absolute" style={{ top: "calc(50% + 110.005px)", left: "calc(50% - 104px)" }}>
          <p className="leading-[normal] text-nowrap whitespace-pre">astringency</p>
        </div>
      </div>

      {/* Interactive Circles and Data Polygon */}
      <div 
        ref={chartRef}
        className="absolute contents translate-x-[-50%] translate-y-[-50%]" 
        data-name="circles" 
        style={{ top: "calc(50% + 11.5px)", left: "calc(50% - 1px)" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute h-[90px] translate-x-[-50%] translate-y-[-50%] w-[74px]" style={{ top: "calc(50% + 10.5px)", left: "calc(50% - 1px)" }}>
          <div className="absolute inset-[-0.76%_-0.82%_-0.56%_-0.69%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 76 92">
              {/* Data polygon with semi-transparent green fill */}
              <motion.path 
                d={generateDataPath()} 
                fill="#7CB342" 
                fillOpacity="0.36" 
                stroke="#7CB342"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  pathLength: { duration: 0.8, ease: "easeInOut" },
                  opacity: { duration: 0.3 }
                }}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(124, 179, 66, 0.2))'
                }}
              />
            </svg>
          </div>
        </div>
        
        {/* Interactive handles */}
        {axesConfig.map((axis) => {
          const value = values[axis.key as keyof typeof values];
          const position = getHandlePosition(axis.key, value);
          
          return (
            <motion.button
              key={axis.key}
              ref={(el) => { handleRefs.current[axis.key] = el; }}
              className="absolute size-2.5 translate-x-[-50%] translate-y-[-50%] cursor-grab focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:ring-offset-2 focus:ring-offset-[#fff9f3] rounded-full"
              style={{
                left: `${(position.x / 74) * 100}%`,
                top: `${(position.y / 90) * 100}%`,
                cursor: isDragging && dragTarget === axis.key ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(axis.key, e)}
              onMouseEnter={(e) => handleCircleHover(e, axis.key, value)}
              onMouseLeave={handleCircleLeave}
              onFocus={() => handleFocus(axis.key)}
              onBlur={handleBlur}
              onKeyDown={(e) => handleKeyDown(e, axis.key)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              whileFocus={{ scale: 1.2 }}
              animate={{
                x: 0,
                y: 0,
                scale: focusedHandle === axis.key ? 1.2 : 1
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              aria-label={`${axis.label} value: ${value} out of 10. Use arrow keys to adjust, Home for 0, End for 10.`}
              tabIndex={0}
            >
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                <circle 
                  cx="5" 
                  cy="5" 
                  fill="#FFF9F3" 
                  r="4.5" 
                  stroke={focusedHandle === axis.key ? "#7CB342" : "#342209"}
                  strokeWidth={focusedHandle === axis.key ? "1.5" : "1"}
                  style={{
                    filter: isDragging && dragTarget === axis.key 
                      ? 'drop-shadow(0 4px 8px rgba(52, 34, 9, 0.3))'
                      : 'drop-shadow(0 2px 4px rgba(52, 34, 9, 0.1))'
                  }}
                />
              </svg>
            </motion.button>
          );
        })}
      </div>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {tooltip.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bg-[#342209] text-[#fff9f3] px-3 py-2 rounded-lg text-sm font-['Syne'] pointer-events-none z-20 shadow-lg"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateX(-50%)',
              backdropFilter: 'blur(4px)'
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7CB342]" />
              <span className="capitalize">{tooltip.label}</span>
              <span className="font-mono text-xs opacity-80">{tooltip.value}/10</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}