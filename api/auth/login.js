import { getAccountByUsername, saveAccount, hashPassword, createSession } from '../lib/db.js';

export default async function handler(req, res) {
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
    const { username, password } = req.body || {};
    const cleanUsername = (username || '').trim().toLowerCase();

    if (!cleanUsername || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const user = await getAccountByUsername(cleanUsername);
    if (!user) {
      return res.status(401).json({ error: 'No account found with that username.' });
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    user.lastLogin = new Date().toISOString();
    await saveAccount(user);

    const token = await createSession(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error during login.' });
  }
}
