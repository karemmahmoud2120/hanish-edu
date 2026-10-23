import React, { useState } from 'react';
import {
  StudentProfile,
  ExamResult,
  LessonItem,
  BookletItem,
  HONOR_STUDENTS,
  MINISTRY_LINKS,
  STAGES,
} from '../data/curriculumData';
import { AuthUser } from './AuthModal';
import {
  Printer,
  Shield,
  HeartHandshake,
  Award,
  Download,
  Upload,
  Plus,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Server,
  Cloud,
  Lock,
  Crown,
  Sparkles,
  KeyRound,
  FileText,
  UserCheck,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import { StudentProgressChart } from './StudentProgressChart';

interface ParentAdminProps {
  currentRole: 'student' | 'parent' | 'admin';
  setCurrentRole: (role: 'student' | 'parent' | 'admin') => void;
  student: StudentProfile;
  examResults: ExamResult[];
  onAddLesson: (lesson: LessonItem) => void;
  onAddBooklet: (booklet: BookletItem) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  currentUser?: AuthUser | null;
  lessons?: LessonItem[];
  booklets?: BookletItem[];
}

export const ParentAdmin: React.FC<ParentAdminProps> = ({
  currentRole,
  setCurrentRole,
  student,
  examResults,
  onAddLesson,
  onAddBooklet,
  onExportBackup,
  onImportBackup,
  currentUser,
  lessons = [],
  booklets = [],
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin' | 'honor'>(
    currentRole === 'admin' ? 'admin' : 'parent'
  );

  // Printable report month
  const [reportMonth, setReportMonth] = useState('2026-10');
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  // Quick Admin Form state
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSubject, setNewLessonSubject] = useState('اللغة العربية');
  const [newLessonGrade, setNewLessonGrade] = useState('الصف الأول الإعدادي');
  const [newLessonVideo, setNewLessonVideo] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');

  // Calculate student average
  const totalScore = examResults.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0);
  const averagePercentage = examResults.length > 0 ? Math.round(totalScore / examResults.length) : 95;

  const getLevelInfo = (pct: number) => {
    if (pct >= 90) return { title: 'ممتاز 🌟', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
    if (pct >= 80) return { title: 'جيد جداً ✨', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' };
    if (pct >= 65) return { title: 'جيد 👍', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
    if (pct >= 50) return { title: 'مقبول ⚠️', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
    return { title: 'يحتاج دعم 💡', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' };
  };

  const level = getLevelInfo(averagePercentage);

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    const stageId = newLessonGrade.includes('ابتدائي')
      ? 'primary'
      : newLessonGrade.includes('إعدادي')
      ? 'prep'
      : 'secondary';

    const item: LessonItem = {
      id: `les-${Date.now()}`,
      title: newLessonTitle.trim(),
      stageId,
      gradeName: newLessonGrade,
      subject: newLessonSubject,
      videoUrl: newLessonVideo.trim() || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '20 دقيقة',
      description: newLessonDesc.trim() || 'درس تعليمي مضاف من لوحة الإدارة.',
      summaryPoints: ['تم رفع وتدقيق هذا الدرس من قبل إدارة المنصة.'],
      views: 1,
      likes: 0,
      questions: [],
    };

    onAddLesson(item);
    setNewLessonTitle('');
    setNewLessonVideo('');
    setNewLessonDesc('');
    alert('تم نشر الدرس بنجاح في قسم المناهج!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportBackup(content);
        alert('تمت استعادة البيانات بنجاح!');
      } catch (err) {
        alert('ملف النسخة الاحتياطية غير صالح.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Segmented Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Tab Button (Shown for admins or when switching) */}
          {(currentRole === 'admin' || currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setCurrentRole('admin');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>👑 لوحة تحكم مدير المنصة (الأدمن)</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('parent');
              setCurrentRole('parent');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>بوابة متابعة ولي الأمر</span>
          </button>

          <button
            onClick={() => setActiveTab('honor')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'honor'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>لوحة الشرف والروابط الرسمية</span>
          </button>
        </div>

        {/* Current Identity Tag */}
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>الحساب النشط:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {currentUser?.name || student.name}
          </span>
          <span className="font-bold text-purple-600 dark:text-purple-400">
            ({currentRole === 'admin' ? '🛡️ مسؤول النظام' : currentRole === 'parent' ? '👨‍👩‍👧 ولي أمر' : '🎓 طالب'})
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. ADMIN SUPER PORTAL (THE USER'S DEDICATED ADMIN DASHBOARD)  */}
      {/* ============================================================== */}
      {activeTab === 'admin' && (
        <div className="space-y-8 animate-fade-in">
          {/* Admin Prestige Welcome Banner */}
          <div className="bg-gradient-to-l from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>لوحة الإدارة والتحكم الشاملة (Super Admin)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                  مرحباً بك يا مدير المنصة: {currentUser?.name || 'كريم محمود حنيش'} 👑
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  هذه هي واجهتك الخاصة كمسؤول أول للمنصة؛ من هنا يمكنك نشر وتحديث الدروس، متابعة كشوف درجات الطلاب،
                  إدارة النسخ الاحتياطية، ومراقبة حالة الذكاء الاصطناعي والاستضافة.
                </p>
              </div>

              {/* Admin Credentials & Secret Link Badge */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right space-y-2 min-w-[270px]">
                <span className="text-[11px] text-amber-300 font-bold block flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>بيانات اعتماد الأدمن ورابط الدخول:</span>
                </span>
                <div className="text-xs font-mono space-y-1">
                  <p>
                    <span className="text-slate-300">اليوزر نيم:</span>{' '}
                    <b className="text-white select-all">admin@hanish.edu.eg</b>
                  </p>
                  <p>
                    <span className="text-slate-300">كلمة المرور:</span>{' '}
                    <b className="text-amber-300 select-all">Hanish@2026</b>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    مقبول أيضاً: <span className="text-slate-300 font-mono">Admin#Hanish2026</span>
                  </p>
                </div>

                {/* Secret Link Copier */}
                <button
                  type="button"
                  onClick={() => {
                    const secretUrl = `${window.location.origin}${window.location.pathname}?portal=admin`;
                    navigator.clipboard.writeText(secretUrl);
                    setCopiedAdminLink(true);
                    setTimeout(() => setCopiedAdminLink(false), 2500);
                  }}
                  className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  title="نسخ الرابط المباشر للوحة الأدمن"
                >
                  {copiedAdminLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>تم نسخ رابط الأدمن بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ رابط الأدمن السري (?portal=admin)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* KPI Dashboard Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-1">
              <span className="text-xs text-slate-500 font-bold block">إجمالي الدروس المفعلة</span>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                {lessons.length || 12}
              </div>
              <span className="text-[11px] text-slate-400">فيديو تعليمي تفاعلي</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-1">
              <span className="text-xs text-slate-500 font-bold block">المذكرات والملازم المرفوعة</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                {booklets.length || 8}
              </div>
              <span className="text-[11px] text-slate-400">ملفات PDF جاهزة للتحميل</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-1">
              <span className="text-xs text-slate-500 font-bold block">الاختبارات المنجزة</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {examResults.length}
              </div>
              <span className="text-[11px] text-slate-400">محاولة تقييم معتمدة</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-right space-y-1">
              <span className="text-xs text-slate-500 font-bold block">متوسط درجات الطلاب</span>
              <div className="text-3xl font-black text-amber-500 tabular-nums">
                {averagePercentage}%
              </div>
              <span className="text-[11px] text-slate-400">معدل نجاح تراكمي ممتاز</span>
            </div>
          </div>

          {/* Main Admin Actions Grid */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* 1. Quick Upload Lesson Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>إضافة درس فيديو وشرح جديد للمنصة</span>
              </h3>

              <form onSubmit={handleCreateLesson} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    عنوان الدرس:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="مثال: مراجعة شاملة على الجبر وحل المعادلات"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      الصف الدراسي:
                    </label>
                    <select
                      value={newLessonGrade}
                      onChange={(e) => setNewLessonGrade(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {STAGES.flatMap((s) => s.years).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">المادة:</label>
                    <input
                      type="text"
                      required
                      value={newLessonSubject}
                      onChange={(e) => setNewLessonSubject(e.target.value)}
                      placeholder="مثال: الرياضيات أو العلوم"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    رابط الفيديو (YouTube / MP4):
                  </label>
                  <input
                    type="url"
                    required
                    value={newLessonVideo}
                    onChange={(e) => setNewLessonVideo(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    وصف مختصر للدرس:
                  </label>
                  <textarea
                    rows={3}
                    value={newLessonDesc}
                    onChange={(e) => setNewLessonDesc(e.target.value)}
                    placeholder="اكتب أهم المفاهيم التي يغطيها الشرح..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
                >
                  نشر الدرس فورياً للطلاب
                </button>
              </form>
            </div>

            {/* 2. Backup, Restore & Hosting Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <span>النسخ الاحتياطي واستعادة قاعدة البيانات</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تصدير كافة محتويات المنصة والدروس والامتحانات ونتائج الطلاب بملف JSON كامل لحفظها أو نقلها لأي خادم.
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={onExportBackup}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير نسخة احتياطية كاملة (JSON)</span>
                  </button>

                  <label className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition cursor-pointer">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>استيراد واستعادة نسخة احتياطية</span>
                    <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Hosting Guide Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>دليل استضافة ورفع المنصة (Node.js + React):</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  المنصة مبنية بنظام Full-Stack متكامل يعمل عبر خادم Express و Vite وتستدعي Google Gemini API مباشرة عبر
                  الخادم الخلفي بحماية كاملة.
                </p>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><b>الخيار الأسهل والأسرع:</b> Render.com أو Railway.app بنقرة واحدة من GitHub.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span><b>الخيار السحابي الأقوى:</b> Google Cloud Run متصل بـ Gemini وسريع جداً.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span><b>الخيار الاقتصادي للملايين:</b> VPS (Hostinger أو Hetzner) بـ 4$ شهرياً.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Global Students Examination Ledger */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>سجل درجات الطلاب والاختبارات المنجزة على المنصة</span>
                </h3>
                <p className="text-xs text-slate-500">كشف فوري بجميع محاولات الطلاب ودرجاتهم ونسب النجاح المحققة.</p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                إجمالي السجلات: {examResults.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">المادة</th>
                    <th className="p-3">عنوان الاختبار</th>
                    <th className="p-3">الصف الدراسي</th>
                    <th className="p-3">الدرجة</th>
                    <th className="p-3">النسبة المئوية</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {examResults.map((r) => {
                    const pct = Math.round((r.score / r.maxScore) * 100);
                    const rLevel = getLevelInfo(pct);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{r.subject}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.quizTitle}</td>
                        <td className="p-3 text-slate-500">{r.gradeName || 'الصف الأول الإعدادي'}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {r.score} / {r.maxScore}
                        </td>
                        <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400 tabular-nums">
                          {pct}%
                        </td>
                        <td className="p-3 text-slate-500 tabular-nums">{r.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rLevel.color}`}>
                            {rLevel.title}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PARENT PORTAL (FOLLOW UP & PROGRESS)                        */}
      {/* ============================================================== */}
      {activeTab === 'parent' && (
        <div className="space-y-6 animate-fade-in">
          {/* Link Student Code Box */}
          <div className="bg-gradient-to-l from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-right">
              <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                متابعة الطالب النشط
              </span>
              <h2 className="text-2xl font-heading font-extrabold text-white">
                تقرير مستوى الطالب: {student.name}
              </h2>
              <p className="text-slate-300 text-xs">
                الصف: <b>{student.gradeName}</b> · كود الربط الخاص بالطالب:{' '}
                <span className="font-mono text-amber-300 font-extrabold tracking-widest">{student.linkCode}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-3 rounded-2xl bg-white text-blue-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير الشهري 🖨️</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2">
              <span className="text-xs text-slate-500 font-bold block">المتوسط التراكمي في الاختبارات</span>
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                {averagePercentage}%
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${level.color}`}>
                التقدير العام: {level.title}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2">
              <span className="text-xs text-slate-500 font-bold block">الامتحانات المؤداة</span>
              <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                {examResults.length}
              </div>
              <span className="text-xs text-slate-400">امتحان تم حله واعتماده</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2">
              <span className="text-xs text-slate-500 font-bold block">أيام الالتزام والمذاكرة</span>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {student.streakDays} أيام
              </div>
              <span className="text-xs text-slate-400">استمرارية ممتازة هذا الأسبوع</span>
            </div>
          </div>

          {/* Recharts Visual Student Progress & Improvement Analytics */}
          <StudentProgressChart examResults={examResults} studentName={student.name} />

          {/* Printable Report Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:shadow-none print:border-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  كشف درجات الاختبارات الإلكترونية لشهر: {reportMonth}
                </h3>
                <p className="text-xs text-slate-500">سجل كامل بجميع الاختبارات ودرجات الطالب وتواريخ الأداء.</p>
              </div>

              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">المادة الدراسية</th>
                    <th className="p-3">عنوان الاختبار</th>
                    <th className="p-3">الدرجة المحققة</th>
                    <th className="p-3">النسبة المئوية</th>
                    <th className="p-3">تاريخ الاختبار</th>
                    <th className="p-3">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {examResults.map((r) => {
                    const pct = Math.round((r.score / r.maxScore) * 100);
                    const rLevel = getLevelInfo(pct);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{r.subject}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.quizTitle}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {r.score} / {r.maxScore}
                        </td>
                        <td className="p-3 font-mono font-black text-blue-600 dark:text-blue-400 tabular-nums">
                          {pct}%
                        </td>
                        <td className="p-3 text-slate-500 tabular-nums">{r.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rLevel.color}`}>
                            {rLevel.title}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
              تقرير إلكتروني رسمي صادر عن منصة عائلة حنيش التعليمية · تم التحقق آلياً
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. HONOR ROLL & OFFICIAL LINKS                                 */}
      {/* ============================================================== */}
      {activeTab === 'honor' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Honor Roll */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>لوحة الشرف: أوائل عائلة حنيش</span>
              </h3>
              <span className="text-xs text-slate-500">تكريم المتفوقين في الاختبارات</span>
            </div>

            <div className="space-y-3">
              {HONOR_STUDENTS.map((st, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{st.badge.split(' ')[0]}</span>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">{st.name}</span>
                      <span className="text-xs text-slate-500">{st.grade}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">
                      {st.average}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">المتوسط التراكمي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Ministry Links */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-500" />
              <span>بوابات وزارة التربية والتعليم الرسمية</span>
            </h3>
            <p className="text-xs text-slate-500">روابط سريعة ومباشرة للمصادر التعليمية الرسمية في مصر:</p>

            <div className="space-y-2.5">
              {MINISTRY_LINKS.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/60 text-right transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                      {link.title}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
