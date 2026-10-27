import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  Shuffle, 
  Flame, 
  HelpCircle, 
  Lightbulb, 
  Code2, 
  ArrowRight,
  Filter,
  Check,
  Award,
  Zap,
  BookOpen
} from 'lucide-react';
import { 
  FLASHCARDS_DATA, 
  FLASHCARD_CATEGORIES, 
  Flashcard, 
  FlashcardProgress 
} from '../data/flashcardsData';

const PROGRESS_STORAGE_KEY = 'toniclite_flashcards_progress';

export const FlashcardsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'mastered'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [progressMap, setProgressMap] = useState<Record<string, FlashcardProgress>>(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save progress changes
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.error('Failed to save flashcards progress:', e);
    }
  }, [progressMap]);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    return FLASHCARDS_DATA.filter(card => {
      if (selectedCategory !== 'All' && card.category !== selectedCategory) {
        return false;
      }
      const p = progressMap[card.id];
      if (filterMode === 'mastered') {
        return p?.state === 'mastered';
      }
      if (filterMode === 'due') {
        if (!p) return true; // new cards are due
        return p.state !== 'mastered' || Date.now() >= p.nextReviewDate;
      }
      return true;
    });
  }, [selectedCategory, filterMode, progressMap]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
    setShowHint(false);
  }, [selectedCategory, filterMode, filteredCards.length]);

  const currentCard: Flashcard | undefined = filteredCards[currentIndex];

  // Stats calculation
  const stats = useMemo(() => {
    const total = FLASHCARDS_DATA.length;
    let mastered = 0;
    let learning = 0;
    Object.values(progressMap).forEach(p => {
      if (p.state === 'mastered') mastered++;
      else if (p.state === 'learning' || p.state === 'review') learning++;
    });
    const reviewed = mastered + learning;
    const progressPercent = Math.round((mastered / (total || 1)) * 100);
    return { total, mastered, learning, reviewed, progressPercent };
  }, [progressMap]);

  // Handle rating with Spaced Repetition (Leitner / SM-2 intervals)
  const handleRateCard = useCallback((rating: 'again' | 'good' | 'mastered') => {
    if (!currentCard) return;

    const now = Date.now();
    const existing = progressMap[currentCard.id];
    let nextIntervalDays = 1;
    let nextState: 'learning' | 'review' | 'mastered' = 'learning';
    let consecutive = existing ? existing.consecutiveCorrect : 0;

    if (rating === 'again') {
      nextIntervalDays = 1;
      nextState = 'learning';
      consecutive = 0;
    } else if (rating === 'good') {
      consecutive += 1;
      nextIntervalDays = consecutive >= 2 ? 3 : 2;
      nextState = 'review';
    } else if (rating === 'mastered') {
      consecutive += 2;
      nextIntervalDays = 7;
      nextState = 'mastered';
    }

    const nextReviewDate = now + nextIntervalDays * 24 * 60 * 60 * 1000;

    setProgressMap(prev => ({
      ...prev,
      [currentCard.id]: {
        cardId: currentCard.id,
        state: nextState,
        intervalDays: nextIntervalDays,
        nextReviewDate,
        consecutiveCorrect: consecutive,
        lastReviewedDate: now
      }
    }));

    // Advance to next card smoothly
    setIsFlipped(false);
    setShowHint(false);
    if (filteredCards.length > 1) {
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % filteredCards.length);
      }, 150);
    }
  }, [currentCard, progressMap, filteredCards.length]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex(prev => (prev + 1) % (filteredCards.length || 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex(prev => (prev - 1 + filteredCards.length) % (filteredCards.length || 1));
      } else if (e.key === '1' && isFlipped) {
        handleRateCard('again');
      } else if (e.key === '2' && isFlipped) {
        handleRateCard('good');
      } else if (e.key === '3' && isFlipped) {
        handleRateCard('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, filteredCards.length, handleRateCard]);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % (filteredCards.length || 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (filteredCards.length > 1) {
      const randomIdx = Math.floor(Math.random() * filteredCards.length);
      setCurrentIndex(randomIdx);
    }
  };

  const currentStatus = currentCard ? progressMap[currentCard.id]?.state : undefined;

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-background text-foreground pb-12">
      {/* Top Banner / Header */}
      <div className="border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-8 py-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93C572] mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Rapid Theory Mastery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span>ML & AI Concept Flashcards</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 font-mono font-medium">
                Spaced Repetition
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              High-yield theory questions, mathematical proofs, and gotchas asked in ML engineer and research interviews at Meta, Google, OpenAI, and Anthropic.
            </p>
          </div>

          {/* Quick Mastery Progress Metric */}
          <div className="flex items-center gap-4 bg-secondary/40 border border-border/80 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Mastered</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {stats.mastered} <span className="text-xs text-muted-foreground font-normal">/ {stats.total}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Mastery Rate</div>
              <div className="text-lg font-bold text-[#93C572] font-mono">
                {stats.progressPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 w-full flex-1 flex flex-col">
        {/* Category Chips & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            {FLASHCARD_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#93C572] text-black font-semibold shadow-xs'
                    : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter Modes (All, Due, Mastered) */}
          <div className="flex items-center gap-1.5 shrink-0 bg-secondary/50 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterMode === 'all' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({FLASHCARDS_DATA.length})
            </button>
            <button
              onClick={() => setFilterMode('due')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterMode === 'due' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Due for Review
            </button>
            <button
              onClick={() => setFilterMode('mastered')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterMode === 'mastered' ? 'bg-background text-emerald-400 shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mastered ({stats.mastered})
            </button>
          </div>
        </div>

        {/* Empty state if filter returns no cards */}
        {filteredCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-border bg-card/20 my-auto">
            <Award className="w-12 h-12 text-[#93C572] mb-3 opacity-80" />
            <h3 className="text-lg font-bold">No cards match this filter!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {filterMode === 'mastered'
                ? "You haven't mastered any cards in this category yet. Review cards and click 'Mastered' to collect them here!"
                : "All cards in this category are up to date with their review interval."}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setFilterMode('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#93C572] text-black text-xs font-bold hover:bg-[#a4d287] transition-colors"
            >
              View All Cards
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
            {/* Navigation Header Above Card */}
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-foreground font-semibold">
                  Card {currentIndex + 1} of {filteredCards.length}
                </span>
                {currentStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    currentStatus === 'mastered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    currentStatus === 'review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {currentStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffle}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Shuffle cards"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-foreground">Space</kbd> to flip</span>
                </div>
              </div>
            </div>

            {/* Interactive 3D Flip Card Container */}
            <div 
              className="w-full relative min-h-[380px] sm:min-h-[420px] rounded-3xl cursor-pointer perspective-1000 select-none transition-transform active:scale-[0.995]"
              onClick={() => setIsFlipped(prev => !prev)}
            >
              <div 
                className={`w-full h-full min-h-[380px] sm:min-h-[420px] rounded-3xl border border-white/10 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl ${
                  isFlipped 
                    ? 'bg-gradient-to-b from-[#131b15] to-[#0d1410] border-[#93C572]/40 shadow-[0_12px_40px_rgba(147,197,114,0.08)]' 
                    : 'bg-gradient-to-b from-card/90 to-card/60 hover:border-white/20'
                }`}
              >
                {/* Front of Card */}
                {!isFlipped ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30">
                          {currentCard.category}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          currentCard.difficulty === 'Foundation' ? 'text-emerald-400 bg-emerald-500/10' :
                          currentCard.difficulty === 'Intermediate' ? 'text-amber-400 bg-amber-500/10' :
                          'text-rose-400 bg-rose-500/10'
                        }`}>
                          {currentCard.difficulty}
                        </span>
                      </div>

                      {/* Question */}
                      <div className="pt-4 pb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                          {currentCard.question}
                        </h2>
                      </div>

                      {/* Optional Hint */}
                      {currentCard.shortHint && (
                        <div className="mt-4">
                          {!showHint ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(true);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Need a hint?</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200">
                              <span className="font-semibold text-sky-400">Hint: </span>
                              {currentCard.shortHint}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer / Call to Flip */}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-muted-foreground/80">
                        <RotateCw className="w-3.5 h-3.5" />
                        Click anywhere or press Space to see answer
                      </span>
                      <span className="text-[#93C572] font-semibold">Flip Card &rarr;</span>
                    </div>
                  </div>
                ) : (
                  /* Back of Card */
                  <div className="flex-1 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      {/* Back Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#93C572] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#93C572]" />
                          Answer & Core Explanation
                        </span>
                        <button
                          onClick={() => setIsFlipped(false)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          Flip back
                        </button>
                      </div>

                      {/* Key summary */}
                      <p className="text-sm sm:text-base font-semibold text-foreground/90 leading-relaxed">
                        {currentCard.answerSummary}
                      </p>

                      {/* Mathematical formula or code snippet */}
                      {currentCard.keyFormulaOrCode && (
                        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-300 whitespace-pre-wrap overflow-x-auto custom-scrollbar">
                          {currentCard.keyFormulaOrCode}
                        </div>
                      )}

                      {/* In-depth explanation bullet points */}
                      <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                        {currentCard.explanation.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#93C572] mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Interview Tip Callout */}
                      <div className="p-3 rounded-xl bg-[#93C572]/10 border border-[#93C572]/20 flex items-start gap-2.5 text-xs">
                        <Lightbulb className="w-4 h-4 text-[#93C572] shrink-0 mt-0.5" />
                        <div className="text-zinc-200">
                          <span className="font-bold text-[#93C572]">Interview Follow-up: </span>
                          {currentCard.interviewTip}
                        </div>
                      </div>

                      {/* Related Coding Problem link if available */}
                      {currentCard.relatedProblemSlug && (
                        <div className="pt-1">
                          <Link
                            to={`/problems/${currentCard.relatedProblemSlug}`}
                            className="inline-flex items-center gap-1.5 text-xs text-[#93C572] hover:underline font-medium"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Practice related coding challenge: {currentCard.relatedProblemSlug} &rarr;</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Bottom Spaced Repetition Buttons */}
                    <div className="pt-5 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground/70">
                        How well did you know this concept?
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleRateCard('again')}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                          title="Key: 1"
                        >
                          <span>Need Review (1d)</span>
                          <kbd className="hidden sm:inline text-[10px] opacity-60 font-mono">1</kbd>
                        </button>

                        <button
                          onClick={() => handleRateCard('good')}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                          title="Key: 2"
                        >
                          <span>Good (3d)</span>
                          <kbd className="hidden sm:inline text-[10px] opacity-60 font-mono">2</kbd>
                        </button>

                        <button
                          onClick={() => handleRateCard('mastered')}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          title="Key: 3"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mastered (7d+)</span>
                          <kbd className="hidden sm:inline text-[10px] opacity-60 font-mono">3</kbd>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card Navigation Arrows */}
            <div className="w-full flex items-center justify-between mt-4 px-1">
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setIsFlipped(prev => !prev)}
                className="px-4 py-1.5 rounded-xl border border-border bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors"
              >
                {isFlipped ? 'Show Front' : 'Reveal Answer'}
              </button>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
