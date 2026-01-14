import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ViewType } from "../types";
import { Eye, EyeOff, BookOpen, Leaf, Sparkles, ChevronLeft } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

interface SecretPageProps {
  onNavigateToView: (view: ViewType) => void;
}

const secrets = [
  {
    title: "The Art of Matcha Meditation",
    content: "True matcha appreciation begins not with taste, but with mindfulness. The ritual of preparing matcha is a meditation in itself, connecting us to centuries of tradition.",
    icon: BookOpen,
    color: "from-emerald-600 to-green-700"
  },
  {
    title: "Hidden Flavor Compounds",
    content: "L-theanine, the secret behind matcha's calm energy, was first discovered in 1949. This amino acid creates the unique zen-like focus that sets matcha apart from all other teas.",
    icon: Leaf,
    color: "from-teal-600 to-emerald-700"
  },
  {
    title: "The Whisper of Leaves",
    content: "Premium matcha is made from tea leaves that are shade-grown for 20-30 days before harvest. This shadowing increases chlorophyll and amino acid content, creating that distinctive vibrant green.",
    icon: Sparkles,
    color: "from-green-600 to-teal-700"
  },
  {
    title: "Temperature's Sacred Role",
    content: "The perfect matcha is whisked with water at exactly 80°C (176°F). Too hot destroys the delicate compounds, too cool fails to release the full essence. Balance is everything.",
    icon: Eye,
    color: "from-lime-600 to-green-700"
  }
];

export function SecretPage({ onNavigateToView }: SecretPageProps) {
  const [revealedSecrets, setRevealedSecrets] = useState<boolean[]>([false, false, false, false]);
  const [currentSecretIndex, setCurrentSecretIndex] = useState(0);
  const { isMobile, isTablet } = useResponsive();

  // Auto-reveal secrets one by one
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealedSecrets(prev => {
        const newRevealed = [...prev];
        const nextIndex = newRevealed.findIndex(revealed => !revealed);
        if (nextIndex !== -1) {
          newRevealed[nextIndex] = true;
          setCurrentSecretIndex(nextIndex);
        }
        return newRevealed;
      });
    }, 2000);

    // Clean up after all secrets are revealed
    if (revealedSecrets.every(revealed => revealed)) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [revealedSecrets]);

  const handleSecretClick = (index: number) => {
    setRevealedSecrets(prev => {
      const newRevealed = [...prev];
      newRevealed[index] = !newRevealed[index];
      return newRevealed;
    });
  };

  const allRevealed = revealedSecrets.every(revealed => revealed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eddecf] via-[#e6d4c1] to-[#dcc7b3] font-['Syne'] relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#7CB342]/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <motion.button
        onClick={() => onNavigateToView('landing')}
        className="absolute top-6 left-6 z-20 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl p-3 shadow-lg hover:bg-white/90 transition-all duration-300"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={20} className="text-[#342209]" />
      </motion.button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className={`font-['Syne'] font-medium ${isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl'} text-[#342209] mb-4 tracking-tight`}>
            Hidden Wisdom
          </h1>
          <p className={`font-['Syne'] ${isMobile ? 'text-sm' : 'text-base'} text-[#342209]/70 max-w-md mx-auto`}>
            The secrets of matcha reveal themselves to those who seek with patience
          </p>
        </motion.div>

        {/* Secrets grid */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : isTablet ? 'grid-cols-2 gap-8' : 'grid-cols-2 gap-10'} max-w-4xl w-full`}>
          {secrets.map((secret, index) => {
            const Icon = secret.icon;
            const isRevealed = revealedSecrets[index];
            const isCurrent = currentSecretIndex === index && !allRevealed;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: isRevealed ? 0 : 180 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.3,
                  type: "spring",
                  stiffness: 100
                }}
                className="relative perspective-1000"
              >
                <motion.button
                  onClick={() => handleSecretClick(index)}
                  className={`relative w-full h-40 rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
                    isCurrent ? 'ring-4 ring-[#7CB342]/50 ring-offset-2' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Card back (hidden state) */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${secret.color} flex items-center justify-center backface-hidden`}
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: isRevealed ? 0 : 360 }}
                      transition={{ duration: 2, repeat: isRevealed ? 0 : Infinity, ease: "linear" }}
                    >
                      <EyeOff size={40} className="text-white/80" />
                    </motion.div>
                  </div>

                  {/* Card front (revealed state) */}
                  <div
                    className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-white/60 p-6 flex flex-col justify-between backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${secret.color}`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-['Syne'] font-medium ${isMobile ? 'text-sm' : 'text-base'} text-[#342209] mb-2 leading-tight`}>
                          {secret.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className={`font-['Syne'] ${isMobile ? 'text-xs' : 'text-sm'} text-[#342209]/80 leading-relaxed`}>
                      {secret.content}
                    </p>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex gap-2"
        >
          {secrets.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                revealedSecrets[index] ? 'bg-[#7CB342]' : 'bg-[#C2B7AB]'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            />
          ))}
        </motion.div>

        {/* Completion message */}
        <AnimatePresence>
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="mt-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-r from-[#7CB342] to-[#8BC34A] text-white px-6 py-3 rounded-full shadow-lg"
              >
                <span className={`font-['Syne'] font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                  ✨ All secrets revealed ✨
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}