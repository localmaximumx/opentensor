import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  Timer, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Trophy 
} from 'lucide-react';
import { getDailyChallenge, DailyChallengeInfo } from '../services/dailyChallengeService';

export const DailyChallengeBanner: React.FC = () => {
  const [dailyInfo, setDailyInfo] = useState<DailyChallengeInfo | null>(null);

  const fetchDaily = () => {
    getDailyChallenge().then(info => setDailyInfo(info));
  };

  useEffect(() => {
    fetchDaily();
    const interval = setInterval(fetchDaily, 30000); // refresh every 30s
    window.addEventListener('toniclite_daily_completed', fetchDaily);
    window.addEventListener('tensortonic_auth_change', fetchDaily);
    return () => {
      clearInterval(interval);
      window.removeEventListener('toniclite_daily_completed', fetchDaily);
      window.removeEventListener('tensortonic_auth_change', fetchDaily);
    };
  }, []);

  if (!dailyInfo || !dailyInfo.problem) return null;

  const { problem, isCompleted, timeRemainingFormatted } = dailyInfo;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-secondary/30 via-secondary/15 to-secondary/30 p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
      {/* Decorative accent glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25 flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" /> PROBLEM OF THE DAY
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" /> 2x Streak Multiplier
            </span>
            {isCompleted && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Solved Today!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
              {problem.title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              problem.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              problem.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-primary" /> Resets in: <strong className="text-foreground font-mono">{timeRemainingFormatted}</strong>
            </span>
            <span>•</span>
            <span>Category: <strong className="text-foreground capitalize">{problem.category}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/problems/${problem.slug}`}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
              isCompleted
                ? 'bg-secondary hover:bg-secondary/80 border border-border text-foreground'
                : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20'
            }`}
          >
            {isCompleted ? 'Review Solution' : 'Solve Daily Challenge'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
