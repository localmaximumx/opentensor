import { ProblemSummary } from '../types';
import { getProblemCatalog } from './dataService';
import { getCurrentUser, markUserProblemSolved, getUserStreak } from './authService';

export interface DailyChallengeInfo {
  dateStr: string;
  problem: ProblemSummary | null;
  isCompleted: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  timeRemainingFormatted: string;
}

const DAILY_COMPLETED_KEY_PREFIX = 'toniclite_daily_completed_';

export async function getDailyChallenge(): Promise<DailyChallengeInfo> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Calculate seconds until next midnight
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;

  // Deterministic seed based on date string
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
  }
  const positiveSeed = Math.abs(seed);

  let selectedProblem: ProblemSummary | null = null;
  try {
    const catalog = await getProblemCatalog();
    if (catalog && catalog.problems && catalog.problems.length > 0) {
      // Filter for engaging medium/easy problems
      const viable = catalog.problems.filter(p => p.difficulty === 'Medium' || p.difficulty === 'Easy');
      const pool = viable.length > 0 ? viable : catalog.problems;
      const index = positiveSeed % pool.length;
      selectedProblem = pool[index];
    }
  } catch (err) {
    console.error('Failed to get daily challenge problem:', err);
  }

  // Check completion
  let isCompleted = false;
  try {
    const user = getCurrentUser();
    const storedDaily = localStorage.getItem(`${DAILY_COMPLETED_KEY_PREFIX}${dateStr}`);
    if (storedDaily === 'true') {
      isCompleted = true;
    } else if (user && selectedProblem && user.solvedProblems && user.solvedProblems.includes(selectedProblem.slug)) {
      isCompleted = true;
    }
  } catch {
    isCompleted = false;
  }

  return {
    dateStr,
    problem: selectedProblem,
    isCompleted,
    hoursRemaining: hours,
    minutesRemaining: mins,
    secondsRemaining: secs,
    timeRemainingFormatted: timeFormatted
  };
}

export function markDailyChallengeCompleted(dateStr: string) {
  try {
    localStorage.setItem(`${DAILY_COMPLETED_KEY_PREFIX}${dateStr}`, 'true');
    window.dispatchEvent(new CustomEvent('toniclite_daily_completed'));
  } catch {}
}
