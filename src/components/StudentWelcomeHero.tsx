import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  Circle,
  ArrowRight,
  Bot,
  Brain,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Trophy,
  Zap,
} from 'lucide-react';

interface StudentWelcomeHeroProps {
  studentName: string;
  gradeName: string;
  xpPoints: number;
  streakDays: number;
  onAddXP: (points: number) => void;
  onNavigateTab: (tab: string) => void;
  onOpenLessons?: () => void;
}

interface DailyMission {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  targetTab: string;
  icon: 'tutor' | 'curriculum' | 'brain';
}

export const StudentWelcomeHero: React.FC<StudentWelcomeHeroProps> = ({
  studentName,
  gradeName,
  xpPoints,
  streakDays,
  onAddXP,
  onNavigateTab,
  onOpenLessons,
}) => {
  // Calculate level based on XP: each level is 250 XP
  const currentLevel = Math.max(1, Math.floor(xpPoints / 250) + 1);
  const currentLevelBaseXP = (currentLevel - 1) * 250;
  const nextLevelXP = currentLevel * 250;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((xpPoints - currentLevelBaseXP) / 250) * 100))
  );

  // Level ranks titles
  const getLevelTitle = (lvl: number) => {
    if (lvl <= 1) return 'مستكشف مبتدئ 🧭';
    if (lvl === 2) return 'طالب مجتهد 🌟';
    if (lvl === 3) return 'باحث فضي 🔬';
    if (lvl === 4) return 'بطل العلوم الذهبي 🏆';
    if (lvl === 5) return 'عالم متميز ⚡';
    return 'أسطورة المتفوقين 👑';
  };

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح الخير والهمة العالية يا بطل ☀️';
    if (hour >= 12 && hour < 17) return 'نهارك سعيد ومليء بالإنجاز والنجاح 🌤️';
    return 'مساء التفوق والتركيز يا عبقري 🌙';
  };

  // Daily missions with local storage persistence
  const [missions, setMissions] = useState<DailyMission[]>(() => {
    const todayKey = `hanish_missions_${new Date().toISOString().slice(0, 10)}`;
    const saved = localStorage.getItem(todayKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'mission-1',
        title: 'استشارة مستر يونس الذكي',
        description: 'اسأل مستر يونس عن أي مفهوم غامض في درس اليوم واحصل على شرح مبسط بصوته العربي.',
        xp: 35,
        completed: false,
        targetTab: 'ai-tutor',
        icon: 'tutor',
      },
      {
        id: 'mission-2',
        title: 'إنجاز درس من المنهج',
        description: 'قم بمراجعة أحد الدروس المقررة في وحدات الفصل الدراسي الحالي.',
        xp: 50,
        completed: false,
        targetTab: 'curriculum',
        icon: 'curriculum',
      },
      {
        id: 'mission-3',
        title: 'تحدي بنك الذاكرة والاختبارات',
        description: 'حل اختباراً قصيراً أو تدرب على البطاقات التعليمية الذكية لترسيخ المعلومات.',
        xp: 40,
        completed: false,
        targetTab: 'brain-hub',
        icon: 'brain',
      },
    ];
  });

  const [celebratingMissionId, setCelebratingMissionId] = useState<string | null>(null);

  // Save missions to localStorage
  useEffect(() => {
    const todayKey = `hanish_missions_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, JSON.stringify(missions));
  }, [missions]);

  const handleCompleteMission = (mId: string, xpReward: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === mId && !m.completed) {
          onAddXP(xpReward);
          setCelebratingMissionId(mId);
          setTimeout(() => setCelebratingMissionId(null), 2500);
          return { ...m, completed: true };
        }
        return m;
      })
    );
  };

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-900/40 mb-8 transition-all">
      {/* Subtle decorative glowing background blur */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      {/* Top Bar: Personalized Greeting & Academic Status */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>لوحة القيادة التفاعلية للطالب</span>
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-300 font-medium">{gradeName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white flex items-center gap-2">
            <span>{getGreeting()}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-300">
              {studentName}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            استمر في التقدم اليومي لتحقيق المركز الأول في قائمة أوائل المدرسة وتجاوز الامتحانات بتفوق واقتدار!
          </p>
        </div>

        {/* Level, XP & Streak Counters */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Streak Flame */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-amber-500/30 text-amber-300 shadow-sm backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-400/80 block font-bold leading-tight">الالتزام المتواصل</span>
              <span className="text-sm font-heading font-black">{streakDays || 5} أيام 🔥</span>
            </div>
          </div>

          {/* Level & XP Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 shadow-sm backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400/80 block font-bold leading-tight">الرتبة الأكاديمية</span>
              <span className="text-sm font-heading font-black">{getLevelTitle(currentLevel)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: XP Progress Bar & Quick Metrics */}
      <div className="relative z-10 py-5 grid sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-8 space-y-2 text-right">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">المستوى {currentLevel}</span>
              <span className="text-slate-400 text-[11px]">
                ({xpPoints - currentLevelBaseXP} / 250 XP للمستوى {currentLevel + 1})
              </span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-600 transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>إجمالي نقاط الخبرة: <strong className="text-amber-400 font-mono">{xpPoints} XP</strong></span>
            <span>تبقى {250 - (xpPoints - currentLevelBaseXP)} XP للترقية القادمة 🚀</span>
          </div>
        </div>

        {/* Missions Progress Indicator */}
        <div className="sm:col-span-4 flex items-center justify-end sm:justify-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-white">
              مهام اليوم: {completedCount} من {missions.length} مكتملة
            </div>
            <div className="text-[11px] text-slate-400">
              {completedCount === missions.length
                ? 'أحسنت! أكملت جميع مهامك اليومية 🎉'
                : 'أكمل المهام لزيادة نقاط خبرتك وتسريع مستواك'}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Interactive Missions Checklist */}
      <div className="relative z-10 pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>مهامك اليومية المقترحة لليوم</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-bold">
            انقر على المهمة لإنجازها وحصد النقاط فورياً
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {missions.map((mission) => {
            const isCelebrating = celebratingMissionId === mission.id;
            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition-all text-right flex flex-col justify-between gap-3 ${
                  mission.completed
                    ? 'bg-slate-800/40 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 hover:border-emerald-500/50 shadow-md'
                } ${isCelebrating ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      {mission.icon === 'tutor' && <Bot className="w-3.5 h-3.5 text-blue-400" />}
                      {mission.icon === 'curriculum' && <BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                      {mission.icon === 'brain' && <Brain className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{mission.title}</span>
                    </span>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +{mission.xp} XP
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {mission.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(mission.targetTab)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>فتح القسم المباشر</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompleteMission(mission.id, mission.xp)}
                    disabled={mission.completed}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mission.completed
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                    }`}
                  >
                    {mission.completed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مكتملة ✓</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-emerald-200" />
                        <span>استلام النقاط</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Launchpad: Direct Fast Jumps */}
      <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
          <span>روابط سريعة لأقوى أدوات المنصة:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('ai-tutor')}
            className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>اسأل مستر يونس AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateTab('curriculum');
              if (onOpenLessons) onOpenLessons();
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>متابعة دروس المنهج</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('brain-hub')}
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>بنك الذاكرة والاختبارات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
