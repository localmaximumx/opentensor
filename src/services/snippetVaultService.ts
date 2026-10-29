export interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  tags: string[];
  category: 'matrix' | 'pytorch' | 'broadcasting' | 'loss' | 'custom';
  description?: string;
  createdAt: string;
}

const STORAGE_KEY = 'toniclite_snippet_vault';

const DEFAULT_SNIPPETS: CodeSnippet[] = [
  {
    id: 'einsum-matmul',
    title: 'Einsum Batched Matrix Multiplication',
    description: 'Perform batched (B, N, K) x (B, K, M) -> (B, N, M) matrix multiplication in a single optimized C-speed operation.',
    category: 'matrix',
    tags: ['einsum', 'matrix-multiplication', 'batched', 'numpy'],
    createdAt: '2026-10-20T10:00:00Z',
    code: `import numpy as np

def batched_matmul_einsum(A, B):
    """
    A: shape (B, N, K)
    B: shape (B, K, M)
    Returns: shape (B, N, M)
    """
    return np.einsum('bnk,bkm->bnm', A, B)
`
  },
  {
    id: 'stable-softmax',
    title: 'Numerically Stable Softmax (Log-Sum-Exp)',
    description: 'Prevent float overflow/underflow by subtracting the row maximum before exponentiating.',
    category: 'loss',
    tags: ['softmax', 'numerical-stability', 'deep-learning'],
    createdAt: '2026-10-21T10:00:00Z',
    code: `import numpy as np

def stable_softmax(logits, axis=-1):
    """
    Subtract max along axis to avoid exp() overflow to inf
    """
    shifted = logits - np.max(logits, axis=axis, keepdims=True)
    exp_scores = np.exp(shifted)
    return exp_scores / np.sum(exp_scores, axis=axis, keepdims=True)
`
  },
  {
    id: 'pairwise-distance',
    title: 'Vectorized Pairwise Euclidean Distance Matrix',
    description: 'Compute ||A_i - B_j||^2 without Python loops using the identity ||a - b||^2 = ||a||^2 + ||b||^2 - 2(a . b).',
    category: 'matrix',
    tags: ['distance', 'vectorization', 'linear-algebra'],
    createdAt: '2026-10-22T10:00:00Z',
    code: `import numpy as np

def pairwise_euclidean_distance(A, B):
    """
    A: shape (N, D)
    B: shape (M, D)
    Returns: shape (N, M) distance matrix
    """
    A2 = np.sum(A**2, axis=1, keepdims=True)   # (N, 1)
    B2 = np.sum(B**2, axis=1, keepdims=True).T # (1, M)
    dot = np.matmul(A, B.T)                     # (N, M)
    dist_sq = np.maximum(0.0, A2 + B2 - 2 * dot)
    return np.sqrt(dist_sq)
`
  },
  {
    id: 'batched-cosine-sim',
    title: 'Batched Cosine Similarity with Broadcasting',
    description: 'Compute similarity across multi-dimensional embedding tensors with unit normalization.',
    category: 'broadcasting',
    tags: ['cosine-similarity', 'embeddings', 'nlp', 'vision'],
    createdAt: '2026-10-23T10:00:00Z',
    code: `import numpy as np

def cosine_similarity(u, v, eps=1e-8):
    """
    u: shape (..., D)
    v: shape (..., D)
    """
    u_norm = u / (np.linalg.norm(u, axis=-1, keepdims=True) + eps)
    v_norm = v / (np.linalg.norm(v, axis=-1, keepdims=True) + eps)
    return np.sum(u_norm * v_norm, axis=-1)
`
  },
  {
    id: 'one-hot-encode',
    title: 'NumPy Zero-Copy One-Hot Encoding',
    description: 'One-hot encode categorical labels in one vectorized line using eye array indexing.',
    category: 'matrix',
    tags: ['one-hot', 'preprocessing', 'classification'],
    createdAt: '2026-10-24T10:00:00Z',
    code: `import numpy as np

def one_hot_encode(labels, num_classes):
    """
    labels: shape (N,) integer array
    num_classes: int
    Returns: shape (N, num_classes)
    """
    return np.eye(num_classes)[labels]
`
  }
];

export function getSavedSnippets(): CodeSnippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SNIPPETS));
      return DEFAULT_SNIPPETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SNIPPETS;
  } catch {
    return DEFAULT_SNIPPETS;
  }
}

export function saveSnippet(snippet: Omit<CodeSnippet, 'id' | 'createdAt'> & { id?: string }): CodeSnippet {
  const all = getSavedSnippets();
  const id = snippet.id || `snippet_${Date.now()}`;
  const now = new Date().toISOString();

  const newSnippet: CodeSnippet = {
    ...snippet,
    id,
    createdAt: now
  };

  const existingIdx = all.findIndex(s => s.id === id);
  if (existingIdx !== -1) {
    all[existingIdx] = newSnippet;
  } else {
    all.unshift(newSnippet);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('toniclite_vault_change'));
  } catch (e) {
    console.error('Failed to save snippet:', e);
  }
  return newSnippet;
}

export function deleteSnippet(id: string): void {
  const all = getSavedSnippets().filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('toniclite_vault_change'));
  } catch (e) {}
}
