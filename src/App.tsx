import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { EditablePage } from './components/EditablePage';
import { GridView } from './components/GridView';
import { ListView } from './components/ListView';
import { SecretPage } from './components/SecretPage';
import rockyImage from './assets/rocky-matcha.png';
import wakatakeImage from './assets/wakatake.jpeg';
import type { MatchaEntry, ViewType } from "./types";

import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullPageLoader } from './components/LoadingSpinner';
import * as matchaApi from './services/matchaApi';

export default function App() {
  const didInit = useRef(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [previousView, setPreviousView] = useState<ViewType>('landing');
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [, setIsTransitioning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [, setIsDataPersisted] = useState(true);
  const [, setLastSaveTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [, setLoadError] = useState<string | null>(null);
  
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Default entries to seed the database if empty
  const defaultEntries: MatchaEntry[] = [
    {
      id: '1',
      name: 'Ceremonial Blend',
      brand: 'Rocky\'s',
      prefecture: 'Kyoto',
      flavorProfile: { grassy: true, nutty: false, floral: false },
      tasteAnalysis: { sweetness: 6, bitterness: 8, green: 10, umami: 8, astringency: 6 },
      notes: 'Premium ceremonial grade matcha with rich umami flavor.',
      color: '#3e6f2c',
      image: rockyImage,
      favorite: false
    },
    {
      id: '2',
      name: '若竹 (Wakataké)',
      brand: 'Marukyu Koyamaen',
      prefecture: 'Uji, Kyoto',
      flavorProfile: { grassy: true, nutty: false, floral: true },
      tasteAnalysis: { sweetness: 7, bitterness: 6, green: 9, umami: 9, astringency: 5 },
      notes: 'Premium ceremonial grade matcha with delicate floral notes and rich umami. "Young Bamboo" represents freshness and purity in traditional Japanese tea culture.',
      color: '#4a7c2a',
      image: wakatakeImage,
      favorite: true
    },
    {
      id: '3',
      name: 'Daily Matcha',
      brand: 'Everyday',
      prefecture: 'Kagoshima',
      flavorProfile: { grassy: false, nutty: true, floral: false },
      tasteAnalysis: { sweetness: 8, bitterness: 4, green: 6, umami: 6, astringency: 4 },
      notes: 'Great for daily consumption with mild taste.',
      color: '#8fca55',
      favorite: false
    },
    {
      id: '4',
      name: 'Organic Matcha',
      brand: 'Natural',
      prefecture: 'Mie',
      flavorProfile: { grassy: true, nutty: false, floral: true },
      tasteAnalysis: { sweetness: 6, bitterness: 6, green: 8, umami: 6, astringency: 6 },
      notes: 'Organically grown with floral notes.',
      color: '#377a10',
      favorite: false
    },
    {
      id: '5',
      name: 'Artisan Select',
      brand: 'Craft',
      prefecture: 'Nara',
      flavorProfile: { grassy: false, nutty: true, floral: true },
      tasteAnalysis: { sweetness: 10, bitterness: 4, green: 6, umami: 8, astringency: 4 },
      notes: 'Hand-picked with complex flavor profile.',
      color: '#adc44f',
      favorite: true
    }
  ];

  const [matchaEntries, setMatchaEntries] = useState<MatchaEntry[]>([]);

  // Load data from backend on mount
  useEffect(() => {
  if (didInit.current) return;
  didInit.current = true;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const entries = await matchaApi.seedIfEmpty(defaultEntries);
      setMatchaEntries(entries);

      setLastSaveTime(new Date());
    } catch (error) {
      console.error("Failed to load matcha entries:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load data");
      setMatchaEntries(defaultEntries);
      toast.info("Running in offline mode - data is saved locally");
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
  }, []);


  const updateMatchaEntry = useCallback(async (id: string, updates: Partial<MatchaEntry>) => {
    try {
      setIsDataPersisted(false);
      
      // Optimistic update
      setMatchaEntries(prev => {
        const newEntries = prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        );
        return newEntries;
      });
      
      // Update backend
      await matchaApi.updateMatchaEntry(id, updates);
      
      // Show success feedback for significant updates
      if (Object.keys(updates).length > 1 || updates.name || updates.brand) {
        toast.success('Entry updated successfully');
      }
      
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      setIsDataPersisted(true);
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error('Failed to save changes');
      // Revert optimistic update by reloading
      try {
        const entries = await matchaApi.fetchMatchaEntries();
        setMatchaEntries(entries);
      } catch (reloadError) {
        console.error('Failed to reload entries:', reloadError);
      }
    }
  }, []);

  const addMatchaEntry = useCallback(async (entry: Omit<MatchaEntry, 'id'>) => {
    try {
      setIsDataPersisted(false);

      // Create in backend first to get the real Supabase ID
      const tempEntry: MatchaEntry = { ...entry, id: Date.now().toString() };
      const createdEntry = await matchaApi.createMatchaEntry(tempEntry);

      // Add real entry to state and navigate to it
      setMatchaEntries(prev => {
        const updated = [...prev, createdEntry];
        setCurrentCarouselIndex(updated.length - 1);
        return updated;
      });

      toast.success(`Added "${entry.name}" to your collection`);
      setLastSaveTime(new Date());
      setIsDataPersisted(true);

      return createdEntry.id;
    } catch (error) {
      console.error('Failed to add entry:', error);
      toast.error('Failed to add entry');
      return '';
    }
  }, []);

  const deleteMatchaEntry = useCallback(async (id: string) => {
    const entryToDelete = matchaEntries.find(e => e.id === id);
    
    try {
      setIsDataPersisted(false);
      
      // Optimistic update
      setMatchaEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        // Adjust current index if necessary
        if (currentCarouselIndex >= updated.length && updated.length > 0) {
          setCurrentCarouselIndex(updated.length - 1);
        } else if (updated.length === 0) {
          setCurrentCarouselIndex(0);
        }
        return updated;
      });
      
      // Delete from backend
      await matchaApi.deleteMatchaEntry(id);
      
      if (entryToDelete) {
        toast.success(`Removed "${entryToDelete.name}" from collection`);
      }
      setLastSaveTime(new Date());
      setIsDataPersisted(true);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry');
      // Revert optimistic update
      try {
        const entries = await matchaApi.fetchMatchaEntries();
        setMatchaEntries(entries);
      } catch (reloadError) {
        console.error('Failed to reload entries:', reloadError);
      }
    }
  }, [currentCarouselIndex, matchaEntries]);

  const handleCarouselIndexChange = useCallback((newIndex: number) => {
    // Ensure index stays within bounds
    if (newIndex >= 0 && newIndex < matchaEntries.length) {
      setCurrentCarouselIndex(newIndex);
    }
  }, [matchaEntries.length]);

  // Enhanced navigation with unsaved changes confirmation
  const confirmAndNavigate = useCallback((navigationFn: () => void) => {
    if (currentView === 'editable' && hasUnsavedChanges) {
      pendingNavigationRef.current = navigationFn;
      setShowUnsavedDialog(true);
    } else {
      navigationFn();
    }
  }, [currentView, hasUnsavedChanges]);

  const navigateToView = useCallback((view: ViewType, entryId?: string) => {
    const doNavigation = () => {
      setIsTransitioning(true);
      setPreviousView(currentView);
      
      // Push to browser history so back button works
      window.history.pushState({ view, entryId }, '', `#${view}`);
      
      setCurrentView(view);
      if (entryId) {
        setSelectedEntryId(entryId);
      }
      
      setTimeout(() => setIsTransitioning(false), 50);
    };

    confirmAndNavigate(doNavigation);
  }, [currentView, confirmAndNavigate]);

  const navigateToEditableView = useCallback((entryId: string) => {
    const entryIndex = matchaEntries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) return;
    
    const doNavigation = () => {
      setIsTransitioning(true);
      setPreviousView(currentView);
      
      // Push to browser history so back button works
      window.history.pushState({ view: 'editable', entryId }, '', '#editable');
      
      setCurrentCarouselIndex(entryIndex);
      setSelectedEntryId(entryId);
      
      setCurrentView('editable');
      setTimeout(() => setIsTransitioning(false), 50);
    };

    confirmAndNavigate(doNavigation);
  }, [matchaEntries, currentView, confirmAndNavigate]);

  const switchToEntry = useCallback((entryIndex: number) => {
    if (entryIndex >= 0 && entryIndex < matchaEntries.length) {
      const entryId = matchaEntries[entryIndex].id;
      setCurrentCarouselIndex(entryIndex);
      setSelectedEntryId(entryId);
    }
  }, [matchaEntries]);

  const reorderMatchaEntries = useCallback(async (newOrder: MatchaEntry[]) => {
  try {
    setIsDataPersisted(false);
    // Update matchaEntries to reflect new order without triggering a re-render loop
    setMatchaEntries(newOrder);
    // Save to Supabase in background
    const orderIds = newOrder.map(entry => entry.id);
    await matchaApi.reorderMatchaEntries(orderIds);
    setLastSaveTime(new Date());
    setIsDataPersisted(true);
  } catch (error) {
    console.error('Failed to reorder entries:', error);
    toast.error('Failed to save new order');
  }
}, []);

  // Handle unsaved changes dialog
  const handleDiscardChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, []);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    pendingNavigationRef.current = null;
  }, []);

  // Memoized computations for better performance
  const filteredEntries = useMemo(() => {
    if (activeFilters.length === 0) return matchaEntries;
    
    return matchaEntries.filter(entry => {
      return activeFilters.some(filter => {
        const filterKey = filter.toLowerCase() as keyof typeof entry.flavorProfile;
        return entry.flavorProfile[filterKey];
      });
    });
  }, [matchaEntries, activeFilters]);

  const currentEntry = useMemo(() => {
    return selectedEntryId ? matchaEntries.find(e => e.id === selectedEntryId) : null;
  }, [selectedEntryId, matchaEntries]);

  const currentEntryIndex = useMemo(() => {
    return selectedEntryId ? matchaEntries.findIndex(e => e.id === selectedEntryId) : -1;
  }, [selectedEntryId, matchaEntries]);

  // Use refs to avoid stale closures in popstate handler
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;
  const matchaEntriesRef = useRef(matchaEntries);
  matchaEntriesRef.current = matchaEntries;

  // Browser back/forward button support
  useEffect(() => {
    // Set initial history state
    window.history.replaceState({ view: 'landing' }, '', '#landing');

    const handlePopState = (event: PopStateEvent) => {
      const view = (event.state?.view as ViewType) ?? 'landing';
      const entryId = event.state?.entryId;
      setIsTransitioning(true);
      setPreviousView(currentViewRef.current);
      if (view === 'editable' && entryId) {
        const entryIndex = matchaEntriesRef.current.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
          setCurrentCarouselIndex(entryIndex);
          setSelectedEntryId(entryId);
        }
      }
      setCurrentView(view);
      setTimeout(() => setIsTransitioning(false), 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // empty deps — refs keep values fresh without re-registering

  // Auto-save indicator
  useEffect(() => {
    if (hasUnsavedChanges) {
      setIsDataPersisted(false);
      const timer = setTimeout(() => {
        setHasUnsavedChanges(false);
        setIsDataPersisted(true);
        setLastSaveTime(new Date());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges]);

  // Get transition direction for smoother animations
  const getTransitionDirection = () => {
    const viewOrder: ViewType[] = ['landing', 'editable', 'grid', 'list', 'secret'];
    const currentIndex = viewOrder.indexOf(currentView);
    const previousIndex = viewOrder.indexOf(previousView);
    return currentIndex > previousIndex ? 1 : -1;
  };

  // Show loading screen while fetching data
  if (isAuthLoading || isLoading) {
    return <FullPageLoader text={isAuthLoading ? "Loading..." : "Loading your matcha collection..."} />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ErrorBoundary>
      <div className="bg-[#eddecf] font-['Syne'] overflow-x-hidden relative min-h-screen">

      {/* Unsaved changes confirmation dialog */}
      <AnimatePresence>
        {showUnsavedDialog && (
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
              <h3 className="text-lg font-medium text-[#342209] mb-2">Unsaved Changes</h3>
              <p className="text-sm text-[#342209]/70 mb-4">
                You have unsaved changes. Are you sure you want to leave this page?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelNavigation}
                  className="px-4 py-2 text-sm rounded-lg border border-[#342209]/20 text-[#342209] hover:bg-[#342209]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 text-sm rounded-lg bg-[#7CB342] text-white hover:bg-[#7CB342]/90 transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal unsaved changes indicator */}
      <AnimatePresence>
        {hasUnsavedChanges && currentView === 'editable' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-amber-100/90 backdrop-blur-sm border border-amber-300/50 text-amber-800 px-3 py-1.5 rounded-full shadow-sm text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Unsaved changes • Cmd+S to save
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with smooth transitions */}
      <AnimatePresence mode="wait" custom={getTransitionDirection()}>
        <motion.div
          key={currentView}
          custom={getTransitionDirection()}
          initial={{ opacity: 0, x: 30 * getTransitionDirection() }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 * getTransitionDirection() }}
          transition={{ 
            duration: 0.25, 
            ease: [0.4, 0.0, 0.2, 1],
            opacity: { duration: 0.15 }
          }}
          className="w-full"
        >
          {currentView === 'landing' && (
            <LandingPage
              entries={matchaEntries}
              currentIndex={currentCarouselIndex}
              onIndexChange={handleCarouselIndexChange}
              onNavigateToView={navigateToView}
              onEditEntry={navigateToEditableView}
              onAddEntry={addMatchaEntry}
              onDeleteEntry={deleteMatchaEntry}
            />
          )}

          {currentView === 'editable' && currentEntry && (
            <EditablePage
              entry={currentEntry}
              entryIndex={currentEntryIndex}
              totalEntries={matchaEntries.length}
              onUpdateEntry={(id, updates) => {
                updateMatchaEntry(id, updates);
                setHasUnsavedChanges(false);
              }}
              onNavigateToView={navigateToView}
              onSwitchToEntry={switchToEntry}
            />
          )}
          
          {currentView === 'grid' && (
            <GridView
              entries={matchaEntries}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              onNavigateToView={navigateToView}
              onEditEntry={navigateToEditableView}
              onUpdateEntry={updateMatchaEntry}
              onAddEntry={addMatchaEntry}
              onReorderEntries={reorderMatchaEntries}
            />
          )}
          
          {currentView === 'list' && (
            <ListView
              entries={filteredEntries}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              onNavigateToView={navigateToView}
              onEditEntry={navigateToEditableView}
              onUpdateEntry={updateMatchaEntry}
              onAddEntry={addMatchaEntry}
            />
          )}

          {currentView === 'secret' && (
            <SecretPage
              onNavigateToView={navigateToView}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Enhanced toast notifications */}
      <Toaster 
        position="top-right" 
        duration={3000}
        expand={true}
        richColors={false}
        closeButton={true}
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg, #342209 0%, #4a2f0a 100%)',
            color: '#fff9f3',
            border: '1px solid #7CB342',
            borderRadius: '8px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            fontWeight: '400',
            boxShadow: '0 4px 12px rgba(52, 34, 9, 0.15)',
            backdropFilter: 'blur(8px)',
          },
          className: 'backdrop-blur-sm',
        }}
      />
      </div>
    </ErrorBoundary>
  );
}