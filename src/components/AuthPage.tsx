import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const inputClass = "w-full px-4 py-3 rounded-lg bg-transparent border border-[#c2b7ab] text-[#342209] text-sm outline-none focus:border-[#7CB342] focus:ring-1 focus:ring-[#7CB342] transition-colors placeholder:text-[#342209]/30 font-['Syne']";
const labelClass = "text-xs text-[#342209]/60 mb-1.5 block tracking-wide uppercase font-['Syne']";

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#342209" strokeWidth="1.8">
    {visible ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
);

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign in fields
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithUsername, signUp } = useAuth();

  const handleSubmit = useCallback(async () => {


    if (mode === 'signin') {
      if (!signInUsername || !signInPassword) {
        toast.error('Please enter your username and password');
        return;
      }
      if (signInPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    } else {
      if (!signUpName || !signUpUsername || !signUpEmail || !signUpPassword) {
        toast.error('Please fill in all fields');
        return;
      }
      if (signUpPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithUsername(signInUsername, signInPassword);
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(signUpEmail, signUpPassword, signUpName, signUpUsername);
        if (error) throw error;
        toast.success('Account created! Welcome to Notes of Matcha.');
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, signInUsername, signInPassword, signUpName, signUpUsername, signUpEmail, signUpPassword, signInWithUsername, signUp]);

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

          <AnimatePresence mode="wait">
            {mode === 'signin' ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="username"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <EyeIcon visible={showSignInPassword} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="username"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <EyeIcon visible={showSignUpPassword} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
