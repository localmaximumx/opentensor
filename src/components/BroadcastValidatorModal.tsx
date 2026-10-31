import React, { useState, useMemo } from 'react';
import { X, Layers, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, SlidersHorizontal, Calculator } from 'lucide-react';

export interface BroadcastValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableInputs?: Array<{ name: string; shape: number[] }>;
  onInsertRepl?: (expression: string) => void;
}

export const BroadcastValidatorModal: React.FC<BroadcastValidatorModalProps> = ({
  isOpen,
  onClose,
  availableInputs = [],
  onInsertRepl,
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'matmul'>('broadcast');

  // Input strings
  const [shapeAStr, setShapeAStr] = useState<string>('32, 1, 64');
  const [shapeBStr, setShapeBStr] = useState<string>('8, 64');

  // Matmul input strings
  const [matmulAStr, setMatmulAStr] = useState<string>('32, 128');
  const [matmulBStr, setMatmulBStr] = useState<string>('128, 64');

  // Helper to parse shapes like "(32, 1, 64)" or "32 1 64" or "[32, 1, 64]"
  const parseShape = (str: string): number[] => {
    const cleaned = str.replace(/[()[\]{}]/g, ' ').trim();
    if (!cleaned) return [];
    return cleaned
      .split(/[\s,]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  };

  // Broadcasting analysis
  const broadcastResult = useMemo(() => {
    const a = parseShape(shapeAStr);
    const b = parseShape(shapeBStr);

    if (a.length === 0 || b.length === 0) {
      return { valid: false, error: 'Please enter valid shapes (e.g. 32, 1, 64)', details: [] };
    }

    const maxRank = Math.max(a.length, b.length);
    const padA = Array(maxRank - a.length).fill(1).concat(a);
    const padB = Array(maxRank - b.length).fill(1).concat(b);

    const outShape: number[] = [];
    const stepDetails: Array<{
      axis: number;
      dimA: number;
      dimB: number;
      wasPaddedA: boolean;
      wasPaddedB: boolean;
      outDim: number;
      status: 'match' | 'broadcastA' | 'broadcastB' | 'conflict';
    }> = [];

    let isCompatible = true;
    let conflictAxis = -1;

    for (let i = 0; i < maxRank; i++) {
      const dimA = padA[i];
      const dimB = padB[i];
      const negAxis = i - maxRank;
      const wasPaddedA = i < maxRank - a.length;
      const wasPaddedB = i < maxRank - b.length;

      if (dimA === dimB) {
        outShape.push(dimA);
        stepDetails.push({ axis: negAxis, dimA, dimB, wasPaddedA, wasPaddedB, outDim: dimA, status: 'match' });
      } else if (dimA === 1) {
        outShape.push(dimB);
        stepDetails.push({ axis: negAxis, dimA, dimB, wasPaddedA, wasPaddedB, outDim: dimB, status: 'broadcastA' });
      } else if (dimB === 1) {
        outShape.push(dimA);
        stepDetails.push({ axis: negAxis, dimA, dimB, wasPaddedA, wasPaddedB, outDim: dimA, status: 'broadcastB' });
      } else {
        isCompatible = false;
        conflictAxis = negAxis;
        stepDetails.push({ axis: negAxis, dimA, dimB, wasPaddedA, wasPaddedB, outDim: -1, status: 'conflict' });
      }
    }

    if (!isCompatible) {
      return {
        valid: false,
        padA,
        padB,
        stepDetails,
        error: `Incompatible dimensions at axis ${conflictAxis}: cannot broadcast dimension of size ${padA[conflictAxis + maxRank]} to size ${padB[conflictAxis + maxRank]}.`,
      };
    }

    return {
      valid: true,
      padA,
      padB,
      outShape,
      stepDetails,
      summary: `Broadcasting successful! Output shape is (${outShape.join(', ')}) with ${outShape.reduce((p, c) => p * c, 1).toLocaleString()} elements.`,
    };
  }, [shapeAStr, shapeBStr]);

  // Matmul analysis
  const matmulResult = useMemo(() => {
    const a = parseShape(matmulAStr);
    const b = parseShape(matmulBStr);

    if (a.length === 0 || b.length === 0) {
      return { valid: false, error: 'Please enter valid shapes for matmul.' };
    }

    // 1D @ 1D: dot product
    if (a.length === 1 && b.length === 1) {
      if (a[0] === b[0]) {
        return {
          valid: true,
          outShape: [] as number[],
          isScalar: true,
          explanation: `1D dot product: vectors of length ${a[0]} contract to a scalar float.`,
        };
      }
      return {
        valid: false,
        error: `Vector length mismatch: ${a[0]} vs ${b[0]}. In dot product, lengths must be identical.`,
      };
    }

    // 2D @ 1D
    if (a.length === 2 && b.length === 1) {
      if (a[1] === b[0]) {
        return {
          valid: true,
          outShape: [a[0]],
          explanation: `Matrix-Vector multiplication: (${a[0]}, ${a[1]}) @ (${b[0]},) contracts inner dimension ${a[1]} -> output shape (${a[0]},).`,
        };
      }
      return {
        valid: false,
        error: `Dimension mismatch: matrix columns (${a[1]}) must match vector length (${b[0]}).`,
      };
    }

    // 1D @ 2D
    if (a.length === 1 && b.length === 2) {
      if (a[0] === b[0]) {
        return {
          valid: true,
          outShape: [b[1]],
          explanation: `Vector-Matrix multiplication: (${a[0]},) @ (${b[0]}, ${b[1]}) contracts inner dimension ${a[0]} -> output shape (${b[1]},).`,
        };
      }
      return {
        valid: false,
        error: `Dimension mismatch: vector length (${a[0]}) must match matrix rows (${b[0]}).`,
      };
    }

    // N-D @ M-D (both >= 2)
    const kA = a[a.length - 1];
    const kB = b[b.length - 2];

    if (kA !== kB) {
      return {
        valid: false,
        error: `Contraction dimension mismatch: Inner dimension of A (${kA}) does not match inner dimension of B (${kB}). Columns of A must equal rows of B.`,
      };
    }

    // Check batch broadcasting
    const batchA = a.slice(0, -2);
    const batchB = b.slice(0, -2);
    const maxBatchRank = Math.max(batchA.length, batchB.length);
    const padBatchA = Array(maxBatchRank - batchA.length).fill(1).concat(batchA);
    const padBatchB = Array(maxBatchRank - batchB.length).fill(1).concat(batchB);

    const outBatch: number[] = [];
    for (let i = 0; i < maxBatchRank; i++) {
      if (padBatchA[i] === padBatchB[i]) {
        outBatch.push(padBatchA[i]);
      } else if (padBatchA[i] === 1) {
        outBatch.push(padBatchB[i]);
      } else if (padBatchB[i] === 1) {
        outBatch.push(padBatchA[i]);
      } else {
        return {
          valid: false,
          error: `Batch dimensions cannot broadcast: axis ${i - maxBatchRank - 2} has sizes (${padBatchA[i]} vs ${padBatchB[i]}).`,
        };
      }
    }

    const outShape = [...outBatch, a[a.length - 2], b[b.length - 1]];
    return {
      valid: true,
      outShape,
      explanation: `Matmul valid! Inner contraction K=${kA}. Rows M=${a[a.length - 2]}, Cols N=${b[b.length - 1]}. Output shape is (${outShape.join(', ')}).`,
    };
  }, [matmulAStr, matmulBStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#13131D] border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-[#191925]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Tensor Dimension & Broadcasting Studio
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  NumPy / PyTorch
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Simulate broadcasting rules and matrix multiplication compatibility before running code
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

        {/* Studio Navigation Tabs */}
        <div className="flex border-b border-border/70 bg-[#0E0E16] px-5 gap-4">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'broadcast'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Shape Broadcasting (+, -, *, /)</span>
          </button>
          <button
            onClick={() => setActiveTab('matmul')}
            className={`py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'matmul'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Matrix Multiplication (@ / matmul)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Quick Presets from Active Problem Inputs */}
          {availableInputs.length >= 2 && (
            <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Problem Inputs:
              </span>
              <button
                onClick={() => {
                  if (activeTab === 'broadcast') {
                    setShapeAStr(availableInputs[0].shape.join(', '));
                    setShapeBStr(availableInputs[1].shape.join(', '));
                  } else {
                    setMatmulAStr(availableInputs[0].shape.join(', '));
                    setMatmulBStr(availableInputs[1].shape.join(', '));
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono border border-emerald-500/25 transition-colors"
              >
                Use {availableInputs[0].name} ({availableInputs[0].shape.join(', ')}) & {availableInputs[1].name} ({availableInputs[1].shape.join(', ')})
              </button>
            </div>
          )}

          {activeTab === 'broadcast' ? (
            /* TAB 1: BROADCASTING */
            <div className="space-y-4">
              {/* Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Shape of Array A:</span>
                    <span className="font-mono text-[11px] text-emerald-400">e.g. 32, 1, 64</span>
                  </label>
                  <input
                    type="text"
                    value={shapeAStr}
                    onChange={e => setShapeAStr(e.target.value)}
                    placeholder="e.g. 32, 1, 64"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E16] border border-border text-foreground font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Shape of Array B:</span>
                    <span className="font-mono text-[11px] text-emerald-400">e.g. 8, 64</span>
                  </label>
                  <input
                    type="text"
                    value={shapeBStr}
                    onChange={e => setShapeBStr(e.target.value)}
                    placeholder="e.g. 8, 64"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E16] border border-border text-foreground font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Presets:</span>
                {[
                  { label: 'Batch Broadcast', a: '32, 1, 128', b: '10, 128' },
                  { label: 'Feature Scaling', a: '64, 512', b: '512' },
                  { label: 'Spatial Bias', a: '16, 3, 32, 32', b: '3, 1, 1' },
                  { label: 'Outer Product', a: '10, 1', b: '1, 10' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShapeAStr(p.a);
                      setShapeBStr(p.b);
                    }}
                    className="px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Step-by-Step Alignment Visualizer */}
              {broadcastResult.stepDetails && broadcastResult.stepDetails.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-[#0E0E16] border border-border/80">
                  <div className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Dimension-by-Dimension Alignment (Right to Left):</span>
                    <span className="text-[11px] font-mono text-muted-foreground">Rank {broadcastResult.stepDetails.length}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground text-[11px]">
                          <th className="py-1 px-2 text-left font-sans">Axis</th>
                          {broadcastResult.stepDetails.map((s, i) => (
                            <th key={i} className="py-1 px-3">
                              dim[{s.axis}]
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Array A */}
                        <tr className="border-b border-border/30">
                          <td className="py-2 px-2 text-left text-muted-foreground font-sans font-medium">Array A</td>
                          {broadcastResult.stepDetails.map((s, i) => (
                            <td key={i} className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded ${s.wasPaddedA ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-secondary text-foreground'}`}>
                                {s.dimA} {s.wasPaddedA && <span className="text-[9px] text-sky-400/80">(prepended)</span>}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* Array B */}
                        <tr className="border-b border-border/30">
                          <td className="py-2 px-2 text-left text-muted-foreground font-sans font-medium">Array B</td>
                          {broadcastResult.stepDetails.map((s, i) => (
                            <td key={i} className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded ${s.wasPaddedB ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-secondary text-foreground'}`}>
                                {s.dimB} {s.wasPaddedB && <span className="text-[9px] text-sky-400/80">(prepended)</span>}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* Resulting Dim */}
                        <tr>
                          <td className="py-2 px-2 text-left text-emerald-400 font-sans font-bold">Result</td>
                          {broadcastResult.stepDetails.map((s, i) => (
                            <td key={i} className="py-2 px-3">
                              {s.status === 'conflict' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                                  X Mismatch
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${s.status === 'match' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'}`}>
                                  {s.outDim}
                                  {s.status !== 'match' && <span className="text-[9px]">(broadcast)</span>}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status Outcome Banner */}
              {broadcastResult.valid ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Broadcasting Valid: Shape ({broadcastResult.outShape?.join(', ')})</span>
                  </div>
                  <p className="text-xs text-emerald-300/80 font-sans">
                    {broadcastResult.summary}
                  </p>
                  {onInsertRepl && (
                    <button
                      onClick={() => onInsertRepl(`np.broadcast_shapes((${shapeAStr}), (${shapeBStr}))`)}
                      className="mt-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
                    >
                      <span>Insert np.broadcast_shapes into REPL</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Broadcasting Error</span>
                  </div>
                  <p className="text-xs text-rose-300/90 font-mono">
                    {broadcastResult.error}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-sans pt-1">
                    Rule: Two dimensions are compatible when either they are equal, or one of them is 1.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: MATMUL */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Shape of Matrix A:</span>
                    <span className="font-mono text-[11px] text-emerald-400">(..., M, K)</span>
                  </label>
                  <input
                    type="text"
                    value={matmulAStr}
                    onChange={e => setMatmulAStr(e.target.value)}
                    placeholder="e.g. 32, 128"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E16] border border-border text-foreground font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Shape of Matrix B:</span>
                    <span className="font-mono text-[11px] text-emerald-400">(..., K, N)</span>
                  </label>
                  <input
                    type="text"
                    value={matmulBStr}
                    onChange={e => setMatmulBStr(e.target.value)}
                    placeholder="e.g. 128, 64"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E16] border border-border text-foreground font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Matmul Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Presets:</span>
                {[
                  { label: 'Linear Layer', a: '32, 128', b: '128, 64' },
                  { label: 'Self-Attention Q @ K^T', a: '8, 12, 64, 32', b: '8, 12, 32, 64' },
                  { label: 'Attn Weights @ V', a: '8, 12, 64, 64', b: '8, 12, 64, 32' },
                  { label: 'Affine Matrix-Vector', a: '4, 4', b: '4' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMatmulAStr(p.a);
                      setMatmulBStr(p.b);
                    }}
                    className="px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Matmul Result Banner */}
              {matmulResult.valid ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Matmul Compatible: Output Shape ({matmulResult.isScalar ? 'scalar' : matmulResult.outShape?.join(', ')})
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300/80 font-sans">
                    {matmulResult.explanation}
                  </p>
                  {onInsertRepl && (
                    <button
                      onClick={() => onInsertRepl(`A @ B`)}
                      className="mt-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
                    >
                      <span>Test A @ B in REPL</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Matmul Dimension Mismatch</span>
                  </div>
                  <p className="text-xs text-rose-300/90 font-mono">
                    {matmulResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/70 bg-[#191925]/80">
          <span className="text-[11px] text-muted-foreground font-mono">
            Tip: Press Esc or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
