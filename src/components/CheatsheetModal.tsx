import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  Code2, 
  Sparkles, 
  Cpu, 
  BookOpen, 
  ExternalLink 
} from 'lucide-react';

interface CheatsheetSnippet {
  title: string;
  description: string;
  code: string;
  category: 'numpy' | 'einsum' | 'backprop' | 'pytorch';
  tags: string[];
}

const CHEATSHEET_DATA: CheatsheetSnippet[] = [
  // NUMPY & BROADCASTING
  {
    title: 'Broadcasting Rules',
    category: 'numpy',
    tags: ['broadcasting', 'shapes', 'dimensions'],
    description: 'Two dimensions are compatible if they are equal, or one of them is 1. Comparison begins from the trailing (rightmost) dimensions.',
    code: `# Example alignment:
# A:      (5, 1, 4)
# B:         (3, 1)  -> padded to (1, 3, 1)
# Result: (5, 3, 4)

import numpy as np
A = np.ones((5, 1, 4))
B = np.ones((3, 1))
C = A + B  # shape: (5, 3, 4)`
  },
  {
    title: 'Adding Dimensions (None / np.newaxis)',
    category: 'numpy',
    tags: ['newaxis', 'expand_dims', 'reshape'],
    description: 'Insert a new axis of length 1 for broadcasting column vs row vectors.',
    code: `x = np.array([1, 2, 3])  # shape (3,)
x_col = x[:, None]       # shape (3, 1) - equivalent to x[:, np.newaxis]
x_row = x[None, :]       # shape (1, 3)

# Outer product via broadcasting:
outer = x_col * x_row    # shape (3, 3)`
  },
  {
    title: 'Vectorized Conditionals (np.where)',
    category: 'numpy',
    tags: ['where', 'conditional', 'masking', 'relu'],
    description: 'Select elements from x or y depending on condition without Python loops.',
    code: `# Leaky ReLU implementation
def leaky_relu(x, alpha=0.01):
    return np.where(x > 0, x, alpha * x)`
  },
  {
    title: 'Normalization with keepdims=True',
    category: 'numpy',
    tags: ['keepdims', 'softmax', 'norm', 'stability'],
    description: 'Preserve reduced dimensions to broadcast directly back against original array.',
    code: `# Numerically stable Softmax
def softmax(x, axis=-1):
    # Subtract max for stability
    e_x = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e_x / np.sum(e_x, axis=axis, keepdims=True)`
  },
  {
    title: 'Pairwise Distance Matrix',
    category: 'numpy',
    tags: ['pairwise', 'distance', 'euclidean', 'broadcasting'],
    description: 'Compute Euclidean distance between all pairs of rows in X without loops.',
    code: `# X shape: (N, D) -> pairwise shape: (N, N)
# Formula: ||a - b||^2 = ||a||^2 + ||b||^2 - 2(a . b)
diff = X[:, None, :] - X[None, :, :]  # (N, N, D)
dists = np.sqrt(np.sum(diff ** 2, axis=-1))`
  },

  // EINSUM & TENSOR CONTRACTION
  {
    title: 'Matrix Multiplication',
    category: 'einsum',
    tags: ['einsum', 'matmul', 'dot'],
    description: 'Standard matrix multiplication C = A @ B.',
    code: `# A is (M, K), B is (K, N) -> Output is (M, N)
C = np.einsum('ik,kj->ij', A, B)`
  },
  {
    title: 'Batched Matrix Multiplication (BMM)',
    category: 'einsum',
    tags: ['einsum', 'bmm', 'batch', 'transformer'],
    description: 'Multiply matrices across batch dimension (common in Transformers).',
    code: `# A: (B, M, K), B: (B, K, N) -> Output: (B, M, N)
C = np.einsum('bik,bkj->bij', A, B)`
  },
  {
    title: 'Multi-Head Attention Scores (Q @ K^T)',
    category: 'einsum',
    tags: ['attention', 'transformer', 'multihead', 'einsum'],
    description: 'Compute attention logits across batch, heads, queries, and keys.',
    code: `# Q: (B, H, S_q, D), K: (B, H, S_k, D)
# Logits: (B, H, S_q, S_k)
scores = np.einsum('bhqd,bhkd->bhqk', Q, K) / np.sqrt(D)`
  },
  {
    title: 'Matrix Trace & Diagonal',
    category: 'einsum',
    tags: ['trace', 'diagonal', 'einsum'],
    description: 'Extract diagonal vector or sum diagonal elements (trace).',
    code: `# Trace (sum of diagonal elements):
trace_val = np.einsum('ii->', A)

# Extract diagonal vector:
diag_vec = np.einsum('ii->i', A)`
  },
  {
    title: 'Vector Dot & Outer Product',
    category: 'einsum',
    tags: ['dot', 'outer', 'vectors', 'einsum'],
    description: 'Inner dot product vs outer tensor product.',
    code: `# Dot product: a . b
dot = np.einsum('i,i->', a, b)

# Outer product: a (x) b
outer = np.einsum('i,j->ij', a, b)`
  },

  // MATRIX CALCULUS & BACKPROP
  {
    title: 'Softmax Jacobian & Gradient',
    category: 'backprop',
    tags: ['softmax', 'gradient', 'jacobian', 'derivative'],
    description: 'Derivative of softmax with respect to logits z: ∂S_i/∂z_j = S_i (δ_ij - S_j).',
    code: `# Forward: s = softmax(z)
# Backward given dL/ds (dL_ds):
# Vectorized: dL/dz = s * (dL_ds - sum(dL_ds * s, axis=-1, keepdims=True))
def softmax_backward(dL_ds, s):
    return s * (dL_ds - np.sum(dL_ds * s, axis=-1, keepdims=True))`
  },
  {
    title: 'Cross-Entropy with Softmax (Fused Gradient)',
    category: 'backprop',
    tags: ['cross-entropy', 'loss', 'gradient', 'backprop'],
    description: 'Combined gradient of Cross-Entropy loss with Softmax simplifies beautifully to (p - y).',
    code: `# p: predicted probabilities (N, C)
# y: one-hot true targets (N, C) or class indices
# Gradient dL/dz:
dL_dz = (p - y) / N`
  },
  {
    title: 'Linear / Dense Layer Backward Pass',
    category: 'backprop',
    tags: ['dense', 'linear', 'affine', 'backprop'],
    description: 'Y = X @ W + b. Given upstream gradient dY.',
    code: `# Forward: Y = X @ W + b  (X: N x D_in, W: D_in x D_out)
# Backward:
dW = X.T @ dY          # Shape: (D_in, D_out)
db = np.sum(dY, axis=0) # Shape: (D_out,)
dX = dY @ W.T          # Shape: (N, D_in)`
  },
  {
    title: 'Layer Normalization Backward Pass',
    category: 'backprop',
    tags: ['layernorm', 'normalization', 'backprop'],
    description: 'Backward pass for LayerNorm(x) = gamma * x_hat + beta.',
    code: `# x_hat = (x - mean) / sqrt(var + eps)
dgamma = np.sum(dy * x_hat, axis=0)
dbeta  = np.sum(dy, axis=0)

# Vectorized dx for feature dimension D:
dx_hat = dy * gamma
D = x.shape[-1]
dx = (1.0 / (D * std)) * (D * dx_hat - np.sum(dx_hat, axis=-1, keepdims=True) - x_hat * np.sum(dx_hat * x_hat, axis=-1, keepdims=True))`
  },

  // PYTORCH VS NUMPY EQUIVALENCE
  {
    title: 'Array Creation & Conversion',
    category: 'pytorch',
    tags: ['torch', 'numpy', 'conversion'],
    description: 'Zero-copy conversion between NumPy arrays and PyTorch tensors.',
    code: `# NumPy -> PyTorch
t = torch.from_numpy(arr)  # shares memory
t = torch.tensor(arr)       # copies

# PyTorch -> NumPy
arr = t.detach().cpu().numpy()
val = t.item()  # for scalar tensor`
  },
  {
    title: 'Reshaping & Squeezing',
    category: 'pytorch',
    tags: ['view', 'flatten', 'squeeze', 'unsqueeze'],
    description: 'Common dimension reshaping operations across libraries.',
    code: `# NumPy                       # PyTorch
x.reshape(-1)                 t.view(-1) / t.flatten()
np.squeeze(x, axis=1)         t.squeeze(1)
np.expand_dims(x, axis=0)     t.unsqueeze(0)
x.transpose(1, 0, 2)          t.permute(1, 0, 2)`
  },
  {
    title: 'Concatenation & Stacking',
    category: 'pytorch',
    tags: ['cat', 'stack', 'concatenate'],
    description: 'Joining arrays along existing vs new dimensions.',
    code: `# Along existing dimension:
# NumPy:   np.concatenate([a, b], axis=0)
# PyTorch: torch.cat([a, b], dim=0)

# Along new dimension:
# NumPy:   np.stack([a, b], axis=0)
# PyTorch: torch.stack([a, b], dim=0)`
  }
];

export interface CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'numpy' | 'einsum' | 'backprop' | 'pytorch';
}

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'numpy'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'numpy' | 'einsum' | 'backprop' | 'pytorch'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filteredSnippets = useMemo(() => {
    return CHEATSHEET_DATA.filter(item => {
      const matchTab = activeTab === 'all' || item.category === activeTab;
      if (!matchTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [activeTab, searchQuery]);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-card dark:bg-[#0c1511] border border-border dark:border-[#1d3326] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/80 dark:border-[#1d3326] flex items-center justify-between bg-secondary/30 dark:bg-[#08100d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#93C572]/15 text-[#93C572] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground dark:text-white flex items-center gap-2">
                <span>ML & Tensor Cheatsheet</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#93C572]/20 text-[#93C572] font-mono font-semibold">
                  Quick Ref
                </span>
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Essential formulas, broadcasting tricks, einsum notation, and gradient derivations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="p-4 border-b border-border/60 dark:border-[#1d3326] bg-card dark:bg-[#09140f] space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formulas, einsum patterns, broadcasting, backprop (e.g. 'softmax', 'bmm', 'jacobian')..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border/80 dark:border-[#223d2e] text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#93C572]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#93C572] text-black shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              All Topics ({CHEATSHEET_DATA.length})
            </button>
            <button
              onClick={() => setActiveTab('numpy')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === 'numpy'
                  ? 'bg-[#93C572] text-black shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              NumPy & Broadcasting
            </button>
            <button
              onClick={() => setActiveTab('einsum')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === 'einsum'
                  ? 'bg-[#93C572] text-black shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              einsum & Tensor Contraction
            </button>
            <button
              onClick={() => setActiveTab('backprop')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === 'backprop'
                  ? 'bg-[#93C572] text-black shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Matrix Calculus & Backprop
            </button>
            <button
              onClick={() => setActiveTab('pytorch')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeTab === 'pytorch'
                  ? 'bg-[#93C572] text-black shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              PyTorch vs NumPy
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No cheatsheet matches found</p>
              <p className="text-xs mt-1">Try another keyword or select a different category tab.</p>
            </div>
          ) : (
            filteredSnippets.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0e1a14] shadow-sm hover:border-[#93C572]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.code, idx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono transition-colors shrink-0"
                    title="Copy snippet"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Block */}
                <div className="relative mt-2">
                  <pre className="p-3 rounded-xl bg-[#090f0c] dark:bg-black/60 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto custom-scrollbar leading-relaxed">
                    <code>{item.code}</code>
                  </pre>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {item.tags.map(t => (
                    <span 
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-secondary/60 dark:bg-[#15231c] text-[10px] font-mono text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/80 dark:border-[#1d3326] bg-secondary/20 dark:bg-[#08100d] flex items-center justify-between text-xs text-muted-foreground shrink-0 font-mono">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px]">Esc</kbd> to close</span>
          <span className="text-[#93C572] font-semibold">{filteredSnippets.length} reference cards available</span>
        </div>
      </div>
    </div>
  );
};
