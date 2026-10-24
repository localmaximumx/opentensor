import { getUserIdFromSession, recordSubmission, getAccountById } from '../lib/db.js';

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
    const { slug, success, runtimeMs, passedCount, totalCount } = req.body || {};

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Sign in to record progress.' });
    }
    if (!slug) {
      return res.status(400).json({ error: 'Missing problem slug.' });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const submission = {
      timestamp: new Date().toISOString(),
      success: Boolean(success),
      runtimeMs: Number(runtimeMs) || 0,
      passedCount: Number(passedCount) || 0,
      totalCount: Number(totalCount) || 0
    };

    const updatedAccount = await recordSubmission(userId, slug, submission);
    return res.status(200).json({
      success: true,
      solvedProblems: updatedAccount?.solvedProblems || []
    });
  } catch (err) {
    console.error('Save progress error:', err);
    return res.status(500).json({ error: 'Failed to record progress.' });
  }
}
