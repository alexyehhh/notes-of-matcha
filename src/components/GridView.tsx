import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop, useDragDropManager } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { MatchaEntry, ViewType } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import svgPaths from '../imports/svg-6owz6pfb8x';
import Group2 from '../imports/Group2';
import Frame40 from '../imports/Frame40';
import { ProfileMenu } from './ProfileMenu';
import { Trash2 } from 'lucide-react';

interface GridViewProps {
  entries: MatchaEntry[];
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  onNavigateToView: (view: ViewType) => void;
  onEditEntry: (entryId: string) => void;
  onUpdateEntry: (id: string, updates: Partial<MatchaEntry>) => Promise<void>;
  onAddEntry: (entry: Omit<MatchaEntry, 'id'>) => void;
  onReorderEntries: (entries: MatchaEntry[]) => void;
  onDeleteEntry: (entryId: string) => void;
  onSignOut: () => void;
  onNavigateToProfile: () => void;
}

interface DragItem {
  id: string;
  index: number;
  type: string;
}

function GridCard({ entry, index, moveCard, onDrop, onEditEntry, onUpdateEntry, onRequestDelete, activeFilters }: {
  entry: MatchaEntry;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onDrop: () => void;
  onEditEntry: (entryId: string) => void;
  onUpdateEntry: (id: string, updates: Partial<MatchaEntry>) => Promise<void>;
  onRequestDelete: (id: string) => void;
  activeFilters: string[];
}) {
  const { isMobile, isTablet } = useResponsive();
  const indexRef = useRef(index);
  indexRef.current = index;

  const [{ isDragging }, dragRef] = useDrag({
    type: 'MATCHA_CARD',
    item: () => ({ id: entry.id, index: indexRef.current, type: 'MATCHA_CARD' }),
    end: () => {
      onDrop();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, dropRef] = useDrop({
    accept: 'MATCHA_CARD',
    hover: (item: DragItem) => {
      if (!item || item.index === indexRef.current) return;
      moveCard(item.index, indexRef.current);
      item.index = indexRef.current;
    }
  });

  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateEntry(entry.id, { favorite: !entry.favorite });
  }, [entry.id, entry.favorite, onUpdateEntry]);

  const getActiveFlavorProfiles = () => {
    return Object.entries(entry.flavorProfile)
      .filter(([_, active]) => active)
      .map(([flavor, _]) => flavor);
  };

  // Responsive dimensions
  const cardDimensions = isMobile 
    ? { width: 'w-full max-w-[300px]', height: 'h-[320px]' }
    : isTablet 
    ? { width: 'w-[240px]', height: 'h-[330px]' }
    : { width: 'w-[260px]', height: 'h-[357px]' };

  const imageDimensions = isMobile 
    ? { top: 'top-[16px]', left: 'left-[16px]', width: 'w-[calc(100%-32px)]', height: 'h-[180px]' }
    : isTablet 
    ? { top: 'top-[17px]', left: 'left-[20px]', width: 'w-[200px]', height: 'h-[200px]' }
    : { top: 'top-[19px]', left: 'left-[22px]', width: 'w-[215px]', height: 'h-[214px]' };

  const tagPosition = isMobile 
    ? { top: 'top-[160px]', left: 'left-[20px]' }
    : isTablet 
    ? { top: 'top-[180px]', left: 'left-[32px]' }
    : { top: 'top-[198px]', left: 'left-[39px]' };

  const favoritePosition = isMobile 
    ? { top: 'top-6', right: 'right-6', size: 'w-[12px] h-[11px]' }
    : isTablet 
    ? { top: 'top-7', right: 'right-7', size: 'w-[14px] h-[12.5px]' }
    : { top: 'top-9', right: 'right-9', size: 'w-[15px] h-[13.5px]' };

  const barPosition = isMobile 
    ? { bottom: 'bottom-[15px]', left: 'left-[20px]', width: 'w-[50px]' }
    : isTablet 
    ? { bottom: 'bottom-[16px]', left: 'left-[20px]', width: 'w-[55px]' }
    : { bottom: 'bottom-[18px]', left: 'left-[22px]', width: 'w-[63px]' };

  const deletePosition = isMobile 
    ? { bottom: 'bottom-[15px]', right: 'right-[20px]' }
    : isTablet 
    ? { bottom: 'bottom-[16px]', right: 'right-[20px]' }
    : { bottom: 'bottom-[18px]', right: 'right-[22px]' };

  const deleteIconSize = isMobile ? 14 : isTablet ? 16 : 18;

  return (
    <div
      ref={(node) => dragRef(dropRef(node)) as any}
      onClick={() => onEditEntry(entry.id)}
      className={`relative ${cardDimensions.width} ${cardDimensions.height} bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-solid cursor-grab transition-opacity hover:opacity-90 ${
        isDragging ? 'opacity-30' : 'opacity-60'
      }`}
    >
      {/* Image or Frame40 default */}
      <div className={`absolute ${imageDimensions.top} ${imageDimensions.left} ${imageDimensions.width} ${imageDimensions.height} rounded-[4px] border-[2.52px] border-[#f6ebe1] border-solid overflow-hidden`}>
        {entry.image ? (
          <div
            className="w-full h-full bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('${entry.image}')` }}
          />
        ) : (
          <div className="w-full h-full scale-[0.4] origin-top-left">
            <Frame40 hideContent={true} />
          </div>
        )}
      </div>
      
      {/* Entry name for all screen sizes */}
      <div className={`absolute ${
        isMobile 
          ? 'top-[210px] left-[20px] right-[20px]' 
          : isTablet 
          ? 'bottom-[45px] left-[20px] right-[20px]'
          : 'bottom-[50px] left-[22px] right-[22px]'
      }`}>
        <div className={`capitalize font-['Syne'] font-normal ${
          isMobile ? 'text-[16px]' : isTablet ? 'text-[18px]' : 'text-[19px]'
        } text-[#342209] text-left`}>
          {entry.name}
        </div>
        <div className={`font-['Syne'] font-normal ${
          isMobile ? 'text-[10px]' : isTablet ? 'text-[11px]' : 'text-[12px]'
        } text-[#342209] uppercase text-left`}>
          {entry.brand}
        </div>
      </div>
      
      {/* Flavor profile tags */}
      <div className={`absolute ${tagPosition.top} ${tagPosition.left} flex gap-[5px] flex-wrap`}>
        {getActiveFlavorProfiles().slice(0, 2).map((flavor) => (
          <div
            key={flavor}
            className={`${
              activeFilters.includes(flavor.charAt(0).toUpperCase() + flavor.slice(1)) ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
            } border-[0.578px] border-[#342209] border-solid rounded-[8.956px] ${
              isMobile ? 'px-[5px] py-[1px] h-[16px]' : 'px-[6.356px] py-[1.733px] h-[17.913px]'
            } flex items-center justify-center`}
          >
            <span className={`font-['Syne'] font-normal ${
              isMobile ? 'text-[10px]' : 'text-[11.557px]'
            } text-[#342209] tracking-[-0.9245px] uppercase`}>
              {flavor}
            </span>
          </div>
        ))}
      </div>

      {/* Favorite button */}
      <button
        onClick={toggleFavorite}
        className={`absolute ${favoritePosition.top} ${favoritePosition.right} ${favoritePosition.size} z-10`}
      >
        {entry.favorite ? (
          <svg className="w-full h-full" fill="none" viewBox="0 0 15 14">
            <path d={svgPaths.p769bb70} fill="#342209" />
          </svg>
        ) : (
          <svg className="w-full h-full" fill="none" viewBox="0 0 17 16">
            <path d={svgPaths.p19004b00} stroke="#342209" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </button>

      {/* Taste analysis bars */}
      <div className={`absolute ${barPosition.bottom} ${barPosition.left} space-y-[2px]`}>
        {Object.entries(entry.tasteAnalysis).map(([taste, value]) => (
          <div key={taste} className="flex items-center gap-1">
            <div className={`${barPosition.width} h-1 bg-[#dcd1c6] rounded-[8px]`}>
              <div 
                className="h-full bg-[#c2b7ab] rounded-[8px] transition-all duration-300"
                style={{ width: `${(value / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(entry.id);
        }}
        className={`absolute ${deletePosition.bottom} ${deletePosition.right} z-10 hover:scale-110 transition-transform`}
      >
        <Trash2 size={deleteIconSize} className="text-[#342209]" strokeWidth={2} />
      </button>
    </div>
  );
}

function NewEntryCard({ onAddEntry }: { onAddEntry: (entry: Omit<MatchaEntry, 'id'>) => void }) {
  const { isMobile, isTablet } = useResponsive();
  
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

  const cardDimensions = isMobile 
    ? { width: 'w-full max-w-[300px]', height: 'h-[320px]' }
    : isTablet 
    ? { width: 'w-[240px]', height: 'h-[330px]' }
    : { width: 'w-[260px]', height: 'h-[357px]' };

  const plusPosition = isMobile 
    ? { top: 'top-[80px]', fontSize: 'text-[80px]' }
    : isTablet 
    ? { top: 'top-[90px]', fontSize: 'text-[90px]' }
    : { top: 'top-[100px]', fontSize: 'text-[100px]' };

  const textPosition = isMobile 
    ? { top: 'top-[180px]', fontSize: 'text-[18px]' }
    : isTablet 
    ? { top: 'top-[200px]', fontSize: 'text-[19px]' }
    : { top: 'top-[220px]', fontSize: 'text-[20px]' };

  return (
    <motion.button
      onClick={handleAddNew}
      className={`relative ${cardDimensions.width} ${cardDimensions.height} bg-[#fff9f3] rounded-[7px] border-[2.52px] border-[#c2b7ab] border-dashed opacity-30 hover:opacity-50 transition-opacity cursor-pointer`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute ${plusPosition.top} left-1/2 transform -translate-x-1/2 font-['Syne_Mono'] ${plusPosition.fontSize} text-[#c2b7ab] tracking-[-8px] uppercase`}>
        +
      </div>
      <div className={`absolute ${textPosition.top} left-1/2 transform -translate-x-1/2 font-['Syne'] font-normal ${textPosition.fontSize} text-[#c2b7ab]`}>
        New Entry
      </div>
    </motion.button>
  );
}

function GridViewContent({ entries, activeFilters, onFiltersChange, onNavigateToView, onEditEntry, onUpdateEntry, onAddEntry, onReorderEntries, onDeleteEntry, onSignOut, onNavigateToProfile }: GridViewProps) {
  const [localEntries, setLocalEntries] = useState(entries);
  const localEntriesRef = useRef(entries);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete);
    }
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  const { isMobile, isTablet } = useResponsive();
  const dragDropManager = useDragDropManager();
  const isDragging = dragDropManager.getMonitor().isDragging();

  // Sync with parent `entries` prop, but not while dragging.
  // This allows local reordering to work smoothly, while still
  // receiving updates from parent (e.g. favorite status change).
  React.useEffect(() => {
    if (!isDragging) {
      setLocalEntries(entries);
      localEntriesRef.current = entries;
    }
  }, [entries, isDragging]);

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    const newEntries = [...localEntriesRef.current];
    const draggedEntry = newEntries[dragIndex];
    newEntries.splice(dragIndex, 1);
    newEntries.splice(hoverIndex, 0, draggedEntry);
    localEntriesRef.current = newEntries;
    setLocalEntries([...newEntries]);
  }, []);

  const handleDrop = useCallback(() => {
    onReorderEntries(localEntriesRef.current);
  }, [onReorderEntries]);

  const toggleFilter = useCallback((filter: string) => {
    if (activeFilters.includes(filter)) {
      onFiltersChange(activeFilters.filter(f => f !== filter));
    } else {
      onFiltersChange([...activeFilters, filter]);
    }
  }, [activeFilters, onFiltersChange]);

  // Apply filters visually — drag still uses full localEntries
  const displayEntries = localEntries.filter(entry => {
    const passesFlavorFilter = activeFilters.length === 0 || activeFilters.some(filter =>
      entry.flavorProfile[filter.toLowerCase() as keyof typeof entry.flavorProfile]
    );
    const passesFavoriteFilter = !showFavoritesOnly || entry.favorite;
    return passesFlavorFilter && passesFavoriteFilter;
  });

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
        gridTop: 'pt-[130px]',
        gridPadding: 'px-4',
        gridCols: 'grid-cols-1',
        gridGap: 'gap-4',
        cardWidth: 'w-full max-w-[300px]',
        cardHeight: 'h-[320px]',
        nameTop: 'top-[380px]',
        nameLeft: 'left-4',
        nameWidth: 'w-full max-w-[300px]',
        nameFontSize: 'text-[18px]',
        prefectureFontSize: 'text-[10px]'
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
        gridTop: 'pt-[150px]',
        gridPadding: 'px-8',
        gridCols: 'grid-cols-2',
        gridGap: 'gap-5',
        cardWidth: 'w-[240px]',
        cardHeight: 'h-[330px]',
        nameTop: 'top-[390px]',
        nameLeft: 'left-8',
        nameWidth: 'w-[240px]',
        nameFontSize: 'text-[19px]',
        prefectureFontSize: 'text-[11px]'
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
        gridTop: 'pt-[175px]',
        gridPadding: 'px-8',
        gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        gridGap: 'gap-[20px]',
        cardWidth: 'w-[260px]',
        cardHeight: 'h-[357px]',
        nameTop: 'top-[418px]',
        nameLeft: 'left-[66px]',
        nameWidth: 'w-[260px]',
        nameFontSize: 'text-[20px]',
        prefectureFontSize: 'text-[12px]'
      };
    }
  };

  const responsive = getResponsiveValues();

  return (
    <div className="relative w-full min-h-screen bg-[#eddecf] overflow-auto">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 shadow-xl border border-white/60 max-w-sm w-full"
            >
              <h3 className="text-lg font-medium text-[#342209] mb-2">Are you sure you want to delete this entry?</h3>
              <p className="text-sm text-[#342209]/70 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm rounded-lg border border-[#342209]/20 text-[#342209] hover:bg-[#342209]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className={`absolute ${responsive.headerTop} left-1/2 transform -translate-x-1/2 z-10`}>
        <div className={`font-['Syne'] font-normal ${responsive.headerFontSize} text-[#342209] tracking-[-2.4px] text-center`}>
          Notes of Matcha
        </div>
      </div>

      {/* Navigation Icons */}
      <div className={`absolute ${responsive.navTop} ${responsive.navRight} flex gap-[8px] z-10`}>
        {/* Home Button */}
        <button 
          onClick={() => onNavigateToView('landing')}
          className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center hover:bg-[#4a2f0d] transition-colors`}
        >
          <svg className={`${isMobile ? 'w-[12px] h-[12px]' : isTablet ? 'w-[14px] h-[14px]' : 'w-[16px] h-[16px]'}`} fill="none" viewBox="0 0 24 24" stroke="#eddecf" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* List View Button */}
        <button 
          onClick={() => onNavigateToView('list')}
          className={`bg-[#342209] rounded-[2.679px] ${responsive.navButtonSize} flex items-center justify-center`}
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

        {/* Grid View Button - Active */}
        <button className={`${responsive.navButtonSize} ${isMobile || isTablet ? 'scale-75' : ''}`}>
          <Group2 />
        </button>

        {/* Profile Menu */}
        <ProfileMenu
          buttonSize={responsive.navButtonSize}
          onSignOut={onSignOut}
          onNavigateToProfile={onNavigateToProfile}
        />
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
            fill="none"
            viewBox="0 0 17 16"
          >
            <path d={svgPaths.p19004b00} stroke="#342209" strokeWidth="1.5" fill={showFavoritesOnly ? '#342209' : 'none'} />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className={`${responsive.gridTop} pb-[100px] ${responsive.gridPadding}`}>
        <div className={`grid ${responsive.gridCols} ${responsive.gridGap} justify-items-center`}>
          <NewEntryCard onAddEntry={onAddEntry} />
          {displayEntries.map((entry) => {
            const dragIndex = localEntriesRef.current.findIndex(e => e.id === entry.id);
            return (
              <GridCard
                key={entry.id}
                entry={entry}
                index={dragIndex}
                moveCard={moveCard}
                onDrop={handleDrop}
                onEditEntry={onEditEntry}
                onUpdateEntry={onUpdateEntry}
                onRequestDelete={(id) => {
                  setEntryToDelete(id);
                  setShowDeleteConfirm(true);
                }}
                activeFilters={activeFilters}
              />
            );
          })}
        </div>
      </div>


    </div>
  );
}

export function GridView(props: GridViewProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <GridViewContent {...props} />
    </DndProvider>
  );
}
