import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { ProfileMenu } from './ProfileMenu';
import { useResponsive } from '../hooks/useResponsive';

interface ProfilePageProps {
  onNavigateToView: (view: 'landing' | 'profile') => void;
  onSignOut: () => void;
}

export function ProfilePage({ onNavigateToView, onSignOut }: ProfilePageProps) {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  // Original values to detect changes
  const [originalName, setOriginalName] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [isVerifyingCurrentPassword, setIsVerifyingCurrentPassword] = useState(false);

  // Load existing profile data and sync confirmed auth email into profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const authUser = user;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, username, email')
        .eq('id', authUser.id)
        .single();

      const loadedName = profileData?.name ?? '';
      const loadedUsername = profileData?.username ?? '';
      let loadedEmail = profileData?.email ?? authUser.email ?? '';

      if (authUser.email && profileData?.email !== authUser.email) {
        const { error: syncError } = await supabase
          .from('profiles')
          .update({ email: authUser.email })
          .eq('id', authUser.id);
        if (!syncError) {
          loadedEmail = authUser.email;
          if (pendingEmail === authUser.email) {
            setPendingEmail(null);
          }
        }
      }

      setName(loadedName);
      setUsername(loadedUsername);
      setEmail(loadedEmail);
      setOriginalName(loadedName);
      setOriginalUsername(loadedUsername);
      setOriginalEmail(loadedEmail);
    };
    loadProfile();
  }, [user, pendingEmail]);

  useEffect(() => {
    if (!user) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'USER_UPDATED') return;
      const freshEmail = session?.user?.email;
      if (!freshEmail || freshEmail === originalEmail) return;

      const { error: syncError } = await supabase
        .from('profiles')
        .update({ email: freshEmail })
        .eq('id', user.id);
      if (syncError) return;

      setEmail(freshEmail);
      setOriginalEmail(freshEmail);
      if (pendingEmail === freshEmail) {
        setPendingEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [user, originalEmail, pendingEmail]);

  const hasProfileChanges =
    name !== originalName ||
    username !== originalUsername ||
    email !== originalEmail;

  const hasPasswordChanges =
    currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
  const showSaveButton = hasProfileChanges || hasPasswordChanges;

  const verifyCurrentPassword = useCallback(async (options?: { silent?: boolean }) => {
    if (!user?.email || !currentPassword) {
      setIsCurrentPasswordValid(false);
      return false;
    }

    setIsVerifyingCurrentPassword(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    setIsVerifyingCurrentPassword(false);

    if (error) {
      setIsCurrentPasswordValid(false);
      if (!options?.silent) {
        toast.error('Current password is incorrect');
      }
      return false;
    }

    setIsCurrentPasswordValid(true);
    return true;
  }, [user?.email, currentPassword]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    if ((newPassword || confirmPassword) && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (currentPassword && !newPassword && !confirmPassword) {
      const verified = await verifyCurrentPassword();
      if (!verified) return;
      toast.success('Current password verified');
      return;
    }

    if ((newPassword || confirmPassword) && !isCurrentPasswordValid) {
      const verified = await verifyCurrentPassword();
      if (!verified) return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      let didRequestEmailChange = false;

      // Update profile name and username
      if (name !== originalName || username !== originalUsername) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name, username })
          .eq('id', user.id);
        if (profileError) throw profileError;
      }

      // Update email if changed
      if (email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setPendingEmail(email);
        setOriginalEmail(email);
        didRequestEmailChange = true;
        toast.success('Confirmation email sent to new address');
      }

      // Update password if provided
      if (newPassword) {
        if (!user.email) {
          throw new Error('Missing email for password verification');
        }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauthError) throw reauthError;

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsCurrentPasswordValid(false);
        toast.success('Password successfully changed');
      }

      // Update originals to reflect saved state
      setOriginalName(name);
      setOriginalUsername(username);
      setOriginalEmail(email);

      if (!didRequestEmailChange && !hasPasswordChanges) {
        toast.success('Profile updated successfully', {
          style: {
            background: '#342209',
            color: '#fff9f3',
            border: '1px solid #7CB342',
            borderRadius: '6px',
            fontFamily: 'Syne, sans-serif',
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [user, name, username, email, newPassword, confirmPassword, originalName, originalUsername, originalEmail, isCurrentPasswordValid, verifyCurrentPassword, currentPassword]);

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
      <div className={`absolute ${responsive.navTop} ${responsive.navRight} flex items-center gap-[8px] z-10`}>
        <button
          onClick={() => onNavigateToView('landing')}
          className={`bg-[#342209] rounded-[6px] ${responsive.navButtonSize} flex items-center justify-center hover:bg-[#4a2f0d] transition-colors`}
          aria-label="Go to home"
        >
          <svg className={responsive.navIconSize} fill="none" viewBox="0 0 24 24" stroke="#eddecf" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <ProfileMenu
          buttonSize={responsive.navButtonSize}
          onSignOut={onSignOut}
          onNavigateToProfile={() => {}}
          disableProfile={true}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl text-[#342209] tracking-[-1px]">Profile</h1>
        </div>

        {/* Card */}
        <div className="bg-[#fff9f3] rounded-2xl border border-[#d7cbbd] p-8 shadow-sm">
          <div className="flex flex-col gap-4">

            {/* Name */}
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            {/* Username */}
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
              {pendingEmail && pendingEmail !== user?.email && (
                <p className="mt-1 text-[11px] text-[#342209]/60">
                  Pending confirmation for {pendingEmail}.
                </p>
              )}
            </div>

            {/* Password section */}
            <div className="border-t border-[#d7cbbd] pt-2">
              <div className="flex flex-col gap-4">
                <p className="text-xs text-[#342209]/50 uppercase tracking-wide text-center">Change password</p>

                {/* Current Password */}
                <div>
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setIsCurrentPasswordValid(false);
                      }}
                      onBlur={() => {
                        if (currentPassword) {
                          verifyCurrentPassword({ silent: true });
                        }
                      }}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <EyeIcon visible={showCurrentPassword} />
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                      disabled={!isCurrentPasswordValid || isVerifyingCurrentPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isCurrentPasswordValid ? 'opacity-50 hover:opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                      disabled={!isCurrentPasswordValid || isVerifyingCurrentPassword}
                    >
                      <EyeIcon visible={showNewPassword} />
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                      disabled={!isCurrentPasswordValid || isVerifyingCurrentPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isCurrentPasswordValid ? 'opacity-50 hover:opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                      disabled={!isCurrentPasswordValid || isVerifyingCurrentPassword}
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save/Verify button — only shown when there are changes */}
          {showSaveButton && (
            <motion.button
              onClick={handleSave}
              disabled={isSaving}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: isSaving ? 1 : 1.01 }}
              whileTap={{ scale: isSaving ? 1 : 0.99 }}
              className={`w-full mt-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSaving
                  ? 'bg-[#7CB342]/50 text-white cursor-not-allowed'
                  : 'bg-[#3e6f2c] text-[#fff9f3] hover:bg-[#5e9526] cursor-pointer'
              }`}
            >
              {isSaving ? 'Saving...' : hasPasswordChanges && !isCurrentPasswordValid ? 'Verify' : 'Save Changes'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
