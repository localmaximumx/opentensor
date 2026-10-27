import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  LogIn,
  UserPlus
} from 'lucide-react';
import { 
  loginUser, 
  registerUser, 
  getAllAccounts, 
  UserAccount 
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserAccount) => void;
  initialTab?: 'login' | 'register';
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
  promptMessage
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'Data Scientist' | 'Research Engineer' | 'Machine Learning Engineer' | 'Student'>('Machine Learning Engineer');
  const [regColor, setRegColor] = useState('#8B5CF6');
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingAccounts = getAllAccounts();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    const res = await loginUser(loginUsername, loginPassword);
    setIsSubmitting(false);

    if (res.success && res.user) {
      if (onSuccess) onSuccess(res.user);
      onClose();
    } else {
      setLoginError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerUser(regUsername, regPassword, regDisplayName, regRole, regColor);
    setIsSubmitting(false);

    if (res.success && res.user) {
      if (onSuccess) onSuccess(res.user);
      onClose();
    } else {
      setRegError(res.error || 'Failed to create account.');
    }
  };

  const colors = [
    { name: 'Violet', hex: '#8B5CF6' },
    { name: 'Lime', hex: '#C4F75B' },
    { name: 'Cyan', hex: '#38BDF8' },
    { name: 'Rose', hex: '#F472B6' },
    { name: 'Amber', hex: '#FBBF24' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#191925] border border-[#303041] rounded-2xl shadow-2xl z-10 text-foreground animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-[#303041] flex items-center justify-between bg-[#13131D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#251B3B] border border-[#45455B] flex items-center justify-center text-[#8B5CF6]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">TonicLite Account</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Synced Progress & Code Drafts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-secondary/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Prompt Message Banner */}
        {promptMessage && (
          <div className="px-5 py-2.5 bg-[#251B3B] border-b border-[#45455B] text-[#8B5CF6] text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mx-5 mt-4 rounded-xl bg-[#13131D] border border-[#303041]">
          <button
            onClick={() => { setActiveTab('login'); setLoginError(null); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'login'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setRegError(null); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'register'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Tab 1: Log In */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
            {loginError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full bg-[#13131D] border border-[#303041] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#13131D] border border-[#303041] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick-Pick Existing Accounts */}
            {existingAccounts.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground block mb-1.5">Saved accounts on this browser:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {existingAccounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setLoginUsername(acc.username)}
                      className="px-2 py-1 rounded bg-[#13131D] hover:bg-[#272738] border border-[#303041] text-[11px] text-gray-300 flex items-center gap-1.5 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.avatarColor }} />
                      <span>{acc.username}</span>
                      <span className="text-[9px] text-[#8B5CF6] font-mono">({acc.solvedProblems.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Account
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Create Account */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {regError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Username <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. alex_ml"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full bg-[#13131D] border border-[#303041] rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Unique identifier used to login</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Mercer"
                value={regDisplayName}
                onChange={e => setRegDisplayName(e.target.value)}
                className="w-full bg-[#13131D] border border-[#303041] rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Target Track / Role
              </label>
              <select
                value={regRole}
                onChange={e => setRegRole(e.target.value as any)}
                className="w-full bg-[#13131D] border border-[#303041] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer"
              >
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Research Engineer">Research Engineer (Frontier Lab)</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Student">Student / Self-Paced</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 4 chars"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#13131D] border border-[#303041] rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-[#13131D] border border-[#303041] rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Profile Theme Color
              </label>
              <div className="flex items-center gap-2">
                {colors.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setRegColor(c.hex)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      regColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#191925]' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Profile & Start Solving
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
