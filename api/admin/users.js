import { getAllUserAccounts } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const accounts = await getAllUserAccounts();
    const safeUsers = accounts.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      role: u.role || 'Machine Learning Engineer',
      avatarColor: u.avatarColor || '#38BDF8',
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      solvedCount: (u.solvedProblems || []).length,
      solvedProblems: u.solvedProblems || [],
      submissionCount: Object.keys(u.submissions || {}).length
    }));

    return res.status(200).json({
      success: true,
      totalUsers: safeUsers.length,
      users: safeUsers
    });
  } catch (err) {
    console.error('Admin users fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}
