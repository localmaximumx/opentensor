import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getResearchPapers, getProjects } from '../services/dataService';
import { ResearchPaper, Project } from '../types';

type ExploreTab = 'papers' | 'projects' | 'systems';

// Exact paper name mapping from TensorTonic production chunk
const paperNameMap: Record<string, string> = {
  transformer: 'Transformers',
  kimik3: 'Kimi K3',
  llama: 'LLaMA',
  resnet: 'ResNet',
  gpt2: 'GPT-2',
  gemma3: 'Gemma 3',
  bert: 'BERT',
  vit: 'Vision Transformer',
  deepseekv3: 'DeepSeek-V3',
  'arcee-trinity': 'Arcee Trinity',
  ddpm: 'DDPM',
  vae: 'VAE',
  gan: 'GAN',
  unet: 'U-Net',
  alexnet: 'AlexNet',
  vgg: 'VGG',
  rnn: 'RNN',
  lstm: 'LSTM',
  gru: 'GRU',
  gptoss: 'gpt-oss',
  glm45: 'GLM-4.5',
  word2vec: 'Word2Vec',
  densenet: 'DenseNet'
};

// Exact paper SVG icon component matching TensorTonic production chunk
const PaperIcon: React.FC<{ paperId: string }> = ({ paperId }) => {
  const hoverClass = 'group-hover:stroke-[#8B5CF6] transition-colors duration-300';

  const renderContent = () => {
    switch (paperId) {
      case 'transformer':
        return (
          <>
            <circle cx="10" cy="12" r="2" />
            <circle cx="10" cy="20" r="2" />
            <circle cx="10" cy="28" r="2" />
            <circle cx="30" cy="12" r="2" />
            <circle cx="30" cy="20" r="2" />
            <circle cx="30" cy="28" r="2" />
            <path d="M12 12h16M12 20h16M12 28h16" />
            <path className={hoverClass} d="M12 12l16 16M12 28l16-16" />
          </>
        );
      case 'llama':
        return (
          <>
            <circle cx="20" cy="20" r="3" />
            <path d="M20 10a10 10 0 0 1 0 20M20 13a7 7 0 0 0 0 14" />
            <path className={hoverClass} d="M20 10a10 10 0 0 0 0 20" />
          </>
        );
      case 'resnet':
        return (
          <>
            <rect x="13" y="16" width="6" height="8" rx="1" />
            <rect x="22" y="16" width="6" height="8" rx="1" />
            <path d="M10 20h3M19 20h3M28 20h2" />
            <path className={hoverClass} d="M10 20v-7h20v7" />
          </>
        );
      case 'gpt2':
        return (
          <>
            <rect x="11" y="11" width="18" height="5" rx="1" />
            <rect x="11" y="18" width="18" height="5" rx="1" />
            <rect x="11" y="25" width="18" height="5" rx="1" />
            <path className={hoverClass} d="M14 13.5h12M14 20.5h12M14 27.5h12" />
          </>
        );
      case 'gemma3':
        return (
          <>
            <circle cx="20" cy="20" r="10" />
            <circle cx="20" cy="20" r="5" />
            <path d="M10 20h20M20 10v20" />
            <path className={hoverClass} d="M13 13l14 14M27 13L13 27" />
          </>
        );
      case 'bert':
        return (
          <>
            <rect x="9" y="16" width="6" height="8" rx="1" />
            <rect x="17" y="16" width="6" height="8" rx="1" />
            <rect x="25" y="16" width="6" height="8" rx="1" />
            <path d="M12 18v4M27 18v4" />
            <path className={hoverClass} d="M19 17l2 2-2 2M19 23l2-2" />
          </>
        );
      case 'vit':
        return (
          <>
            <rect x="11" y="11" width="18" height="18" rx="2" />
            <path d="M17 11v18M23 11v18M11 17h18M11 23h18" />
            <path className={hoverClass} d="M14 14h6v6h-6zM20 20h6v6h-6z" />
          </>
        );
      case 'deepseekv3':
        return (
          <>
            <circle cx="11" cy="20" r="2.5" />
            <circle cx="29" cy="12" r="2.5" />
            <circle cx="29" cy="20" r="2.5" />
            <circle cx="29" cy="28" r="2.5" />
            <path d="M13.5 20l13-8M13.5 20h13M13.5 20l13 8" />
            <path className={hoverClass} d="M15 20h11" />
          </>
        );
      case 'arcee-trinity':
        return (
          <>
            <circle cx="20" cy="12" r="3" />
            <circle cx="12" cy="26" r="3" />
            <circle cx="28" cy="26" r="3" />
            <path d="M20 15v6M14.5 24h11M17 14l-4 8M23 14l4 8" />
            <path className={hoverClass} d="M20 15l8 11" />
          </>
        );
      case 'ddpm':
        return (
          <>
            <circle cx="10" cy="20" r="3" />
            <circle cx="20" cy="20" r="3" />
            <circle cx="30" cy="20" r="3" />
            <path d="M13 20h4M23 20h4" />
            <path className={hoverClass} d="M10 12v-2M10 30v-2M30 12v-2M30 30v-2" />
          </>
        );
      case 'vae':
        return (
          <>
            <circle cx="10" cy="20" r="2.5" />
            <circle cx="20" cy="13" r="2.5" />
            <circle cx="20" cy="27" r="2.5" />
            <circle cx="30" cy="20" r="2.5" />
            <path d="M12.5 20l5-7M12.5 20l5 7M22.5 13l5 7M22.5 27l5-7" />
            <path className={hoverClass} d="M17.5 13h5M17.5 27h5" />
          </>
        );
      case 'gan':
        return (
          <>
            <rect x="10" y="16" width="8" height="8" rx="1" />
            <circle cx="29" cy="20" r="4" />
            <path d="M18 20h7" />
            <path className={hoverClass} d="M14 18l2 2-2 2M29 16v8" />
          </>
        );
      case 'unet':
        return (
          <>
            <path d="M10 11v13l10 6 10-6V11" />
            <path d="M13 13h5M13 18h5M22 18h5M22 23h5" />
            <path className={hoverClass} d="M10 11h8v6h4v-6h8" />
          </>
        );
      case 'alexnet':
        return (
          <>
            <rect x="10" y="12" width="5" height="16" rx="1" />
            <rect x="18" y="14" width="5" height="12" rx="1" />
            <rect x="26" y="16" width="4" height="8" rx="1" />
            <path className={hoverClass} d="M12.5 15v10M20.5 17v6M28 18v4" />
          </>
        );
      case 'vgg':
        return (
          <>
            <rect x="10" y="12" width="4" height="16" rx="1" />
            <rect x="16" y="12" width="4" height="16" rx="1" />
            <rect x="22" y="12" width="4" height="16" rx="1" />
            <rect x="28" y="12" width="3" height="16" rx="1" />
            <path className={hoverClass} d="M12 15h17M12 25h17" />
          </>
        );
      case 'rnn':
        return (
          <>
            <circle cx="15" cy="20" r="4" />
            <circle cx="27" cy="20" r="3" />
            <path d="M19 20h5M15 16c-8-4-8 12 0 8" />
            <path className={hoverClass} d="M27 17c6-3 6 9 0 6" />
          </>
        );
      case 'lstm':
        return (
          <>
            <rect x="11" y="13" width="18" height="14" rx="2" />
            <path d="M15 13v14M20 13v14M25 13v14" />
            <path className={hoverClass} d="M12 20h16M20 10v20" />
          </>
        );
      case 'gru':
        return (
          <>
            <circle cx="14" cy="20" r="5" />
            <circle cx="26" cy="20" r="5" />
            <path d="M19 20h2M14 15v10M26 15v10" />
            <path className={hoverClass} d="M10 20h20" />
          </>
        );
      case 'gptoss':
        return (
          <>
            <rect x="9" y="12" width="8" height="16" rx="1" />
            <circle cx="27" cy="14" r="2" />
            <circle cx="27" cy="20" r="2" />
            <circle cx="27" cy="26" r="2" />
            <path d="M17 16l8-2M17 20h8M17 24l8 2" />
            <path className={hoverClass} d="M11 15h4M11 20h4M11 25h4" />
          </>
        );
      case 'glm45':
        return (
          <>
            <circle cx="11" cy="20" r="2.5" />
            <rect x="18" y="12" width="11" height="5" rx="1" />
            <rect x="18" y="23" width="11" height="5" rx="1" />
            <path d="M13.5 20l4.5-5M13.5 20l4.5 5" />
            <path className={hoverClass} d="M20 14.5h7M20 25.5h7" />
          </>
        );
      case 'word2vec':
        return (
          <>
            <circle cx="20" cy="20" r="3" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="10" cy="28" r="2" />
            <circle cx="30" cy="12" r="2" />
            <circle cx="30" cy="28" r="2" />
            <path d="M12 12l6 6M12 28l6-6M28 12l-6 6M28 28l-6-6" />
            <path className={hoverClass} d="M17 20h6" />
          </>
        );
      case 'densenet':
        return (
          <>
            <rect x="10" y="12" width="4" height="16" rx="1" />
            <rect x="18" y="12" width="4" height="16" rx="1" />
            <rect x="26" y="12" width="4" height="16" rx="1" />
            <path d="M14 14l4 4M14 20l4 4M22 14l4 4M22 20l4 4" />
            <path className={hoverClass} d="M10 12l16 16" />
          </>
        );
      default:
        return (
          <>
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="28" cy="12" r="2.5" />
            <circle cx="20" cy="20" r="2.5" />
            <circle cx="12" cy="28" r="2.5" />
            <circle cx="28" cy="28" r="2.5" />
            <path d="M14.5 12h11M12 14.5l8 3M28 14.5l-8 3M20 22.5v3" />
            <path className={hoverClass} d="M12 28l8-5 8 5" />
          </>
        );
    }
  };

  return (
    <svg
      className="w-10 h-10 shrink-0 text-foreground/60 dark:text-muted-foreground/55 group-hover:text-foreground transition-colors duration-300"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {renderContent()}
    </svg>
  );
};

// Project Spot Art SVG component
const ProjectSpotArt: React.FC<{ slug: string }> = ({ slug }) => {
  const accentColor = '#8B5CF6';

  switch (slug) {
    case 'rag-agent':
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="12" y="14" width="22" height="36" rx="4" opacity="0.45" />
          <path d="M18 24h10M18 32h10M18 40h7" opacity="0.5" />
          <circle cx="44" cy="26" r="10" style={{ stroke: accentColor }} opacity="0.8" />
          <path d="M51 33l7 7" style={{ stroke: accentColor }} strokeWidth={2} opacity="0.85" />
          <circle cx="44" cy="26" r="3" style={{ fill: accentColor }} stroke="none" opacity="0.75" />
        </svg>
      );
    case 'react-agent':
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="32" cy="32" r="16" opacity="0.45" strokeDasharray="4 3" />
          <circle cx="32" cy="16" r="3" style={{ fill: accentColor }} stroke="none" opacity="0.85" />
          <circle cx="32" cy="32" r="5" style={{ stroke: accentColor }} opacity="0.7" />
          <path d="M32 21v6M32 37v6M21 32h6M37 32h6" opacity="0.4" />
        </svg>
      );
    case 'mcp-server':
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="14" y="18" width="16" height="28" rx="3" opacity="0.5" />
          <path d="M19 25h6M19 31h6M19 37h6" opacity="0.45" />
          <rect x="36" y="18" width="14" height="12" rx="3" style={{ stroke: accentColor }} opacity="0.75" />
          <rect x="36" y="34" width="14" height="12" rx="3" style={{ stroke: accentColor }} opacity="0.55" />
          <path d="M30 24h6M36 40h-6" style={{ stroke: accentColor }} opacity="0.8" strokeDasharray="2 2" />
        </svg>
      );
    case 'triton-matmul':
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="12" y="12" width="18" height="18" rx="2" style={{ stroke: accentColor }} opacity="0.7" />
          <rect x="34" y="12" width="18" height="18" rx="2" opacity="0.5" />
          <rect x="23" y="34" width="18" height="18" rx="2" style={{ stroke: accentColor }} opacity="0.85" />
          <path d="M22 21h12M32 30v4" opacity="0.6" strokeDasharray="2 2" />
        </svg>
      );
    case 'detector-back-half':
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="14" y="14" width="36" height="36" rx="4" opacity="0.4" />
          <rect x="20" y="22" width="24" height="20" rx="2" style={{ stroke: accentColor }} opacity="0.85" />
          <circle cx="20" cy="22" r="2.5" style={{ fill: accentColor }} stroke="none" />
          <circle cx="44" cy="42" r="2.5" style={{ fill: accentColor }} stroke="none" />
        </svg>
      );
    default:
      return (
        <svg className="w-10 h-10 shrink-0 text-foreground/70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="20" cy="24" r="5" opacity="0.5" />
          <circle cx="44" cy="24" r="5" opacity="0.5" />
          <circle cx="32" cy="44" r="5" style={{ stroke: accentColor }} opacity="0.85" />
          <path d="M24 26l6 14M40 26l-6 14M25 24h14" opacity="0.4" />
        </svg>
      );
  }
};

// Exact 21 systems from TensorTonic production chunk
const systemsList = [
  { name: 'Netflix Recommendation', logo: '/images/companies/netflix_new.jpg' },
  { name: 'Anthropic RAG System', logo: '/images/companies/anthropic.svg' },
  { name: 'Amazon Product Recommendation', logo: '/images/companies/icons8-amazon-48.png' },
  { name: 'Youtube Recommendation', logo: '/images/companies/youtube.png' },
  { name: 'OpenAI Distributed Training', logo: '/images/companies/icons8-chatgpt-50.png' },
  { name: 'Pinterest Visual Search', logo: '/images/companies/Pinterest.svg.png' },
  { name: 'Facebook News Feed', logo: '/images/companies/icons8-meta-48.png' },
  { name: 'Stripe Fraud Detection', logo: '/images/companies/stripe.webp' },
  { name: 'Spotify Music Recommendation', logo: '/images/companies/spotify_new.jpeg' },
  { name: 'Google Autocomplete', logo: '/images/companies/icons8-google-48.png' },
  { name: 'Meta Ad Click Prediction', logo: '/images/companies/icons8-meta-48.png' },
  { name: 'TikTok Content Moderation', logo: '/images/companies/tiktok.webp' },
  { name: 'LinkedIn People You May Know', logo: '/images/companies/linkedin.webp' },
  { name: 'Uber ETA Prediction', logo: '/images/companies/uber.png' },
  { name: 'Airbnb Smart Pricing', logo: '/images/companies/airbnb.png' },
  { name: 'Tesla Autopilot Perception', logo: '/images/companies/tesla.png' },
  { name: 'Gmail Spam Filter', logo: '/images/companies/gmail.svg' },
  { name: 'Apple Notification Ranking', logo: '/images/companies/apple.png' },
  { name: 'Instagram Visual Product Tagging', logo: '/images/companies/instagram_new.jpeg' },
  { name: 'X Trending Topics', logo: '/images/companies/twitter.png' },
  { name: 'ByteDance Cost-Optimize Pipeline', logo: '/images/companies/bytedance.png' }
];

export const ExplorePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExploreTab>('papers');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function loadData() {
      const [papersData, projectsData] = await Promise.all([
        getResearchPapers(),
        getProjects()
      ]);
      setPapers(papersData);
      setProjects(projectsData);
    }
    loadData();
  }, []);

  const getHeaderLink = () => {
    switch (activeTab) {
      case 'papers':
        return { to: '/research', text: 'See all papers' };
      case 'projects':
        return { to: '/projects', text: 'See all projects' };
      case 'systems':
        return { to: '/ml-design', text: 'See all systems' };
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'papers':
        return 'Implement landmark ML papers from scratch.';
      case 'projects':
        return 'Build real AI systems end to end.';
      case 'systems':
        return 'Design ML systems asked in interviews.';
    }
  };

  return (
    <div className="bg-card dark:bg-background/50 backdrop-blur-xl border border-border/70 dark:border-white/[0.06] rounded-xl p-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-foreground">Research Papers</h3>
        <Link
          to="/research"
          className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] hover:underline font-medium transition-colors"
        >
          See all papers →
        </Link>
      </div>

      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground mb-3">
        Implement landmark ML papers from scratch.
      </p>

      {/* Content for Papers */}
      <div className="space-y-1 h-[360px] overflow-y-auto pr-2 custom-scrollbar">
        {papers.map((p) => {
          const displayName = paperNameMap[p.id] || p.title;
          return (
            <Link
              key={p.id}
              to={`/research?paper=${p.id}`}
              className="group flex items-center gap-3 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-border/70 hover:bg-secondary/40 dark:hover:border-transparent dark:hover:bg-muted/20 transition-colors duration-200 ease-out"
            >
              <PaperIcon paperId={p.id} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground group-hover:text-[#8B5CF6] transition-colors truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {p.year} • {p.architectureType.toUpperCase()}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>

    </div>
  );
};
