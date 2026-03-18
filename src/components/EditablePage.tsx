import { useState, useCallback, useEffect } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
// import { toast } from "sonner@2.0.3";
import { toast } from "sonner";
import type { MatchaEntry, ViewType } from '../types';
import { InteractiveRadarChart } from './InteractiveRadarChart';
import { useResponsive } from '../hooks/useResponsive';

import { Trash2 } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ProfileMenu } from './ProfileMenu';
import svgPathsFrame27 from '../imports/svg-tkzjn83enc';
import { uploadEntryImage } from '../lib/images';
import Frame40 from '../imports/Frame40';
import Group2 from '../imports/Group2';
import Frame8 from '../imports/Frame8';

interface EditablePageProps {
  entry: MatchaEntry;
  entryIndex: number;
  totalEntries: number;
  onUpdateEntry: (id: string, updates: Partial<MatchaEntry>) => Promise<void>;
  onNavigateToView: (view: ViewType) => void;
  onSwitchToEntry: (entryIndex: number) => void;
  onSignOut: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export function EditablePage({ entry, entryIndex, totalEntries, onUpdateEntry, onNavigateToView, onSwitchToEntry, onSignOut, onDeleteEntry }: EditablePageProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
  ];
  const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
  
  // Local state for all editable fields
  const [localName, setLocalName] = useState(entry.name);
  const [localBrand, setLocalBrand] = useState(entry.brand);
  const [localPrefecture, setLocalPrefecture] = useState(entry.prefecture);
  const [localNotes, setLocalNotes] = useState(entry.notes);
  const [localFlavorProfile, setLocalFlavorProfile] = useState(entry.flavorProfile);
  const [localTasteAnalysis, setLocalTasteAnalysis] = useState(entry.tasteAnalysis);
  const [localColor, setLocalColor] = useState(entry.color);
  const [localFavorite, setLocalFavorite] = useState(entry.favorite);
  
  // Track if changes have been made
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local state when entry changes (e.g., switching entries)
  useEffect(() => {
    setLocalName(entry.name);
    setLocalBrand(entry.brand);
    setLocalPrefecture(entry.prefecture);
    setLocalNotes(entry.notes);
    setLocalFlavorProfile(entry.flavorProfile);
    setLocalTasteAnalysis(entry.tasteAnalysis);
    setLocalColor(entry.color);
    setLocalFavorite(entry.favorite);
    setHasUnsavedChanges(false);
  }, [entry.id, entry.name, entry.brand, entry.prefecture, entry.notes, entry.flavorProfile, entry.tasteAnalysis, entry.color, entry.favorite]);

  // Manual save function
  const handleSave = useCallback(() => {
    setIsSaving(true);
    
    const updates: Partial<MatchaEntry> = {
      name: localName,
      brand: localBrand,
      prefecture: localPrefecture,
      notes: localNotes,
      flavorProfile: localFlavorProfile,
      tasteAnalysis: localTasteAnalysis,
      color: localColor,
      favorite: localFavorite
    };
    
    onUpdateEntry(entry.id, updates);
    setHasUnsavedChanges(false);
    
    // Brief saving indicator
    setTimeout(() => {
      setIsSaving(false);
    }, 300);
  }, [entry.id, onUpdateEntry, localName, localBrand, localPrefecture, localNotes, localFlavorProfile, localTasteAnalysis, localColor, localFavorite]);

  // Function to mark changes as unsaved
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleDeleteConfirm = () => {
    onDeleteEntry(entry.id);
    setShowDeleteConfirm(false);
    onNavigateToView('landing');
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleFlavorProfileToggle = useCallback((flavor: 'grassy' | 'nutty' | 'floral') => {
    const newFlavorProfile = {
      ...localFlavorProfile,
      [flavor]: !localFlavorProfile[flavor]
    };
    setLocalFlavorProfile(newFlavorProfile);
    markAsChanged();
  }, [localFlavorProfile, markAsChanged]);

  const handleTasteAnalysisChange = useCallback((newTasteAnalysis: typeof entry.tasteAnalysis) => {
    setLocalTasteAnalysis(newTasteAnalysis);
    markAsChanged();
  }, [markAsChanged]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasAllowedMime = file.type && ALLOWED_IMAGE_MIME_TYPES.includes(file.type);

    // Validate image file
    if (!file.type.startsWith('image/') || (!hasAllowedMime && !hasAllowedExtension)) {
      toast.error("Please select a valid image file (JPG, PNG, or HEIC)", {
        duration: 3000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #d4183d',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 5MB). Please choose a smaller file.", {
        duration: 3000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #d4183d',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });
      return;
    }

    setIsProcessingImage(true);

    try {
      setIsSaving(true);
      const { path, signedUrl } = await uploadEntryImage(file, entry.id);
      await onUpdateEntry(entry.id, { image: signedUrl, imagePath: path });
      setTimeout(() => setIsSaving(false), 300);

      // Show upload success toast
      toast.success("Image uploaded successfully", {
        duration: 2000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #7CB342',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });

      // Start both OCR and reverse image search in parallel
      toast.info("Analyzing image: extracting text and searching for matches...", {
        duration: 3000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #7CB342',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });

      // Image analysis not yet implemented
      setIsProcessingImage(false);
      toast.info("Image analysis coming soon.", {
        duration: 3000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #7CB342',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });
    } catch (error) {
      console.error('Error processing image:', error);
      setIsSaving(false);
      setIsProcessingImage(false);
      
      // Show detailed error based on error type
      let errorMessage = "Failed to process image";
      if (error instanceof Error) {
        if (error.message.includes('OCR')) {
          errorMessage = "Text extraction failed. Please try with a clearer image.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection and try again.";
        } else {
          errorMessage = "Image analysis failed - please try with a different image.";
        }
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #d4183d',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });
    }
  }, [entry.id, onUpdateEntry, entry.flavorProfile]);

  const handleTranslateName = useCallback(async () => {
    if (!localName || isTranslating) return;

    setIsTranslating(true);
    
    try {
      // Simulate translation API call (in real app, would use Google Translate API)
      setTimeout(() => {
        // Mock translation for Japanese text
        const translations: Record<string, string> = {
          '抹茶道楽 特級品': 'Premium Matcha Connoisseur',
          '宇治の香り': 'Fragrance of Uji',
          '京都伝統': 'Kyoto Traditional',
          '特選抹茶': 'Special Selection Matcha'
        };

        const translation = translations[localName] || `Translated: ${localName}`;
        setLocalName(translation);
        markAsChanged();
        setIsTranslating(false);
        
        toast.success("Translation complete", {
          duration: 2000,
          style: {
            background: '#342209',
            color: '#fff9f3',
            border: '1px solid #7CB342',
            borderRadius: '6px',
            fontFamily: 'Syne, sans-serif',
          },
        });
      }, 1000);
    } catch (error) {
      console.error('Translation error:', error);
      setIsTranslating(false);
    }
  }, [localName, isTranslating, markAsChanged]);

  const detectJapaneseText = useCallback((text: string) => {
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return japaneseRegex.test(text);
  }, []);

  const imageSrc = entry.image;

  // Responsive values
  const getResponsiveValues = () => {
    if (isMobile) {
      return {
        headerTop: 'top-6',
        headerFontSize: 'text-[20px]',
        navTop: 'top-[28px]',
        navRight: 'right-4',
        navButtonSize: 'w-[24px] h-[24px]',
        saveStatusTop: 'top-[28px]',
        saveStatusRight: 'right-[140px]',
        saveStatusSize: 'text-[10px] px-2 py-1',
        indicatorTop: 'top-[80px]',
        indicatorGap: 'gap-4',
        indicatorSize: 'w-[10px] h-[10px]',
        contentTop: 'pt-[120px]',
        contentPadding: 'px-4',
        contentLayout: 'flex-col',
        contentGap: 'gap-6',
        imageSize: 'w-full max-w-[300px] h-[240px]',
        formWidth: 'w-full max-w-[400px]',
        formHeight: 'h-auto'
      };
    } else if (isTablet) {
      return {
        headerTop: 'top-8',
        headerFontSize: 'text-[24px]',
        navTop: 'top-[36px]',
        navRight: 'right-8',
        navButtonSize: 'w-[28px] h-[28px]',
        saveStatusTop: 'top-[36px]',
        saveStatusRight: 'right-[180px]',
        saveStatusSize: 'text-[11px] px-2.5 py-1',
        indicatorTop: 'top-[100px]',
        indicatorGap: 'gap-5',
        indicatorSize: 'w-[11px] h-[11px]',
        contentTop: 'pt-[140px]',
        contentPadding: 'px-8',
        contentLayout: 'flex-col lg:flex-row',
        contentGap: 'gap-8',
        imageSize: 'w-full max-w-[400px] h-[320px]',
        formWidth: 'w-full max-w-[500px]',
        formHeight: 'h-auto'
      };
    } else {
      return {
        headerTop: 'top-12',
        headerFontSize: 'text-[30px]',
        navTop: 'top-[52px]',
        navRight: 'right-[66px]',
        navButtonSize: 'w-[31.481px] h-[31.481px]',
        saveStatusTop: 'top-[52px]',
        saveStatusRight: 'right-[240px]',
        saveStatusSize: 'text-[12px] px-3 py-1',
        indicatorTop: 'top-[121px]',
        indicatorGap: 'gap-[28px]',
        indicatorSize: 'w-[13px] h-[13px]',
        contentTop: 'pt-[172px]',
        contentPadding: 'px-[66px]',
        contentLayout: 'flex-row',
        contentGap: 'gap-[50px]',
        imageSize: 'w-[506px] h-[642px]',
        formWidth: 'w-[507px]',
        formHeight: 'h-[641px]'
      };
    }
  };

  const responsive = getResponsiveValues();

  return (
    <div className="relative w-full min-h-screen bg-[#eddecf] pb-20">
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
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
        <div className={`font-['Syne'] font-normal ${responsive.headerFontSize} text-[#342209] tracking-[-2.4px]`}>
          Notes of Matcha
        </div>
      </div>

      {/* Save Status */}
      <div className={`absolute ${responsive.saveStatusTop} ${responsive.saveStatusRight} z-10 flex items-center gap-2`}>
        {hasUnsavedChanges && (
          <div className={`bg-[#f39c12] ${responsive.saveStatusSize} rounded-[4px] flex items-center gap-2`}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="font-['Syne'] font-normal text-white">Unsaved changes</span>
          </div>
        )}
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
          className={`${responsive.navButtonSize} hover:opacity-80 transition-opacity ${isMobile || isTablet ? 'scale-75' : ''}`}
        >
          <Group2 />
        </button>

        {/* Profile Menu */}
        <ProfileMenu
          buttonSize={responsive.navButtonSize}
          onSignOut={onSignOut}
          onNavigateToProfile={() => onNavigateToView('profile')}
        />
      </div>

      {/* Carousel Indicators - showing active entry */}
      <div className={`absolute ${responsive.indicatorTop} left-1/2 transform -translate-x-1/2 flex ${responsive.indicatorGap} z-10 max-w-full overflow-x-auto px-4`}>
        {/* Show dots for all entries with the current one highlighted */}
        {Array.from({ length: totalEntries }, (_, index) => (
          <button
            key={index}
            onClick={() => onSwitchToEntry(index)}
            className={`${responsive.indicatorSize} rounded-full transition-all duration-300 cursor-pointer hover:scale-110 flex-shrink-0 ${
              index === entryIndex ? 'bg-[#342209]' : 'bg-[#C2B7AB] hover:bg-[#988479]'
            }`}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className={`${responsive.contentTop} ${responsive.contentPadding} w-full`}>
        <div className={`flex ${responsive.contentLayout} ${responsive.contentGap} items-center justify-center w-full max-w-7xl mx-auto`}>
          
          {/* Left placeholder image - only show on desktop */}
          {isDesktop && (
            <motion.button
              onClick={() => {
                const prevIndex = entryIndex - 1;
                if (prevIndex >= 0) {
                  onSwitchToEntry(prevIndex);
                  toast.success(`Switched to entry ${prevIndex + 1}`, {
                    duration: 1500,
                    style: {
                      background: '#342209',
                      color: '#fff9f3',
                      border: '1px solid #7CB342',
                      borderRadius: '6px',
                      fontFamily: 'Syne, sans-serif',
                    },
                  });
                }
              }}
              disabled={entryIndex === 0}
              className={`bg-[#fff9f3] h-[642px] rounded-[7px] w-[506px] shrink-0 relative group transition-all duration-300 ${
                entryIndex === 0 
                  ? 'opacity-15 cursor-not-allowed' 
                  : 'opacity-30 hover:opacity-50 cursor-pointer hover:scale-[1.005]'
              }`}
              whileHover={entryIndex > 0 ? { scale: 1.005 } : {}}
              whileTap={entryIndex > 0 ? { scale: 0.995 } : {}}
            >
              <div className={`border-[2.52px] border-solid inset-0 pointer-events-none rounded-[7px] w-full h-full transition-colors duration-300 ${
                entryIndex > 0 ? 'border-[#c2b7ab] group-hover:border-[#7CB342]' : 'border-[#c2b7ab]'
              }`} />
              
              {/* Navigation hint overlay */}
              {entryIndex > 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-[#342209]/80 text-white px-6 py-3 rounded-lg font-['Syne'] text-center backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <div>
                        <div className="text-sm">Previous Entry</div>
                        <div className="text-xs opacity-75">{entryIndex} of {totalEntries}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Disabled state overlay */}
              {entryIndex === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#c2b7ab]/60 text-[#342209] px-6 py-3 rounded-lg font-['Syne'] text-center">
                    <div className="text-sm opacity-70">First Entry</div>
                    <div className="text-xs opacity-50">No previous entries</div>
                  </div>
                </div>
              )}
            </motion.button>
          )}

          {/* Main content area with image and form */}
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'gap-6' : 'gap-[13px]'} items-center justify-center shrink-0 w-full`}>
            {/* Main image/upload placeholder */}
            <div className={`rounded-[7px] overflow-hidden border-[2.52px] border-[#c2b7ab] border-solid ${responsive.imageSize} shrink-0 relative group mx-auto`}>
              {imageSrc ? (
                <div
                  className="w-full h-full bg-center bg-cover bg-no-repeat rounded-[5px]"
                  style={{ backgroundImage: `url('${imageSrc}')` }}
                />
              ) : (
                <Frame40 />
              )}
              
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[7px] flex items-center justify-center">
                <label className={`cursor-pointer bg-[#7CB342] text-white px-4 py-2 rounded font-['Syne'] text-sm hover:bg-[#689F38] transition-colors ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>{isProcessingImage ? 'Analyzing...' : 'Upload & Analyze'}</span>
                    <span className="text-xs opacity-80">{isProcessingImage ? 'Reading text & matching...' : 'OCR + product search'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isProcessingImage}
                  />
                </label>
              </div>

              {/* Processing indicator */}
              {isProcessingImage && (
                <div className="absolute top-4 left-4 bg-[#7CB342] text-white px-3 py-2 rounded text-xs font-['Syne'] flex items-center gap-2 shadow-lg">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex flex-col">
                    <span>Smart Image Analysis</span>
                    <span className="text-xs opacity-80">OCR + Product Search</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form panel */}
            <div className={`${responsive.formWidth} ${responsive.formHeight} shrink-0 mx-auto`}>
              <div className={`${responsive.formHeight === 'h-auto' ? 'h-auto' : responsive.formHeight} overflow-x-clip ${responsive.formHeight === 'h-auto' ? '' : 'overflow-y-auto'} relative w-full`}>
                <div className={`bg-[#fff9f3] ${responsive.formHeight === 'h-auto' ? 'min-h-[600px] p-6' : 'h-[715px]'} rounded-[6px] w-full relative`}>
                  {/* Form Content */}
                  <div 
                    className={`${responsive.formHeight === 'h-auto' ? 'relative' : 'absolute'} content-stretch flex flex-col gap-[31px] items-start justify-start ${responsive.formHeight === 'h-auto' ? '' : 'translate-x-[-50%] translate-y-[-50%]'} w-full max-w-[432px] mx-auto`}
                    style={responsive.formHeight === 'h-auto' ? {} : { top: 'calc(50% + 0.644px)', left: 'calc(50% + 3.5px)' }}
                  >
                    {/* Frame36 - Top Section */}
                    <div className="content-stretch flex flex-col gap-[18px] items-start justify-start relative shrink-0 w-[409px]">
                      {/* Frame30 - Name and Prefecture */}
                      <div className="content-stretch flex flex-col gap-[7px] items-start justify-start relative shrink-0 w-full">
                        {/* Frame28 - Name with Translation */}
                        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                          <div className="flex items-center flex-1 gap-2">
                            <input
                              value={localName}
                              onChange={(e) => {
                                setLocalName(e.target.value);
                                markAsChanged();
                              }}
                              className="font-['Syne:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#c2b7ab] text-[30px] text-nowrap tracking-[-2.4px] bg-transparent border-none outline-none flex-1 text-[rgba(52,34,9,1)]"
                              placeholder="Name of matcha"
                            />
                            {detectJapaneseText(localName) && (
                              <button
                                onClick={handleTranslateName}
                                disabled={isTranslating}
                                className="px-2 py-1 text-[10px] bg-[#7CB342] text-white rounded hover:bg-[#689F38] transition-colors disabled:opacity-50"
                                title="Translate to English"
                              >
                                {isTranslating ? '...' : '翻��'}
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              setLocalFavorite(!localFavorite);
                              markAsChanged();
                            }}
                            className="h-[18px] relative shrink-0 w-5"
                          >
                            <div className="absolute inset-[-5.56%_-5%_-7.45%_-5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 21">
                                <path d={svgPathsFrame27.p33733d00} stroke="#342209" strokeWidth="2" fill={localFavorite ? '#342209' : 'none'} />
                              </svg>
                            </div>
                          </button>
                        </div>
                        
                        {/* Frame29 - Brand and Prefecture */}
                        <div className="content-stretch flex font-['Syne:Regular',_sans-serif] font-normal items-center justify-between leading-[0] relative shrink-0 text-[#c2b7ab] text-[25px] text-nowrap tracking-[-2px] w-[323.678px]">
                          <input
                            value={localBrand}
                            onChange={(e) => {
                              setLocalBrand(e.target.value);
                              markAsChanged();
                            }}
                            className="relative shrink-0 bg-transparent border-none outline-none font-['Syne:Regular',_sans-serif] font-normal text-[#c2b7ab] text-[25px] tracking-[-2px] text-[rgba(52,34,9,1)]"
                            placeholder="Brand"
                          />
                          <input
                            value={localPrefecture}
                            onChange={(e) => {
                              setLocalPrefecture(e.target.value);
                              markAsChanged();
                            }}
                            className="relative shrink-0 bg-transparent border-none outline-none font-['Syne:Regular',_sans-serif] font-normal text-[#c2b7ab] text-[25px] tracking-[-2px] text-[rgba(52,34,9,1)]"
                            placeholder="Prefecture"
                          />
                        </div>
                      </div>

                      {/* Frame31 - Flavor Profile */}
                      <div className="content-stretch flex flex-col gap-[7px] items-start justify-start leading-[0] relative shrink-0 w-[276.03px]">
                        <div className="font-['Syne:Regular',_sans-serif] font-normal min-w-full relative shrink-0 text-[#c2b7ab] text-[20px] tracking-[-1.6px]" style={{ width: "min-content" }}>
                          <p className="leading-[normal]">Flavor Profile</p>
                        </div>
                        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
                          {(['grassy', 'nutty', 'floral'] as const).map((flavor, index) => (
                            <button
                              key={flavor}
                              onClick={() => handleFlavorProfileToggle(flavor)}
                              className={`[grid-area:1_/_1] ${
                                localFlavorProfile[flavor] ? 'bg-[#c2b7ab]' : 'bg-[#fff9f3]'
                              } box-border content-stretch flex gap-2.5 h-[31px] items-center justify-center ${
                                index === 0 ? 'ml-0 mt-[0.222px]' : index === 1 ? 'ml-[102px] mt-0' : 'ml-[188px] mt-0'
                              } px-[11px] py-[3px] relative rounded-[15.5px] ${
                                flavor === 'grassy' ? 'w-[94px]' : 'w-auto'
                              }`}
                            >
                              <div aria-hidden="true" className="absolute border border-[#342209] border-solid inset-0 pointer-events-none rounded-[15.5px]" />
                              <div className="font-['Syne:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#342209] text-[20px] text-nowrap tracking-[-1.6px] uppercase">
                                <p className="leading-[normal] whitespace-pre">{flavor}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Frame37 - Taste Analysis and Notes/Color */}
                    <div className="content-stretch flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
                      {/* Frame32 - Taste Analysis */}
                      <div className="content-stretch flex flex-col gap-3 items-start justify-start relative shrink-0 w-[416px]">
                        <InteractiveRadarChart
                          tasteAnalysis={localTasteAnalysis}
                          onTasteAnalysisChange={handleTasteAnalysisChange}
                          isInteractive={true}
                        />

                      </div>

                      {/* Frame35 - Notes and Color */}
                      <div className="content-stretch flex gap-7 items-center justify-start relative shrink-0 w-full">
                        {/* Frame33 - Notes */}
                        <div className="content-stretch flex flex-col gap-[7px] items-start justify-start relative shrink-0 w-[230px]">
                          <div className="font-['Syne:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#c2b7ab] text-[20px] tracking-[-1.6px] w-full">
                            <p className="leading-[normal]">Notes:</p>
                          </div>
                          <div className="h-[92px] relative rounded-[6px] shrink-0 w-full">
                            <textarea
                              value={localNotes}
                              onChange={(e) => {
                                setLocalNotes(e.target.value);
                                markAsChanged();
                              }}
                              className="w-full h-full rounded-[6px] p-3 resize-none bg-transparent font-['Syne'] text-[#342209] border-none outline-none"
                              placeholder="Add your notes..."
                            />
                            <div aria-hidden="true" className="absolute border border-[#342209] border-solid inset-0 pointer-events-none rounded-[6px]" />
                          </div>
                        </div>
                        
                        {/* Frame34 - Color */}
                        <div className="content-stretch flex flex-col gap-[7px] items-start justify-start leading-[0] relative shrink-0 w-[174px]">
                          <div className="font-['Syne:Regular',_sans-serif] font-normal min-w-full relative shrink-0 text-[#c2b7ab] text-[20px] tracking-[-1.6px]" style={{ width: "min-content" }}>
                            <p className="leading-[normal]">Color:</p>
                          </div>
                          <ColorPicker
                            selectedColor={localColor}
                            onChange={(color) => {
                              setLocalColor(color);
                              markAsChanged();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute border-[#d7cbbd] border-[3px] border-solid inset-0 pointer-events-none rounded-[6px]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right placeholder image - only show on desktop */}
          {isDesktop && (
            <motion.button
              onClick={() => {
                const nextIndex = entryIndex + 1;
                if (nextIndex < totalEntries) {
                  onSwitchToEntry(nextIndex);
                  toast.success(`Switched to entry ${nextIndex + 1}`, {
                    duration: 1500,
                    style: {
                      background: '#342209',
                      color: '#fff9f3',
                      border: '1px solid #7CB342',
                      borderRadius: '6px',
                      fontFamily: 'Syne, sans-serif',
                    },
                  });
                }
              }}
              disabled={entryIndex === totalEntries - 1}
              className={`bg-[#fff9f3] h-[642px] rounded-[7px] w-[506px] shrink-0 relative group transition-all duration-300 ${
                entryIndex === totalEntries - 1
                  ? 'opacity-15 cursor-not-allowed' 
                  : 'opacity-30 hover:opacity-50 cursor-pointer hover:scale-[1.005]'
              }`}
              whileHover={entryIndex < totalEntries - 1 ? { scale: 1.005 } : {}}
              whileTap={entryIndex < totalEntries - 1 ? { scale: 0.995 } : {}}
            >
              <div className={`border-[2.52px] border-solid inset-0 pointer-events-none rounded-[7px] w-full h-full transition-colors duration-300 ${
                entryIndex < totalEntries - 1 ? 'border-[#c2b7ab] group-hover:border-[#7CB342]' : 'border-[#c2b7ab]'
              }`} />
              
              {/* Navigation hint overlay */}
              {entryIndex < totalEntries - 1 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-[#342209]/80 text-white px-6 py-3 rounded-lg font-['Syne'] text-center backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm">Next Entry</div>
                        <div className="text-xs opacity-75">{entryIndex + 2} of {totalEntries}</div>
                      </div>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Disabled state overlay */}
              {entryIndex === totalEntries - 1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#c2b7ab]/60 text-[#342209] px-6 py-3 rounded-lg font-['Syne'] text-center">
                    <div className="text-sm opacity-70">Last Entry</div>
                    <div className="text-xs opacity-50">No more entries</div>
                  </div>
                </div>
              )}
            </motion.button>
          )}

        </div>
      </div>

      {/* Action Buttons - Center Bottom */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`transition-all ${
            hasUnsavedChanges && !isSaving 
              ? 'hover:opacity-90 cursor-pointer' 
              : 'cursor-not-allowed opacity-60'
          }`}
        >
          <Frame8 />
        </button>
        {/* Delete Button */}
        <motion.button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-[#342209] hover:bg-red-600 transition-colors duration-200 rounded-[6px] p-3 shadow-lg flex items-center justify-center group h-[46px] w-[46px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 
              size={20} 
              className="text-[#eddecf] group-hover:text-white transition-colors duration-200" 
            />
        </motion.button>
      </div>

      {/* Auto-save Indicator */}
      {isSaving && (
        <div
          className="absolute bg-[#7CB342] box-border flex gap-2 h-[40px] items-center justify-center left-1/2 px-4 py-2 rounded-[6px] translate-x-[-50%] z-10 transition-all duration-300"
          style={{ bottom: '71px' }}
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div className="font-['Syne'] font-normal text-[14px] text-white">
            Auto-saving...
          </div>
        </div>
      )}
    </div>
  );
}
