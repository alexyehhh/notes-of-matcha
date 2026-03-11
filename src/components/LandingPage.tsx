import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MatchaEntry, ViewType } from "../types";
// import { ImageWithFallback } from './figma/ImageWithFallback';
import { useResponsive } from '../hooks/useResponsive';
// import svgPaths from '../imports/svg-6owz6pfb8x';
// import imgRectangle3 from "figma:asset/dc6fd5a4a8fa791d2e308774ae9cdd5d0400c792.png";
// import imgRectangle15 from "figma:asset/cc2e29cb7decd5e1b94615650ce7e42071d9c94a.png";
// import imgRectangle16 from "figma:asset/e1d39a1e66254ce927156619bbbe9078d9bda195.png";
// import matchaImage from '../assets/rocky-matcha.png';
import Frame40 from '../imports/Frame40';
import Group2 from '../imports/Group2';
import { Trash2 } from 'lucide-react';

interface LandingPageProps {
  entries: MatchaEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onNavigateToView: (view: ViewType) => void;
  onEditEntry: (entryId: string) => void;
  onAddEntry: (entry: Omit<MatchaEntry, 'id'>) => Promise<string>;
  onDeleteEntry: (entryId: string) => void;
}

export function LandingPage({ entries, currentIndex, onIndexChange, onNavigateToView, onEditEntry, onAddEntry, onDeleteEntry }: LandingPageProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200, height: typeof window !== 'undefined' ? window.innerHeight : 800 });
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const totalEntries = entries.length;
  
  // Listen for window resize to update carousel dimensions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleCarouselClick = useCallback( 
    async (clickedIndex: number, isNewEntry = false) => {
    if (isNewEntry) {
      // Add new entry without image - Frame40 will be used automatically as default
      const newEntry: Omit<MatchaEntry, 'id'> = {
        name: 'New Matcha',
        brand: 'Brand',
        prefecture: 'Prefecture',
        flavorProfile: { grassy: false, nutty: false, floral: false },
        tasteAnalysis: { sweetness: 6, bitterness: 6, green: 6, umami: 6, astringency: 6 },
        notes: '',
        color: '#3e6f2c',
        favorite: false
        // No image property - Frame40 will be used as default
      };
      const entryId = await onAddEntry(newEntry);
      // Navigate to edit page for new entry after a brief delay
      if (entryId) {
        setTimeout(() => onEditEntry(entryId), 500);
      }
    } else if (clickedIndex >= 0 && clickedIndex < totalEntries) {
      if (clickedIndex !== currentIndex) {
        // Move clicked image to center
        onIndexChange(clickedIndex);
      } else {
        // Click on center image to navigate directly to edit
        onEditEntry(entries[currentIndex].id);
      }
    }
  }, [currentIndex, onIndexChange, onEditEntry, onAddEntry, entries, totalEntries]);

  const getCarouselImages = () => {
  // 1) No entries: nothing to render in the "entries exist" carousel path
  if (totalEntries === 0) return [];

  const displayImages: Array<{
    src: string | null;
    entry: MatchaEntry | null;
    index: number;
    position: number; // 0 = left, 1 = center, 2 = right
    isNewEntry: boolean;
    isHidden: boolean; // Step 2: prevents pushing "invalid" items without breaking 3-slot layout
  }> = [];

  // Step 4: If there's only 1 entry, avoid duplicates.
  // Show: left hidden, center entry, right "add new"
  if (totalEntries === 1) {
    displayImages.push({
      src: null,
      entry: null,
      index: -1,
      position: 0,
      isNewEntry: false,
      isHidden: true,
    });

    displayImages.push({
      src: entries[0]?.image || null,
      entry: entries[0] ?? null,
      index: 0,
      position: 1,
      isNewEntry: false,
      isHidden: false,
    });

    displayImages.push({
      src: null,
      entry: null,
      index: totalEntries, // index used only for click handler; key uses position for new-entry
      position: 2,
      isNewEntry: true,
      isHidden: false,
    });

    return displayImages;
  }

  // 3-slot carousel for 2+ entries
  for (let position = 0; position < 3; position++) {
    let actualIndex = currentIndex - 1 + position;
    let entry: MatchaEntry | null = null;
    let isNewEntry = false;
    let isHidden = false;

    if (actualIndex >= 0 && actualIndex < totalEntries) {
      // Normal case
      entry = entries[actualIndex];
    } else if (actualIndex >= totalEntries) {
      // Past the end: only show "Add New" on the right slot
      if (position === 2) {
        isNewEntry = true;
        actualIndex = totalEntries;
      } else {
        // Step 2: keep layout stable but mark hidden instead of a "real" item
        actualIndex = -1;
        isHidden = true;
      }
    } else {
      // actualIndex < 0: wrap to end for left slot
      const wrappedIndex = ((actualIndex % totalEntries) + totalEntries) % totalEntries;
      entry = entries[wrappedIndex];
      actualIndex = wrappedIndex;
    }

    displayImages.push({
      src: entry?.image || null,
      entry,
      index: actualIndex,
      position,
      isNewEntry,
      isHidden,
    });
  }

  return displayImages;
  };


  const carouselImages = getCarouselImages();

  // Responsive values with fluid image sizing
  const getResponsiveValues = () => {
    if (isMobile) {
      return {
        headerTop: 'top-6',
        headerFontSize: 'text-[20px]',
        navTop: 'top-[28px]',
        navRight: 'right-4',
        navButtonSize: 'w-[24px] h-[24px]',
        indicatorTop: 'top-[80px]',
        indicatorGap: 'gap-4',
        indicatorSize: 'w-[10px] h-[10px]',
        indicatorPadding: 'py-1',
        carouselTop: 'top-[120px]',
        carouselWidth: 'w-full px-4',
        bottomPadding: 'pb-[120px]', // Match top spacing
        // Fluid responsive sizing based on viewport width
        centerWidth: Math.min(Math.max(window.innerWidth * 0.75, 280), 400),
        centerHeight: Math.min(Math.max(window.innerWidth * 0.95, 355), 507),
        sideWidth: Math.min(Math.max(window.innerWidth * 0.55, 200), 300),
        sideHeight: Math.min(Math.max(window.innerWidth * 0.70, 254), 380),
        translateDistance: Math.min(Math.max(window.innerWidth * 0.4, 120), 200)
      };
    } else if (isTablet) {
      return {
        headerTop: 'top-8',
        headerFontSize: 'text-[24px]',
        navTop: 'top-[36px]',
        navRight: 'right-8',
        navButtonSize: 'w-[28px] h-[28px]',
        indicatorTop: 'top-[100px]',
        indicatorGap: 'gap-5',
        indicatorSize: 'w-[11px] h-[11px]',
        indicatorPadding: 'py-1.5',
        carouselTop: 'top-[140px]',
        carouselWidth: 'w-full px-8',
        bottomPadding: 'pb-[140px]', // Match top spacing
        // Fluid responsive sizing based on viewport width
        centerWidth: Math.min(Math.max(window.innerWidth * 0.5, 350), 500),
        centerHeight: Math.min(Math.max(window.innerWidth * 0.63, 444), 635),
        sideWidth: Math.min(Math.max(window.innerWidth * 0.35, 250), 350),
        sideHeight: Math.min(Math.max(window.innerWidth * 0.44, 317), 444),
        translateDistance: Math.min(Math.max(window.innerWidth * 0.3, 200), 300)
      };
    } else {
      return {
        headerTop: 'top-12',
        headerFontSize: 'text-[30px]',
        navTop: 'top-[52px]',
        navRight: 'right-[66px]',
        navButtonSize: 'w-[31.481px] h-[31.481px]',
        indicatorTop: 'top-[121px]',
        indicatorGap: 'gap-[28px]',
        indicatorSize: 'w-[13px] h-[13px]',
        indicatorPadding: 'py-2',
        carouselTop: 'top-[172px]',
        carouselWidth: 'w-full max-w-[1380px] px-8',
        bottomPadding: 'pb-[172px]', // Match top spacing
        // Fluid responsive sizing based on viewport width with max constraints
        centerWidth: Math.min(Math.max(window.innerWidth * 0.35, 400), 600),
        centerHeight: Math.min(Math.max(window.innerWidth * 0.44, 507), 762),
        sideWidth: Math.min(Math.max(window.innerWidth * 0.25, 300), 450),
        sideHeight: Math.min(Math.max(window.innerWidth * 0.32, 380), 571),
        translateDistance: Math.min(Math.max(window.innerWidth * 0.25, 300), 450)
      };
    }
  };

  const responsive = getResponsiveValues();

  // Calculate total page height to ensure proper bottom padding
  const totalPageHeight = Math.max(
    window.innerHeight,
    (isMobile ? 120 : isTablet ? 140 : 172) + responsive.centerHeight + (isMobile ? 120 : isTablet ? 140 : 172)
  );

  return (
    <div 
      className={`relative w-full bg-[#eddecf] ${responsive.bottomPadding}`}
      style={{ minHeight: `${totalPageHeight}px` }}
    >
      {/* Header */}
      <div className={`absolute ${responsive.headerTop} left-1/2 transform -translate-x-1/2 z-10`}>
        <motion.button
          onClick={() => onNavigateToView('secret')}
          className={`font-['Syne'] font-normal ${responsive.headerFontSize} text-[#342209] tracking-[-2.4px] text-center relative group transition-all duration-300 cursor-pointer`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative">
            Notes of Matcha
          </span>
          {/* Subtle tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-[#342209]/80 text-white/90 rounded-md shadow-lg pointer-events-none ${isMobile ? 'text-xs' : 'text-sm'}`}
          >
            <div className="relative">
              Hidden secrets within...
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#342209]/80 rotate-45" />
            </div>
          </motion.div>
        </motion.button>
      </div>

      {/* Navigation Icons */}
      <div className={`absolute ${responsive.navTop} ${responsive.navRight} flex gap-[8px] z-10`}>
        {/* List View Button */}
        <button 
          onClick={() => onNavigateToView('list')}
          className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center hover:bg-[#4a2f0d] transition-colors`}
        >
          <div className="flex flex-col gap-[2px] items-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-[1px]">
                <div className={`${isMobile ? 'w-[10px] h-[3px]' : isTablet ? 'w-[12px] h-[3.5px]' : 'w-[13.396px] h-[4.019px]'} border border-[#eddecf] rounded-[0.67px]`} />
                <div className={`${isMobile ? 'w-[3px] h-[3px]' : isTablet ? 'w-[3.5px] h-[3.5px]' : 'w-[4.019px] h-[4.019px]'} border border-[#eddecf] rounded-[0.67px]`} />
              </div>
            ))}
          </div>
        </button>

        {/* Grid View Button */}
        <button 
          onClick={() => onNavigateToView('grid')}
          className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center hover:bg-[#4a2f0d] transition-colors`}
        >
          <Group2 />
        </button>
      </div>

      {/* Carousel Indicators - Only show when there are entries */}
      {entries.length > 0 && (
        <div className={`absolute ${responsive.indicatorTop} left-1/2 transform -translate-x-1/2 flex ${responsive.indicatorGap} z-10 max-w-full overflow-x-auto px-4 ${responsive.indicatorPadding}`}>
          {entries.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`${responsive.indicatorSize} rounded-full transition-all duration-300 flex-shrink-0 ${
                index === currentIndex ? 'bg-[#342209]' : 'bg-[#C2B7AB]'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
          {/* Add new entry indicator */}
          <motion.button
            onClick={() => handleCarouselClick(totalEntries, true)}
            className={`${responsive.indicatorSize} rounded-full border-2 border-[#C2B7AB] border-dashed bg-transparent hover:bg-[#C2B7AB]/20 transition-all duration-300 flex-shrink-0`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className={`${isMobile ? 'w-[4px] h-[4px] text-[6px]' : 'w-[6px] h-[6px] text-[8px]'} text-[#C2B7AB] flex items-center justify-center font-bold`}>
                +
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Carousel Container */}
      <div className={`absolute ${responsive.carouselTop} left-1/2 transform -translate-x-1/2 ${responsive.carouselWidth}`} style={{ height: `${responsive.centerHeight}px` }}>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Show centered Frame40 when no entries exist */}
          {entries.length === 0 && (
            <motion.button
              onClick={() => handleCarouselClick(0, true)}
              className="absolute rounded-[7px] overflow-hidden cursor-pointer"
              style={{
                width: `${responsive.centerWidth}px`,
                height: `${responsive.centerHeight}px`,
                zIndex: 10
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut",
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              whileHover={{ 
                scale: 1.02,
                opacity: 0.8
              }}
              whileTap={{ 
                scale: 0.98
              }}
            >
              <Frame40 isNewEntry={true} />
            </motion.button>
          )}
          
          {/* Regular carousel images when entries exist */}
          {entries.length > 0 && carouselImages.map((imageData, idx) => {
            if (imageData.isHidden) return null;
            const isCenter = imageData.position === 1;
            const isLeft = imageData.position === 0;
            const isRight = imageData.position === 2;
            
            // Calculate positions with responsive values
            let translateX = 0;
            let scale = 0.75; // Side images are 75% of center size
            let opacity = isMobile ? 0.6 : 0.4; // Higher opacity on mobile for better visibility
            let zIndex = 5;
            let width = responsive.sideWidth;
            let height = responsive.sideHeight;
            
            if (isCenter) {
              translateX = 0;
              scale = 1;
              opacity = 1;
              zIndex = 10;
              width = responsive.centerWidth;
              height = responsive.centerHeight;
            } else if (isLeft) {
              translateX = -responsive.translateDistance;
              // Hide left image on mobile to save space
              if (isMobile) {
                opacity = 0;
                scale = 0;
              }
            } else if (isRight) {
              translateX = responsive.translateDistance;
            }

            // Handle new entry placeholder
            if (imageData.isNewEntry) {
              return (
                <motion.button
                  key={`new-entry-${imageData.position}`}
                  onClick={() => handleCarouselClick(imageData.index, true)}
                  className="absolute rounded-[7px] overflow-hidden cursor-pointer"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex
                  }}
                  initial={{ 
                    x: translateX,
                    scale: scale,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: translateX,
                    scale: scale,
                    opacity: opacity 
                  }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: isCenter ? 1.02 : 0.78,
                    opacity: isCenter ? 0.8 : 0.6
                  }}
                  whileTap={{ 
                    scale: isCenter ? 0.98 : 0.73
                  }}
                >
                  <Frame40 isNewEntry={true} />
                </motion.button>
              );
            }

            // Skip rendering if no entry data and not new entry
            if (!imageData.entry || imageData.index < 0) {
              return null;
            }

            // Show Frame40 placeholder if there's no image
            if (!imageData.src) {
              return (
                <motion.button
                  key={`${imageData.index}-${imageData.position}`}
                  onClick={() => handleCarouselClick(imageData.index)}
                  className="absolute rounded-[7px] overflow-hidden cursor-pointer"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex
                  }}
                  initial={{ 
                    x: translateX,
                    scale: scale,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: translateX,
                    scale: scale,
                    opacity: opacity 
                  }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: isCenter ? 1.02 : 0.78
                  }}
                  whileTap={{ 
                    scale: isCenter ? 0.98 : 0.73
                  }}
                >
                  <Frame40 />
                </motion.button>
              );
            }

            return (
              <motion.button
                key={`${imageData.index}-${imageData.position}`}
                onClick={() => handleCarouselClick(imageData.index)}
                onMouseEnter={() => setHoveredImageIndex(imageData.index)}
                onMouseLeave={() => setHoveredImageIndex(null)}
                className="absolute rounded-[7px] overflow-hidden border-[2.52px] border-[#c2b7ab] border-solid cursor-pointer"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  zIndex
                }}
                initial={{ 
                  x: translateX,
                  scale: scale,
                  opacity: 0 
                }}
                animate={{ 
                  x: translateX,
                  scale: scale,
                  opacity: opacity 
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeInOut",
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                whileHover={{ 
                  scale: isCenter ? 1.02 : 0.78
                }}
                whileTap={{ 
                  scale: isCenter ? 0.98 : 0.73
                }}
              >
                {/* Background Image or Frame40 Default */}
                {imageData.src ? (
                  <div className={`w-full h-full relative rounded-[5px] overflow-hidden transition-all duration-300 ${
                    hoveredImageIndex === imageData.index ? 'blur-sm opacity-70' : ''
                  }`}>
                    <img
                      src={imageData.src}
                      alt={imageData.entry?.name || 'Matcha'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide the failed image and show Frame40
                        e.currentTarget.style.display = 'none';
                        const frameContainer = e.currentTarget.nextElementSibling as HTMLElement;
                        if (frameContainer) {
                          frameContainer.style.display = 'block';
                        }
                      }}
                    />
                    <div className="absolute inset-0 hidden">
                      <Frame40 />
                    </div>
                  </div>
                ) : (
                  <div className={`w-full h-full transition-all duration-300 ${
                    hoveredImageIndex === imageData.index ? 'blur-sm opacity-70' : ''
                  }`}>
                    <Frame40 />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <AnimatePresence>
                  {hoveredImageIndex === imageData.index && imageData.entry && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-[5px] p-4"
                    >
                      <div className="text-center space-y-2">
                        <div className="font-['Syne'] font-normal text-[20px] text-white tracking-[-1.5px] drop-shadow-lg">
                          {imageData.entry.name}
                        </div>
                        <div className="font-['Syne'] font-normal text-[14px] text-white/90 uppercase tracking-[-0.7px] drop-shadow-lg">
                          {imageData.entry.brand}
                        </div>
                        <div className="flex gap-[6px] justify-center mt-3 flex-wrap">
                          {Object.entries(imageData.entry.flavorProfile)
                            .filter(([_, active]) => active)
                            .map(([flavor, _]) => (
                              <div
                                key={flavor}
                                className="bg-white/90 border border-[#342209] rounded-[10px] px-[6px] py-[1px] h-[20px] flex items-center justify-center"
                              >
                                <span className="font-['Syne'] font-normal text-[12px] text-[#342209] tracking-[-0.9px] uppercase">
                                  {flavor}
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Delete Button - positioned underneath the center image */}
      {entries.length > 0 && entries[currentIndex] && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 z-20`} 
             style={{ 
               top: `${(isMobile ? 120 : isTablet ? 140 : 172) + responsive.centerHeight + 20}px` 
             }}>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteEntry(entries[currentIndex].id);
            }}
            className="bg-[#342209] hover:bg-red-600 transition-colors duration-200 rounded-[2.679px] p-3 shadow-lg flex items-center justify-center group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Trash2 
              size={isMobile ? 16 : isTablet ? 18 : 20} 
              className="text-[#eddecf] group-hover:text-white transition-colors duration-200" 
            />
          </motion.button>
        </div>
      )}

    </div>
  );
}