import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = useCallback(async () => {
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, mode, signIn, signUp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  }, [handleSubmit]);

  return (
    <div className="min-h-screen bg-[#eddecf] flex items-center justify-center p-6 font-['Syne']">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#3e6f2c' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C8 3 4 7 4 12c0 3 1.5 5.5 4 7l4 2 4-2c2.5-1.5 4-4 4-7 0-5-4-9-8-9z"
                fill="#fff9f3"
                fillOpacity="0.9"
              />
            </svg>
          </motion.div>
          <h1 className="text-2xl text-[#342209] tracking-[-1px]">Notes of Matcha</h1>
          <p className="text-sm text-[#342209]/60 mt-1">Your personal matcha journal</p>
        </div>

        {/* Card */}
        <div className="bg-[#fff9f3] rounded-2xl border border-[#d7cbbd] p-8 shadow-sm">

          {/* Mode toggle */}
          <div className="flex bg-[#eddecf] rounded-lg p-1 mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm rounded-md transition-all duration-200 ${
                  mode === m
                    ? 'bg-[#fff9f3] text-[#342209] shadow-sm font-medium'
                    : 'text-[#342209]/50 hover:text-[#342209]/80'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-[#342209]/60 mb-1.5 block tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#c2b7ab] text-[#342209] text-sm outline-none focus:border-[#7CB342] focus:ring-1 focus:ring-[#7CB342] transition-colors placeholder:text-[#342209]/30"
              />
            </div>

            <div>
              <label className="text-xs text-[#342209]/60 mb-1.5 block tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#c2b7ab] text-[#342209] text-sm outline-none focus:border-[#7CB342] focus:ring-1 focus:ring-[#7CB342] transition-colors placeholder:text-[#342209]/30"
              />
            </div>
          </div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            className={`w-full mt-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSubmitting
                ? 'bg-[#7CB342]/50 text-white cursor-not-allowed'
                : 'bg-[#3e6f2c] text-[#fff9f3] hover:bg-[#5e9526] cursor-pointer'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </motion.div>
              ) : (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Mode switch hint */}
          <p className="text-center text-xs text-[#342209]/50 mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-[#5e9526] hover:text-[#3e6f2c] transition-colors underline underline-offset-2"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
