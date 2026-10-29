import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CloudRain, 
  Coffee, 
  Music, 
  Waves, 
  Keyboard, 
  BellRing,
  Sparkles,
  Timer
} from 'lucide-react';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface FocusRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TrackId = 'lofi' | 'rain' | 'coffee' | 'binaural' | 'keyboard';

interface TrackOption {
  id: TrackId;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

const TRACKS: TrackOption[] = [
  {
    id: 'lofi',
    name: 'Lo-Fi Chill Synth',
    desc: 'Procedural neo-soul jazz chords & soothing ambient warmth',
    icon: <Music className="w-5 h-5 text-purple-400" />
  },
  {
    id: 'rain',
    name: 'Gentle Rain & Thunder',
    desc: 'Deep pink-noise rainfall with low-frequency rumble',
    icon: <CloudRain className="w-5 h-5 text-sky-400" />
  },
  {
    id: 'coffee',
    name: 'Coffeehouse Hum',
    desc: 'Warm cafe acoustics & soft atmospheric murmur',
    icon: <Coffee className="w-5 h-5 text-amber-400" />
  },
  {
    id: 'binaural',
    name: '432Hz Theta Waves',
    desc: 'Pure binaural sine frequencies for deep ML problem solving',
    icon: <Waves className="w-5 h-5 text-emerald-400" />
  },
  {
    id: 'keyboard',
    name: 'Mechanical ASMR',
    desc: 'Rhythmic, tactile keyboard clicks to keep typing rhythm',
    icon: <Keyboard className="w-5 h-5 text-indigo-400" />
  }
];

export const FocusRadioModal: React.FC<FocusRadioModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(soundscapeEngine.getIsPlaying());
  const [currentTrack, setCurrentTrack] = useState<string | null>(soundscapeEngine.getCurrentTrack());
  const [volume, setVolume] = useState<number>(soundscapeEngine.getVolume());

  // Pomodoro timer state
  const [timerMinutes, setTimerMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'deep'>('work');

  useEffect(() => {
    const handleState = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setIsPlaying(detail.isPlaying);
        setCurrentTrack(detail.currentTrack);
        setVolume(detail.volume);
      }
    };
    window.addEventListener('toniclite_soundscape_change', handleState);
    return () => window.removeEventListener('toniclite_soundscape_change', handleState);
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            soundscapeEngine.playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const selectMode = (mode: 'work' | 'break' | 'deep') => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    const mins = mode === 'work' ? 25 : mode === 'break' ? 5 : 50;
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const toggleTimer = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(timerMinutes * 60);
    }
    setIsTimerRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(timerMinutes * 60);
  };

  const toggleTrack = (trackId: TrackId) => {
    soundscapeEngine.playTrack(trackId);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscapeEngine.setVolume(newVol);
  };

  if (!isOpen) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSeconds = timerMinutes * 60;
  const progressPct = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Lo-Fi Focus Radio & Timer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                  Synthesized WebAudio
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Keep the tab open & stay locked in flow state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Pomodoro Timer Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-secondary/20 border border-border/70 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Mode Selector */}
            <div className="flex items-center gap-2 mb-4 bg-background/80 p-1 rounded-xl border border-border/60 text-xs">
              <button
                onClick={() => selectMode('work')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timerMode === 'work' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🍅 25m Focus
              </button>
              <button
                onClick={() => selectMode('break')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timerMode === 'break' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ☕ 5m Rest
              </button>
              <button
                onClick={() => selectMode('deep')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  timerMode === 'deep' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ⚡ 50m Deep Work
              </button>
            </div>

            {/* Countdown Display */}
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-foreground my-2">
              {formattedTime}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden my-3">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Timer Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm shadow-md transition-transform active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-primary hover:opacity-90 text-primary-foreground'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Start Timer
                  </>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 rounded-xl bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => soundscapeEngine.playCompletionChime()}
                className="p-2 rounded-xl bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Test completion chime"
              >
                <BellRing className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Soundscapes Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Ambient Soundscapes
              </h4>
              {isPlaying && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Playing Audio
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TRACKS.map(track => {
                const active = currentTrack === track.id && isPlaying;
                return (
                  <button
                    key={track.id}
                    onClick={() => toggleTrack(track.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40'
                        : 'bg-secondary/15 hover:bg-secondary/30 border-border/60 hover:border-border'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/50 shrink-0 mt-0.5">
                      {track.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold truncate ${active ? 'text-primary' : 'text-foreground'}`}>
                          {track.name}
                        </span>
                        {active && (
                          <div className="flex items-center gap-0.5 h-3">
                            <span className="w-1 bg-primary h-2 animate-bounce rounded-full" />
                            <span className="w-1 bg-primary h-3.5 animate-bounce [animation-delay:0.15s] rounded-full" />
                            <span className="w-1 bg-primary h-2 animate-bounce [animation-delay:0.3s] rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                        {track.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Control */}
          <div className="p-3.5 rounded-xl bg-secondary/15 border border-border/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="text-xs font-medium">Volume ({Math.round(volume * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              className="w-40 sm:w-56 accent-primary cursor-pointer"
            />
            {isPlaying && (
              <button
                onClick={() => soundscapeEngine.stop()}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20"
              >
                Stop Sound
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>🎧 Procedural audio keeps playing while you solve problems</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Keep Playing & Close
          </button>
        </div>
      </div>
    </div>
  );
};
