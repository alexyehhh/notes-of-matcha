import { useState, useRef, useEffect } from 'react';

interface ProfileMenuProps {
  buttonSize: string;
  onSignOut: () => void;
  onNavigateToProfile: () => void;
  disableProfile?: boolean;
}

export function ProfileMenu({ buttonSize, onSignOut, onNavigateToProfile, disableProfile = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* Profile icon button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`bg-[#342209] rounded-[6px] ${buttonSize} flex items-center justify-center hover:bg-[#4a2f0d] transition-colors`}
      >
        <svg
          className="w-[55%] h-[55%]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#eddecf"
          strokeWidth="1.8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-[130px] bg-[#fff9f3] border border-[#c2b7ab] rounded-[6px] shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => {
              setIsOpen(false);
              if (!disableProfile) onNavigateToProfile();
            }}
            disabled={disableProfile}
            className={`w-full text-left px-4 py-2.5 font-['Syne'] text-[13px] text-[#342209] transition-colors ${
              disableProfile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#eddecf]'
            }`}
          >
            Profile
          </button>
          <div className="border-t border-[#c2b7ab]" />
          <button
            onClick={() => { setIsOpen(false); onSignOut(); }}
            className="w-full text-left px-4 py-2.5 font-['Syne'] text-[13px] text-[#342209] hover:bg-[#eddecf] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
