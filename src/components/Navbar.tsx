import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ChevronDown, 
  User, 
  LogIn, 
  LogOut, 
  Download, 
  Users, 
  ShieldCheck,
  Menu,
  X,
  Home,
  Code2,
  BookOpen,
  Radio,
  Database,
  Flame,
  Settings
} from 'lucide-react';
import { 
  getCurrentUser, 
  logoutUser, 
  getUserSolvedProblems, 
  syncUserSession,
  exportAccountBackup, 
  getUserStorageUsage,
  getUserStreak,
  UserStreakData,
  UserStorageUsage,
  UserAccount 
} from '../services/authService';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('toniclite_theme') || localStorage.getItem('opentensor_theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<UserStorageUsage>(() => getUserStorageUsage());
  const [streakData, setStreakData] = useState<UserStreakData>(() => getUserStreak());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const refreshAuth = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setSolvedCount(user.solvedProblems?.length || 0);
    } else {
      setSolvedCount(0);
    }
    setStorageUsage(getUserStorageUsage(user?.id));
    setStreakData(getUserStreak(user?.id));
  };

  useEffect(() => {
    refreshAuth();
    syncUserSession().then(() => refreshAuth());

    const syncTheme = () => {
      const savedTheme = localStorage.getItem('toniclite_theme') || localStorage.getItem('opentensor_theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      } else if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else {
        const isDomDark = document.documentElement.classList.contains('dark');
        setIsDark(isDomDark);
      }
    };

    syncTheme();

    const handleAuthChange = () => refreshAuth();
    const handleThemeChange = () => syncTheme();

    window.addEventListener('tensortonic_auth_change', handleAuthChange);
    window.addEventListener('toniclite_theme_change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthChange);
      window.removeEventListener('toniclite_theme_change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Close user dropdown on outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('toniclite_theme', 'dark');
      localStorage.setItem('opentensor_theme', 'dark');
      window.dispatchEvent(new CustomEvent('toniclite_theme_change', { detail: 'dark' }));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('toniclite_theme', 'light');
      localStorage.setItem('opentensor_theme', 'light');
      window.dispatchEvent(new CustomEvent('toniclite_theme_change', { detail: 'light' }));
    }
  };

  const handleExportBackup = () => {
    if (!currentUser) return;
    const jsonStr = exportAccountBackup(currentUser.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toniclite_${currentUser.username}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Problems', path: '/problems', icon: Code2 },
    { label: 'Research', path: '/research', icon: BookOpen },
    { label: 'Interview', path: '/interview', icon: Radio }
  ];

  const getInitials = (name: string) => {
    if (!name) return 'OT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => refreshAuth()}
      />

      <nav className="text-foreground sticky top-0 z-50 w-full pt-3 pb-1 flex-shrink-0">
        <div className="container mx-auto px-4 max-w-7xl relative">
          <div className="relative z-50 h-14 flex items-center justify-between pl-5 pr-3 rounded-full border backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] border-[#303041] bg-[#191925]/95">
            
            {/* Left: Brand logo & Nav links */}
            <div className="flex items-center gap-2 md:gap-8 flex-shrink-0">
              <Link to="/" className="hover:opacity-85 transition-opacity flex items-center gap-2 shrink-0">
                <img
                  alt="TonicLite"
                  width={28}
                  height={28}
                  className="h-7 w-auto flex-shrink-0 drop-shadow-sm"
                  src="/images/logos/toniclite.svg"
                />
                <span className="text-[#F4F4FA] font-black text-base sm:text-lg tracking-tight font-sans inline">
                  Tonic<span className="text-[#8B5CF6]">Lite</span>
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-2">
                {navLinks.map((link) => {
                  const isInterview = link.path === '/interview' && (
                    location.pathname.startsWith('/interview') ||
                    location.search.includes('assessment=')
                  );
                  const isResearch = link.path === '/research' && location.pathname.startsWith('/research');
                  const isProblems = link.path === '/problems' && (
                    location.pathname.startsWith('/problems') && !location.search.includes('assessment=')
                  );
                  const isHome = link.path === '/' && location.pathname === '/';
                  const isActive = isInterview || isResearch || isProblems || isHome;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-[#251B3B] text-[#8B5CF6] border border-[#45455B]/60 font-semibold'
                          : 'text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738]/50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Solved Counter, Theme Toggle, User Account */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              
              {/* Solved Progress Counter */}
              <Link
                to="/problems"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#13131D] text-[#B5B5C8] hover:text-[#F4F4FA] border border-[#303041] transition-colors"
                title={currentUser ? `${currentUser.username}'s solved problems` : "Total solved problems"}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span className="tabular-nums font-mono font-semibold text-[#F4F4FA]">{solvedCount}</span>
                <span className="text-[11px] text-[#9292A8]">/ 790</span>
              </Link>

              {/* Daily Streak Flame Counter */}
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#251B3B] hover:bg-[#272738] text-[#C4F75B] border border-[#45455B]/60 transition-colors shadow-xs"
                title={`Daily Streak: ${streakData.currentStreak} day${streakData.currentStreak === 1 ? '' : 's'}`}
              >
                <Flame className="w-3.5 h-3.5 fill-[#C4F75B] text-[#C4F75B] shrink-0" />
                <span className="tabular-nums font-mono">{streakData.currentStreak}</span>
              </Link>

              {/* Theme Toggle Button (Desktop visible, on mobile moved into hamburger menu) */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738] transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Account Pill / Menu */}
              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => {
                      const next = !isUserMenuOpen;
                      setIsUserMenuOpen(next);
                      if (next) {
                        setStorageUsage(getUserStorageUsage(currentUser.id));
                        setStreakData(getUserStreak(currentUser.id));
                      }
                    }}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#13131D] hover:bg-[#272738] border border-[#303041] transition-colors text-xs font-semibold text-[#F4F4FA] group"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-[#0B0B12] shadow-xs shrink-0"
                      style={{ backgroundColor: currentUser.avatarColor || '#8B5CF6' }}
                    >
                      {getInitials(currentUser.displayName || currentUser.username)}
                    </div>
                    <span className="max-w-[100px] truncate hidden md:inline">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#9292A8] group-hover:text-[#F4F4FA] transition-transform" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#222231] border border-[#303041] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      
                      {/* User Header Linking to Profile */}
                      <Link 
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 border-b border-[#303041] hover:bg-[#272738] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-[#0B0B12] shrink-0 ring-2 ring-white/10"
                            style={{ backgroundColor: currentUser.avatarColor || '#8B5CF6' }}
                          >
                            {getInitials(currentUser.displayName || currentUser.username)}
                          </div>
                          <div className="truncate min-w-0">
                            <div className="font-bold text-[#F4F4FA] truncate text-sm">{currentUser.displayName || currentUser.username}</div>
                            <div className="text-[11px] text-[#9292A8] font-mono truncate">@{currentUser.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#251B3B] text-[#8B5CF6] border border-[#45455B]/60 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{currentUser.role}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#251B3B] text-[#C4F75B] border border-[#45455B]/60 text-[10px] font-bold font-mono">
                            <Flame className="w-3 h-3 fill-[#C4F75B]" />
                            <span>{streakData.currentStreak}d Streak</span>
                          </div>
                        </div>
                      </Link>

                      {/* Solved Stats Preview */}
                      <div className="px-4 py-2 border-b border-[#303041] flex items-center justify-between text-[#9292A8] font-mono text-[11px] bg-[#191925]">
                        <span>Solved Problems</span>
                        <span className="text-[#4ADE80] font-bold">{currentUser.solvedProblems?.length || 0} / 790</span>
                      </div>

                      {/* Navigation Actions */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-[#272738] text-[#B5B5C8] hover:text-[#F4F4FA] flex items-center gap-2.5 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>Profile & Activity Heatmap</span>
                        </Link>
                        <Link
                          to="/profile?tab=settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-[#272738] text-[#B5B5C8] hover:text-[#F4F4FA] flex items-center gap-2.5 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Account Settings & Storage</span>
                        </Link>
                        <button
                          onClick={handleExportBackup}
                          className="w-full text-left px-4 py-2 hover:bg-[#272738] text-[#B5B5C8] hover:text-[#F4F4FA] flex items-center gap-2.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>Export Account Backup (JSON)</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); setIsAuthModalOpen(true); }}
                          className="w-full text-left px-4 py-2 hover:bg-[#272738] text-[#B5B5C8] hover:text-[#F4F4FA] flex items-center gap-2.5 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-[#FBBF24]" />
                          <span>Switch Account / New User</span>
                        </button>
                        <button
                          onClick={() => { logoutUser(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-[#30191E] text-[#F87171] hover:text-[#F87171] flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738] transition-colors ml-1"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-[#F4F4FA]" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>

          {/* Backdrop overlay when mobile menu is open (dims content below, tap to dismiss) */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Mobile Navigation Dropdown - floating overlay over page text and problems list */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-[calc(100%+0.5rem)] left-4 right-4 z-50 p-3 bg-[#222231] backdrop-blur-2xl border border-[#303041] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100dvh-5.5rem)] overflow-y-auto custom-scrollbar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isInterview = link.path === '/interview' && (
                  location.pathname.startsWith('/interview') ||
                  location.search.includes('assessment=')
                );
                const isResearch = link.path === '/research' && location.pathname.startsWith('/research');
                const isProblems = link.path === '/problems' && (
                  location.pathname.startsWith('/problems') && !location.search.includes('assessment=')
                );
                const isHome = link.path === '/' && location.pathname === '/';
                const isActive = isInterview || isResearch || isProblems || isHome;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#251B3B] text-[#8B5CF6] border border-[#45455B]'
                        : 'text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />}
                  </Link>
                );
              })}

              {/* Profile & Streak Link in Mobile Menu */}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/profile'
                    ? 'bg-[#251B3B] text-[#8B5CF6] border border-[#45455B]'
                    : 'text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738]'
                }`}
              >
                <User className="w-4 h-4 text-[#8B5CF6]" />
                <span>Profile & Streak</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#251B3B] text-[#C4F75B] border border-[#45455B]/60 text-xs font-mono font-bold">
                  <Flame className="w-3.5 h-3.5 fill-[#C4F75B]" />
                  <span>{streakData.currentStreak}d</span>
                </span>
              </Link>

              {/* Theme Toggle Button Inside Mobile Menu */}
              <div className="pt-2 mt-2 border-t border-[#303041]">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[#B5B5C8] hover:text-[#F4F4FA] hover:bg-[#272738] transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-[#8B5CF6]" />
                    ) : (
                      <Sun className="w-4 h-4 text-[#FBBF24]" />
                    )}
                    <span>Theme</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#191925] border border-[#303041]">
                    {isDark ? (
                      <>
                        <Sun className="w-3 h-3 text-[#FBBF24]" />
                        <span>Dark (Tap to switch)</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3 text-[#8B5CF6]" />
                        <span>Light (Tap to switch)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Mobile Solved Counter */}
              <div className="pt-2 border-t border-[#303041] flex items-center justify-between px-3 py-1.5 text-xs text-[#9292A8]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span>Your Solved Problems</span>
                </span>
                <span className="font-mono font-bold text-[#F4F4FA]">{solvedCount} / 790</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
