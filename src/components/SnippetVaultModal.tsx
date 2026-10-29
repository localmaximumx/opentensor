import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bookmark, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  X, 
  Tag, 
  Code2, 
  Sparkles,
  ArrowDownToLine,
  FileCode
} from 'lucide-react';
import { getSavedSnippets, saveSnippet, deleteSnippet, CodeSnippet } from '../services/snippetVaultService';
import { highlightPythonCode } from './SolutionViewer';

interface SnippetVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode?: (code: string) => void;
  initialCodeToSave?: string;
  initialTitle?: string;
}

export const SnippetVaultModal: React.FC<SnippetVaultModalProps> = ({
  isOpen,
  onClose,
  onInsertCode,
  initialCodeToSave,
  initialTitle
}) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);

  // New snippet form state
  const [isCreating, setIsCreating] = useState<boolean>(!!initialCodeToSave);
  const [newTitle, setNewTitle] = useState<string>(initialTitle || '');
  const [newCode, setNewCode] = useState<string>(initialCodeToSave || '');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [newCategory, setNewCategory] = useState<CodeSnippet['category']>('custom');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const loadAll = () => {
    const list = getSavedSnippets();
    setSnippets(list);
    if (!selectedSnippet && list.length > 0) {
      setSelectedSnippet(list[0]);
    }
  };

  useEffect(() => {
    loadAll();
    window.addEventListener('toniclite_vault_change', loadAll);
    return () => window.removeEventListener('toniclite_vault_change', loadAll);
  }, []);

  useEffect(() => {
    if (initialCodeToSave) {
      setIsCreating(true);
      setNewCode(initialCodeToSave);
      if (initialTitle) setNewTitle(initialTitle);
    }
  }, [initialCodeToSave, initialTitle]);

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchQ = !q || 
        s.title.toLowerCase().includes(q) || 
        s.code.toLowerCase().includes(q) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
        (s.description && s.description.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [snippets, searchQuery, activeCategory]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    const tagsArray = newTags
      .split(/[,#\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const saved = saveSnippet({
      title: newTitle.trim(),
      code: newCode.trim(),
      description: newDesc.trim() || undefined,
      category: newCategory,
      tags: tagsArray
    });

    setIsCreating(false);
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewTags('');
    setSelectedSnippet(saved);
  };

  const handleCopy = (snip: CodeSnippet) => {
    navigator.clipboard.writeText(snip.code);
    setCopiedId(snip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (snip: CodeSnippet) => {
    if (onInsertCode) {
      onInsertCode(snip.code);
      setInsertedId(snip.id);
      setTimeout(() => setInsertedId(null), 2000);
    }
  };

  const handleDelete = (id: string) => {
    deleteSnippet(id);
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Personal Snippet Vault</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                  {snippets.length} Saved Recipes
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Store reusable array tricks, custom loss formulas & einsum snippets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> {isCreating ? 'View Library' : 'New Snippet'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area */}
        {isCreating ? (
          <form onSubmit={handleSave} className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" /> Create New Snippet
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Fast Cosine Similarity Matrix"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="custom">Custom Snippet</option>
                  <option value="matrix">Matrix & Linear Algebra</option>
                  <option value="pytorch">PyTorch Tensors</option>
                  <option value="loss">Loss & Activations</option>
                  <option value="broadcasting">Broadcasting & Indexing</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Brief Description (Optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="What does this function do or when should you use it?"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Python Code *</label>
              <textarea
                required
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                rows={9}
                placeholder="def my_function(A, B): ..."
                className="w-full p-3 rounded-xl bg-background font-mono text-xs sm:text-sm border border-border/80 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                placeholder="e.g. numpy, einsum, attention, vectors"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold shadow-md"
              >
                Save to Vault
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Snippet List */}
            <div className="w-full md:w-80 border-r border-border/60 flex flex-col bg-secondary/10 shrink-0">
              {/* Search & Filter */}
              <div className="p-3 border-b border-border/60 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search snippets..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  {['all', 'matrix', 'loss', 'broadcasting', 'custom'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg whitespace-nowrap capitalize font-medium transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground border border-border/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                {filteredSnippets.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No snippets match your filter.
                  </div>
                ) : (
                  filteredSnippets.map(snip => {
                    const isSelected = selectedSnippet?.id === snip.id;
                    return (
                      <button
                        key={snip.id}
                        onClick={() => setSelectedSnippet(snip)}
                        className={`w-full text-left p-3.5 transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-secondary/30'
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground truncate">
                          {snip.title}
                        </div>
                        {snip.description && (
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {snip.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {snip.tags?.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-background border border-border/60 text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Preview Pane */}
            <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
              {selectedSnippet ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Detail Header */}
                  <div className="p-4 border-b border-border/60 flex items-center justify-between bg-secondary/15">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {selectedSnippet.title}
                      </h4>
                      {selectedSnippet.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedSnippet.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(selectedSnippet)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border flex items-center gap-1.5"
                      >
                        {copiedId === selectedSnippet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>

                      {onInsertCode && (
                        <button
                          onClick={() => handleInsert(selectedSnippet)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:opacity-90 text-primary-foreground flex items-center gap-1.5 shadow-sm"
                        >
                          {insertedId === selectedSnippet.id ? <Check className="w-3.5 h-3.5" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                          Insert into Editor
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(selectedSnippet.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Code View */}
                  <div className="flex-1 p-4 overflow-y-auto bg-[#0d1117] text-white">
                    <pre className="font-mono text-xs leading-relaxed">
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightPythonCode(selectedSnippet.code)
                        }}
                      />
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
                  <Bookmark className="w-8 h-8 opacity-40" />
                  <p className="text-sm">Select a code snippet to view or copy</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
