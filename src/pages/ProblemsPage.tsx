import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Check, Sparkles, TrendingUp, BookOpen, Layers, Cpu, Award } from 'lucide-react';
import { getProblemCatalog, getSolvedProblems } from '../services/dataService';
import { ProblemSummary, Difficulty, Category } from '../types';
import { ExplorePanel } from '../components/ExplorePanel';

export const ProblemsPage: React.FC = () => {
  const [catalog, setCatalog] = useState<{ total: number; topics: { name: string; count: number }[]; problems: ProblemSummary[] }>({
    total: 0,
    topics: [],
    problems: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());

  const pageSize = 30;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProblemCatalog();
      setCatalog(data);
      setSolvedSet(getSolvedProblems());
      setLoading(false);
    }
    load();

    const handleAuthOrStorage = () => {
      setSolvedSet(getSolvedProblems());
    };
    window.addEventListener('tensortonic_auth_change', handleAuthOrStorage);
    window.addEventListener('storage', handleAuthOrStorage);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthOrStorage);
      window.removeEventListener('storage', handleAuthOrStorage);
    };
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'numpy', label: 'NumPy', icon: '/images/catalog-categories/numpy.svg', bg: '#17333f' },
    { id: 'pytorch', label: 'PyTorch', icon: '/images/catalog-categories/pytorch.svg', bg: '#3a2423' },
    { id: 'cuda', label: 'CUDA', icon: '/images/catalog-categories/cuda.svg', bg: '#2d3b1d' },
    { id: 'triton', label: 'Triton', icon: '/images/catalog-categories/triton.svg', bg: '#312746' },
    { id: 'sql', label: 'SQL', icon: '/images/catalog-categories/sql.svg', bg: '#3b321d' },
    { id: 'python', label: 'Python', icon: '/images/catalog-categories/python.svg', bg: '#243554' },
    { id: 'pandas', label: 'Pandas', icon: '/images/catalog-categories/pandas.svg', bg: '#40263a' }
  ];

  // Filtering
  const filteredProblems = useMemo(() => {
    return catalog.problems.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory) {
        return false;
      }
      // Topic filter
      if (selectedTopic !== 'All' && !p.tags.includes(selectedTopic)) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }
      // Status filter
      const isSolved = solvedSet.has(p.slug);
      if (selectedStatus === 'Solved' && !isSolved) return false;
      if (selectedStatus === 'Unsolved' && isSolved) return false;
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTag = p.tags.some(t => t.toLowerCase().includes(q));
        const matchesCategory = p.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesCategory) return false;
      }
      return true;
    });
  }, [catalog.problems, selectedCategory, selectedTopic, selectedDifficulty, selectedStatus, searchQuery, solvedSet]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / pageSize));
  const displayedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage]);

  // Solved Stats Breakdown
  const solvedStats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    for (const p of catalog.problems) {
      if (solvedSet.has(p.slug)) {
        if (p.difficulty === 'Easy') easy++;
        else if (p.difficulty === 'Medium') medium++;
        else if (p.difficulty === 'Hard') hard++;
      }
    }
    return { total: solvedSet.size, easy, medium, hard };
  }, [catalog.problems, solvedSet]);

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="inline-flex rounded-md border border-[#28633D] bg-[#14291D] px-2 py-0.5 text-xs font-medium text-[#4ADE80]">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex rounded-md border border-[#70521D] bg-[#302719] px-2 py-0.5 text-xs font-medium text-[#FBBF24]">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex rounded-md border border-[#70303A] bg-[#30191E] px-2 py-0.5 text-xs font-medium text-[#F87171]">
            Hard
          </span>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0B0B12] text-[#F4F4FA] custom-scrollbar">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-8 grid grid-cols-12 gap-4 lg:gap-10 max-w-7xl">
        
        {/* Left Sidebar */}
        <aside className="col-span-12 lg:col-span-3 hidden lg:flex flex-col gap-4">
          
          {/* Explore Side Panel (Papers) */}
          <ExplorePanel />

          {/* Your Progress */}
          <div className="bg-[#191925] border border-[#303041] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#251B3B] rounded-lg border border-[#45455B]/60">
                <TrendingUp className="w-3.5 h-3.5 text-[#C4F75B]" />
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4FA]">Your Progress</h3>
              <span className="ml-auto text-[11px] font-mono text-[#C4F75B] font-semibold">Active</span>
            </div>

            {/* Circular Ring Progress */}
            <div className="flex justify-center py-2">
              <div className="relative flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-[#303041] flex flex-col items-center justify-center bg-[#13131D]">
                  <span className="text-2xl font-bold font-mono text-[#F4F4FA]">{solvedStats.total}</span>
                  <span className="text-[10px] text-[#9292A8]">solved</span>
                </div>
              </div>
            </div>

            {/* Difficulty breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#303041] text-center">
              <div>
                <div className="text-[11px] text-[#4ADE80] font-medium">Easy</div>
                <div className="text-sm font-bold font-mono text-[#F4F4FA]">{solvedStats.easy}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#FBBF24] font-medium">Med</div>
                <div className="text-sm font-bold font-mono text-[#F4F4FA]">{solvedStats.medium}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#F87171] font-medium">Hard</div>
                <div className="text-sm font-bold font-mono text-[#F4F4FA]">{solvedStats.hard}</div>
              </div>
            </div>
          </div>

          {/* Pro Unlocked Banner */}
          <div className="bg-[#191925] border border-[#303041] rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6] mb-1">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span>Full Free Access</span>
            </div>
            <p className="text-xs text-[#9292A8] leading-relaxed mt-1">
              All 790 problems and landmark research papers are fully unlocked. No subscription required.
            </p>
          </div>

        </aside>

        {/* Main Problems Table Section */}
        <section className="col-span-12 lg:col-span-9">
          
          {/* Top Topics Filter */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap no-scrollbar">
            <button
              onClick={() => { setSelectedTopic('All'); setCurrentPage(1); }}
              className={`inline-flex h-7 shrink-0 whitespace-nowrap items-center rounded-full px-3 text-xs font-medium transition-colors ${
                selectedTopic === 'All'
                  ? 'bg-[#251B3B] text-[#8B5CF6] font-semibold border border-[#45455B]'
                  : 'bg-[#13131D] text-[#B5B5C8] hover:bg-[#272738] hover:text-[#F4F4FA] border border-[#303041]'
              }`}
            >
              All topics
            </button>
            {catalog.topics.slice(0, 10).map((t) => (
              <button
                key={t.name}
                onClick={() => { setSelectedTopic(t.name); setCurrentPage(1); }}
                className={`inline-flex h-7 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                  selectedTopic === t.name
                    ? 'bg-[#251B3B] text-[#8B5CF6] font-semibold border border-[#45455B]'
                    : 'bg-[#13131D] text-[#B5B5C8] hover:bg-[#272738] hover:text-[#F4F4FA] border border-[#303041]'
                }`}
              >
                {t.name}
                <span className="text-[10px] tabular-nums text-[#9292A8]">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Mobile Progress Summary Card (< lg) */}
          <div className="lg:hidden mb-4 p-3.5 rounded-xl bg-[#191925] border border-[#303041] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#251B3B] text-[#C4F75B] rounded-lg border border-[#45455B]/60">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#F4F4FA]">Your Solved Progress</div>
                <div className="text-[10px] text-[#9292A8] font-mono mt-0.5">
                  Easy: <span className="text-[#4ADE80] font-semibold">{solvedStats.easy}</span> · Med: <span className="text-[#FBBF24] font-semibold">{solvedStats.medium}</span> · Hard: <span className="text-[#F87171] font-semibold">{solvedStats.hard}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-lg font-black text-[#C4F75B]">{solvedStats.total}</span>
              <span className="text-[11px] text-[#9292A8]"> / 790</span>
            </div>
          </div>

          {/* Category Icons Row */}
          <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap no-scrollbar">
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.id as Category); setCurrentPage(1); }}
                  className={`relative inline-flex h-9 shrink-0 whitespace-nowrap min-w-0 items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors px-3 ${
                    active
                      ? 'bg-[#251B3B] text-[#8B5CF6] border border-[#45455B] font-semibold'
                      : 'bg-[#13131D] text-[#B5B5C8] hover:bg-[#272738] hover:text-[#F4F4FA] border border-[#303041]'
                  }`}
                >
                  {c.icon && (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: c.bg }}
                    >
                      <img src={c.icon} alt="" className="w-4 h-4" />
                    </span>
                  )}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar + Filters */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-2 mb-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9292A8]" />
              <input
                type="text"
                placeholder="Search problems by name, topic, or category..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#13131D] border border-[#303041] rounded-lg pl-10 pr-8 py-2 text-sm text-[#F4F4FA] placeholder-[#9292A8] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-[#13131D] rounded-lg border border-[#303041] text-xs text-[#F4F4FA] focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Solved">Status: Solved</option>
                <option value="Unsolved">Status: Unsolved</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-[#13131D] rounded-lg border border-[#303041] text-xs text-[#F4F4FA] focus:outline-none cursor-pointer"
              >
                <option value="All">Difficulty: All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Problems Table */}
          <div className="bg-[#191925] border border-[#303041] rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1.5rem_1fr_1.5rem] md:grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_5rem] gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3.5 sm:py-3 bg-[#13131D] border-b border-[#303041] text-xs font-semibold text-[#9292A8]">
              <div className="text-center">#</div>
              <div className="min-w-0">Problem</div>
              <div className="hidden md:block min-w-0">Topics</div>
              <div className="text-center md:text-left">Diff</div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[#9292A8] text-sm">
                <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading problems...
              </div>
            ) : displayedProblems.length === 0 ? (
              <div className="p-12 text-center text-[#9292A8] text-sm">
                No problems matched your current filters.
              </div>
            ) : (
              <div className="divide-y divide-[#303041]">
                {displayedProblems.map((p) => {
                  const isSolved = solvedSet.has(p.slug);
                  return (
                    <div
                      key={p.slug}
                      className="relative grid grid-cols-[1.5rem_1fr_1.5rem] md:grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_5rem] gap-2.5 sm:gap-3 px-3.5 sm:px-4 h-[60px] sm:h-14 items-center hover:bg-[#272738] transition-colors group"
                    >
                      {/* Left accent bar on hover */}
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Status Icon */}
                      <div className="flex justify-center">
                        {isSolved ? (
                          <Check className="w-4 h-4 text-[#4ADE80] shrink-0" />
                        ) : (
                          <span className="text-sm text-[#9292A8]/60">-</span>
                        )}
                      </div>

                      {/* Problem Number + Title */}
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-[#9292A8] text-sm font-mono shrink-0">{p.sortOrder}.</span>
                        <Link
                          to={`/problems/${p.slug}`}
                          className="min-w-0 flex-1 text-[#F4F4FA] text-sm hover:text-[#8B5CF6] transition-colors truncate font-medium py-1"
                          title={p.title}
                        >
                          {p.title}
                        </Link>
                      </div>

                      {/* Topics */}
                      <div className="hidden md:block min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                          {p.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="max-w-full truncate rounded-full bg-[#13131D] border border-[#303041] px-2.5 py-0.5 text-[11px] text-[#B5B5C8]"
                            >
                              {tag}
                            </span>
                          ))}
                          {p.tags.length > 2 && (
                            <span className="text-[10px] text-[#9292A8]">
                              +{p.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Difficulty: Dot on mobile, full badge on md+ */}
                      <div className="flex justify-center md:justify-start">
                        <span
                          className={`md:hidden w-2.5 h-2.5 rounded-full shrink-0 ${
                            p.difficulty === 'Easy'
                              ? 'bg-[#4ADE80]'
                              : p.difficulty === 'Medium'
                              ? 'bg-[#FBBF24]'
                              : 'bg-[#F87171]'
                          }`}
                          title={p.difficulty}
                        />
                        <div className="hidden md:block">
                          {getDifficultyBadge(p.difficulty)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#303041] bg-[#191925] hover:bg-[#272738] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-[#9292A8]" />
            </button>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-8 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold'
                      : 'bg-[#191925] text-[#B5B5C8] border border-[#303041] hover:bg-[#272738]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#303041] bg-[#191925] hover:bg-[#272738] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-[#9292A8]" />
            </button>
          </div>

        </section>
      </div>
    </div>
  );
};
