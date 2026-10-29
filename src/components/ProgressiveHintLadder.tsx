import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Lock, 
  Unlock, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  Layers,
  Code2
} from 'lucide-react';
import { MathView } from './MathView';

interface ProgressiveHintLadderProps {
  slug: string;
  hints?: (string | any)[];
  theory?: string;
  requirements?: string | string[];
}

export const ProgressiveHintLadder: React.FC<ProgressiveHintLadderProps> = ({
  slug,
  hints = [],
  theory,
  requirements
}) => {
  const storageKey = `toniclite_hints_unlocked_${slug}`;
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(storageKey) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [confirmUnlockIdx, setConfirmUnlockIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(unlockedLevel));
    } catch {}
  }, [unlockedLevel, storageKey]);

  // Extract or synthesize 3 tiered hints
  const rawHints = hints.map(h => (typeof h === 'string' ? h : h.content || JSON.stringify(h)));

  const stage1Text = rawHints[0] || (theory ? 'Focus on the fundamental mathematical invariant before touching code. What dimensions does the input have, and what shape must the output be?' : 'Examine the input dimensions and expected output shape carefully.');
  const stage2Text = rawHints[1] || (requirements ? `Consider using vectorization rather than Python for-loops. Look into functions like np.einsum, np.matmul, or broadcasting.` : 'Look for NumPy functions that operate across axes (e.g. axis=-1, keepdims=True) to avoid manual loops.');
  const stage3Text = rawHints[2] || rawHints[rawHints.length - 1] || 'Step 1: Normalize or reshape the input array.\nStep 2: Apply the reduction or matrix transformation along the specified axis.\nStep 3: Return the result with appropriate type casting.';

  const stages = [
    {
      level: 1,
      title: 'Stage 1: Core Mathematical Intuition',
      subtitle: 'Conceptual mental model & invariants',
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      content: stage1Text
    },
    {
      level: 2,
      title: 'Stage 2: NumPy / Vector Primitives',
      subtitle: 'Key library functions & broadcasting rules',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      content: stage2Text
    },
    {
      level: 3,
      title: 'Stage 3: Algorithmic Pseudocode',
      subtitle: 'Step-by-step logic structure without spoilers',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      content: stage3Text
    }
  ];

  const handleUnlock = (lvl: number) => {
    setUnlockedLevel(lvl);
    setConfirmUnlockIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            3-Stage Progressive Hint Ladder
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reveal hints one step at a time so you don't spoil the challenge
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary/60 border border-border/80 text-muted-foreground">
          {unlockedLevel}/3 Revealed
        </span>
      </div>

      <div className="space-y-3">
        {stages.map(stage => {
          const isUnlocked = unlockedLevel >= stage.level;
          const isNextToUnlock = unlockedLevel === stage.level - 1;

          return (
            <div
              key={stage.level}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isUnlocked
                  ? 'bg-secondary/25 border-border/80 shadow-sm'
                  : 'bg-secondary/10 border-border/40 opacity-80'
              }`}
            >
              {/* Header */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-background border border-border/80 text-foreground'
                      : 'bg-muted/40 border border-border/40 text-muted-foreground'
                  }`}>
                    {stage.icon}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{stage.title}</span>
                      {isUnlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{stage.subtitle}</p>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                  ) : isNextToUnlock ? (
                    confirmUnlockIdx === stage.level ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUnlock(stage.level)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmUnlockIdx(null)}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmUnlockIdx(stage.level)}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3" /> Unlock Hint {stage.level}
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Unlocked Content */}
              {isUnlocked && (
                <div className="px-4 pb-4 pt-1 border-t border-border/40">
                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans bg-background/60 p-3.5 rounded-xl border border-border/60">
                    <MathView content={stage.content} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
