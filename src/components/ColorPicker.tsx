import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback, useRef } from 'react';
import { Pipette, Palette, Check, X } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

const matchaColors = [
  '#3e6f2c',  // Dark green
  '#adc44f',  // Light green  
  '#8fca55',  // Medium light green
  '#5e9526',  // Medium green
  '#377a10',  // Medium dark green
  '#215e08'   // Very dark green
];

export function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customColorInput, setCustomColorInput] = useState(selectedColor);
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for EyeDropper API support
  useState(() => {
    if ('EyeDropper' in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  const handleCustomColorChange = useCallback((value: string) => {
    setCustomColorInput(value);
    // Validate hex color format and apply immediately if valid
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  }, [onChange]);

  const handleCustomColorSubmit = useCallback(() => {
    if (/^#[0-9A-F]{6}$/i.test(customColorInput)) {
      onChange(customColorInput);
      setIsCustomMode(false);
    }
  }, [customColorInput, onChange]);

  const handleEyeDropper = useCallback(async () => {
    if (!('EyeDropper' in window)) {
      return;
    }

    try {
      // @ts-ignore - EyeDropper is not in TypeScript types yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        const color = result.sRGBHex.toUpperCase();
        // Automatically save the picked color and close the panel
        onChange(color);
        setCustomColorInput(color);
        setIsCustomMode(false);
      }
    } catch (error: any) {
      // Only log error if it's not user cancellation (ESC key or clicking outside)
      if (error.name !== 'AbortError') {
        console.error('EyeDropper error:', error);
      }
      // AbortError is expected when user cancels - silently ignore
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomColorSubmit();
    } else if (e.key === 'Escape') {
      setCustomColorInput(selectedColor);
      setIsCustomMode(false);
    }
  }, [handleCustomColorSubmit, selectedColor]);

  return (
    <div className="relative w-[174px]">
      {/* Main color bar */}
      <motion.button
        onClick={() => setIsCustomMode(!isCustomMode)}
        className="bg-[#3e6f2c] h-14 w-[174px] rounded-[6px] mb-[4px] relative overflow-hidden group cursor-pointer hover:ring-2 hover:ring-[#7CB342] hover:ring-offset-1 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div 
          className="absolute inset-0 rounded-[6px] transition-colors duration-200"
          style={{ backgroundColor: selectedColor }}
        />
        
        {/* Custom color overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-[6px] transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs font-['Syne'] text-[#342209] flex items-center gap-2">
            <Palette className="w-3 h-3" />
            <span>Custom Color</span>
          </div>
        </div>
      </motion.button>
      
      {/* Custom color input panel */}
      <AnimatePresence>
        {isCustomMode && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mb-[4px] bg-[#fff9f3] rounded-[6px] border border-[#c2b7ab] p-4 shadow-lg"
          >
            <div className="text-xs font-['Syne'] text-[#342209] mb-3 flex items-center gap-2">
              <Palette className="w-3 h-3" />
              <span>Custom Color</span>
            </div>
            
            {/* Tools row */}
            <div className="flex gap-2 mb-3">
              {/* Eye dropper tool */}
              {isEyeDropperSupported && (
                <button
                  onClick={handleEyeDropper}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-['Syne'] bg-[#7CB342] text-white rounded hover:bg-[#689F38] transition-colors"
                  title="Pick color from screen"
                >
                  <Pipette className="w-3 h-3" />
                  <span>Pick</span>
                </button>
              )}
              
              {/* Color input */}
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={customColorInput}
                  onChange={(e) => handleCustomColorChange(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="#3E6F2C"
                  className="w-full px-3 py-2 text-xs font-['Syne'] bg-transparent border border-[#c2b7ab] rounded text-[#342209] outline-none focus:border-[#7CB342] focus:ring-1 focus:ring-[#7CB342] transition-colors"
                  maxLength={7}
                />
              </div>
            </div>
            
            {/* Action buttons */}

            
            {/* Validation message */}
            {customColorInput.length > 0 && !/^#[0-9A-F]{6}$/i.test(customColorInput) && (
              <div className="text-xs text-[#d4183d] mt-2 flex items-center gap-1">
                <X className="w-3 h-3" />
                <span>Invalid hex color format (e.g., #3E6F2C)</span>
              </div>
            )}
            
            {/* Success message */}
            {/^#[0-9A-F]{6}$/i.test(customColorInput) && customColorInput !== selectedColor && (
              <div className="text-xs text-[#7CB342] mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Valid color - click Apply to save</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Color swatches */}
      <div className="flex gap-[1px]">
        {matchaColors.map((color, index) => (
          <motion.button
            key={color}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-[4px] relative ${
              selectedColor === color ? 'ring-2 ring-[#342209] ring-offset-1' : ''
            }`}
            style={{ backgroundColor: color }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}