export interface CommunitySolutionItem {
  id: string;
  slug: string;
  author: string;
  authorRole: string;
  upvotes: number;
  tags: string[];
  title: string;
  code: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = 'toniclite_community_solutions';
const UPVOTES_KEY = 'toniclite_user_upvotes';

// Pre-seeded community solutions for common problems
const SEED_COMMUNITY_SOLUTIONS: Record<string, CommunitySolutionItem[]> = {
  default: [
    {
      id: 'seed-einsum',
      slug: 'default',
      author: 'EinsumWizard',
      authorRole: 'Research Engineer',
      upvotes: 42,
      tags: ['one-liner', 'einsum', 'vectorized'],
      title: 'Ultra-concise np.einsum Vectorization',
      code: `# Elegant one-liner using NumPy Einstein Summation convention
def solution(*args):
    # Expressed as a single tensor contraction with zero intermediate allocations
    return np.einsum('...i,...i->...', args[0], args[1]) if len(args) > 1 else np.einsum('...ii->...', args[0])
`,
      notes: 'Avoids multi-step loops or memory copies by computing the tensor contraction directly in optimized BLAS.',
      createdAt: '2026-10-24T12:00:00Z'
    },
    {
      id: 'seed-pytorch',
      slug: 'default',
      author: 'TorchNinja',
      authorRole: 'Machine Learning Engineer',
      upvotes: 28,
      tags: ['pytorch', 'gpu-ready', 'tensors'],
      title: 'PyTorch Equivalent (CUDA / Metal ready)',
      code: `import torch

def torch_solution(x):
    # Convert numpy array to torch tensor with zero copy
    t = torch.as_tensor(x)
    res = torch.matmul(t, t.T) if t.dim() == 2 else torch.sum(t, dim=-1)
    return res.numpy()
`,
      notes: 'Zero-copy conversion into PyTorch tensors for immediate GPU and autograd acceleration.',
      createdAt: '2026-10-25T14:30:00Z'
    }
  ]
};

export function getCommunitySolutions(slug: string): CommunitySolutionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const customList: CommunitySolutionItem[] = raw ? JSON.parse(raw) : [];
    const forSlug = customList.filter(s => s.slug === slug);

    // Merge with seeds
    const seeds = (SEED_COMMUNITY_SOLUTIONS[slug] || SEED_COMMUNITY_SOLUTIONS['default']).map(s => ({
      ...s,
      slug
    }));

    return [...forSlug, ...seeds];
  } catch {
    return (SEED_COMMUNITY_SOLUTIONS[slug] || SEED_COMMUNITY_SOLUTIONS['default']).map(s => ({
      ...s,
      slug
    }));
  }
}

export function addCommunitySolution(item: Omit<CommunitySolutionItem, 'id' | 'createdAt' | 'upvotes'>): CommunitySolutionItem {
  const newItem: CommunitySolutionItem = {
    ...item,
    id: `comm_${Date.now()}`,
    upvotes: 1,
    createdAt: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: CommunitySolutionItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('toniclite_community_update'));
  } catch (e) {}

  return newItem;
}

export function upvoteCommunitySolution(id: string): number {
  try {
    const upvotedRaw = localStorage.getItem(UPVOTES_KEY);
    const upvotedSet: Record<string, boolean> = upvotedRaw ? JSON.parse(upvotedRaw) : {};
    
    if (upvotedSet[id]) {
      return 0; // already upvoted
    }

    upvotedSet[id] = true;
    localStorage.setItem(UPVOTES_KEY, JSON.stringify(upvotedSet));

    const raw = localStorage.getItem(STORAGE_KEY);
    const list: CommunitySolutionItem[] = raw ? JSON.parse(raw) : [];
    const item = list.find(s => s.id === id);
    if (item) {
      item.upvotes += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('toniclite_community_update'));
      return item.upvotes;
    }
    return 1;
  } catch {
    return 1;
  }
}

export function hasUserUpvoted(id: string): boolean {
  try {
    const upvotedRaw = localStorage.getItem(UPVOTES_KEY);
    const upvotedSet: Record<string, boolean> = upvotedRaw ? JSON.parse(upvotedRaw) : {};
    return !!upvotedSet[id];
  } catch {
    return false;
  }
}
