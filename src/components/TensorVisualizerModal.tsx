import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Grid, 
  Maximize2,
  Copy,
  Check
} from 'lucide-react';

interface TensorVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TensorVisualizerModal: React.FC<TensorVisualizerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'broadcasting' | 'slicing'>('broadcasting');

  // Broadcasting State
  const [shapeAStr, setShapeAStr] = useState<string>('3, 1, 4');
  const [shapeBStr, setShapeBStr] = useState<string>('2, 4');

  // Slicing State
  const [sliceExpr, setSliceExpr] = useState<string>('arr[1:3, 1:4]');
  const [copiedSlice, setCopiedSlice] = useState<boolean>(false);

  // Parse shapes
  const parseShape = (str: string): number[] => {
    return str
      .replace(/[()[\]]/g, '')
      .split(/[,x\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  };

  const shapeA = useMemo(() => parseShape(shapeAStr), [shapeAStr]);
  const shapeB = useMemo(() => parseShape(shapeBStr), [shapeBStr]);

  // Compute broadcasting
  const broadcastResult = useMemo(() => {
    if (shapeA.length === 0 || shapeB.length === 0) {
      return { isValid: false, error: 'Please enter valid positive dimensions for both tensors.' };
    }

    const maxLen = Math.max(shapeA.length, shapeB.length);
    const paddedA: number[] = Array(maxLen - shapeA.length).fill(1).concat(shapeA);
    const paddedB: number[] = Array(maxLen - shapeB.length).fill(1).concat(shapeB);

    const steps: {
      dimIdx: number;
      dimA: number;
      dimB: number;
      isPrependedA: boolean;
      isPrependedB: boolean;
      resultDim: number;
      status: 'match' | 'stretchA' | 'stretchB' | 'error';
      reason: string;
    }[] = [];

    let isCompatible = true;
    const outputShape: number[] = [];

    for (let i = 0; i < maxLen; i++) {
      const a = paddedA[i];
      const b = paddedB[i];
      const isPrependedA = i < maxLen - shapeA.length;
      const isPrependedB = i < maxLen - shapeB.length;

      if (a === b) {
        steps.push({
          dimIdx: i,
          dimA: a,
          dimB: b,
          isPrependedA,
          isPrependedB,
          resultDim: a,
          status: 'match',
          reason: `Both shapes have size ${a}`
        });
        outputShape.push(a);
      } else if (a === 1) {
        steps.push({
          dimIdx: i,
          dimA: a,
          dimB: b,
          isPrependedA,
          isPrependedB,
          resultDim: b,
          status: 'stretchA',
          reason: `Tensor A size 1 stretches to match B size ${b}`
        });
        outputShape.push(b);
      } else if (b === 1) {
        steps.push({
          dimIdx: i,
          dimA: a,
          dimB: b,
          isPrependedA,
          isPrependedB,
          resultDim: a,
          status: 'stretchB',
          reason: `Tensor B size 1 stretches to match A size ${a}`
        });
        outputShape.push(a);
      } else {
        isCompatible = false;
        steps.push({
          dimIdx: i,
          dimA: a,
          dimB: b,
          isPrependedA,
          isPrependedB,
          resultDim: 0,
          status: 'error',
          reason: `Incompatible sizes: ${a} vs ${b}`
        });
        break;
      }
    }

    return {
      isValid: true,
      isCompatible,
      paddedA,
      paddedB,
      steps,
      outputShape: isCompatible ? outputShape : null,
      error: isCompatible
        ? null
        : `ValueError: operands could not be broadcast together with shapes (${shapeA.join(',')}) (${shapeB.join(',')})`
    };
  }, [shapeA, shapeB]);

  // Slicing Grid logic: 4 rows x 5 columns
  const gridRows = 4;
  const gridCols = 5;
  const gridData = useMemo(() => {
    const data: number[][] = [];
    let count = 10;
    for (let r = 0; r < gridRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < gridCols; c++) {
        row.push(count++);
      }
      data.push(row);
    }
    return data;
  }, []);

  // Parse slice expression: e.g. arr[1:3, 1:4]
  const isSelectedCell = (r: number, c: number): boolean => {
    try {
      const match = sliceExpr.match(/arr\[\s*([^,\]]+)(?:,\s*([^,\]]+))?\s*\]/);
      if (!match) return false;

      const parseSlicePart = (part: string, maxLen: number): number[] => {
        const trimmed = part.trim();
        if (trimmed === ':') return Array.from({ length: maxLen }, (_, i) => i);
        if (!trimmed.includes(':')) {
          let idx = parseInt(trimmed, 10);
          if (idx < 0) idx += maxLen;
          return idx >= 0 && idx < maxLen ? [idx] : [];
        }

        const tokens = trimmed.split(':');
        let start = tokens[0] !== '' ? parseInt(tokens[0], 10) : 0;
        let stop = tokens[1] !== '' ? parseInt(tokens[1], 10) : maxLen;
        let step = tokens[2] !== undefined && tokens[2] !== '' ? parseInt(tokens[2], 10) : 1;

        if (start < 0) start += maxLen;
        if (stop < 0) stop += maxLen;

        start = Math.max(0, Math.min(maxLen, start));
        stop = Math.max(0, Math.min(maxLen, stop));

        const res: number[] = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) res.push(i);
        } else if (step < 0) {
          for (let i = start; i > stop; i += step) res.push(i);
        }
        return res;
      };

      const rowPart = match[1];
      const colPart = match[2] || ':';

      const validRows = parseSlicePart(rowPart, gridRows);
      const validCols = parseSlicePart(colPart, gridCols);

      return validRows.includes(r) && validCols.includes(c);
    } catch {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Interactive Tensor Visualizer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  NumPy / PyTorch Specs
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Inspect broadcasting rules, alignment steps, and multidimensional indexing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/60 bg-secondary/15 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('broadcasting')}
            className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'broadcasting'
                ? 'bg-card text-primary border-border/70 border-b-transparent shadow-sm'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            📐 Tensor Broadcasting Rules
          </button>
          <button
            onClick={() => setActiveTab('slicing')}
            className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'slicing'
                ? 'bg-card text-primary border-border/70 border-b-transparent shadow-sm'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            🧊 2D Matrix Slice Inspector
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'broadcasting' && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground font-medium">Quick Presets:</span>
                <button
                  onClick={() => { setShapeAStr('3, 1, 4'); setShapeBStr('2, 4'); }}
                  className="px-2.5 py-1 rounded-lg bg-secondary/30 hover:bg-secondary border border-border/60 text-foreground transition-colors"
                >
                  3D & 2D: (3, 1, 4) + (2, 4)
                </button>
                <button
                  onClick={() => { setShapeAStr('8, 1, 64'); setShapeBStr('8, 12, 1'); }}
                  className="px-2.5 py-1 rounded-lg bg-secondary/30 hover:bg-secondary border border-border/60 text-foreground transition-colors"
                >
                  Attention Heads: (8, 1, 64) + (8, 12, 1)
                </button>
                <button
                  onClick={() => { setShapeAStr('5, 4'); setShapeBStr('4'); }}
                  className="px-2.5 py-1 rounded-lg bg-secondary/30 hover:bg-secondary border border-border/60 text-foreground transition-colors"
                >
                  Matrix + Bias: (5, 4) + (4,)
                </button>
                <button
                  onClick={() => { setShapeAStr('3, 5'); setShapeBStr('2, 5'); }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                >
                  Incompatible: (3, 5) + (2, 5) ❌
                </button>
              </div>

              {/* Shape Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/70 space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Tensor A Shape</span>
                    <span className="text-primary font-mono text-[11px]">({shapeA.join(', ')})</span>
                  </label>
                  <input
                    type="text"
                    value={shapeAStr}
                    onChange={e => setShapeAStr(e.target.value)}
                    placeholder="e.g. 3, 1, 4"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/80 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">Comma or space separated dimensions</p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/70 space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Tensor B Shape</span>
                    <span className="text-primary font-mono text-[11px]">({shapeB.join(', ')})</span>
                  </label>
                  <input
                    type="text"
                    value={shapeBStr}
                    onChange={e => setShapeBStr(e.target.value)}
                    placeholder="e.g. 2, 4"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/80 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">NumPy aligns trailing dimensions first</p>
                </div>
              </div>

              {/* Alignment Visualization */}
              {broadcastResult.isValid && (
                <div className="p-4 sm:p-5 rounded-2xl bg-secondary/15 border border-border/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Right-To-Left Dimension Alignment
                    </h4>
                    {broadcastResult.isCompatible ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Broadcasts to ({broadcastResult.outputShape?.join(', ')})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Incompatible Shapes
                      </span>
                    )}
                  </div>

                  {/* Alignment Columns */}
                  <div className="overflow-x-auto pb-2">
                    <div className="inline-flex gap-3 min-w-full justify-center py-2">
                      {broadcastResult.steps.map((step, idx) => {
                        const isErr = step.status === 'error';
                        const isStretchA = step.status === 'stretchA';
                        const isStretchB = step.status === 'stretchB';

                        return (
                          <div 
                            key={idx}
                            className={`flex flex-col items-center p-3 rounded-xl border min-w-[110px] text-center transition-all ${
                              isErr
                                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                                : 'bg-background/80 border-border/80'
                            }`}
                          >
                            <span className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                              Axis -{broadcastResult.steps.length - idx}
                            </span>

                            {/* Dim A */}
                            <div className="flex items-center gap-1 font-mono text-sm font-bold text-foreground my-0.5">
                              <span className="text-[10px] text-muted-foreground">A:</span>
                              <span className={step.isPrependedA ? 'text-primary/70 italic' : isStretchA ? 'text-amber-400' : ''}>
                                {step.dimA} {step.isPrependedA && '(prepended 1)'}
                              </span>
                            </div>

                            {/* Dim B */}
                            <div className="flex items-center gap-1 font-mono text-sm font-bold text-foreground my-0.5">
                              <span className="text-[10px] text-muted-foreground">B:</span>
                              <span className={step.isPrependedB ? 'text-primary/70 italic' : isStretchB ? 'text-amber-400' : ''}>
                                {step.dimB} {step.isPrependedB && '(prepended 1)'}
                              </span>
                            </div>

                            {/* Divider Arrow */}
                            <div className="my-1.5 w-full h-[1px] bg-border/60 flex items-center justify-center">
                              <span className="bg-card px-1 text-[10px] text-muted-foreground">↓</span>
                            </div>

                            {/* Output Dim */}
                            <div className="font-mono text-sm font-black text-primary">
                              {isErr ? '❌' : step.resultDim}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                              {step.reason}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Output summary */}
                  {broadcastResult.isCompatible ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-400">
                      <span>
                        ✅ <strong>Success:</strong> Resulting array shape has <strong>{broadcastResult.outputShape?.length}</strong> dimensions and <strong>{broadcastResult.outputShape?.reduce((a, b) => a * b, 1)}</strong> total elements.
                      </span>
                      <span className="font-mono font-bold text-sm">
                        shape: ({broadcastResult.outputShape?.join(', ')})
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 font-mono">
                      {broadcastResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'slicing' && (
            <div className="space-y-6">
              {/* Slicing Expression Controls */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Python Slice Expression</label>
                  <span className="text-xs text-muted-foreground">Grid Shape: (4, 5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sliceExpr}
                    onChange={e => setSliceExpr(e.target.value)}
                    placeholder="e.g. arr[1:3, 1:4] or arr[:, ::2]"
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/80 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sliceExpr);
                      setCopiedSlice(true);
                      setTimeout(() => setCopiedSlice(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-background border border-border/80 text-muted-foreground hover:text-foreground"
                    title="Copy slice"
                  >
                    {copiedSlice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Slicing Presets */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-muted-foreground">Presets:</span>
                  <button
                    onClick={() => setSliceExpr('arr[1:3, 1:4]')}
                    className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary border border-border/60 text-foreground"
                  >
                    Submatrix arr[1:3, 1:4]
                  </button>
                  <button
                    onClick={() => setSliceExpr('arr[:, ::2]')}
                    className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary border border-border/60 text-foreground"
                  >
                    Every other col arr[:, ::2]
                  </button>
                  <button
                    onClick={() => setSliceExpr('arr[-2:, :]')}
                    className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary border border-border/60 text-foreground"
                  >
                    Bottom 2 rows arr[-2:, :]
                  </button>
                  <button
                    onClick={() => setSliceExpr('arr[2, 3]')}
                    className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary border border-border/60 text-foreground"
                  >
                    Single Cell arr[2, 3]
                  </button>
                </div>
              </div>

              {/* Matrix Grid Visualization */}
              <div className="p-5 rounded-2xl bg-secondary/15 border border-border/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Column Index (axis 1) →</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-primary" /> Selected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-background border border-border" /> Unselected
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto py-2">
                  <div className="inline-block min-w-full">
                    {/* Column Headers */}
                    <div className="grid grid-cols-6 gap-2 mb-2 text-center text-xs font-mono text-muted-foreground">
                      <div></div>
                      {Array.from({ length: gridCols }).map((_, c) => (
                        <div key={c} className="font-bold">Col {c}</div>
                      ))}
                    </div>

                    {/* Matrix Rows */}
                    {gridData.map((row, r) => (
                      <div key={r} className="grid grid-cols-6 gap-2 mb-2">
                        {/* Row Header */}
                        <div className="flex items-center justify-center font-mono text-xs font-bold text-muted-foreground">
                          Row {r}
                        </div>
                        {row.map((val, c) => {
                          const selected = isSelectedCell(r, c);
                          return (
                            <div
                              key={c}
                              className={`h-12 rounded-xl flex flex-col items-center justify-center font-mono transition-all border ${
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105 font-bold z-10'
                                  : 'bg-background/80 text-muted-foreground border-border/70 hover:border-primary/50'
                              }`}
                            >
                              <span className="text-sm">{val}</span>
                              <span className="text-[9px] opacity-70">[{r},{c}]</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>💡 Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> anytime to return to coding</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
