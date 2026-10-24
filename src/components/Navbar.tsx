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
  ShieldCheck 
} from 'lucide-react';
import { 
  getCurrentUser, 
  logoutUser, 
  getUserSolvedProblems, 
  exportAccountBackup, 
  UserAccount 
} from '../services/authService';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshAuth = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setSolvedCount(user.solvedProblems?.length || 0);
    } else {
      setSolvedCount(0);
    }
  };

  useEffect(() => {
    refreshAuth();
    const savedTheme = localStorage.getItem('opentensor_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
    const handleAuthChange = () => refreshAuth();
    window.addEventListener('tensortonic_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('opentensor_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('opentensor_theme', 'dark');
    }
  };

  const handleExportBackup = () => {
    if (!currentUser) return;
    const jsonStr = exportAccountBackup(currentUser.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opentensor_${currentUser.username}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Problems', path: '/problems' },
    { label: 'Research', path: '/research' },
    { label: 'Interview', path: '/interview' }
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

      <nav className="text-foreground sticky top-0 z-50 w-full pt-3 pb-1">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-14 flex items-center justify-between pl-5 pr-3 rounded-full border backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border-border bg-card/95 dark:border-border/60 dark:bg-background/60">
            
            {/* Left: Brand logo & Nav links */}
            <div className="flex items-center gap-2 md:gap-8 flex-shrink-0">
              <Link to="/" className="hover:opacity-85 transition-opacity flex items-center gap-2.5">
                <img
                  alt="OpenTensor"
                  width={28}
                  height={28}
                  className="h-7 w-auto flex-shrink-0 drop-shadow-sm"
                  src="/images/logos/opentensor.svg"
                />
                <span className="text-foreground font-black text-lg tracking-tight hidden sm:inline font-sans">
                  Open<span className="text-[#93C572]">Tensor</span>
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-6">
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
                      className={`text-sm transition-colors ${
                        isActive
                          ? 'text-brand-accent dark:text-[#93C572] font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground border border-border/80 transition-colors"
                title={currentUser ? `${currentUser.username}'s solved problems` : "Total solved problems"}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#93C572]" />
                <span className="tabular-nums font-mono font-semibold">{solvedCount}</span>
                <span className="text-[11px] opacity-70">/ 790</span>
              </Link>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Account Pill / Menu */}
              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary border border-border/70 transition-colors text-xs font-semibold text-foreground group"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-black shadow-xs shrink-0"
                      style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                    >
                      {getInitials(currentUser.displayName || currentUser.username)}
                    </div>
                    <span className="max-w-[100px] truncate hidden md:inline">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-transform" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#111614] border border-[#27382d] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      
                      {/* User Header */}
                      <div className="px-4 py-2.5 border-b border-[#27382d]">
                        <div className="flex items-center gap-2.5 mb-1">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0"
                            style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                          >
                            {getInitials(currentUser.displayName || currentUser.username)}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-white truncate">{currentUser.displayName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">@{currentUser.username}</div>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#93C572]/15 text-[#93C572] text-[10px] font-semibold mt-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{currentUser.role}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="px-4 py-2 border-b border-[#27382d] flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                        <span>Solved Problems</span>
                        <span className="text-[#93C572] font-bold">{currentUser.solvedProblems?.length || 0}</span>
                      </div>

                      {/* Actions */}
                      <div className="py-1">
                        <button
                          onClick={handleExportBackup}
                          className="w-full text-left px-4 py-2 hover:bg-[#1a241f] text-gray-300 hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#93C572]" />
                          <span>Export Account Backup (JSON)</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); setIsAuthModalOpen(true); }}
                          className="w-full text-left px-4 py-2 hover:bg-[#1a241f] text-gray-300 hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-sky-400" />
                          <span>Switch Account / New User</span>
                        </button>
                        <button
                          onClick={() => { logoutUser(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 flex items-center gap-2.5 transition-colors"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

            </div>

          </div>
        </div>
      </nav>
    </>
  );
};
