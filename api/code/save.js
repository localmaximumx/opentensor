import { getUserIdFromSession, saveDraft } from '../lib/db.js';

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
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body?.token;
    const { slug, code } = req.body || {};

    if (!token || !slug) {
      return res.status(400).json({ error: 'Missing token or problem slug.' });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    await saveDraft(userId, slug, code || '');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save code draft.' });
  }
}
