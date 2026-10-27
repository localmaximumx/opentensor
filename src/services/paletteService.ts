export type PaletteId = 'original-emerald' | 'electric-violet' | 'light-blue' | 'cyber-indigo' | 'electric-cyan';

export interface PaletteOption {
  id: PaletteId;
  name: string;
  tagline: string;
  primaryHex: string;
  gradient: string;
  isOriginal?: boolean;
  isNew?: boolean;
}

export const PALETTES: PaletteOption[] = [
  {
    id: 'original-emerald',
    name: 'Original Emerald',
    tagline: 'Matcha Green, Pistachio & Mint (Original)',
    primaryHex: '#93C572',
    gradient: 'from-[#93C572] via-[#A4D287] to-[#10B981]',
    isOriginal: true
  },
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    tagline: 'Vibrant Violet, Deep Surfaces & Lime Accent',
    primaryHex: '#8B5CF6',
    gradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]',
    isNew: true
  },
  {
    id: 'light-blue',
    name: 'Light Sky Blue',
    tagline: 'Vibrant Sky Blue, Cyan & Clean Azure',
    primaryHex: '#0EA5E9',
    gradient: 'from-[#0EA5E9] via-[#38BDF8] to-[#0284C7]'
  },
  {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    tagline: 'Electric Indigo, Royal Violet & Cyan',
    primaryHex: '#6366F1',
    gradient: 'from-[#6366F1] via-[#8B5CF6] to-[#38BDF8]'
  },
  {
    id: 'electric-cyan',
    name: 'Electric Cyan',
    tagline: 'Deep Tech Neon Cyan & Teal',
    primaryHex: '#06B6D4',
    gradient: 'from-[#06B6D4] via-[#0EA5E9] to-[#38BDF8]'
  }
];

const STORAGE_KEY = 'toniclite_color_palette';
const LEGACY_STORAGE_KEY = 'opentensor_color_palette';

export function getSavedPalette(): PaletteId {
  try {
    const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as PaletteId | null;
    if (saved && PALETTES.some(p => p.id === saved)) {
      return saved;
    }
    // Default to restored Original Emerald palette
    return 'original-emerald';
  } catch (e) {
    return 'original-emerald';
  }
}

export function applyPalette(id: PaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute('data-palette', id);
    window.dispatchEvent(new CustomEvent('toniclite_palette_change', { detail: id }));
    window.dispatchEvent(new CustomEvent('opentensor_palette_change', { detail: id }));
  } catch (e) {
    console.error('Failed to apply palette', e);
  }
}

// Initial bootstrap executed on page load
export function initPalette(): void {
  const current = getSavedPalette();
  document.documentElement.setAttribute('data-palette', current);
}
