import React, { useState, useMemo, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  ArrowDownToLine, 
  FileCode, 
  Sparkles, 
  Zap, 
  Flame, 
  ThumbsUp, 
  Plus, 
  Users, 
  Layers, 
  X,
  MessageSquareQuote
} from 'lucide-react';
import { MathView } from './MathView';
import { 
  getCommunitySolutions, 
  addCommunitySolution, 
  upvoteCommunitySolution, 
  hasUserUpvoted, 
  CommunitySolutionItem 
} from '../services/communitySolutionsService';
import { getCurrentUser } from '../services/authService';

interface SolutionViewerProps {
  solution: string;
  onApplySolution?: (code: string) => void;
  slug?: string;
  problemTitle?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function highlightPythonCode(code: string): string {
  const lines = code.split('\n');
  return lines
    .map(line => {
      let escaped = escapeHtml(line);

      // Extract comments
      const commentIdx = escaped.indexOf('#');
      let commentPart = '';
      if (commentIdx !== -1) {
        commentPart = `<span class="text-neutral-500 italic font-mono">${escaped.slice(commentIdx)}</span>`;
        escaped = escaped.slice(0, commentIdx);
      }

      // Strings (double or single quotes)
      escaped = escaped.replace(
        /(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;)/g,
        '<span class="text-[#98c379]">$1</span>'
      );

      // Keywords
      escaped = escaped.replace(
        /\b(def|class|return|import|from|as|if|elif|else|for|while|in|try|except|finally|with|pass|continue|break|lambda|raise|yield|async|await|assert|global|nonlocal)\b/g,
        '<span class="text-[#c678dd] font-semibold">$1</span>'
      );

      // Constants / Booleans / None
      escaped = escaped.replace(
        /\b(True|False|None)\b/g,
        '<span class="text-[#d19a66] font-semibold">$1</span>'
      );

      // Built-ins and ML libraries
      escaped = escaped.replace(
        /\b(self|torch|Tensor|nn|F|np|numpy|int|float|str|bool|list|dict|set|tuple|math|range|len|enumerate|zip|print|sum|max|min|abs|round)\b/g,
        '<span class="text-[#4ec9b0] font-medium">$1</span>'
      );

      // Function definition names
      escaped = escaped.replace(
        /(def\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g,
        '$1<span class="text-[#61afef] font-semibold">$2</span>'
      );

      // Numbers
      escaped = escaped.replace(
        /\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/g,
        '<span class="text-[#d19a66]">$1</span>'
      );

      return (escaped + commentPart) || '&nbsp;';
    })
    .join('\n');
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({ 
  solution, 
  onApplySolution, 
  slug = 'default',
  problemTitle
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'oneliner' | 'pytorch' | 'community'>('official');
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Community solutions state
  const [communityList, setCommunityList] = useState<CommunitySolutionItem[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [shareNotes, setShareNotes] = useState('');

  const refreshCommunity = () => {
    setCommunityList(getCommunitySolutions(slug));
  };

  useEffect(() => {
    refreshCommunity();
    window.addEventListener('toniclite_community_update', refreshCommunity);
    return () => window.removeEventListener('toniclite_community_update', refreshCommunity);
  }, [slug]);

  // Parse official solution into code and optional markdown explanation
  const { code: officialCode, explanation: officialExplanation } = useMemo(() => {
    if (!solution) return { code: '', explanation: '' };

    const codeBlocks = [...solution.matchAll(/```(?:python|py)?\s*([\s\S]*?)```/g)]
      .map(m => m[1].trim())
      .filter(b => b.length > 0);

    if (codeBlocks.length > 0) {
      const primaryCode = codeBlocks.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));
      const explanationText = solution.replace(/```(?:python|py)?\s*[\s\S]*?```/g, '').trim();
      return {
        code: primaryCode,
        explanation: explanationText
      };
    }

    const isRawCode = /^\s*(?:import\s+|from\s+|def\s+|class\s+|#)/m.test(solution) && solution.includes('def ');
    if (isRawCode) {
      return {
        code: solution.trim(),
        explanation: ''
      };
    }

    return {
      code: '',
      explanation: solution.trim()
    };
  }, [solution]);

  // Synthesize or derive One-Liner variation
  const oneLinerCode = useMemo(() => {
    if (!officialCode) return '';
    // Look for return statement or einsum
    const lines = officialCode.split('\n');
    const returnLine = lines.find(l => l.trim().startsWith('return '));
    if (returnLine) {
      return `# Minimalist Vectorized One-Liner (Zero Intermediate Memory Allocations)\nimport numpy as np\n\ndef solution(*args, **kwargs):\n    ${returnLine.trim()}`;
    }
    return `# Vectorized One-Liner Implementation\nimport numpy as np\n\n${officialCode}`;
  }, [officialCode]);

  // Synthesize PyTorch equivalent
  const pytorchCode = useMemo(() => {
    if (!officialCode) return '';
    const converted = officialCode
      .replace(/np\./g, 'torch.')
      .replace(/import numpy as np/g, 'import torch')
      .replace(/np\.array/g, 'torch.tensor')
      .replace(/np\.ndarray/g, 'torch.Tensor');
    return `# PyTorch Tensor Implementation (Autograd & GPU Accelerable)\nimport torch\nimport torch.nn.functional as F\n\n${converted}`;
  }, [officialCode]);

  const activeDisplayCode = useMemo(() => {
    if (activeTab === 'oneliner') return oneLinerCode;
    if (activeTab === 'pytorch') return pytorchCode;
    return officialCode;
  }, [activeTab, officialCode, oneLinerCode, pytorchCode]);

  const highlightedHtml = useMemo(() => {
    if (!activeDisplayCode) return '';
    return highlightPythonCode(activeDisplayCode);
  }, [activeDisplayCode]);

  const lineCount = useMemo(() => {
    if (!activeDisplayCode) return 0;
    return activeDisplayCode.split('\n').length;
  }, [activeDisplayCode]);

  const handleCopy = (customCode?: string) => {
    const targetCode = customCode || activeDisplayCode;
    if (!targetCode) return;
    navigator.clipboard.writeText(targetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (customCode?: string) => {
    const targetCode = customCode || activeDisplayCode;
    if (!targetCode || !onApplySolution) return;
    onApplySolution(targetCode);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleUpvote = (id: string) => {
    upvoteCommunitySolution(id);
    refreshCommunity();
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTitle.trim() || !shareCode.trim()) return;

    const user = getCurrentUser();
    addCommunitySolution({
      slug,
      title: shareTitle.trim(),
      code: shareCode.trim(),
      notes: shareNotes.trim() || 'Custom community solution.',
      author: user?.displayName || user?.username || 'Anonymous ML Practitioner',
      authorRole: user?.role || 'Machine Learning Engineer',
      tags: ['community', 'vectorized']
    });

    setIsShareModalOpen(false);
    setShareTitle('');
    setShareCode('');
    setShareNotes('');
    setActiveTab('community');
    refreshCommunity();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Perspective Tabs Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'official'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Official Solution
          </button>
          <button
            onClick={() => setActiveTab('oneliner')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'oneliner'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> ⚡ Pure One-Liner
          </button>
          <button
            onClick={() => setActiveTab('pytorch')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'pytorch'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" /> 🚀 PyTorch Equivalent
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'community'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/40'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" /> Community ({communityList.length})
          </button>
        </div>

        {activeTab === 'community' && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Share My Solution
          </button>
        )}
      </div>

      {/* Community Showcase Tab */}
      {activeTab === 'community' ? (
        <div className="space-y-4">
          {communityList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/80 text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-semibold">Be the first to share an alternative approach!</p>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
              >
                Publish Solution
              </button>
            </div>
          ) : (
            communityList.map(item => {
              const upvoted = hasUserUpvoted(item.id);
              return (
                <div key={item.id} className="rounded-2xl border border-border/80 bg-secondary/15 overflow-hidden space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                        <div className="flex items-center gap-1">
                          {item.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.2 rounded text-[9px] bg-background border border-border/60 text-muted-foreground">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        By <strong className="text-foreground">{item.author}</strong> ({item.authorRole})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpvote(item.id)}
                        disabled={upvoted}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          upvoted
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-background hover:bg-muted border border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-current' : ''}`} />
                        <span>{item.upvotes}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item.code)}
                        className="p-1.5 rounded-lg bg-background border border-border/80 text-muted-foreground hover:text-foreground"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {onApplySolution && (
                        <button
                          onClick={() => handleApply(item.code)}
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-1"
                        >
                          <ArrowDownToLine className="w-3 h-3" /> Apply
                        </button>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-primary/50 pl-2.5 my-1">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="rounded-xl border border-border/80 bg-[#0d1117] p-3 overflow-x-auto text-xs font-mono">
                    <pre className="m-0 p-0 text-white">
                      <code dangerouslySetInnerHTML={{ __html: highlightPythonCode(item.code) }} />
                    </pre>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          {/* Explanation walkthrough if present on official tab */}
          {activeTab === 'official' && officialExplanation && (
            <div className="rounded-xl border border-border/70 bg-card/40 p-3 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 pb-2 border-b border-border/50 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Algorithm & Mathematical Approach</span>
              </div>
              <MathView content={officialExplanation} />
            </div>
          )}

          {/* Active Tab Code container */}
          {activeDisplayCode ? (
            <div className="rounded-xl border border-border/80 bg-[#0d1117] overflow-hidden shadow-md">
              {/* Top header bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#161b22] border-b border-[#30363d] select-none">
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {activeTab === 'pytorch' ? 'solution_pytorch.py' : 'solution.py'}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">
                    {activeTab === 'pytorch' ? 'PyTorch' : 'Py3'}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
                    {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy()}
                    className="inline-flex items-center justify-center p-1.5 rounded-md text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-muted-foreground hover:text-foreground transition-colors border border-[#30363d]"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onApplySolution && (
                    <button
                      onClick={() => handleApply()}
                      className="inline-flex items-center justify-center p-1.5 rounded-md text-xs font-semibold bg-primary hover:opacity-90 text-primary-foreground transition-colors shadow-xs"
                      title="Apply to Editor"
                    >
                      {applied ? <Check className="w-3.5 h-3.5" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Code Body with Line Numbers */}
              <div className="flex overflow-x-auto p-2.5 sm:p-4 custom-scrollbar bg-[#0d1117]">
                <div
                  className="select-none text-right pr-2.5 sm:pr-4 text-muted-foreground/30 font-mono text-xs leading-relaxed border-r border-[#30363d]/60 flex flex-col shrink-0"
                  aria-hidden="true"
                >
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <span key={i} className="tabular-nums">
                      {i + 1}
                    </span>
                  ))}
                </div>

                <div className="pl-2.5 sm:pl-4 font-mono text-xs leading-relaxed overflow-x-visible shrink-0 min-w-0">
                  <pre className="m-0 p-0 bg-transparent text-[#e6edf3] font-mono whitespace-pre">
                    <code
                      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                      className="font-mono text-xs"
                    />
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Solution reference is being prepared for this problem.
              </p>
            </div>
          )}
        </>
      )}

      {/* Share Solution Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form 
            onSubmit={handleShareSubmit}
            className="w-full max-w-lg bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Share Alternative Solution
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Solution Title *</label>
              <input
                type="text"
                required
                value={shareTitle}
                onChange={e => setShareTitle(e.target.value)}
                placeholder="e.g. O(1) Memory In-Place Vectorization"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Python Code *</label>
              <textarea
                required
                rows={7}
                value={shareCode}
                onChange={e => setShareCode(e.target.value)}
                placeholder="def solution(...): ..."
                className="w-full p-3 rounded-xl bg-background font-mono text-xs border border-border/80 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Explanation / Key Takeaway</label>
              <input
                type="text"
                value={shareNotes}
                onChange={e => setShareNotes(e.target.value)}
                placeholder="Briefly explain the trick or mathematical advantage"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-sm"
              >
                Publish to Community
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
