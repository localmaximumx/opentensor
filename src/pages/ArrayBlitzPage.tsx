import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Flame, 
  Timer, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Award, 
  ArrowRight, 
  Sparkles, 
  SkipForward, 
  ChevronRight,
  Code2
} from 'lucide-react';
import { runPythonCode } from '../services/pyodideRunner';
import { getCurrentUser, recordUserSubmission } from '../services/authService';

interface BlitzProblem {
  id: string;
  title: string;
  desc: string;
  fnName: string;
  starter: string;
  testCases: { input: any[]; expected: any; description: string }[];
}

const BLITZ_PROBLEMS: BlitzProblem[] = [
  {
    id: 'diag-sum',
    title: 'Matrix Diagonal Sum',
    desc: 'Compute the sum of elements along the main diagonal of a 2D matrix A.',
    fnName: 'diagonal_sum',
    starter: 'def diagonal_sum(A):\n    # Return the trace/diagonal sum\n    return np.trace(A)',
    testCases: [
      { input: [[[1, 2], [3, 4]]], expected: 5, description: '2x2 matrix trace' },
      { input: [[[5, 1, 2], [3, 6, 4], [7, 8, 9]]], expected: 20, description: '3x3 matrix trace' }
    ]
  },
  {
    id: 'norm-1d',
    title: 'Z-Score Normalization',
    desc: 'Standardize a 1D vector x: (x - mean) / std.',
    fnName: 'normalize_1d',
    starter: 'def normalize_1d(x):\n    # Standardize array\n    return (x - np.mean(x)) / (np.std(x) + 1e-8)',
    testCases: [
      { input: [[10.0, 20.0, 30.0]], expected: [-1.2247, 0.0, 1.2247], description: 'Zero-mean unit-variance' }
    ]
  },
  {
    id: 'invert-mask',
    title: 'Invert Boolean Mask',
    desc: 'Given a boolean array mask, invert all True and False values.',
    fnName: 'invert_mask',
    starter: 'def invert_mask(mask):\n    # Invert the boolean mask\n    return ~mask',
    testCases: [
      { input: [[true, false, true]], expected: [false, true, false], description: 'Inverted array' }
    ]
  },
  {
    id: 'row-argmax',
    title: 'Row-wise Argmax',
    desc: 'Find the index of the maximum value along each row of matrix A.',
    fnName: 'row_argmax',
    starter: 'def row_argmax(A):\n    # Return index of max per row\n    return np.argmax(A, axis=1)',
    testCases: [
      { input: [[[1, 9, 3], [8, 2, 4]]], expected: [1, 0], description: 'Max column index for row 0 & row 1' }
    ]
  },
  {
    id: 'matrix-transpose',
    title: 'Matrix Transpose',
    desc: 'Return the transpose of a 2D matrix A.',
    fnName: 'matrix_transpose',
    starter: 'def matrix_transpose(A):\n    # Return transposed matrix\n    return A.T',
    testCases: [
      { input: [[[1, 2, 3], [4, 5, 6]]], expected: [[1, 4], [2, 5], [3, 6]], description: '2x3 becomes 3x2' }
    ]
  },
  {
    id: 'clip-range',
    title: 'Clip Values to Range',
    desc: 'Clip all values in matrix A between low and high.',
    fnName: 'clip_range',
    starter: 'def clip_range(A, low, high):\n    # Clip array\n    return np.clip(A, low, high)',
    testCases: [
      { input: [[[-5, 2, 10], [0, 8, -2]], 0, 5], expected: [[0, 2, 5], [0, 5, 0]], description: 'Clamped between 0 and 5' }
    ]
  },
  {
    id: 'count-positive',
    title: 'Count Positive Elements',
    desc: 'Count how many elements in array A are strictly greater than zero.',
    fnName: 'count_positive',
    starter: 'def count_positive(A):\n    # Count positive values\n    return int(np.sum(A > 0))',
    testCases: [
      { input: [[[-2, 0, 3, -5, 7, 1]]], expected: 3, description: '3 positive items' }
    ]
  },
  {
    id: 'relu',
    title: 'ReLU Activation',
    desc: 'Implement the ReLU activation function max(0, x) element-wise on array x.',
    fnName: 'relu',
    starter: 'def relu(x):\n    # Apply ReLU\n    return np.maximum(x, 0)',
    testCases: [
      { input: [[[-3.0, 4.0, -1.0, 0.0, 5.0]]], expected: [0.0, 4.0, 0.0, 0.0, 5.0], description: 'Zeroed negative elements' }
    ]
  },
  {
    id: 'cumsum',
    title: 'Cumulative Sum',
    desc: 'Compute the cumulative sum of a 1D vector x.',
    fnName: 'cumulative_sum',
    starter: 'def cumulative_sum(x):\n    # Return cumulative sum\n    return np.cumsum(x)',
    testCases: [
      { input: [[1, 2, 3, 4, 5]], expected: [1, 3, 6, 10, 15], description: 'Running sum' }
    ]
  },
  {
    id: 'reverse-rows',
    title: 'Reverse Matrix Rows',
    desc: 'Reverse the order of rows in a 2D matrix A.',
    fnName: 'reverse_rows',
    starter: 'def reverse_rows(A):\n    # Reverse row order\n    return A[::-1]',
    testCases: [
      { input: [[[1, 2], [3, 4], [5, 6]]], expected: [[5, 6], [3, 4], [1, 2]], description: 'Flipped top-to-bottom' }
    ]
  }
];

export const ArrayBlitzPage: React.FC = () => {
  const [gameDuration, setGameDuration] = useState<number>(180); // 3 minutes default
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [code, setCode] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('toniclite_blitz_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const timerRef = useRef<any>(null);
  const currentProblem = BLITZ_PROBLEMS[currentIdx % BLITZ_PROBLEMS.length];

  // Start game
  const startGame = (duration: number = gameDuration) => {
    setGameDuration(duration);
    setSecondsRemaining(duration);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setSolvedCount(0);
    setCurrentIdx(0);
    setCode(BLITZ_PROBLEMS[0].starter);
    setStatusMessage(null);
    setGameState('running');
  };

  // Clock countdown
  useEffect(() => {
    if (gameState === 'running') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const finishGame = () => {
    setGameState('finished');
    setScore(prev => {
      if (prev > highScore) {
        setHighScore(prev);
        try {
          localStorage.setItem('toniclite_blitz_highscore', String(prev));
        } catch {}
      }
      return prev;
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Switch to problem
  useEffect(() => {
    if (gameState === 'running') {
      setCode(currentProblem.starter);
      setStatusMessage(null);
    }
  }, [currentIdx, gameState]);

  // Run and check solution
  const handleSubmit = async () => {
    if (isVerifying || gameState !== 'running') return;
    setIsVerifying(true);
    setStatusMessage({ text: 'Evaluating solution...', type: 'info' });

    try {
      // Build test script
      const testCasesJson = JSON.stringify(currentProblem.testCases);
      const harness = `
import numpy as np
import json

${code}

test_cases = json.loads('''${testCasesJson}''')
results = []
all_passed = True

for tc in test_cases:
    inputs = tc['input']
    expected = tc['expected']
    
    # convert nested lists to numpy arrays
    py_args = [np.array(arg) if isinstance(arg, list) else arg for arg in inputs]
    
    try:
        out = ${currentProblem.fnName}(*py_args)
        if isinstance(out, np.ndarray):
            out_list = out.tolist()
        else:
            out_list = out
            
        # Comparison check
        if isinstance(expected, list):
            diff = np.max(np.abs(np.array(out) - np.array(expected)))
            passed = diff < 1e-3
        else:
            passed = (out == expected)
            
        if not passed:
            all_passed = False
            break
    except Exception as e:
        all_passed = False
        break

print(json.dumps({"passed": all_passed}))
`;

      const rep = await runPythonCode(harness);
      let passed = false;
      if (rep.success && rep.stdout) {
        try {
          const lines = rep.stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const parsed = JSON.parse(lastLine);
          passed = !!parsed.passed;
        } catch {}
      }

      if (passed) {
        // Success!
        const pts = 100 * combo;
        setScore(prev => prev + pts);
        setCombo(prev => {
          const next = prev + 1;
          if (next > maxCombo) setMaxCombo(next);
          return next;
        });
        setSolvedCount(prev => prev + 1);
        setStatusMessage({ text: `Correct! +${pts} pts! 🔥`, type: 'success' });

        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.7 }
        });

        setTimeout(() => {
          setCurrentIdx(prev => prev + 1);
          setIsVerifying(false);
        }, 350);
      } else {
        // Failed
        setCombo(1);
        setStatusMessage({ text: 'Test cases failed. Check vector operations & return type!', type: 'error' });
        setIsVerifying(false);
      }
    } catch (e: any) {
      setCombo(1);
      setStatusMessage({ text: e.message || 'Execution error', type: 'error' });
      setIsVerifying(false);
    }
  };

  const skipProblem = () => {
    setCombo(1);
    setScore(prev => Math.max(0, prev - 25));
    setCurrentIdx(prev => prev + 1);
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-y-auto">
      {/* Top Banner */}
      <div className="border-b border-border/70 bg-secondary/20 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> SPEEDRUN MODE
              </span>
              <span className="text-xs text-muted-foreground">High Score: <strong className="text-foreground">{highScore} pts</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              3-Minute Array Blitz
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Solve rapid-fire NumPy and vector operations against the clock. Build combo multipliers & climb ranks!
            </p>
          </div>

          {gameState === 'idle' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => startGame(60)}
                className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold transition-all"
              >
                ⚡ 1-Min Bullet
              </button>
              <button
                onClick={() => startGame(180)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Start 3-Min Blitz
              </button>
              <button
                onClick={() => startGame(300)}
                className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold transition-all"
              >
                🏃 5-Min Marathon
              </button>
            </div>
          )}

          {gameState === 'running' && (
            <div className="flex items-center gap-4 bg-background/80 px-4 py-2 rounded-2xl border border-border/80 shadow-sm">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${secondsRemaining <= 30 ? 'text-rose-400 animate-bounce' : 'text-primary'}`} />
                <span className={`font-mono text-2xl font-black ${secondsRemaining <= 30 ? 'text-rose-400' : 'text-foreground'}`}>
                  {timeFormatted}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-border" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Score</div>
                <div className="font-mono text-xl font-black text-primary">{score}</div>
              </div>
              <div className="h-6 w-[1px] bg-border" />
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <Flame className="w-4 h-4 fill-current animate-pulse" />
                <span>{combo}x</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {gameState === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto py-8">
            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/80 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Instant Vector Puzzles</h3>
              <p className="text-xs text-muted-foreground">
                Micro array challenges designed to sharpen your muscle memory on shapes, broadcasting, slicing, and reductions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/80 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-lg font-bold">Combo Streak Fire</h3>
              <p className="text-xs text-muted-foreground">
                Each consecutive correct puzzle multiplies your score from 1x to 5x. One wrong submission resets the streak!
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/80 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Climb ML Rank ELO</h3>
              <p className="text-xs text-muted-foreground">
                Score points in Blitz mode to directly boost your user rank tier from Scalar Novice to Tensor Grandmaster.
              </p>
            </div>
          </div>
        )}

        {gameState === 'running' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
            {/* Left Prompt */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-secondary/20 border border-border/80 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-primary">Challenge #{currentIdx + 1}</span>
                  <span>Solves: {solvedCount}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {currentProblem.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentProblem.desc}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-background/80 border border-border/60">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Example Test Case:</div>
                  <div className="font-mono text-xs text-foreground">
                    Input: {JSON.stringify(currentProblem.testCases[0]?.input[0])}
                  </div>
                  <div className="font-mono text-xs text-emerald-400 mt-1">
                    Expected: {JSON.stringify(currentProblem.testCases[0]?.expected)}
                  </div>
                </div>
              </div>

              {/* Status Notice */}
              {statusMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={skipProblem}
                  className="px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip (-25 pts)
                </button>
                <button
                  onClick={() => finishGame()}
                  className="px-3 py-2 rounded-xl bg-background border border-border/80 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
                >
                  End Blitz
                </button>
              </div>
            </div>

            {/* Right Quick Code Box */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="p-4 rounded-2xl bg-secondary/15 border border-border/80 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary" /> Python 3.12 (NumPy enabled)
                  </span>
                  <span>Press Submit or Ctrl+Enter</span>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  className="w-full flex-1 min-h-[220px] bg-background font-mono text-sm p-3 rounded-xl border border-border/80 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="def solution(): ..."
                  autoFocus
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" /> Submit One-Liner (Ctrl + Enter)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="max-w-lg mx-auto w-full p-6 sm:p-8 rounded-3xl bg-secondary/20 border border-border/80 shadow-2xl text-center space-y-6 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Speedrun Completed</span>
              <h2 className="text-3xl font-black text-foreground tracking-tight mt-1">
                {score >= highScore ? 'New Personal Best! 🎉' : 'Great Speedrun! ⚡'}
              </h2>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-background/80 border border-border/80">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold">Total Score</div>
                <div className="font-mono text-2xl font-black text-primary">{score}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold">Puzzles Solved</div>
                <div className="font-mono text-2xl font-black text-emerald-400">{solvedCount}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold">Max Combo</div>
                <div className="font-mono text-2xl font-black text-amber-400">{maxCombo}x</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => startGame(gameDuration)}
                className="w-full sm:flex-1 py-3 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <Link
                to="/problems"
                className="w-full sm:flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2"
              >
                Browse Catalog <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
