import { getUserIdFromSession, getAccountById } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token || req.body?.token;

    if (!token) {
      return res.status(401).json({ error: 'No session token provided.' });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const user = await getAccountById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    console.error('Session check error:', err);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
}
