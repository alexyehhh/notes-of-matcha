import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useResponsive } from '../hooks/useResponsive';

interface ResetPasswordPageProps {
  onNavigateToView: (view: 'landing' | 'profile') => void;
  onSignOut: () => void;
}

export function ResetPasswordPage({ onNavigateToView, onSignOut }: ResetPasswordPageProps) {
  const { isMobile, isTablet } = useResponsive();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const hydrateSession = async () => {
      setSessionError(null);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      try {
        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }

        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setSessionError('Auth session missing. Please use the latest reset link from your email.');
          setIsSessionReady(false);
          return;
        }

        setIsSessionReady(true);
      } catch (error: any) {
        setSessionError(error.message ?? 'Unable to initialize reset session');
        setIsSessionReady(false);
      }
    };

    hydrateSession();
  }, []);

  const handleReset = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error('Auth session missing. Please use the latest reset link.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordChanged(true);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed');
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/');
        onNavigateToView('landing');
        onSignOut();
      }, 1200);
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to reset password');
    } finally {
      setIsSaving(false);
    }
  }, [newPassword, confirmPassword]);

  const inputClass = "w-full px-4 py-3 rounded-lg bg-transparent border border-[#c2b7ab] text-[#342209] text-sm outline-none focus:border-[#7CB342] focus:ring-1 focus:ring-[#7CB342] transition-colors placeholder:text-[#342209]/30 font-['Syne']";
  const labelClass = "text-xs text-[#342209]/60 mb-1.5 block tracking-wide uppercase font-['Syne']";

  const getResponsiveValues = () => {
    if (isMobile) {
      return {
        headerTop: 'top-6',
        headerFontSize: 'text-[20px]',
        navTop: 'top-[28px]',
        navRight: 'right-4',
        navButtonSize: 'w-[24px] h-[24px]',
        navIconSize: 'w-[12px] h-[12px]',
      };
    }
    if (isTablet) {
      return {
        headerTop: 'top-8',
        headerFontSize: 'text-[24px]',
        navTop: 'top-[36px]',
        navRight: 'right-8',
        navButtonSize: 'w-[28px] h-[28px]',
        navIconSize: 'w-[14px] h-[14px]',
      };
    }
    return {
      headerTop: 'top-12',
      headerFontSize: 'text-[30px]',
      navTop: 'top-[52px]',
      navRight: 'right-[66px]',
      navButtonSize: 'w-[31.481px] h-[31.481px]',
      navIconSize: 'w-[16px] h-[16px]',
    };
  };

  const responsive = getResponsiveValues();

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

  return (
    <div className="min-h-screen bg-[#eddecf] flex items-center justify-center p-6 font-['Syne'] relative">
      <div className={`absolute ${responsive.headerTop} left-1/2 transform -translate-x-1/2 z-10`}>
        <div className={`font-['Syne'] font-normal ${responsive.headerFontSize} text-[#342209] tracking-[-2.4px]`}>
          Notes of Matcha
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl text-[#342209] tracking-[-1px]">Reset Password</h1>
        </div>

        <div className="bg-[#fff9f3] rounded-2xl border border-[#d7cbbd] p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                  disabled={!isSessionReady}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isSessionReady ? 'opacity-50 hover:opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                  disabled={!isSessionReady}
                >
                  <EyeIcon visible={showNewPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                  disabled={!isSessionReady}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isSessionReady ? 'opacity-50 hover:opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                  disabled={!isSessionReady}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>
          </div>

          {sessionError && (
            <p className="text-center text-xs text-[#342209]/60 mt-4">
              {sessionError}
            </p>
          )}

          <motion.button
            onClick={handleReset}
            disabled={isSaving || !isSessionReady}
            whileHover={{ scale: isSaving ? 1 : 1.01 }}
            whileTap={{ scale: isSaving ? 1 : 0.99 }}
            className={`w-full mt-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSaving || !isSessionReady
                ? 'bg-[#7CB342]/50 text-white cursor-not-allowed'
                : 'bg-[#3e6f2c] text-[#fff9f3] hover:bg-[#5e9526] cursor-pointer'
            }`}
          >
            {isSaving ? 'Resetting...' : 'Reset Password'}
          </motion.button>

          {passwordChanged && (
            <p className="text-center text-xs text-[#342209]/60 mt-4">
              Password changed
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
