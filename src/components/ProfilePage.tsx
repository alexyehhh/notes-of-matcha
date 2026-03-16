import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import type { ViewType } from '../types';

interface ProfilePageProps {
  onNavigateToView: (view: ViewType) => void;
  onSignOut: () => void;
}

export function ProfilePage({ onNavigateToView }: ProfilePageProps) {
  const { user } = useAuth();

  // Original values to detect changes
  const [originalName, setOriginalName] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, username, email')
        .eq('id', user.id)
        .single();

      const loadedName = data?.name ?? '';
      const loadedUsername = data?.username ?? '';
      const loadedEmail = data?.email ?? user.email ?? '';

      setName(loadedName);
      setUsername(loadedUsername);
      setEmail(loadedEmail);
      setOriginalName(loadedName);
      setOriginalUsername(loadedUsername);
      setOriginalEmail(loadedEmail);
    };
    loadProfile();
  }, [user]);

  const hasProfileChanges =
    name !== originalName ||
    username !== originalUsername ||
    email !== originalEmail;

  const hasPasswordChanges = newPassword.length > 0 || confirmPassword.length > 0;
  const showSaveButton = hasProfileChanges || hasPasswordChanges;

  const handleSave = useCallback(async () => {
    if (!user) return;

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
        await supabase.from('profiles').update({ email }).eq('id', user.id);
        toast.success('Confirmation email sent to new address');
      }

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        setNewPassword('');
        setConfirmPassword('');
      }

      // Update originals to reflect saved state
      setOriginalName(name);
      setOriginalUsername(username);
      setOriginalEmail(email);

      toast.success('Profile updated successfully', {
        style: {
          background: '#342209',
          color: '#fff9f3',
          border: '1px solid #7CB342',
          borderRadius: '6px',
          fontFamily: 'Syne, sans-serif',
        },
      });
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [user, name, username, email, newPassword, confirmPassword, originalName, originalUsername, originalEmail]);

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

  return (
    <div className="min-h-screen bg-[#eddecf] flex items-center justify-center p-6 font-['Syne']">
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
            </div>

            {/* Password section */}
            <div className="border-t border-[#d7cbbd] pt-2">
              <p className="text-xs text-[#342209]/50 mb-3">Change password (leave blank to keep current)</p>

              <div className="flex flex-col gap-4">
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save button — only shown when there are changes */}
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
              {isSaving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
