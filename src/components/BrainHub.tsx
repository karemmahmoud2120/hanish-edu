import React, { useState, useEffect } from 'react';
import { Flashcard, StudyTask, ExamResult } from '../data/curriculumData';
import {
  Layers,
  CheckCircle2,
  RotateCw,
  Trophy,
  Flame,
  Plus,
  Gamepad2,
  Timer,
  Sparkles,
  Check,
  X,
  Brain,
  TrendingUp,
  Bell,
  Clock,
  Calendar,
  AlertTriangle,
  Trash2,
  Play,
} from 'lucide-react';
import { FocusMode } from './FocusMode';
import { StudentProgressChart } from './StudentProgressChart';
import { ScheduledStudySession } from '../types/notifications';
import {
  getScheduledStudySessions,
  addScheduledStudySession,
  removeScheduledStudySession,
} from '../utils/notificationService';

interface BrainHubProps {
  userId: string;
  flashcards: Flashcard[];
  tasks: StudyTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, subject: string, xp: number, dueDate?: string) => void;
  onUpdateFlashcardBox: (cardId: string, newBox: number) => void;
  onAddFlashcard: (deck: string, front: string, back: string) => void;
  onAddXP: (points: number) => void;
  xpPoints: number;
  streakDays: number;
  badges: string[];
  selectedGrade?: string;
  examResults?: ExamResult[];
  studentName?: string;
  initialOpenFocusMode?: boolean;
  onTriggerNotification?: (title: string, body: string, type: 'study_session' | 'task_deadline') => void;
}

export const BrainHub: React.FC<BrainHubProps> = ({
  userId,
  flashcards,
  tasks,
  onToggleTask,
  onAddTask,
  onUpdateFlashcardBox,
  onAddFlashcard,
  onAddXP,
  xpPoints,
  streakDays,
  badges,
  selectedGrade,
  examResults = [],
  studentName,
  initialOpenFocusMode = false,
  onTriggerNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'tasks' | 'games' | 'analytics'>('flashcards');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(initialOpenFocusMode);

  // Auto-open focus mode if triggered via notification
  useEffect(() => {
    if (initialOpenFocusMode) {
      setIsFocusModeOpen(true);
    }
  }, [initialOpenFocusMode]);

  // Scheduled Study Sessions State
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledStudySession[]>(() => getScheduledStudySessions(userId));
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionSubject, setSessionSubject] = useState('العلوم والمناهج');
  const [sessionMinutesFromNow, setSessionMinutesFromNow] = useState(15);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(25);

  // Auto-refresh countdown for sessions
  useEffect(() => {
    const interval = setInterval(() => {
      setScheduledSessions(getScheduledStudySessions(userId));
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleQuickScheduleSession = (minutesFromNow: number, title?: string, subject?: string) => {
    const targetTime = Date.now() + minutesFromNow * 60 * 1000;
    const sess = addScheduledStudySession(
      userId,
      title || `جلسة مذاكرة (${minutesFromNow} دقيقة)`,
      targetTime,
      25,
      subject || selectedGrade || 'عامة'
    );
    setScheduledSessions(getScheduledStudySessions(userId));
    if (onTriggerNotification) {
      onTriggerNotification(
        '⏰ تم جدولة جلسة المذاكرة بنجاح!',
        `سيتم تذكيرك بعد ${minutesFromNow} دقيقة لبدء جلسة ${sess.title}.`,
        'study_session'
      );
    }
  };

  const handleCancelSession = (id: string) => {
    removeScheduledStudySession(userId, id);
    setScheduledSessions(getScheduledStudySessions(userId));
  };

  // Flashcards state
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardDeck, setNewCardDeck] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  // Tasks state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('عامة');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Mini-Games state
  const [activeGame, setActiveGame] = useState<'math' | 'color' | 'ttt' | 'sudoku'>('math');

  // Math Sprint Game
  const [mathA, setMathA] = useState(5);
  const [mathB, setMathB] = useState(7);
  const [mathOp, setMathOp] = useState<'+' | '-' | '×'>('+');
  const [mathChoices, setMathChoices] = useState<number[]>([12, 10, 15, 35]);
  const [mathTimer, setMathTimer] = useState(0);
  const [mathScore, setMathScore] = useState(0);
  const [isMathPlaying, setIsMathPlaying] = useState(false);

  // Tic-Tac-Toe state
  const [tttBoard, setTttBoard] = useState<string[]>(Array(9).fill(''));
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  // Unique decks
  const decks = Array.from(new Set(flashcards.map((f) => f.deck)));
  const filteredCards = flashcards.filter((f) => selectedDeck === 'all' || f.deck === selectedDeck);
  const currentCard = filteredCards[cardIndex] || filteredCards[0];

  // Next card in flashcards
  const handleCardResult = (knows: boolean) => {
    if (!currentCard) return;
    const nextBox = knows ? Math.min(4, currentCard.box + 1) : 0;
    onUpdateFlashcardBox(currentCard.id, nextBox);
    setIsFlipped(false);
    if (knows) onAddXP(10);

    if (cardIndex + 1 < filteredCards.length) {
      setCardIndex((prev) => prev + 1);
    } else {
      setCardIndex(0);
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    onAddFlashcard(newCardDeck.trim() || 'مفاهيم عامة', newCardFront.trim(), newCardBack.trim());
    setNewCardFront('');
    setNewCardBack('');
    setShowAddCardModal(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), newTaskSubject, 25, newTaskDueDate);
    setNewTaskTitle('');
    setNewTaskDueDate(new Date().toISOString().split('T')[0]);
    setShowAddTaskModal(false);
  };

  // Math Sprint Logic
  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    const opList: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const op = opList[Math.floor(Math.random() * 3)];
    let ans = op === '+' ? a + b : op === '-' ? a + b - a : a * b; // keep positive
    const actualA = op === '-' ? a + b : a;

    setMathA(actualA);
    setMathB(b);
    setMathOp(op);

    const wrong1 = ans + (Math.random() > 0.5 ? 2 : -2);
    const wrong2 = ans + (Math.random() > 0.5 ? 4 : -3);
    const wrong3 = Math.max(1, ans + (Math.random() > 0.5 ? 6 : -5));
    const set = Array.from(new Set([ans, wrong1, wrong2, wrong3])).slice(0, 4);
    while (set.length < 4) set.push(ans + set.length + 1);
    setMathChoices(set.sort(() => Math.random() - 0.5));
  };

  const startMathGame = () => {
    setIsMathPlaying(true);
    setMathScore(0);
    setMathTimer(45);
    generateMathQuestion();
  };

  useEffect(() => {
    let interval: any = null;
    if (isMathPlaying && mathTimer > 0) {
      interval = setInterval(() => {
        setMathTimer((prev) => prev - 1);
      }, 1000);
    } else if (mathTimer === 0 && isMathPlaying) {
      setIsMathPlaying(false);
      onAddXP(mathScore * 5);
    }
    return () => clearInterval(interval);
  }, [isMathPlaying, mathTimer]);

  const answerMath = (choice: number) => {
    let expected = mathOp === '+' ? mathA + mathB : mathOp === '-' ? mathA - mathB : mathA * mathB;
    if (choice === expected) {
      setMathScore((prev) => prev + 1);
    }
    generateMathQuestion();
  };

  // Tic-Tac-Toe AI
  const handleTttClick = (index: number) => {
    if (tttBoard[index] || tttWinner) return;

    const newBoard = [...tttBoard];
    newBoard[index] = 'X';

    // Check human win
    const checkWinner = (b: string[]) => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (const [x, y, z] of lines) {
        if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
      }
      return b.every((c) => c) ? 'draw' : null;
    };

    let win = checkWinner(newBoard);
    if (win) {
      setTttBoard(newBoard);
      setTttWinner(win);
      if (win === 'X') onAddXP(20);
      return;
    }

    // AI move (Minimax / Random)
    const emptyIndices = newBoard.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (emptyIndices.length > 0) {
      const aiMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      newBoard[aiMove] = 'O';
      win = checkWinner(newBoard);
      if (win) setTttWinner(win);
    }

    setTttBoard(newBoard);
  };

  const resetTtt = () => {
    setTttBoard(Array(9).fill(''));
    setTttWinner(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Gamification Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 text-2xl shrink-0">
            ⭐
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">نقاط الخبرة (XP)</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{xpPoints}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 text-2xl shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">أيام الالتزام المتتالية</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{streakDays} أيام</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 text-2xl shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">الشارات المكتسبة</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{badges.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 text-2xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">البطاقات المتقنة</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {flashcards.filter((f) => f.box >= 3).length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation & FocusMode Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>بطاقات المراجعة التكرارية</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>خطة ومهام المذاكرة</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'games'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>ألعاب تنمية الذكاء</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>سجل الدرجات والتحسن</span>
          </button>
        </div>

        {/* Focus Mode Trigger Button */}
        <button
          onClick={() => setIsFocusModeOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md shadow-emerald-900/30 flex items-center gap-2 transition hover:scale-105 cursor-pointer shrink-0"
        >
          <Timer className="w-4 h-4 animate-pulse text-amber-300" />
          <span>وضع التركيز ومؤقت بومودورو 🎯</span>
        </button>
      </div>

      {/* 1. FLASHCARDS TAB */}
      {activeTab === 'flashcards' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Deck selector & management */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                مجموعات البطاقات
              </h3>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بطاقة</span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedDeck('all');
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`w-full p-3 rounded-2xl text-right text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  selectedDeck === 'all'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>جميع البطاقات</span>
                <span>{flashcards.length}</span>
              </button>

              {decks.map((dk) => {
                const count = flashcards.filter((f) => f.deck === dk).length;
                return (
                  <button
                    key={dk}
                    onClick={() => {
                      setSelectedDeck(dk);
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-right text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedDeck === dk
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{dk}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">نظام لايتنر للمراجعة المتباعدة:</p>
              <p>البطاقة التي تتذكرها بنجاح تنتقل للمستوى التالي، والبطاقة التي تخطئ فيها تعود للصندوق الأول لترسيخها.</p>
            </div>
          </div>

          {/* Flashcard Studio Arena */}
          <div className="lg:col-span-8 space-y-6">
            {currentCard ? (
              <div className="space-y-4">
                {/* Leitner Box Progress */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    البطاقة {cardIndex + 1} من {filteredCards.length} · {currentCard.deck}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>مستوى الإتقان:</span>
                    {[0, 1, 2, 3, 4].map((bx) => (
                      <span
                        key={bx}
                        className={`w-4 h-2 rounded-full ${
                          currentCard.box >= bx ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Flip Card Canvas */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[280px] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-8 border-2 border-amber-500/30 shadow-xl flex flex-col justify-between items-center text-center cursor-pointer hover:border-amber-500 transition-all group"
                >
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
                    {isFlipped ? 'الإجابة والتعريف' : 'السؤال / المصطلح'} (اضغط للقلب 🔄)
                  </span>

                  <div className="my-auto py-6 space-y-3">
                    <p className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 group-hover:text-amber-600 transition flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>انقر لقلب الوجه الآخر</span>
                  </span>
                </div>

                {/* Response Feedback Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCardResult(false)}
                    className="py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-extrabold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>لسه محتاج أراجعها 🔁</span>
                  </button>

                  <button
                    onClick={() => handleCardResult(true)}
                    className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>عرفتها ومتقنها (+10 XP) ✅</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                لا توجد بطاقات في هذه المجموعة حالياً.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Scheduled Study Sessions & Focus Reminders Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                      جلسات المذاكرة المجدولة وتنبيهات بومودورو
                    </h3>
                    <p className="text-xs text-slate-500">
                      جدول موعد جلسة التركيز وسيرسل لك النظام إشعار توست وتنبيه متصفح صوتي فور حلول الموعد.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickScheduleSession(10, 'جلسة تركيز خاطفة')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    +10 دقائق
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickScheduleSession(25, 'جلسة بومودورو (25 د)')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow cursor-pointer"
                  >
                    +25 دقيقة 🎯
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    موعد مخصص ⚙️
                  </button>
                </div>
              </div>

              {/* Active Scheduled Sessions */}
              {scheduledSessions.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    الجلسات القادمة المسجلة في جدولك:
                  </span>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {scheduledSessions.map((sess) => {
                      const minutesLeft = Math.max(0, Math.round((sess.targetTime - Date.now()) / 60000));
                      const isDueNow = Date.now() >= sess.targetTime;
                      return (
                        <div
                          key={sess.id}
                          className="p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {sess.title}
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                              {sess.subject} · {isDueNow ? '🚨 حان موعد البدء الآن!' : `متبقي ${minutesLeft} دقيقة`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsFocusModeOpen(true);
                                handleCancelSession(sess.id);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1"
                              title="ابدأ جلسة التركيز الآن"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>ابدأ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelSession(sess.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="إلغاء الجلسة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  لا توجد جلسات مذاكرة مجدولة حالياً. انقر على الأزرار السريعة بالأعلى لتحديد موعد مذاكرتك القادم 🎯
                </div>
              )}
            </div>

            {/* Task list Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                    جدول مهام المذاكرة ومواعيد التسليم
                  </h3>
                  <p className="text-xs text-slate-500">
                    يتم تذكيرك تلقائياً عند حلول موعد التسليم لحفظ أيام الالتزام والتفوق.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>مهمة جديدة</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {tasks.map((task) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];

                  const isDueToday = task.dueDate === todayStr;
                  const isOverdue = !task.done && task.dueDate < todayStr;
                  const isDueTomorrow = task.dueDate === tomorrowStr;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task.id)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                        task.done
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : isOverdue
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-sm'
                          : isDueToday
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-sm'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            task.done
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {task.done && <Check className="w-4 h-4" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-bold text-sm block ${
                                task.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </span>

                            {!task.done && isDueToday && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>موعد التسليم اليوم ⏳</span>
                              </span>
                            )}

                            {!task.done && isOverdue && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>تجاوزت الموعد ⚠️</span>
                              </span>
                            )}

                            {!task.done && isDueTomorrow && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                <span>الموعد غداً 📅</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 block">
                            {task.subject} · موعد الاستحقاق: {task.dueDate}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        +{task.xpPoints} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Badges & Live Notification System Widget */}
          <div className="lg:col-span-4 space-y-6">
            {/* Notification system widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Bell className="w-4 h-4" />
                <span>نظام التنبيهات المحلي 🔔</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                يقوم النظام بإرسال إشعارات توست عائمة وأصوات تذكير عند اقتراب مواعيد تسليم المهام وبدء جلسات بومودورو المجدولة.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onTriggerNotification) {
                    onTriggerNotification(
                      '🔔 تنبيه فوري: اقتراب موعد تسليم مهمة',
                      'تذكير: لديك مهمة دراسية في BrainHub مستحقة الإنجاز اليوم!',
                      'task_deadline'
                    );
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>اختبار إرسال تنبيه تجريبي الآن</span>
              </button>
            </div>

            {/* Badges showcase sidebar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>شارات التفوق المحققة</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-center space-y-1"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {badge}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">مكتملة ✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GAMES TAB */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          {/* Game Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveGame('math')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeGame === 'math' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              ⚡ سباق الحساب السريع (45 ث)
            </button>
            <button
              onClick={() => setActiveGame('ttt')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeGame === 'ttt' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              ❌ إكس أو ضد الذكاء (X & O)
            </button>
          </div>

          {/* Math Sprint Game View */}
          {activeGame === 'math' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1 text-rose-500">
                  <Timer className="w-4 h-4" />
                  <span>الوقت المتبقي: {mathTimer} ثانية</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-base">
                  النقاط: {mathScore}
                </span>
              </div>

              {!isMathPlaying ? (
                <div className="py-8 space-y-4">
                  <span className="text-5xl block">⚡</span>
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                    تحدي الحساب الذهني الخاطف
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    45 ثانية لاختبار سرعة بديهتك الرياضية وحل أكبر قدر من العمليات الذهنية لكسب نقاط XP.
                  </p>
                  <button
                    onClick={startMathGame}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-lg hover:opacity-95 transition cursor-pointer"
                  >
                    ابدأ السباق الآن 🚀
                  </button>
                </div>
              ) : (
                <div className="py-4 space-y-6">
                  <div className="text-5xl font-black text-slate-900 dark:text-white tracking-widest tabular-nums">
                    {mathA} {mathOp} {mathB} = ؟
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {mathChoices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => answerMath(choice)}
                        className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-900 dark:text-white font-black text-xl transition-all shadow-sm cursor-pointer"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tic-Tac-Toe Game View */}
          {activeGame === 'ttt' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm mx-auto text-center space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">أنت (X) ضد الذكاء (O)</span>
                <button
                  onClick={resetTtt}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  جولة جديدة 🔄
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {tttBoard.map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTttClick(idx)}
                    className={`h-20 rounded-2xl text-3xl font-black transition-all flex items-center justify-center cursor-pointer ${
                      val === 'X'
                        ? 'bg-blue-600 text-white shadow-md'
                        : val === 'O'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {tttWinner && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                  {tttWinner === 'X' ? '🎉 فزت على الذكاء الاصطناعي (+20 XP)!' : tttWinner === 'O' ? '🤖 فاز الكمبيوتر، حاول مرة أخرى!' : '🤝 تعادل ممتاز!'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. ANALYTICS & STUDENT PROGRESS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <StudentProgressChart
            examResults={examResults}
            studentName={studentName}
          />
        </div>
      )}

      {/* Add Flashcard Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
              إضافة بطاقة مراجعة جديدة
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">اسم المجموعة (Deck):</label>
                <input
                  type="text"
                  required
                  value={newCardDeck}
                  onChange={(e) => setNewCardDeck(e.target.value)}
                  placeholder="مثال: فيزياء - قوانين نيوتن"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">السؤال / المصطلح (الوجه الأول):</label>
                <textarea
                  required
                  rows={2}
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="اكتب السؤال أو المصطلح..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الإجابة والتعريف (الوجه الثاني):</label>
                <textarea
                  required
                  rows={2}
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="اكتب الإجابة المفصلة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs"
                >
                  حفظ البطاقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
              إضافة مهمة مذاكرة جديدة
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">عنوان المهمة:</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: حل 20 سؤال نحو من المذكرة"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">المادة الدراسية:</label>
                <input
                  type="text"
                  required
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="مثال: اللغة العربية أو الرياضيات"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    موعد تسليم المهمة:
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewTaskDueDate(new Date().toISOString().split('T')[0])}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      اليوم
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        const tom = new Date();
                        tom.setDate(tom.getDate() + 1);
                        setNewTaskDueDate(tom.toISOString().split('T')[0]);
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      غداً
                    </button>
                  </div>
                </div>

                <input
                  type="date"
                  required
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500 cursor-pointer"
                >
                  إضافة المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Custom Study Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  جدولة جلسة مذاكرة وتنبيه مخصص
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  المادة / موضوع الجلسة:
                </label>
                <input
                  type="text"
                  value={sessionSubject}
                  onChange={(e) => setSessionSubject(e.target.value)}
                  placeholder="مثال: أحياء - مراجعة الخلية والتنفس"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  تذكيري بالبدء بعد (بالدقائق):
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 20, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSessionMinutesFromNow(mins)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        sessionMinutesFromNow === mins
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mins} د
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={sessionMinutesFromNow}
                  onChange={(e) => setSessionMinutesFromNow(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  مدة جلسة التركيز (مؤقت بومودورو):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSessionDurationMinutes(d)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        sessionDurationMinutes === d
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {d} دقيقة
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickScheduleSession(
                      sessionMinutesFromNow,
                      `جلسة تركيز ${sessionSubject}`,
                      sessionSubject
                    );
                    setShowScheduleModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  تأكيد وضبط التذكير ⏰
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen FocusMode Component */}
      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        onAddXP={onAddXP}
        selectedGrade={selectedGrade || 'المرحلة الدراسية'}
      />
    </div>
  );
};
