import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Timer, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  Sparkles, 
  Code2, 
  FileText, 
  Terminal, 
  ChevronRight, 
  Layers, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ChevronLeft,
  X,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { getProblemDetail } from '../services/dataService';
import { runPythonCode, ExecutionReport } from '../services/pyodideRunner';
import { getCurrentUser } from '../services/authService';
import { ProblemDetail, TestCase } from '../types';

export interface MockTrack {
  id: string;
  name: string;
  companyTarget: string;
  durationMinutes: number;
  level: string;
  description: string;
  problemSlugs: string[];
}

export const MOCK_TRACKS: MockTrack[] = [
  {
    id: 'track-mle-screening',
    name: 'Machine Learning Engineer Screening',
    companyTarget: 'Meta · Google · ByteDance',
    durationMinutes: 45,
    level: 'L4 / E4 Mid-Level',
    description: 'Standard 45-minute technical coding screening focusing on numerical stability, tensor manipulation, and core attention layer mechanics.',
    problemSlugs: ['sigmoid-numpy', 'scaled-dot-product-attention']
  },
  {
    id: 'track-research-eng',
    name: 'Senior AI Research Engineer',
    companyTarget: 'OpenAI · Anthropic · DeepMind',
    durationMinutes: 60,
    level: 'L5 / E5 Senior',
    description: 'Advanced 60-minute session testing transformer architecture foundations: positional harmonics, layer normalization, and gradient stability.',
    problemSlugs: ['positional-encoding', 'dl-layer-normalization']
  },
  {
    id: 'track-optim-systems',
    name: 'ML Optimization & Training Systems',
    companyTarget: 'NVIDIA · PyTorch · Tesla AI',
    durationMinutes: 45,
    level: 'L4 / L5 Systems',
    description: 'Focuses on optimizer update steps, first & second moments, and end-to-end gradient descent training loops.',
    problemSlugs: ['adam-optimizer', 'logistic-regression-training']
  },
  {
    id: 'track-computer-vision',
    name: 'Computer Vision & Perception Engineer',
    companyTarget: 'Waymo · Cruise · Apple Vision',
    durationMinutes: 45,
    level: 'Mid / Senior',
    description: 'Geometry transformations, coordinate frame math, and multi-scale anchor bounding box generation for object detection.',
    problemSlugs: ['homogeneous-transform', 'anchor-box-generation']
  }
];

export interface MockSessionResult {
  trackId: string;
  trackName: string;
  totalTimeSeconds: number;
  timeSpentSeconds: number;
  submittedAt: number;
  problems: {
    slug: string;
    title: string;
    difficulty: string;
    totalTests: number;
    passedTests: number;
    passed: boolean;
    userCode: string;
  }[];
  overallVerdict: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Practice';
  totalPassedTests: number;
  totalTests: number;
  scorePercentage: number;
}

export const MockInterviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Session state: 'select' -> 'briefing' -> 'active' -> 'scorecard'
  const [sessionState, setSessionState] = useState<'select' | 'briefing' | 'active' | 'scorecard'>('select');
  const [selectedTrack, setSelectedTrack] = useState<MockTrack>(MOCK_TRACKS[0]);

  // Active interview state
  const [problemsData, setProblemsData] = useState<ProblemDetail[]>([]);
  const [currentProblemIdx, setCurrentProblemIdx] = useState<number>(0);
  const [userCodes, setUserCodes] = useState<Record<string, string>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [testReports, setTestReports] = useState<Record<string, ExecutionReport | null>>({});
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'scratchpad'>('problem');
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState<number>(0);

  // Timer state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(45 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Scorecard result
  const [finalResult, setFinalResult] = useState<MockSessionResult | null>(null);

  // Load problem details when entering briefing or active
  const handleSelectTrack = async (track: MockTrack) => {
    setSelectedTrack(track);
    setSessionState('briefing');
  };

  const handleStartInterview = async () => {
    setSessionState('active');
    setTimeRemainingSeconds(selectedTrack.durationMinutes * 60);
    setIsTimerPaused(false);
    setCurrentProblemIdx(0);

    // Fetch problem details
    const loaded: ProblemDetail[] = [];
    const initialCodes: Record<string, string> = {};
    const initialReports: Record<string, ExecutionReport | null> = {};

    for (const slug of selectedTrack.problemSlugs) {
      const data = await getProblemDetail(slug);
      if (data) {
        loaded.push(data);
        initialCodes[slug] = data.starterCode || 'def solution():\n    pass\n';
      }
      initialReports[slug] = null;
    }

    setProblemsData(loaded);
    setUserCodes(initialCodes);
    setTestReports(initialReports);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (sessionState !== 'active' || isTimerPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleEndInterview(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, isTimerPaused]);

  const currentProblem = problemsData[currentProblemIdx];
  const currentSlug = currentProblem?.slug || '';
  const currentCode = userCodes[currentSlug] || currentProblem?.starterCode || '';
  const currentReport = testReports[currentSlug] || null;

  // Determine function name
  const getFunctionName = (problem: ProblemDetail, code: string): string => {
    if (problem.functionMetadata?.name) return problem.functionMetadata.name;
    const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (match) return match[1];
    return problem.slug.replace(/[^a-zA-Z0-9_]/g, '_') || 'solution';
  };

  // Run Testcases for Current Problem
  const handleRunCurrentTests = async () => {
    if (!currentProblem || isRunningTests) return;

    setIsRunningTests(true);
    try {
      const casesToRun = currentProblem.testCases || [];
      const fnName = getFunctionName(currentProblem, currentCode);
      const report = await runPythonCode(currentCode, fnName, casesToRun);
      
      setTestReports(prev => ({
        ...prev,
        [currentSlug]: report
      }));
    } catch (err: any) {
      console.error('Execution failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // End Interview & Generate Scorecard
  const handleEndInterview = (timeExpired: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSeconds = selectedTrack.durationMinutes * 60;
    const timeSpent = totalSeconds - timeRemainingSeconds;

    let totalTestsAcrossAll = 0;
    let passedTestsAcrossAll = 0;

    const problemSummaries = problemsData.map(prob => {
      const report = testReports[prob.slug];
      const totalTests = prob.testCases?.length || 1;
      const passedTests = report ? report.results.filter(r => r.passed).length : 0;
      const passed = passedTests === totalTests && totalTests > 0;

      totalTestsAcrossAll += totalTests;
      passedTestsAcrossAll += passedTests;

      return {
        slug: prob.slug,
        title: prob.title,
        difficulty: prob.difficulty,
        totalTests,
        passedTests,
        passed,
        userCode: userCodes[prob.slug] || ''
      };
    });

    const scorePercentage = totalTestsAcrossAll > 0 
      ? Math.round((passedTestsAcrossAll / totalTestsAcrossAll) * 100) 
      : 0;

    let overallVerdict: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Practice' = 'Needs Practice';
    if (scorePercentage === 100) {
      overallVerdict = 'Strong Hire';
    } else if (scorePercentage >= 75) {
      overallVerdict = 'Hire';
    } else if (scorePercentage >= 50) {
      overallVerdict = 'Leaning Hire';
    }

    const result: MockSessionResult = {
      trackId: selectedTrack.id,
      trackName: selectedTrack.name,
      totalTimeSeconds: totalSeconds,
      timeSpentSeconds: timeSpent,
      submittedAt: Date.now(),
      problems: problemSummaries,
      overallVerdict,
      totalPassedTests: passedTestsAcrossAll,
      totalTests: totalTestsAcrossAll,
      scorePercentage
    };

    // Save to localStorage
    try {
      const existingStr = localStorage.getItem('toniclite_mock_interviews');
      const list = existingStr ? JSON.parse(existingStr) : [];
      list.unshift(result);
      localStorage.setItem('toniclite_mock_interviews', JSON.stringify(list.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save mock interview:', e);
    }

    setFinalResult(result);
    setSessionState('scorecard');
  };

  // Format Time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW 1: TRACK SELECTION
  // =========================================================================
  if (sessionState === 'select') {
    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-background text-foreground pb-12">
        {/* Header Banner */}
        <div className="border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-8 py-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93C572] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Interview Simulation Arena</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                <span>Mock Technical Interview Simulator</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                  Live Pyodide Sandbox
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                Experience realistic, timed FAANG/Tier-1 AI technical interviews with live code execution, real PyTorch & NumPy test cases, and a comprehensive hiring scorecard.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/flashcards"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary/70 hover:bg-secondary text-xs font-semibold text-foreground transition-colors border border-border/80"
              >
                <Zap className="w-3.5 h-3.5 text-[#93C572]" />
                <span>Theory Flashcards</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 w-full flex-1">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Select an Interview Track</h2>
            <p className="text-xs text-muted-foreground">Each track simulates a full technical coding round with multiple sequential problems.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MOCK_TRACKS.map(track => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="group p-6 rounded-2xl border border-border/80 bg-card/70 hover:border-[#93C572]/50 hover:bg-card transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#93C572]/5 rounded-bl-full pointer-events-none group-hover:bg-[#93C572]/10 transition-colors" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 font-semibold">
                      {track.level}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {track.durationMinutes} Minutes
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground group-hover:text-[#93C572] transition-colors mb-1">
                    {track.name}
                  </h3>
                  <div className="text-xs text-sky-400 font-medium mb-3">
                    {track.companyTarget}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {track.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Layers className="w-3.5 h-3.5 text-[#93C572]" />
                    <span>{track.problemSlugs.length} Problems</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#93C572] group-hover:translate-x-1 transition-transform">
                    <span>Prepare & Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Past Mock Interview History */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#93C572]" />
              <span>Recent Mock Interview Scorecards</span>
            </h3>

            {(() => {
              const savedStr = localStorage.getItem('toniclite_mock_interviews');
              const list: MockSessionResult[] = savedStr ? JSON.parse(savedStr) : [];
              if (list.length === 0) {
                return (
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 text-xs text-muted-foreground text-center">
                    No mock interviews completed yet. Choose a track above to run your first session!
                  </div>
                );
              }
              return (
                <div className="space-y-2.5">
                  {list.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-card/60 border border-border/80 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          item.overallVerdict === 'Strong Hire' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.overallVerdict === 'Hire' ? 'bg-[#93C572]/20 text-[#93C572]' :
                          item.overallVerdict === 'Leaning Hire' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {item.overallVerdict}
                        </span>
                        <span className="font-semibold text-foreground">{item.trackName}</span>
                      </div>

                      <div className="flex items-center gap-4 text-muted-foreground font-mono">
                        <span>Score: {item.scorePercentage}%</span>
                        <span>{Math.round(item.timeSpentSeconds / 60)}m spent</span>
                        <span className="text-[11px] opacity-60">
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PRE-INTERVIEW BRIEFING
  // =========================================================================
  if (sessionState === 'briefing') {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-background text-foreground overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#93C572]/20 border border-[#93C572]/40 flex items-center justify-center text-[#93C572]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedTrack.name}</h2>
                <div className="text-xs text-sky-400 font-mono">{selectedTrack.companyTarget}</div>
              </div>
            </div>
            <button
              onClick={() => setSessionState('select')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs text-muted-foreground">
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-2">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#93C572]" />
                <span>Screening Rules & Advice</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-muted-foreground leading-relaxed">
                <li>Total Duration: <strong className="text-foreground">{selectedTrack.durationMinutes} minutes</strong> continuously.</li>
                <li>You will solve <strong className="text-foreground">{selectedTrack.problemSlugs.length} sequential problems</strong> in this session.</li>
                <li>Vectorize code using NumPy and PyTorch tensors. Avoid slow Python loops where possible.</li>
                <li>You can run test cases as many times as needed before submitting.</li>
                <li>A complete scorecard will be generated evaluating Correctness, Time Efficiency, and Hiring Recommendation.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              <strong className="text-amber-400">Pro-Tip:</strong> Check tensor shapes and data types before executing code. Use the scratchpad to draft your approach.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setSessionState('select')}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Tracks
            </button>

            <button
              onClick={handleStartInterview}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#93C572] hover:bg-[#a4d287] text-black text-xs font-bold transition-all shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Begin Technical Interview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ACTIVE INTERVIEW LIVE SANDBOX
  // =========================================================================
  if (sessionState === 'active') {
    const isTimeUrgent = timeRemainingSeconds <= 300; // < 5 mins
    const isTimeWarning = timeRemainingSeconds <= 900 && !isTimeUrgent; // < 15 mins

    return (
      <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        {/* Top Interview Control Bar */}
        <div className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          {/* Left: Track Name & Problem Tabs */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 font-bold text-xs text-foreground shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#93C572]" />
              <span className="truncate max-w-[180px]">{selectedTrack.name}</span>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Question Selector Tabs */}
            <div className="flex items-center gap-1.5">
              {problemsData.map((prob, idx) => {
                const isCurrent = idx === currentProblemIdx;
                const rep = testReports[prob.slug];
                const allPassed = rep && rep.results.every(r => r.passed);
                return (
                  <button
                    key={prob.slug}
                    onClick={() => {
                      setCurrentProblemIdx(idx);
                      setActiveTestCaseIdx(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-[#93C572] text-black shadow-xs'
                        : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {allPassed ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-black' : 'text-emerald-400'}`} />
                    ) : (
                      <span className="font-mono text-[11px] opacity-80">Q{idx + 1}</span>
                    )}
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">
                      {prob.title?.replace(/<[^>]*>?/gm, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Live Countdown Timer & End Button */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
              isTimeUrgent ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
              isTimeWarning ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTime(timeRemainingSeconds)}</span>
              <button
                onClick={() => setIsTimerPaused(prev => !prev)}
                className="ml-1 opacity-70 hover:opacity-100 p-0.5"
                title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
              >
                {isTimerPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you ready to submit your interview and generate your performance scorecard?')) {
                  handleEndInterview(false);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
            >
              Finish Interview
            </button>
          </div>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Panel: Description & Scratchpad */}
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-r border-border flex flex-col bg-card/30 min-h-0">
            {/* Subtabs: Problem Description vs Scratchpad */}
            <div className="h-10 border-b border-border/80 px-4 flex items-center justify-between bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'problem' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Problem Spec</span>
                </button>
                <button
                  onClick={() => setActiveTab('scratchpad')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'scratchpad' ? 'bg-background text-[#93C572] shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Interview Notes</span>
                </button>
              </div>

              {currentProblem && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  currentProblem.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                  currentProblem.difficulty?.toLowerCase() === 'hard' ? 'text-rose-400 bg-rose-500/10' :
                  'text-amber-400 bg-amber-500/10'
                }`}>
                  {currentProblem.difficulty}
                </span>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
              {activeTab === 'problem' ? (
                currentProblem ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {currentProblem.title?.replace(/<[^>]*>?/gm, '')}
                      </h2>
                      {currentProblem.tags && currentProblem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {currentProblem.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Problem Description HTML / Markdown */}
                    <div 
                      className="prose dark:prose-invert prose-xs max-w-none text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentProblem.description || '' }}
                    />

                    {/* Example Test Cases */}
                    {currentProblem.testCases && currentProblem.testCases.length > 0 && (
                      <div className="pt-4 border-t border-border/60 space-y-3">
                        <div className="font-bold text-foreground text-xs uppercase tracking-wider">
                          Sample Test Cases
                        </div>
                        {currentProblem.testCases.slice(0, 2).map((tc, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 font-mono text-[11px]">
                            <div className="text-muted-foreground font-semibold">Case {idx + 1}:</div>
                            <div className="text-sky-300">
                              <span className="text-muted-foreground">Input: </span>
                              {JSON.stringify(tc.inputs)}
                            </div>
                            {tc.expectedOutput !== undefined && (
                              <div className="text-emerald-300">
                                <span className="text-muted-foreground">Expected: </span>
                                {JSON.stringify(tc.expectedOutput)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">Loading problem details...</div>
                )
              ) : (
                /* Scratchpad notes */
                <div className="h-full flex flex-col space-y-2">
                  <div className="text-muted-foreground text-[11px]">
                    Use this scratchpad to organize time & space complexity, sketch tensor shapes, or list edge cases.
                  </div>
                  <textarea
                    value={userNotes[currentSlug] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserNotes(prev => ({ ...prev, [currentSlug]: val }));
                    }}
                    placeholder="e.g. Approach:&#10;1. Compute QK^T / sqrt(d_k)&#10;2. Apply row-wise softmax across last dimension&#10;3. Multiply by V&#10;Time Complexity: O(N^2 * d)&#10;Space Complexity: O(N^2)"
                    className="flex-1 w-full p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-foreground outline-none focus:border-[#93C572] resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Monaco Editor & Test Runner */}
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col min-h-0 bg-background">
            {/* Editor Action Bar */}
            <div className="h-10 border-b border-border/80 px-4 flex items-center justify-between bg-card/40 shrink-0">
              <span className="text-xs font-mono text-muted-foreground">solution.py</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentProblem?.starterCode) {
                      setUserCodes(prev => ({ ...prev, [currentSlug]: currentProblem.starterCode }));
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Reset Starter Code
                </button>

                <button
                  onClick={handleRunCurrentTests}
                  disabled={isRunningTests}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#93C572] hover:bg-[#a4d287] text-black text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
                >
                  {isRunningTests ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={currentCode}
                onChange={(val) => {
                  setUserCodes(prev => ({ ...prev, [currentSlug]: val || '' }));
                }}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  automaticLayout: true,
                  tabSize: 4
                }}
              />
            </div>

            {/* Bottom Test Case Execution Output */}
            <div className="h-44 border-t border-border bg-[#0d120f] flex flex-col shrink-0">
              <div className="h-8 border-b border-white/10 px-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#93C572]" />
                  <span className="font-bold text-foreground font-mono">Test Results</span>
                  {currentReport && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      currentReport.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {currentReport.results.filter(r => r.passed).length} / {currentReport.results.length} Passed
                    </span>
                  )}
                </div>

                {currentReport && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Runtime: {currentReport.totalTimeMs.toFixed(1)}ms
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 font-mono text-xs">
                {!currentReport ? (
                  <div className="text-muted-foreground/60 italic text-[11px] h-full flex items-center justify-center">
                    Click "Run Tests" to execute your solution against Pyodide test cases.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Test Case Selector Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {currentReport.results.map((res, idx) => (
                        <button
                          key={res.id || idx}
                          onClick={() => setActiveTestCaseIdx(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors ${
                            activeTestCaseIdx === idx
                              ? 'bg-white/15 text-white'
                              : 'bg-black/40 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {res.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          <span>Case {idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Test Case Detail */}
                    {(() => {
                      const activeRes = currentReport.results[activeTestCaseIdx] || currentReport.results[0];
                      if (!activeRes) return null;
                      return (
                        <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-[11px]">
                          {activeRes.error ? (
                            <div className="text-rose-400 font-semibold whitespace-pre-wrap">
                              Error: {activeRes.error}
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="text-muted-foreground">Actual Output: </span>
                                <span className={activeRes.passed ? 'text-emerald-300' : 'text-rose-300'}>
                                  {JSON.stringify(activeRes.actualOutput)}
                                </span>
                              </div>
                              {activeRes.expectedOutput !== undefined && (
                                <div>
                                  <span className="text-muted-foreground">Expected: </span>
                                  <span className="text-zinc-300">{JSON.stringify(activeRes.expectedOutput)}</span>
                                </div>
                              )}
                            </>
                          )}
                          {activeRes.stdout && (
                            <div className="pt-1 text-muted-foreground/90">
                              <span className="text-sky-400">Stdout: </span>
                              {activeRes.stdout}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: POST-INTERVIEW COMPREHENSIVE SCORECARD
  // =========================================================================
  if (sessionState === 'scorecard' && finalResult) {
    const isHire = finalResult.overallVerdict === 'Strong Hire' || finalResult.overallVerdict === 'Hire';

    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-background text-foreground pb-12">
        <div className="border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-8 py-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93C572] mb-1">
                <Award className="w-4 h-4" />
                <span>Screening Completed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Technical Interview Scorecard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {finalResult.trackName} · Completed in {Math.round(finalResult.timeSpentSeconds / 60)} minutes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSessionState('select')}
                className="px-4 py-2 rounded-xl border border-border bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors"
              >
                Back to Tracks
              </button>
              <button
                onClick={handleStartInterview}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#93C572] hover:bg-[#a4d287] text-black text-xs font-bold transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Session</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
          {/* Main Recommendation Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl ${
            finalResult.overallVerdict === 'Strong Hire' ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40' :
            finalResult.overallVerdict === 'Hire' ? 'bg-gradient-to-r from-[#93C572]/20 via-[#93C572]/10 to-transparent border-[#93C572]/40' :
            finalResult.overallVerdict === 'Leaning Hire' ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40' :
            'bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent border-rose-500/40'
          }`}>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                Recommendation Verdict
              </div>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
                isHire ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {finalResult.overallVerdict}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md">
                {finalResult.overallVerdict === 'Strong Hire' ? 'Flawless execution! Passed 100% of test cases within the allotted time with robust code structure.' :
                 finalResult.overallVerdict === 'Hire' ? 'Solid performance meeting hiring thresholds across core machine learning challenges.' :
                 finalResult.overallVerdict === 'Leaning Hire' ? 'Demonstrated strong foundational knowledge with opportunities to improve edge case handling.' :
                 'More practice recommended on vectorization and tensor manipulation speed.'}
              </p>
            </div>

            {/* Score Pill */}
            <div className="text-center bg-black/40 border border-white/10 px-8 py-4 rounded-2xl shrink-0">
              <div className="text-xs text-muted-foreground">Test Pass Rate</div>
              <div className="text-4xl font-black text-foreground font-mono mt-0.5">
                {finalResult.scorePercentage}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {finalResult.totalPassedTests} of {finalResult.totalTests} tests passed
              </div>
            </div>
          </div>

          {/* Breakdown Per Problem */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Problem Breakdown</h3>
            <div className="space-y-3">
              {finalResult.problems.map((p, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-card/60 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">Q{idx + 1}</span>
                      <h4 className="text-sm font-bold text-foreground">{p.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        p.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                        p.difficulty?.toLowerCase() === 'hard' ? 'text-rose-400 bg-rose-500/10' :
                        'text-amber-400 bg-amber-500/10'
                      }`}>
                        {p.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Passed {p.passedTests} of {p.totalTests} test cases
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                      p.passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{p.passed ? 'PASSED' : 'UNSOLVED'}</span>
                    </span>

                    <Link
                      to={`/problems/${p.slug}`}
                      className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Practice this question in standard mode"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAANG Interview Takeaways */}
          <div className="p-5 rounded-2xl bg-[#93C572]/10 border border-[#93C572]/20 space-y-2 text-xs">
            <div className="font-bold text-[#93C572] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Next Steps to Level Up</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Continue reinforcing edge-case coverage (such as 0-length sequences, broadcast dimensions, and numerical underflow/overflow) to consistently achieve Strong Hire ratings in real interviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
