import React, { useState } from 'react';
import { X, Copy, Check, Eye, CornerDownLeft, Activity } from 'lucide-react';
import { TensorVariableMeta } from '../services/pyodideRunner';

export interface MatrixHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  variable: TensorVariableMeta | null;
  onInsertRepl?: (cmd: string) => void;
}

export const MatrixHeatmapModal: React.FC<MatrixHeatmapModalProps> = ({
  isOpen,
  onClose,
  variable,
  onInsertRepl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !variable) return null;

  const matrix = variable.slice2D || [];
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  // Find min and max for color normalization
  let maxAbs = 1;
  matrix.forEach(row => {
    row.forEach(val => {
      if (Math.abs(val) > maxAbs) maxAbs = Math.abs(val);
    });
  });

  const getCellColor = (val: number): string => {
    if (val === 0) return 'rgba(255, 255, 255, 0.03)';
    const ratio = Math.min(Math.abs(val) / (maxAbs || 1), 1);
    const alpha = 0.15 + ratio * 0.55;
    if (val > 0) {
      // Emerald green
      return `rgba(34, 197, 94, ${alpha})`;
    } else {
      // Rose red
      return `rgba(244, 63, 94, ${alpha})`;
    }
  };

  const handleCopy = () => {
    const text = matrix.map(r => r.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#13131D] border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-[#191925]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground font-mono">
                  {variable.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
                  shape {variable.fullShapeStr}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {variable.dtype}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Numerical matrix heatmap and slice inspector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Statistical Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-[#0E0E16] border-b border-border/60 text-xs font-mono">
          <div className="p-2 rounded-lg bg-[#191925] border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Min Value</div>
            <div className="text-foreground font-semibold font-mono text-xs">{variable.min !== null ? variable.min : 'N/A'}</div>
          </div>
          <div className="p-2 rounded-lg bg-[#191925] border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Value</div>
            <div className="text-foreground font-semibold font-mono text-xs">{variable.max !== null ? variable.max : 'N/A'}</div>
          </div>
          <div className="p-2 rounded-lg bg-[#191925] border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Mean</div>
            <div className="text-foreground font-semibold font-mono text-xs">{variable.mean !== null ? variable.mean : 'N/A'}</div>
          </div>
          <div className="p-2 rounded-lg bg-[#191925] border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Elements</div>
            <div className="text-foreground font-semibold font-mono text-xs">{variable.size.toLocaleString()}</div>
          </div>
        </div>

        {/* Matrix Heatmap Grid */}
        <div className="p-5 overflow-auto custom-scrollbar flex-1 space-y-3">
          {rows > 0 && cols > 0 ? (
            <div className="inline-block min-w-full">
              <div className="flex items-center justify-between pb-2 text-[11px] text-muted-foreground">
                <span>
                  Showing {rows}×{cols} numerical slice {variable.ndim > 2 && '(first 2D slice of higher-rank tensor)'}
                </span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/50 inline-block" /> Positive
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500/50 inline-block" /> Negative
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-white/10 inline-block" /> Zero
                  </span>
                </span>
              </div>

              <div className="overflow-x-auto border border-border/70 rounded-xl bg-[#0E0E16] p-2">
                <table className="border-collapse text-xs font-mono mx-auto">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-muted-foreground text-[10px] select-none text-right pr-2">#</th>
                      {Array.from({ length: cols }).map((_, c) => (
                        <th key={c} className="p-1.5 text-muted-foreground text-[10px] select-none text-center min-w-[52px]">
                          [{c}]
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, r) => (
                      <tr key={r}>
                        <td className="p-1.5 text-muted-foreground text-[10px] select-none text-right pr-2 font-medium">
                          [{r}]
                        </td>
                        {row.map((val, c) => (
                          <td
                            key={c}
                            className="p-1 text-center"
                            title={`(${variable.name}[${r}, ${c}] = ${val})`}
                          >
                            <div
                              style={{ backgroundColor: getCellColor(val) }}
                              className="px-2 py-1.5 rounded-lg border border-white/5 hover:border-emerald-400/60 transition-all cursor-pointer font-mono text-[11px] font-semibold text-foreground hover:scale-105"
                            >
                              {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              No 2D slice available for this variable.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/70 bg-[#191925]/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Tabular Data' : 'Copy Values'}</span>
            </button>

            {onInsertRepl && (
              <>
                <button
                  onClick={() => {
                    onInsertRepl(`${variable.name}.T`);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
                >
                  <CornerDownLeft className="w-3 h-3 text-emerald-400" />
                  <span>{variable.name}.T</span>
                </button>
                <button
                  onClick={() => {
                    onInsertRepl(`np.linalg.norm(${variable.name})`);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
                >
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>norm</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
