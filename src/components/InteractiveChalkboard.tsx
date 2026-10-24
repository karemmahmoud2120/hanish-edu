import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  RotateCcw,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  BookOpen,
  Atom,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface InteractiveChalkboardProps {
  selectedGrade: string;
  onAddXP: (points: number) => void;
  isNightFocus?: boolean;
}

interface LessonCard {
  title: string;
  text: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const CHALK_COLORS = [
  { name: 'أبيض طباشيري', color: '#f8fafc', iconColor: 'bg-slate-100' },
  { name: 'أصفر رياضي', color: '#fde047', iconColor: 'bg-yellow-300' },
  { name: 'سماوي فيزيائي', color: '#38bdf8', iconColor: 'bg-sky-400' },
  { name: 'أخضر أحيائي', color: '#4ade80', iconColor: 'bg-emerald-400' },
  { name: 'وردي كيميائي', color: '#f472b6', iconColor: 'bg-pink-400' },
];

const PRESET_TOPICS = [
  { topic: 'قوانين نيوتن للحركة والجاذبية', subject: 'الفيزياء', grade: 'إعدادي وثانوي' },
  { topic: 'تفاعلات الأكسدة والاختزال والمعادلات', subject: 'الكيمياء', grade: 'إعدادي وثانوي' },
  { topic: 'أنواع الخبر وكان وأخواتها', subject: 'اللغة العربية', grade: 'جميع المراحل' },
  { topic: 'الانقسام الميتوزي والميوزي وتكاثر الخلية', subject: 'الأحياء والعلوم', grade: 'إعدادي وثانوي' },
  { topic: 'نظرية فيثاغورس وحساب المثلثات', subject: 'الرياضيات', grade: 'المرحلة الإعدادية' },
];

export const InteractiveChalkboard: React.FC<InteractiveChalkboardProps> = ({
  selectedGrade,
  onAddXP,
  isNightFocus = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>('#f8fafc');
  const [brushSize, setBrushSize] = useState<number>(3.5);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);

  // Lesson Generation State
  const [topicInput, setTopicInput] = useState('قوانين نيوتن للحركة والجاذبية');
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<LessonCard[]>([]);
  const [summary, setSummary] = useState('');
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Setup initial canvas dimensions and chalkboard background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = 440;
      initCanvasBackground(canvas);
      saveState();
    }

    const handleResize = () => {
      if (canvas && parent) {
        const savedData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = parent.clientWidth;
        initCanvasBackground(canvas);
        if (savedData) {
          canvas.getContext('2d')?.putImageData(savedData, 0, 0);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initCanvasBackground = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rich dark slate chalkboard texture
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#152520');
    grad.addColorStop(0.5, '#101d19');
    grad.addColorStop(1, '#0b1613');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle chalk dust grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Grid lines for math & geometry
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory((prev) => [...prev.slice(-10), data]);
  };

  const handleUndo = () => {
    if (canvasHistory.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newHistory = [...canvasHistory];
    newHistory.pop(); // remove current
    const previous = newHistory[newHistory.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setCanvasHistory(newHistory);
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvasBackground(canvas);
    saveState();
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hanish-chalkboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Drawing event handlers with touch & mouse
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (isEraser) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Subtle chalk feathering effect
      ctx.shadowBlur = 1.5;
      ctx.shadowColor = currentColor;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  // Auto-draw teacher notes onto the canvas
  const writeNotesOnChalkboard = (card: LessonCard, cardNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initCanvasBackground(canvas);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    // Title banner
    ctx.font = 'bold 22px Cairo, Tajawal, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = 'rgba(253, 224, 71, 0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(`✎ الفكرة [${cardNum}]: ${card.title}`, canvas.width - 40, 50);

    // Decorative underline
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40, 65);
    ctx.lineTo(canvas.width - 340, 65);
    ctx.stroke();

    // Body text wrapping
    ctx.font = '16px Tajawal, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
    ctx.shadowBlur = 2;

    const words = card.text.split(' ');
    let line = '';
    let y = 110;
    const maxWidth = canvas.width - 80;
    const lineHeight = 30;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width - 40, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width - 40, y);

    // Key rule / highlight box
    y += 40;
    if (y < canvas.height - 100) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, y, canvas.width - 80, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 15px Cairo, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('💡 قاعدة مستر يونس الذهبية:', canvas.width - 60, y + 30);

      ctx.font = '14px Tajawal, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(card.question, canvas.width - 60, y + 58);
    }

    ctx.restore();
    saveState();
  };

  // Audio Narrator
  const stopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const narrateText = async (text: string) => {
    if (!audioEnabled) return;
    stopAudio();

    const clean = text
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim()
      .slice(0, 350);

    if (!clean) return;

    try {
      const res = await fetch('/api/gemini/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voiceName: 'Puck' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          activeAudioRef.current = audio;
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => {
            setIsSpeaking(false);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            activeAudioRef.current = null;
          };
          await audio.play();
          return;
        }
      }
      throw new Error('TTS fallback');
    } catch {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'ar-EG';
        utter.rate = 0.95;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  // Generate Lesson Cards and write onto the board
  const handleStartLesson = async (overrideTopic?: string) => {
    const topic = (overrideTopic || topicInput).trim();
    if (!topic) return;

    setIsLoading(true);
    stopAudio();

    try {
      const res = await fetch('/api/gemini/lesson-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          grade: selectedGrade,
          subject: 'المنهج الدراسي المعتمد',
        }),
      });

      const data = await res.json();
      if (!data || !data.cards || data.cards.length === 0) {
        throw new Error('تعذر إنشاء بطاقات الشرح');
      }

      setCards(data.cards);
      setSummary(data.summary || '');
      setActiveCardIdx(0);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setScore(0);

      onAddXP(25);

      // Write first card on chalkboard
      writeNotesOnChalkboard(data.cards[0], 1);

      if (audioEnabled) {
        narrateText(`${data.cards[0].title}. ${data.cards[0].text}`);
      }
    } catch (err: any) {
      console.warn('Blackboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (isAnswerRevealed || !cards[activeCardIdx]) return;
    setSelectedAnswer(optionIdx);
    setIsAnswerRevealed(true);

    const isCorrect = optionIdx === cards[activeCardIdx].answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      onAddXP(15);
      narrateText('ممتاز يا بطل! إجابة صحيحة ودقيقة.');
    } else {
      narrateText('انتبه يا بطل، راجع التوضيح الصحيح على السبورة.');
    }
  };

  const handleNextCard = () => {
    if (activeCardIdx + 1 < cards.length) {
      const next = activeCardIdx + 1;
      setActiveCardIdx(next);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      writeNotesOnChalkboard(cards[next], next + 1);
      narrateText(`${cards[next].title}. ${cards[next].text}`);
    }
  };

  // Initial load
  useEffect(() => {
    handleStartLesson();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Controls & Input Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-right">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                السبورة التفاعلية الذكية لـ مستر يونس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لوح رقمي تفاعلي للشرح والكتابة الحرة مع التوليد الآلي لقواعد المنهج المصري · {selectedGrade}
              </p>
            </div>
          </div>

          {/* Sound & Status indicators */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSpeaking) stopAudio();
                setAudioEnabled(!audioEnabled);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{audioEnabled ? 'الصوت مفعّل' : 'صامت'}</span>
            </button>

            {isSpeaking && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>المعلم يشرح الآن...</span>
              </span>
            )}
          </div>
        </div>

        {/* Input & Generator CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartLesson()}
            placeholder="اكتب عنوان أي درس تريده (مثال: قوانين نيوتن، الكيمياء العضوية، النحو والإعراب)..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            onClick={() => handleStartLesson()}
            disabled={isLoading || !topicInput.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>اكتب واشرح على السبورة</span>
          </button>
        </div>

        {/* Quick Curriculum Topic Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold shrink-0">شروحات منهجية فورية:</span>
          {PRESET_TOPICS.map((item) => (
            <button
              key={item.topic}
              onClick={() => {
                setTopicInput(item.topic);
                handleStartLesson(item.topic);
              }}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer"
            >
              {item.topic}
            </button>
          ))}
        </div>
      </div>

      {/* Chalkboard Workspace */}
      <div className="relative rounded-3xl overflow-hidden border-8 border-[#3a2e22] dark:border-[#221c15] shadow-2xl bg-[#101d19]">
        {/* Top Blackboard Wooden Header Toolbar */}
        <div className="bg-[#241c14] text-amber-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#16100a]">
          {/* Tool Selector: Chalk Colors & Eraser */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-200/80 font-bold ml-1">ألوان الطباشير:</span>
            {CHALK_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setCurrentColor(c.color);
                  setIsEraser(false);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                  !isEraser && currentColor === c.color
                    ? 'ring-2 ring-white scale-110 shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={c.name}
              >
                <span className={`w-5 h-5 rounded-full ${c.iconColor} block border border-black/20`} />
              </button>
            ))}

            <div className="h-5 w-px bg-amber-900/60 mx-1" />

            {/* Eraser Button */}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isEraser
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'bg-[#312519] hover:bg-[#3d2e1f] text-amber-200'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ممحاة الطباشير</span>
            </button>

            {/* Brush Size Picker */}
            <div className="flex items-center gap-1.5 bg-[#312519] px-2.5 py-1 rounded-xl text-xs">
              <span className="text-[11px] text-amber-300">السمك:</span>
              <button
                onClick={() => setBrushSize(2)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${brushSize === 2 ? 'bg-amber-500 text-slate-900' : 'text-amber-200'}`}
              >
                رفيع
              </button>
              <button
                onClick={() => setBrushSize(4)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${brushSize === 4 ? 'bg-amber-500 text-slate-900' : 'text-amber-200'}`}
              >
                متوسط
              </button>
              <button
                onClick={() => setBrushSize(8)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${brushSize === 8 ? 'bg-amber-500 text-slate-900' : 'text-amber-200'}`}
              >
                عريض
              </button>
            </div>
          </div>

          {/* Action Buttons: Undo, Clear, Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="p-1.5 rounded-lg bg-[#312519] hover:bg-[#3d2e1f] text-amber-200 transition cursor-pointer"
              title="تراجع عن آخر خط"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearCanvas}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-bold transition cursor-pointer"
            >
              مسح السبورة
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="px-3 py-1.5 rounded-xl bg-[#312519] hover:bg-[#3d2e1f] text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="حفظ رسمة وشرح السبورة"
            >
              <Download className="w-3.5 h-3.5" />
              <span>حفظ الصورة</span>
            </button>
          </div>
        </div>

        {/* Chalkboard Drawing Canvas */}
        <div className="relative w-full cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full block touch-none"
          />

          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="font-bold text-sm">مستر يونس يكتب ويجهز الشرح على السبورة...</p>
            </div>
          )}

          {/* Bottom Wood Chalk Tray with visual chalks */}
          <div className="bg-[#1f1710] border-t-4 border-[#120d09] px-6 py-2 flex items-center justify-between text-[11px] text-amber-300/70 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-8 h-2 rounded bg-slate-100 inline-block shadow"></span>
                <span>طباشير أبيض</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-8 h-2 rounded bg-yellow-300 inline-block shadow"></span>
                <span>أصفر</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-8 h-2 rounded bg-sky-400 inline-block shadow"></span>
                <span>سماوي</span>
              </span>
            </div>
            <span>✍️ يمكنك الرسم والكتابة الحرة على السبورة في أي وقت بالفأرة أو اللمس</span>
          </div>
        </div>
      </div>

      {/* Synchronized Pedagogical Lesson Checkpoint Cards */}
      {cards.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-right">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                بطاقات الشرح التفاعلية وأسئلة الفهم السريع
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                البطاقة {activeCardIdx + 1} من {cards.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                النقاط: {score}
              </span>
            </div>
          </div>

          {/* Current Card Content */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                فكرة الدرس {activeCardIdx + 1}:
              </span>
              <h5 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                {cards[activeCardIdx].title}
              </h5>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {cards[activeCardIdx].text}
              </p>
            </div>

            {/* Checkpoint Question */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سؤال تحقق الفهم السريع:</span>
                <span className="text-slate-900 dark:text-white font-normal">{cards[activeCardIdx].question}</span>
              </div>

              <div className="grid gap-2 pt-1">
                {cards[activeCardIdx].options.map((opt, idx) => {
                  const isCorrect = idx === cards[activeCardIdx].answer;
                  const isChosen = selectedAnswer === idx;

                  let style =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500';
                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      style = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                    } else if (isChosen && !isCorrect) {
                      style = 'bg-rose-600 text-white border-rose-600';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={isAnswerRevealed}
                      className={`w-full p-3 rounded-xl border text-right text-xs sm:text-sm transition flex items-center justify-between gap-3 cursor-pointer ${style}`}
                    >
                      <span>{opt}</span>
                      {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      {isAnswerRevealed && isChosen && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and next card button */}
              {isAnswerRevealed && (
                <div className="pt-3 border-t border-emerald-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold leading-relaxed">
                    تفسير المعلم: {cards[activeCardIdx].explanation}
                  </p>

                  {activeCardIdx + 1 < cards.length ? (
                    <button
                      onClick={handleNextCard}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>الانتقال للفكرة التالية وكتابتها على السبورة</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                      🎉 أحسنت! أنهيت مراجعة جميع بطاقات السبورة التفاعلية لهذا الدرس بنجاح.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
