import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles, X, Coffee, Brain, Droplets, Eye, Wind, Award } from 'lucide-react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXP: (points: number) => void;
  selectedGrade: string;
}

type TimerPhase = 'work' | 'shortBreak' | 'longBreak';
type SoundType = 'rain' | 'white-noise' | 'drone' | 'silent';

const BREAK_TIPS = [
  { icon: Droplets, title: 'ترطيب الجسم', tip: 'اشرب كوب ماء بارد الآن، فالدماغ يتكون من 75% ماء والترطيب يجدد تركيزك فوراً.' },
  { icon: Eye, title: 'قاعدة 20-20-20', tip: 'انظر إلى شيء يبعد عنك 6 أمتار لمدة 20 ثانية لإراحة عضلات العين وتجنب الصداع.' },
  { icon: Wind, title: 'تمرين تنفس الصندوق', tip: 'خذ شهيقاً عميقاً في 4 ثوانٍ، احبس نفسك 4 ثوانٍ، ثم ازفر بهدوء في 4 ثوانٍ.' },
  { icon: Coffee, title: 'حركة خفيفة', tip: 'قف وافرد عضلات ظهرك ورقبتك وقم بجولة مشي دقيقتين داخل الغرفة.' },
];

export const FocusMode: React.FC<FocusModeProps> = ({
  isOpen,
  onClose,
  onAddXP,
  selectedGrade,
}) => {
  const [phase, setPhase] = useState<TimerPhase>('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundType, setSoundType] = useState<SoundType>('rain');
  const [volume, setVolume] = useState(0.5);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Web Audio Context & Node Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: any; gain?: GainNode; filter?: BiquadFilterNode } | null>(null);

  const getInitialSeconds = (p: TimerPhase) => {
    switch (p) {
      case 'work':
        return 25 * 60;
      case 'shortBreak':
        return 5 * 60;
      case 'longBreak':
        return 15 * 60;
    }
  };

  const totalSeconds = getInitialSeconds(phase);
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Countdown Interval
  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      handlePhaseComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  // Handle phase completion
  const handlePhaseComplete = () => {
    playChime();
    setIsRunning(false);

    if (phase === 'work') {
      const newSessions = completedSessions + 1;
      setCompletedSessions(newSessions);
      onAddXP(50);
      setCelebrationMsg('🎉 أحسنت صنعاً! أتممت جلسة بومودورو بنجاح (+50 XP)');
      setTimeout(() => setCelebrationMsg(null), 6000);

      // Determine next break
      if (newSessions % 4 === 0) {
        setPhase('longBreak');
        setSecondsLeft(15 * 60);
      } else {
        setPhase('shortBreak');
        setSecondsLeft(5 * 60);
      }
    } else {
      setPhase('work');
      setSecondsLeft(25 * 60);
      setCelebrationMsg('💪 انتهت فترة الاستراحة، مستعد لجلسة التركيز التالية؟');
      setTimeout(() => setCelebrationMsg(null), 5000);
    }
  };

  // Play gentle completion chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {
      // Audio not permitted
    }
  };

  // Pure Web Audio Generator for Ambient Focus Sounds
  const stopAmbientSound = () => {
    if (soundNodesRef.current?.source) {
      try {
        soundNodesRef.current.source.stop();
        soundNodesRef.current.source.disconnect();
      } catch (e) {}
    }
    soundNodesRef.current = null;
  };

  const startAmbientSound = (type: SoundType) => {
    stopAmbientSound();
    if (type === 'silent') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === 'rain' || type === 'white-noise') {
        // Generate Pink / Rain noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (type === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(900, ctx.currentTime);
        } else {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, ctx.currentTime);
        }

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        soundNodesRef.current = { source: whiteNoise, gain: masterGain, filter };
      } else if (type === 'drone') {
        // Binaural Alpha Beats (136.1Hz & 144Hz -> 7.9Hz Alpha waves)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(136.1, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(144.0, ctx.currentTime);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.2, ctx.currentTime);

        osc1.connect(subGain);
        osc2.connect(subGain);
        subGain.connect(masterGain);

        osc1.start();
        osc2.start();

        soundNodesRef.current = {
          source: {
            stop: () => {
              osc1.stop();
              osc2.stop();
            },
            disconnect: () => {
              osc1.disconnect();
              osc2.disconnect();
            },
          },
          gain: masterGain,
        };
      }
    } catch (e) {
      console.warn('Ambient audio error:', e);
    }
  };

  // Manage ambient sound when type changes or play state changes
  useEffect(() => {
    if (isOpen && isRunning && soundType !== 'silent') {
      startAmbientSound(soundType);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [soundType, isRunning, isOpen]);

  // Handle volume update
  useEffect(() => {
    if (soundNodesRef.current?.gain && audioCtxRef.current) {
      soundNodesRef.current.gain.gain.setValueAtTime(volume * 0.4, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fade-in">
      {/* Top Bar: DND Banner & Controls */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg text-white">وضع التركيز العميق (FocusMode)</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                حجب التنبيهات 🔕
              </span>
            </div>
            <span className="text-xs text-slate-400 font-bold block">{selectedGrade} · منصة عائلة حنيش</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            stopAmbientSound();
            onClose();
          }}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          title="إنهاء وضع التركيز والخروج"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Focus Area: Circular Timer */}
      <div className="max-w-md mx-auto w-full text-center space-y-6 my-auto">
        {/* Phase Badges */}
        <div className="flex items-center justify-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl max-w-xs mx-auto text-xs font-bold">
          <button
            onClick={() => {
              setPhase('work');
              setSecondsLeft(25 * 60);
              setIsRunning(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              phase === 'work' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            جلسة تركيز (25 د)
          </button>
          <button
            onClick={() => {
              setPhase('shortBreak');
              setSecondsLeft(5 * 60);
              setIsRunning(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              phase === 'shortBreak' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            استراحة قصيرة (5 د)
          </button>
          <button
            onClick={() => {
              setPhase('longBreak');
              setSecondsLeft(15 * 60);
              setIsRunning(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              phase === 'longBreak' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            استراحة طويلة (15 د)
          </button>
        </div>

        {/* Celebration Banner */}
        {celebrationMsg && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-lg animate-bounce">
            {celebrationMsg}
          </div>
        )}

        {/* SVG Circular Timer */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={phase === 'work' ? '#10b981' : phase === 'shortBreak' ? '#38bdf8' : '#a855f7'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Centered Numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="text-6xl sm:text-7xl font-mono font-black tracking-tighter text-white tabular-nums drop-shadow-md">
              {timeFormatted}
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              {phase === 'work' ? '🎯 تركيز بدون مشتتات' : '☕ استراحة وتجديد طاقة'}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setSecondsLeft(getInitialSeconds(phase));
              setIsRunning(false);
            }}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="إعادة تعيين المؤقت"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-4 rounded-2xl font-black text-base shadow-xl hover:scale-105 transition-all flex items-center gap-2.5 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 text-slate-950 shadow-amber-900/30'
                : 'bg-emerald-500 text-slate-950 shadow-emerald-900/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>ابدأ المذاكرة</span>
              </>
            )}
          </button>

          <button
            onClick={handlePhaseComplete}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="تخطي للمرحلة التالية"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions Completed Stat */}
        <div className="text-xs text-slate-400 font-bold flex items-center justify-center gap-3">
          <span>جلسات اليوم المكتملة: <b className="text-emerald-400 tabular-nums">{completedSessions}</b></span>
          <span>·</span>
          <span>إجمالي دقائق التركيز: <b className="text-emerald-400 tabular-nums">{completedSessions * 25} د</b></span>
        </div>
      </div>

      {/* Bottom Deck: Ambient Audio Controls & Break Activity Suggestions */}
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-4 items-center pt-4 border-t border-slate-900">
        {/* Ambient Sound Selector */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundType(soundType === 'silent' ? 'rain' : 'silent')}
              className="text-slate-400 hover:text-white"
            >
              {soundType !== 'silent' && isRunning ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <span className="font-bold text-slate-300">أصوات التركيز:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'rain', label: '🌧️ مطر هادئ' },
              { id: 'white-noise', label: '📻 ضوضاء بيضاء' },
              { id: 'drone', label: '🧘 نغمات ألفا' },
              { id: 'silent', label: '🔇 صامت' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSoundType(s.id as SoundType)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  soundType === s.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {soundType !== 'silent' && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 accent-emerald-500 cursor-pointer"
              title="مستوى الصوت"
            />
          )}
        </div>

        {/* Break Activity Tip Carousel */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-blue-300 block text-[11px]">
              مقترح للاستراحة: {BREAK_TIPS[completedSessions % BREAK_TIPS.length].title}
            </span>
            <p className="text-slate-400 text-[11px] truncate">
              {BREAK_TIPS[completedSessions % BREAK_TIPS.length].tip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
