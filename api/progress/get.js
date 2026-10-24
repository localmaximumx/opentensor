import { getUserIdFromSession, getAccountById } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid session.' });
    }

    const user = await getAccountById(userId);
    return res.status(200).json({
      success: true,
      solvedProblems: user?.solvedProblems || [],
      submissions: user?.submissions || {}
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve progress.' });
  }
}
