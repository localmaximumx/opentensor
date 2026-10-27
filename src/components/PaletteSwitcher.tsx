import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { PALETTES, PaletteId, getSavedPalette, applyPalette } from '../services/paletteService';

export const PaletteSwitcher: React.FC = () => {
  const [currentPalette, setCurrentPalette] = useState<PaletteId>(getSavedPalette());
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaletteChange = (e: any) => {
      setCurrentPalette(e.detail || getSavedPalette());
    };
    window.addEventListener('toniclite_palette_change', handlePaletteChange);
    window.addEventListener('opentensor_palette_change', handlePaletteChange);
    return () => {
      window.removeEventListener('toniclite_palette_change', handlePaletteChange);
      window.removeEventListener('opentensor_palette_change', handlePaletteChange);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: PaletteId) => {
    applyPalette(id);
    setCurrentPalette(id);
    setIsOpen(false);
  };

  const activePal = PALETTES.find(p => p.id === currentPalette) || PALETTES[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change color palette"
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
        title={`Current Palette: ${activePal.name} (Click to change)`}
      >
        <Palette className="w-4 h-4" />
        <span
          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-background shadow-xs"
          style={{ backgroundColor: activePal.primaryHex }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-border/60 mb-1 flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" style={{ color: activePal.primaryHex }} />
              Color Palette
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Select style</span>
          </div>

          <div className="space-y-1">
            {PALETTES.map((pal) => {
              const isSelected = pal.id === currentPalette;
              return (
                <button
                  key={pal.id}
                  onClick={() => handleSelect(pal.id)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-secondary border border-border/80 font-bold text-foreground shadow-xs'
                      : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Color swatch circle */}
                    <div
                      className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-white/20"
                      style={{ backgroundColor: pal.primaryHex }}
                    />
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{pal.name}</span>
                        {pal.isNew && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            New
                          </span>
                        )}
                        {pal.isOriginal && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Original
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {pal.tagline}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0 text-foreground" style={{ color: pal.primaryHex }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
