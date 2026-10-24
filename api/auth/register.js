import { getAccountByUsername, saveAccount, hashPassword, createSession } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username, password, displayName, role, avatarColor } = req.body || {};

    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const existing = await getAccountByUsername(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another or sign in.' });
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();
    const colors = ['#38BDF8', '#0EA5E9', '#93C572', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'];
    const chosenColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      username: cleanUsername,
      passwordHash,
      displayName: (displayName || '').trim() || cleanUsername,
      role: role || 'Machine Learning Engineer',
      avatarColor: chosenColor,
      createdAt: now,
      lastLogin: now,
      solvedProblems: [],
      codeDrafts: {},
      submissions: {}
    };

    await saveAccount(newUser);
    const token = await createSession(newUser.id);

    // Return safe user object (excluding passwordHash)
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal Server Error during registration.' });
  }
}
