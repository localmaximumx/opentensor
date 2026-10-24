import React, { useState, useMemo } from 'react';
import { Copy, Check, Play, FileCode, Terminal, Sparkles } from 'lucide-react';
import { MathView } from './MathView';

interface SolutionViewerProps {
  solution: string;
  onApplySolution?: (code: string) => void;
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

export const SolutionViewer: React.FC<SolutionViewerProps> = ({ solution, onApplySolution }) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Parse solution into code and optional markdown explanation
  const { code, explanation } = useMemo(() => {
    if (!solution) return { code: '', explanation: '' };

    const codeBlocks = [...solution.matchAll(/```(?:python|py)?\s*([\s\S]*?)```/g)]
      .map(m => m[1].trim())
      .filter(b => b.length > 0);

    if (codeBlocks.length > 0) {
      // Pick the main code block (usually the largest or last)
      const primaryCode = codeBlocks.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));
      // Remove that code block from text to get explanation
      const explanationText = solution.replace(/```(?:python|py)?\s*[\s\S]*?```/g, '').trim();
      return {
        code: primaryCode,
        explanation: explanationText
      };
    }

    // Check if entire text is raw Python code
    const isRawCode = /^\s*(?:import\s+|from\s+|def\s+|class\s+|#)/m.test(solution) && solution.includes('def ');
    if (isRawCode) {
      return {
        code: solution.trim(),
        explanation: ''
      };
    }

    // Otherwise, text might be predominantly explanation
    return {
      code: '',
      explanation: solution.trim()
    };
  }, [solution]);

  const highlightedHtml = useMemo(() => {
    if (!code) return '';
    return highlightPythonCode(code);
  }, [code]);

  const lineCount = useMemo(() => {
    if (!code) return 0;
    return code.split('\n').length;
  }, [code]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!code || !onApplySolution) return;
    onApplySolution(code);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Explanation walkthrough if present */}
      {explanation && (
        <div className="rounded-xl border border-border/70 bg-card/40 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#93C572]" />
            <span>Algorithm & Approach</span>
          </div>
          <MathView content={explanation} />
        </div>
      )}

      {/* Code container */}
      {code ? (
        <div className="rounded-xl border border-border/80 bg-[#0d1117] overflow-hidden shadow-md">
          {/* Top header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] select-none">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-[#93C572]" />
              <span className="font-mono text-xs font-semibold text-foreground">solution.py</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30">
                Python 3
              </span>
              <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-muted-foreground hover:text-foreground transition-colors border border-[#30363d]"
                title="Copy reference code"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onApplySolution && (
                <button
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#93C572] hover:bg-[#a5db82] text-black transition-colors shadow-xs"
                  title="Insert directly into editor"
                >
                  {applied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Apply to Editor</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="flex overflow-x-auto p-4 custom-scrollbar bg-[#0d1117]">
            {/* Line Numbers Gutter */}
            <div
              className="select-none text-right pr-4 text-muted-foreground/30 font-mono text-xs leading-relaxed border-r border-[#30363d]/60 flex flex-col shrink-0"
              aria-hidden="true"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <span key={i} className="tabular-nums">
                  {i + 1}
                </span>
              ))}
            </div>

            {/* Code Content */}
            <div className="pl-4 font-mono text-xs leading-relaxed overflow-x-visible shrink-0 min-w-0">
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
        !explanation && (
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Solution walkthrough is being formulated for this problem.
            </p>
          </div>
        )
      )}
    </div>
  );
};
