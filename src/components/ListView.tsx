import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MatchaEntry, ViewType } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import svgPaths from '../imports/svg-6owz6pfb8x';
import Group2 from '../imports/Group2';
import Frame40 from '../imports/Frame40';

interface ListViewProps {
  entries: MatchaEntry[];
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  onNavigateToView: (view: ViewType) => void;
  onEditEntry: (entryId: string) => void;
  onUpdateEntry: (id: string, updates: Partial<MatchaEntry>) => void;
  onAddEntry: (entry: Omit<MatchaEntry, 'id'>) => void;
}

// Shared responsive layout configuration to ensure perfect alignment
const getListItemResponsiveValues = (isMobile: boolean, isTablet: boolean) => {
  if (isMobile) {
    return {
      isMobile: true,
      itemLayout: 'mobile'
    };
  }
  
  return {
    isMobile: false,
    itemWidth: isTablet ? 'w-full max-w-[600px] mx-auto' : 'w-full max-w-[1200px] mx-auto',
    itemHeight: isTablet ? 'h-[100px]' : 'h-[120px]',
    imageSize: isTablet ? 'w-[70px] h-[70px]' : 'w-[85px] h-[85px]',
    imagePosition: isTablet ? 'top-[15px] left-[18px]' : 'top-[18px] left-[22px]',
    namePosition: isTablet ? 'top-[30px] left-[110px]' : 'top-[38px] left-[151px]',
    nameSize: isTablet ? 'text-[24px]' : 'text-[30px]',
    prefecturePosition: isTablet ? 'top-[30px] left-[320px]' : 'top-[38px] left-[440px]',
    prefectureSize: isTablet ? 'text-[11px]' : 'text-[13px]',
    tagPosition: isTablet ? 'top-[30px] right-[150px]' : 'top-[38px] right-[200px]',
    tagGap: isTablet ? 'gap-[6px]' : 'gap-[8.427px]',
    tagSize: isTablet ? 'text-[16px] px-[8px] py-[2px] h-[26px]' : 'text-[19.476px] px-[10.712px] py-[2.921px] h-[30.188px]',
    favoritePosition: isTablet ? 'top-[35px] right-[80px] w-5 h-[18px]' : 'top-[42px] right-[80px] w-6 h-[21.6px]'
  };
};

function ListItem({ entry, onEditEntry, onUpdateEntry, activeFilters }: {
  entry: MatchaEntry;
  onEditEntry: (entryId: string) => void;
  onUpdateEntry: (id: string, updates: Partial<MatchaEntry>) => void;
  activeFilters: string[];
}) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState({
    name: entry.name,
    prefecture: entry.prefecture
  });
  const { isMobile, isTablet } = useResponsive();
  const layout = getListItemResponsiveValues(isMobile, isTablet);

  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateEntry(entry.id, { favorite: !entry.favorite });
  }, [entry.id, entry.favorite, onUpdateEntry]);

  const handleEdit = useCallback((field: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback((field: string) => {
    onUpdateEntry(entry.id, { [field]: localValues[field as keyof typeof localValues] });
    setIsEditing(null);
  }, [entry.id, localValues, onUpdateEntry]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      handleSave(field);
    } else if (e.key === 'Escape') {
      setIsEditing(null);
      setLocalValues({ name: entry.name, prefecture: entry.prefecture });
    }
  }, [handleSave, entry.name, entry.prefecture]);

  const getActiveFlavorProfiles = (): ('grassy' | 'nutty' | 'floral')[] => {
  return Object.entries(entry.flavorProfile)
    .filter(([_, active]) => active)
    .map(([flavor, _]) => flavor as 'grassy' | 'nutty' | 'floral');
  };

  const toggleFlavorProfile = useCallback((flavor: 'grassy' | 'nutty' | 'floral') => {
    onUpdateEntry(entry.id, {
      flavorProfile: {
        ...entry.flavorProfile,
        [flavor]: !entry.flavorProfile[flavor]
      }
    });
  }, [entry.id, entry.flavorProfile, onUpdateEntry]);

  // Responsive layout - mobile uses stacked card layout
  if (isMobile) {
    return (
      <motion.div
        className="relative w-full bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-solid opacity-50 hover:opacity-70 transition-opacity cursor-pointer p-4"
        onClick={() => onEditEntry(entry.id)}
        whileHover={{ scale: 1.005 }}
        layout
      >
        <div className="flex items-start gap-4">
          {/* Image or Frame40 default */}
          <div className="w-[60px] h-[60px] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-solid overflow-hidden flex-shrink-0">
            {entry.image ? (
              <div
                className="w-full h-full bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${entry.image}')` }}
              />
            ) : (
              <div className="w-full h-full scale-[0.3] origin-top-left">
                <Frame40 hideContent={true} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name and Prefecture - Side by side */}
            <div className="flex items-center gap-3 mb-3">
              {/* Name - Editable */}
              <div className="flex-1">
                {isEditing === 'name' ? (
                  <input
                    value={localValues.name}
                    onChange={(e) => handleEdit('name', e.target.value)}
                    onBlur={() => handleSave('name')}
                    onKeyDown={(e) => handleKeyPress(e, 'name')}
                    className="w-full font-['Syne'] font-normal text-[20px] text-[#342209] bg-transparent border-none outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing('name');
                    }}
                    className="
                      w-full 
                      flex items-center justify-start
                      text-left font-['Syne'] font-normal text-[20px] text-[#342209] 
                      hover:bg-white/20 active:bg-white/30
                      rounded transition-all duration-200 ease-in-out
                      px-1 py-1
                      min-w-0 truncate
                      focus:outline-none focus:ring-2 focus:ring-[#7CB342]/50 focus:ring-inset
                      hover:scale-[1.01] active:scale-[0.99]
                    "
                  >
                    {entry.name}
                  </button>
                )}
              </div>

              {/* Prefecture - Editable */}
              <div className="flex-shrink-0">
                {isEditing === 'prefecture' ? (
                  <input
                    value={localValues.prefecture}
                    onChange={(e) => handleEdit('prefecture', e.target.value)}
                    onBlur={() => handleSave('prefecture')}
                    onKeyDown={(e) => handleKeyPress(e, 'prefecture')}
                    className="font-['Syne'] font-normal text-[11px] text-[#342209] uppercase bg-transparent border-none outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing('prefecture');
                    }}
                    className="font-['Syne'] font-normal text-[11px] text-[#342209] uppercase hover:bg-white/20 rounded px-1"
                  >
                    {entry.prefecture}
                  </button>
                )}
              </div>
            </div>

            {/* Flavor profile tags - Interactive */}
            <div className="flex gap-2 flex-wrap">
              {getActiveFlavorProfiles().map((flavor) => (
                <button
                  key={flavor}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFlavorProfile(flavor);
                  }}
                  className={`${
                    activeFilters.includes(flavor.charAt(0).toUpperCase() + flavor.slice(1)) ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
                  } border-[0.974px] border-[#342209] border-solid rounded-[12px] px-[8px] py-[2px] h-[24px] flex items-center justify-center hover:scale-105 transition-transform`}
                >
                  <span className="font-['Syne'] font-normal text-[14px] text-[#342209] tracking-[-1px] uppercase">
                    {flavor}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            className="w-5 h-[18px] z-10 hover:scale-110 transition-transform flex-shrink-0"
          >
            {entry.favorite ? (
              <svg className="w-full h-full" fill="none" viewBox="0 0 28 26">
                <path d={svgPaths.p3a39e200} fill="#342209" />
              </svg>
            ) : (
              <svg className="w-full h-full" fill="none" viewBox="0 0 28 26">
                <path d={svgPaths.p3a39e200} stroke="#342209" strokeWidth="2.4" fill="none" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // Tablet and desktop layout using shared configuration
  return (
    <motion.div
      className={`relative ${layout.itemWidth} ${layout.itemHeight} bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-solid opacity-50 hover:opacity-70 transition-opacity cursor-pointer`}
      onClick={() => onEditEntry(entry.id)}
      whileHover={{ scale: 1.005 }}
      layout
    >
      {/* Image or Frame40 default */}
      <div className={`absolute ${layout.imagePosition} ${layout.imageSize} rounded-[7px] border-[2.52px] border-[#c2b7ab] border-solid overflow-hidden`}>
        {entry.image ? (
          <div
            className="w-full h-full bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('${entry.image}')` }}
          />
        ) : (
          <div className="w-full h-full scale-[0.25] origin-top-left">
            <Frame40 hideContent={true} />
          </div>
        )}
      </div>
      
      {/* Name - Editable */}
      <div className={`absolute ${layout.namePosition} ${isTablet ? 'w-[200px] h-[29px]' : 'w-[280px] h-[35px]'} max-w-[calc(100%-320px)]`}>
        {isEditing === 'name' ? (
          <input
            value={localValues.name}
            onChange={(e) => handleEdit('name', e.target.value)}
            onBlur={() => handleSave('name')}
            onKeyDown={(e) => handleKeyPress(e, 'name')}
            className={`w-full h-full font-['Syne'] font-normal ${layout.nameSize} text-[#342209] bg-transparent border-none outline-none`}
            autoFocus
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing('name');
            }}
            className={`
              w-full h-full 
              flex items-center justify-start
              text-left font-['Syne'] font-normal ${layout.nameSize} text-[#342209] 
              hover:bg-white/20 active:bg-white/30
              rounded transition-all duration-200 ease-in-out
              px-1 py-0
              min-w-0 truncate
              focus:outline-none focus:ring-2 focus:ring-[#7CB342]/50 focus:ring-inset
              hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            {entry.name}
          </button>
        )}
      </div>

      {/* Prefecture - Editable */}
      <div className={`absolute ${layout.prefecturePosition} ${isTablet ? 'w-[100px] h-[29px]' : 'w-[120px] h-[35px]'}`}>
        {isEditing === 'prefecture' ? (
          <input
            value={localValues.prefecture}
            onChange={(e) => handleEdit('prefecture', e.target.value)}
            onBlur={() => handleSave('prefecture')}
            onKeyDown={(e) => handleKeyPress(e, 'prefecture')}
            className={`w-full h-full font-['Syne'] font-normal ${layout.prefectureSize} text-[#342209] uppercase bg-transparent border-none outline-none flex items-end`}
            autoFocus
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing('prefecture');
            }}
            className={`w-full h-full font-['Syne'] font-normal ${layout.prefectureSize} text-[#342209] uppercase hover:bg-white/20 rounded px-1 py-0 flex items-end justify-start`}
          >
            {entry.prefecture}
          </button>
        )}
      </div>

      {/* Flavor profile tags - Interactive */}
      <div className={`absolute ${layout.tagPosition} flex ${layout.tagGap}`}>
        {getActiveFlavorProfiles().map((flavor) => (
          <button
            key={flavor}
            onClick={(e) => {
              e.stopPropagation();
              toggleFlavorProfile(flavor);
            }}
            className={`${
              activeFilters.includes(flavor.charAt(0).toUpperCase() + flavor.slice(1)) ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
            } border-[0.974px] border-[#342209] border-solid rounded-[15.094px] ${layout.tagSize} flex items-center justify-center hover:scale-105 transition-transform`}
          >
            <span className={`font-['Syne'] font-normal text-[#342209] tracking-[-1.5581px] uppercase`}>
              {flavor}
            </span>
          </button>
        ))}
      </div>

      {/* Favorite button */}
      <button
        onClick={toggleFavorite}
        className={`absolute ${layout.favoritePosition} z-10 hover:scale-110 transition-transform`}
      >
        {entry.favorite ? (
          <svg className="w-full h-full" fill="none" viewBox="0 0 28 26">
            <path d={svgPaths.p3a39e200} fill="#342209" />
          </svg>
        ) : (
          <svg className="w-full h-full" fill="none" viewBox="0 0 28 26">
            <path d={svgPaths.p3a39e200} stroke="#342209" strokeWidth="2.4" fill="none" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}

function NewEntryItem({ onAddEntry }: { onAddEntry: (entry: Omit<MatchaEntry, 'id'>) => void }) {
  const { isMobile, isTablet } = useResponsive();
  const layout = getListItemResponsiveValues(isMobile, isTablet);
  
  const handleAddNew = useCallback(() => {
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
    onAddEntry(newEntry);
  }, [onAddEntry]);

  // Mobile layout - match mobile ListItem exactly
  if (isMobile) {
    return (
      <motion.button
        onClick={handleAddNew}
        className="relative w-full bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-dashed opacity-30 hover:opacity-50 transition-opacity cursor-pointer p-4"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-start gap-4">
          {/* Image placeholder - matching ListItem image container */}
          <div className="w-[60px] h-[60px] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-dashed overflow-hidden flex-shrink-0 flex items-center justify-center">
            <div className="font-['Syne_Mono'] text-[24px] text-[#c2b7ab] leading-none">+</div>
          </div>
          
          <div className="flex-1 min-w-0 flex items-center">
            <div className="font-['Syne'] font-normal text-[20px] text-[#c2b7ab]">
              New Entry
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Tablet and desktop layout - use shared responsive configuration
  return (
    <motion.button
      onClick={handleAddNew}
      className={`relative ${layout.itemWidth} ${layout.itemHeight} bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-dashed opacity-30 hover:opacity-50 transition-opacity cursor-pointer`}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Image container - exact same positioning and sizing as ListItem */}
      <div className={`absolute ${layout.imagePosition} ${layout.imageSize} rounded-[7px] border-[2.52px] border-[#c2b7ab] border-dashed overflow-hidden flex items-center justify-center`}>
        <svg className={`${isTablet ? 'w-[35px] h-[35px]' : 'w-[42px] h-[42px]'}`} fill="none" viewBox="0 0 100 100">
          <rect x="42" y="25" width="16" height="50" fill="#c2b7ab" rx="3"/>
          <rect x="25" y="42" width="50" height="16" fill="#c2b7ab" rx="3"/>
        </svg>
      </div>
      
      {/* Name position - exact same positioning and sizing as ListItem */}
      <div className={`absolute ${layout.namePosition} ${isTablet ? 'w-[200px] h-[29px]' : 'w-[280px] h-[35px]'} max-w-[calc(100%-320px)]`}>
        <div className={`w-full h-full flex items-center justify-start font-['Syne'] font-normal ${layout.nameSize} text-[#c2b7ab]`}>
          New Entry
        </div>
      </div>
    </motion.button>
  );
}

export function ListView({ entries, activeFilters, onFiltersChange, onNavigateToView, onEditEntry, onUpdateEntry, onAddEntry }: ListViewProps) {
  const { isMobile, isTablet} = useResponsive();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  
  const toggleFilter = useCallback((filter: string) => {
    if (activeFilters.includes(filter)) {
      onFiltersChange(activeFilters.filter(f => f !== filter));
    } else {
      onFiltersChange([...activeFilters, filter]);
    }
  }, [activeFilters, onFiltersChange]);

  // Responsive values
  const getResponsiveValues = () => {
    if (isMobile) {
      return {
        headerTop: 'top-6',
        headerFontSize: 'text-[20px]',
        navTop: 'top-[28px]',
        navRight: 'right-4',
        navButtonSize: 'w-[24px] h-[24px]',
        filterTop: 'top-[80px]',
        filterGap: 'gap-2',
        filterFontSize: 'text-[16px]',
        filterPadding: 'px-[8px] py-[2px]',
        filterHeight: 'h-[28px]',
        listTop: 'pt-[130px]',
        listPadding: 'px-4',
        listGap: 'space-y-[12px]'
      };
    } else if (isTablet) {
      return {
        headerTop: 'top-8',
        headerFontSize: 'text-[24px]',
        navTop: 'top-[36px]',
        navRight: 'right-8',
        navButtonSize: 'w-[28px] h-[28px]',
        filterTop: 'top-[100px]',
        filterGap: 'gap-[8px]',
        filterFontSize: 'text-[18px]',
        filterPadding: 'px-[10px] py-[2px]',
        filterHeight: 'h-[30px]',
        listTop: 'pt-[150px]',
        listPadding: 'px-8',
        listGap: 'space-y-[15px]'
      };
    } else {
      return {
        headerTop: 'top-12',
        headerFontSize: 'text-[30px]',
        navTop: 'top-[52px]',
        navRight: 'right-[66px]',
        navButtonSize: 'w-[31.481px] h-[31.481px]',
        filterTop: 'top-[118px]',
        filterGap: 'gap-[10px]',
        filterFontSize: 'text-[20px]',
        filterPadding: 'px-[11px] py-[3px]',
        filterHeight: 'h-[31px]',
        listTop: 'pt-[175px]',
        listPadding: 'px-[66px]',
        listGap: 'space-y-[18px]'
      };
    }
  };

  const responsive = getResponsiveValues();

  return (
    <div className="relative w-full min-h-screen bg-[#eddecf] overflow-auto">
      {/* Header */}
      <div className={`absolute ${responsive.headerTop} left-1/2 transform -translate-x-1/2 z-10`}>
        <div className={`font-['Syne'] font-normal ${responsive.headerFontSize} text-[#342209] tracking-[-2.4px] text-center`}>
          Notes of Matcha
        </div>
      </div>

      {/* Navigation Icons */}
      <div className={`absolute ${responsive.navTop} ${responsive.navRight} flex gap-[8px] z-10`}>
        {/* Back Button */}
        <button 
          onClick={() => onNavigateToView('landing')}
          className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center`}
        >
          <svg className={`${isMobile ? 'w-[12px] h-[9px]' : isTablet ? 'w-[15px] h-[11px]' : 'w-[17px] h-[12px]'}`} fill="none" viewBox="0 0 32 24">
            <path d={svgPaths.p20511b00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>

        {/* List View Button - Active */}
        <button className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center`}>
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
          className={`${responsive.navButtonSize} hover:opacity-80 transition-opacity ${isMobile || isTablet ? 'scale-75' : ''}`}
        >
          <Group2 />
        </button>
      </div>

      {/* Filter buttons */}
      <div className={`absolute ${responsive.filterTop} left-1/2 transform -translate-x-1/2 flex ${responsive.filterGap} z-10 flex-wrap justify-center max-w-full px-4`}>
        {['Grassy', 'Nutty', 'Floral'].map((filter) => (
          <button
            key={filter}
            onClick={() => toggleFilter(filter)}
            className={`${
              activeFilters.includes(filter) ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
            } border border-[#342209] rounded-[15.5px] ${responsive.filterPadding} ${responsive.filterHeight} flex items-center justify-center`}
          >
            <span className={`font-['Syne'] font-normal ${responsive.filterFontSize} text-[#342209] tracking-[-1.6px] uppercase`}>
              {filter}
            </span>
          </button>
        ))}
        {/* Favorites filter */}
        <button
          onClick={() => setShowFavoritesOnly(prev => !prev)}
          className={`${
            showFavoritesOnly ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
          } border border-[#342209] rounded-[15.5px] ${responsive.filterPadding} ${responsive.filterHeight} flex items-center justify-center`}
        >
          <svg
            className={isMobile ? 'w-[14px] h-[13px]' : isTablet ? 'w-[16px] h-[14px]' : 'w-[18px] h-[16px]'}
            fill={showFavoritesOnly ? '#342209' : 'none'}
            viewBox="0 0 17 16"
          >
            <path d={svgPaths.p19004b00} stroke="#342209" strokeWidth="1.5" fill={showFavoritesOnly ? '#342209' : 'none'} />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className={`${responsive.listTop} pb-[100px] ${responsive.listPadding}`}>
        <div className={`flex flex-col ${responsive.listGap} items-center`}>
          <NewEntryItem onAddEntry={onAddEntry} />
          <AnimatePresence>
            {(showFavoritesOnly ? entries.filter(e => e.favorite) : entries).map((entry) => (
              <ListItem
                key={entry.id}
                entry={entry}
                onEditEntry={onEditEntry}
                onUpdateEntry={onUpdateEntry}
                activeFilters={activeFilters}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}