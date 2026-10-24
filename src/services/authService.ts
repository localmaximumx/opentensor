export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: 'Data Scientist' | 'Research Engineer' | 'Machine Learning Engineer' | 'Student';
  avatarColor: string;
  createdAt: string;
  lastLogin: string;
  solvedProblems: string[];
  codeDrafts: Record<string, string>;
  submissions: Record<string, {
    timestamp: string;
    success: boolean;
    runtimeMs: number;
    passedCount: number;
    totalCount: number;
  }[]>;
}

const ACCOUNTS_STORAGE_KEY = 'tensortonic_accounts';
const SESSION_STORAGE_KEY = 'tensortonic_auth_session';
const AUTH_TOKEN_KEY = 'tensortonic_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

// SHA-256 password hash using standard Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getAllAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load accounts', e);
    return [];
  }
}

function saveAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionUserId) return null;
    const accounts = getAllAccounts();
    return accounts.find(a => a.id === sessionUserId) || null;
  } catch (e) {
    return null;
  }
}

export async function syncUserSession(): Promise<UserAccount | null> {
  const token = getAuthToken();
  if (!token) return getCurrentUser();

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(
          a => a.id === data.user.id || a.username.toLowerCase() === data.user.username.toLowerCase()
        );
        const fullUser: UserAccount = {
          ...data.user,
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = { ...accounts[existingIdx], ...fullUser };
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);

        if (Array.isArray(fullUser.solvedProblems) && fullUser.solvedProblems.length > 0) {
          const stored = localStorage.getItem('tensortonic_solved_problems');
          const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
          fullUser.solvedProblems.forEach((s: string) => localSet.add(s));
          localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
        }

        window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
        return fullUser;
      }
    }
  } catch (e) {
    // offline or backend unreachable
  }
  return getCurrentUser();
}

if (typeof window !== 'undefined') {
  syncUserSession();
}

export function setCurrentSession(userId: string | null): void {
  if (userId) {
    localStorage.setItem(SESSION_STORAGE_KEY, userId);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
}

export async function registerUser(
  username: string,
  passwordPlain: string,
  displayName?: string,
  role?: 'Data Scientist' | 'Research Engineer' | 'Machine Learning Engineer' | 'Student',
  avatarColor?: string
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes.' };
  }
  if (!passwordPlain || passwordPlain.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // 1. Try Vercel Serverless Backend API
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: passwordPlain,
        displayName,
        role,
        avatarColor
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setAuthToken(data.token);
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(a => a.id === data.user.id || a.username.toLowerCase() === cleanUsername);
        const fullUser: UserAccount = {
          ...data.user,
          passwordHash: await hashPassword(passwordPlain),
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = fullUser;
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);
        return { success: true, user: fullUser };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error && res.status !== 404 && res.status !== 502) {
        return { success: false, error: errData.error };
      }
    }
  } catch (apiErr) {
    // Backend API offline or local dev, fallback seamlessly to client accounts
  }

  // 2. Client-side local fallback
  const accounts = getAllAccounts();
  if (accounts.some(a => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Username is already taken. Please choose another or sign in.' };
  }

  const passwordHash = await hashPassword(passwordPlain);
  const now = new Date().toISOString();
  const colors = ['#93C572', '#38BDF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'];
  const chosenColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    passwordHash,
    displayName: displayName?.trim() || cleanUsername,
    role: role || 'Machine Learning Engineer',
    avatarColor: chosenColor,
    createdAt: now,
    lastLogin: now,
    solvedProblems: [],
    codeDrafts: {},
    submissions: {}
  };

  accounts.push(newUser);
  saveAccounts(accounts);
  setCurrentSession(newUser.id);

  return { success: true, user: newUser };
}

export async function loginUser(
  username: string,
  passwordPlain: string
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Try Vercel Serverless Backend API
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: passwordPlain
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setAuthToken(data.token);
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(a => a.id === data.user.id || a.username.toLowerCase() === cleanUsername);
        const fullUser: UserAccount = {
          ...data.user,
          passwordHash: await hashPassword(passwordPlain),
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = fullUser;
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);
        return { success: true, user: fullUser };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error && res.status !== 404 && res.status !== 502) {
        return { success: false, error: errData.error };
      }
    }
  } catch (apiErr) {
    // Backend API offline or local dev, fallback to local accounts
  }

  // 2. Client-side local fallback
  const accounts = getAllAccounts();
  const user = accounts.find(a => a.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'No account found with that username.' };
  }

  const inputHash = await hashPassword(passwordPlain);
  if (inputHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  user.lastLogin = new Date().toISOString();
  saveAccounts(accounts);
  setCurrentSession(user.id);

  return { success: true, user };
}

export function logoutUser(): void {
  const token = getAuthToken();
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
    setAuthToken(null);
  }
  setCurrentSession(null);
}

// Scoped progress helpers
export function getUserSolvedProblems(userId?: string): Set<string> {
  const current = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!current) return new Set();
  return new Set(current.solvedProblems || []);
}

export function markUserProblemSolved(slug: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.solvedProblems.includes(slug)) {
      target.solvedProblems.push(slug);
      saveAccounts(accounts);
      window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
    }
  }
}

export function unmarkUserProblemSolved(slug: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target && target.solvedProblems) {
    target.solvedProblems = target.solvedProblems.filter(s => s !== slug);
    saveAccounts(accounts);
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  }
}

export function getUserSavedCode(slug: string, defaultCode: string, userId?: string): string {
  const current = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!current || !current.codeDrafts) return defaultCode;
  const saved = current.codeDrafts[slug];
  if (!saved) return defaultCode;
  if (
    saved.includes('Reference Python implementation') ||
    saved.includes('def solution():\n    pass') ||
    saved.trim().endsWith('return x') ||
    saved.trim().endsWith('return arr') ||
    saved.trim() === 'SELECT * FROM table;'
  ) {
    return defaultCode;
  }
  return saved;
}

export function saveUserCode(slug: string, code: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.codeDrafts) target.codeDrafts = {};
    target.codeDrafts[slug] = code;
    saveAccounts(accounts);
  }

  // Sync to Vercel API
  const token = getAuthToken();
  if (token) {
    fetch('/api/code/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ slug, code })
    }).catch(() => {});
  }
}

export function recordUserSubmission(
  slug: string,
  success: boolean,
  runtimeMs: number,
  passedCount: number,
  totalCount: number,
  userId?: string
): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.submissions) target.submissions = {};
    if (!target.submissions[slug]) target.submissions[slug] = [];
    target.submissions[slug].push({
      timestamp: new Date().toISOString(),
      success,
      runtimeMs,
      passedCount,
      totalCount
    });
    if (success && !target.solvedProblems.includes(slug)) {
      target.solvedProblems.push(slug);
    }
    saveAccounts(accounts);
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  }

  // Also sync to global solved problems store for instant catalog counter
  if (success) {
    try {
      const stored = localStorage.getItem('tensortonic_solved_problems');
      const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
      localSet.add(slug);
      localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
      window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
    } catch (e) {}
  }

  // Sync to Vercel API
  const token = getAuthToken();
  if (token) {
    fetch('/api/progress/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ slug, success, runtimeMs, passedCount, totalCount })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.solvedProblems)) {
          const accs = getAllAccounts();
          const t = accs.find(a => a.id === currentId);
          if (t) {
            t.solvedProblems = data.solvedProblems;
            saveAccounts(accs);
          }
          const stored = localStorage.getItem('tensortonic_solved_problems');
          const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
          data.solvedProblems.forEach((s: string) => localSet.add(s));
          localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
          window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
        }
      })
      .catch(() => {});
  }
}

export function exportAccountBackup(userId?: string): string {
  const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!user) return '';
  return JSON.stringify(user, null, 2);
}

export function importAccountBackup(jsonString: string): { success: boolean; error?: string; user?: UserAccount } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.username || !data.passwordHash) {
      return { success: false, error: 'Invalid account backup file.' };
    }
    const accounts = getAllAccounts();
    const existingIdx = accounts.findIndex(a => a.username.toLowerCase() === data.username.toLowerCase());
    if (existingIdx !== -1) {
      accounts[existingIdx] = { ...accounts[existingIdx], ...data };
    } else {
      accounts.push(data);
    }
    saveAccounts(accounts);
    setCurrentSession(data.id);
    return { success: true, user: data };
  } catch (e: any) {
    return { success: false, error: e.message || 'Corrupted account JSON file.' };
  }
}
