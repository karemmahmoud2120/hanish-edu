import React, { useState } from 'react';
import {
  StudentProfile,
  ExamResult,
  LessonItem,
  BookletItem,
  QuizItem,
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
  Trash2,
  Edit3,
  Megaphone,
  BookOpen,
  HelpCircle,
  Users,
  Search,
  Filter,
  Eye,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';
import { StudentProgressChart } from './StudentProgressChart';

interface ParentAdminProps {
  currentRole: 'student' | 'parent' | 'admin';
  setCurrentRole: (role: 'student' | 'parent' | 'admin') => void;
  student: StudentProfile;
  examResults: ExamResult[];
  onAddLesson: (lesson: LessonItem) => void;
  onUpdateLesson?: (lesson: LessonItem) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onAddBooklet: (booklet: BookletItem) => void;
  onDeleteBooklet?: (bookletId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  currentUser?: AuthUser | null;
  lessons?: LessonItem[];
  booklets?: BookletItem[];
  quizzes?: QuizItem[];
  onAddQuiz?: (quiz: QuizItem) => void;
  onDeleteQuiz?: (quizId: string) => void;
  platformAnnouncement?: string;
  onUpdateAnnouncement?: (text: string) => void;
  onUpdateStudent?: (student: StudentProfile) => void;
}

export const ParentAdmin: React.FC<ParentAdminProps> = ({
  currentRole,
  setCurrentRole,
  student,
  examResults,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddBooklet,
  onDeleteBooklet,
  onExportBackup,
  onImportBackup,
  currentUser,
  lessons = [],
  booklets = [],
  quizzes = [],
  onAddQuiz,
  onDeleteQuiz,
  platformAnnouncement = 'مرحباً بكم في منصة عائلة حنيش التعليمية لعام 2026! تم تفعيل السبورة التفاعلية ومستر يونس الذكي.',
  onUpdateAnnouncement,
  onUpdateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin' | 'honor'>(
    currentRole === 'admin' ? 'admin' : 'parent'
  );

  // Admin CMS Sub-tabs
  const [adminCmsTab, setAdminCmsTab] = useState<'lessons' | 'quizzes' | 'announcements' | 'students' | 'backup'>(
    'lessons'
  );

  // Printable report month
  const [reportMonth, setReportMonth] = useState('2026-10');
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  // Lessons CMS State
  const [lessonFilterGrade, setLessonFilterGrade] = useState('all');
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);

  // Add Lesson Form state
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSubject, setNewLessonSubject] = useState('اللغة العربية');
  const [newLessonGrade, setNewLessonGrade] = useState('الصف الأول الإعدادي');
  const [newLessonVideo, setNewLessonVideo] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('20 دقيقة');
  const [newLessonDesc, setNewLessonDesc] = useState('');

  // Announcement CMS state
  const [announcementText, setAnnouncementText] = useState(platformAnnouncement);
  const [savedAnnouncementToast, setSavedAnnouncementToast] = useState(false);

  // Student XP Edit state
  const [editingXP, setEditingXP] = useState(student.xpPoints);
  const [editingStreak, setEditingStreak] = useState(student.streakDays);
  const [editingStudentName, setEditingStudentName] = useState(student.name);

  // Add Quiz Form state
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('العلوم');
  const [newQuizGrade, setNewQuizGrade] = useState('الصف الأول الإعدادي');
  const [newQuizDuration, setNewQuizDuration] = useState(15);
  const [newQuizPassing, setNewQuizPassing] = useState(70);

  // Calculate student average
  const totalScore = examResults.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0);
  const averagePercentage = examResults.length > 0 ? Math.round(totalScore / examResults.length) : 95;

  const getLevelInfo = (pct: number) => {
    if (pct >= 90) return { title: 'ممتاز', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
    if (pct >= 80) return { title: 'جيد جداً', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' };
    if (pct >= 65) return { title: 'جيد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
    if (pct >= 50) return { title: 'مقبول', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
    return { title: 'يحتاج دعم', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' };
  };

  const level = getLevelInfo(averagePercentage);

  // Create new lesson
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
      duration: newLessonDuration || '20 دقيقة',
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

  // Save edited lesson
  const handleSaveEditedLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    if (onUpdateLesson) {
      onUpdateLesson(editingLesson);
      alert('تم تحديث بيانات الدرس بنجاح!');
    }
    setEditingLesson(null);
  };

  // Delete lesson
  const handleDeleteLessonAction = (lessonId: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الدرس: "${title}"؟`)) {
      if (onDeleteLesson) {
        onDeleteLesson(lessonId);
      }
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateAnnouncement) {
      onUpdateAnnouncement(announcementText);
      setSavedAnnouncementToast(true);
      setTimeout(() => setSavedAnnouncementToast(false), 3000);
    }
  };

  // Save student profile edits
  const handleSaveStudentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        name: editingStudentName.trim() || student.name,
        xpPoints: Number(editingXP) || 0,
        streakDays: Number(editingStreak) || 0,
      });
      alert('تم تحديث بيانات الطالب ونقاط الخبرة بنجاح!');
    }
  };

  // Create new Quiz
  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const stageId = newQuizGrade.includes('ابتدائي')
      ? 'primary'
      : newQuizGrade.includes('إعدادي')
      ? 'prep'
      : 'secondary';

    const item: QuizItem = {
      id: `qz-${Date.now()}`,
      title: newQuizTitle.trim(),
      stageId,
      gradeName: newQuizGrade,
      subject: newQuizSubject,
      durationMinutes: Number(newQuizDuration) || 15,
      passingScore: Number(newQuizPassing) || 70,
      questions: [
        {
          id: `q-1`,
          question: `سؤال تقييمي أولي حول موضوع: ${newQuizTitle}`,
          options: ['الإجابة الأولى النموذجية', 'خيار غير صحيح', 'خيار للمقارنة'],
          correctIndex: 0,
          explanation: 'توضيح النموذج النموذجي للإجابة الصحيحة.',
        },
      ],
    };

    if (onAddQuiz) {
      onAddQuiz(item);
      setNewQuizTitle('');
      alert('تمت إضافة الاختبار بنجاح في بنك الأسئلة!');
    }
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

  // Filtered lessons for CMS
  const filteredLessons = lessons.filter((l) => {
    const matchesGrade = lessonFilterGrade === 'all' || l.gradeName === lessonFilterGrade;
    const matchesQuery =
      !lessonSearchQuery.trim() ||
      l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(lessonSearchQuery.toLowerCase());
    return matchesGrade && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-right">
      {/* Top Segmented Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Tab Button (Shown for admins) */}
          {(currentRole === 'admin' || currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setCurrentRole('admin');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>لوحة تحكم مدير المنصة (الأدمن)</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('parent');
              setCurrentRole('parent');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'honor'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>لوحة الشرف والمتفوقين</span>
          </button>
        </div>

        {/* Current Admin Badge */}
        {currentRole === 'admin' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">
              {currentUser?.name || 'مدير المنصة'} (صلاحيات كاملة)
            </span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. ADMIN CMS CONTROL CENTER                                   */}
      {/* ============================================================== */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Admin Hero Header */}
          <div className="bg-gradient-to-l from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>مركز إدارة المحتوى الأكاديمي (CMS)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                لوحة تحكم مدير منصة عائلة حنيش التعليمية
              </h2>
              <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                تحكم كامل في تعديل وإضافة وحذف الدروس والمناهج، بنك الأسئلة والاختبارات، شريط الإعلانات العامة، وسجل الطلاب.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onExportBackup}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>نسخة احتياطية (JSON)</span>
              </button>
            </div>
          </div>

          {/* CMS Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setAdminCmsTab('lessons')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'lessons'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>إدارة وتعديل الدروس ({lessons.length})</span>
            </button>

            <button
              onClick={() => setAdminCmsTab('quizzes')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'quizzes'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>بنك الاختبارات والأسئلة ({quizzes.length})</span>
            </button>

            <button
              onClick={() => setAdminCmsTab('announcements')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'announcements'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>شريط التنبيهات والإعلانات</span>
            </button>

            <button
              onClick={() => setAdminCmsTab('students')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'students'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الطلاب ونقاط الـ XP</span>
            </button>

            <button
              onClick={() => setAdminCmsTab('backup')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'backup'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>الاستضافة والنسخ الاحتياطي</span>
            </button>
          </div>

          {/* SUBTAB 1: LESSONS CMS (Add, Edit, Delete, Filter) */}
          {adminCmsTab === 'lessons' && (
            <div className="space-y-6">
              {/* Add New Lesson Accordion / Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>إضافة درس فيديو وشرح جديد للمنهج</span>
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
                      placeholder="مثال: مراجعة شاملة على الجبر وحل المعادلات الكيميائية"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        المادة:
                      </label>
                      <input
                        type="text"
                        required
                        value={newLessonSubject}
                        onChange={(e) => setNewLessonSubject(e.target.value)}
                        placeholder="مثال: الرياضيات، العلوم، اللغة العربية"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        المدة الزمنية:
                      </label>
                      <input
                        type="text"
                        value={newLessonDuration}
                        onChange={(e) => setNewLessonDuration(e.target.value)}
                        placeholder="مثال: 25 دقيقة"
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
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      وصف وملخص الدرس:
                    </label>
                    <textarea
                      rows={2}
                      value={newLessonDesc}
                      onChange={(e) => setNewLessonDesc(e.target.value)}
                      placeholder="اكتب أهم النقاط والمفاهيم التي يغطيها الشرح..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
                  >
                    + نشر الدرس فورياً للطلاب في المنصة
                  </button>
                </form>
              </div>

              {/* Existing Lessons List & Management Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                      قائمة الدروس المنشورة على المنصة ({filteredLessons.length} درس)
                    </h3>
                    <p className="text-xs text-slate-400">
                      يمكنك تعديل أي درس أو حذفه بنقرة واحدة وستنعكس التعديلات فوراً للطلاب.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Grade Filter */}
                    <select
                      value={lessonFilterGrade}
                      onChange={(e) => setLessonFilterGrade(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="all">جميع الصفوف الدراسية</option>
                      {STAGES.flatMap((s) => s.years).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 sm:w-48">
                      <input
                        type="text"
                        value={lessonSearchQuery}
                        onChange={(e) => setLessonSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم أو المادة..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Lessons Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">عنوان الدرس</th>
                        <th className="p-3">المادة</th>
                        <th className="p-3">الصف الدراسي</th>
                        <th className="p-3">المدة</th>
                        <th className="p-3">المشاهدات</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLessons.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{l.title}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{l.subject}</td>
                          <td className="p-3 text-slate-500">{l.gradeName}</td>
                          <td className="p-3 text-slate-500 font-mono">{l.duration}</td>
                          <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">{l.views}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingLesson(l)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 font-bold transition flex items-center gap-1 cursor-pointer"
                                title="تعديل بيانات الدرس"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                onClick={() => handleDeleteLessonAction(l.id, l.title)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 font-bold transition flex items-center gap-1 cursor-pointer"
                                title="حذف الدرس نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Lesson Modal */}
              {editingLesson && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-purple-600" />
                        <span>تعديل بيانات الدرس: {editingLesson.title}</span>
                      </h4>
                      <button
                        onClick={() => setEditingLesson(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditedLesson} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          عنوان الدرس:
                        </label>
                        <input
                          type="text"
                          required
                          value={editingLesson.title}
                          onChange={(e) =>
                            setEditingLesson({ ...editingLesson, title: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            الصف الدراسي:
                          </label>
                          <select
                            value={editingLesson.gradeName}
                            onChange={(e) =>
                              setEditingLesson({ ...editingLesson, gradeName: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          >
                            {STAGES.flatMap((s) => s.years).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            المادة:
                          </label>
                          <input
                            type="text"
                            required
                            value={editingLesson.subject}
                            onChange={(e) =>
                              setEditingLesson({ ...editingLesson, subject: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رابط الفيديو:
                        </label>
                        <input
                          type="url"
                          required
                          value={editingLesson.videoUrl}
                          onChange={(e) =>
                            setEditingLesson({ ...editingLesson, videoUrl: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-left"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الوصف:
                        </label>
                        <textarea
                          rows={3}
                          value={editingLesson.description}
                          onChange={(e) =>
                            setEditingLesson({ ...editingLesson, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingLesson(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ التعديلات</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: QUIZZES CMS */}
          {adminCmsTab === 'quizzes' && (
            <div className="space-y-6">
              {/* Add New Quiz */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>إضافة اختبار إلكتروني جديد في بنك الأسئلة</span>
                </h3>

                <form onSubmit={handleCreateQuiz} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      عنوان الاختبار:
                    </label>
                    <input
                      type="text"
                      required
                      value={newQuizTitle}
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="مثال: اختبار الكيمياء الشامل على الباب الأول"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الصف الدراسي:
                      </label>
                      <select
                        value={newQuizGrade}
                        onChange={(e) => setNewQuizGrade(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      >
                        {STAGES.flatMap((s) => s.years).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        المادة:
                      </label>
                      <input
                        type="text"
                        required
                        value={newQuizSubject}
                        onChange={(e) => setNewQuizSubject(e.target.value)}
                        placeholder="مثال: الفيزياء أو الأحياء"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        مدة الامتحان (دقيقة):
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={newQuizDuration}
                        onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نسبة النجاح (%):
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={newQuizPassing}
                        onChange={(e) => setNewQuizPassing(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow transition cursor-pointer"
                  >
                    + نشر الاختبار في قسم المناهج
                  </button>
                </form>
              </div>

              {/* Quizzes List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  الاختبارات الإلكترونية المسجلة ({quizzes.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">عنوان الاختبار</th>
                        <th className="p-3">المادة</th>
                        <th className="p-3">الصف الدراسي</th>
                        <th className="p-3">المدة</th>
                        <th className="p-3">درجة النجاح</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {quizzes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{q.title}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{q.subject}</td>
                          <td className="p-3 text-slate-500">{q.gradeName}</td>
                          <td className="p-3 text-slate-500 font-mono">{q.durationMinutes} دقيقة</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {q.passingScore}%
                          </td>
                          <td className="p-3 text-center">
                            {onDeleteQuiz && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف هذا الاختبار: "${q.title}"؟`)) {
                                    onDeleteQuiz(q.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: ANNOUNCEMENTS CMS */}
          {adminCmsTab === 'announcements' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                    التحكم في شريط الإعلانات وتنبيهات الطلاب العاجلة
                  </h3>
                  <p className="text-xs text-slate-400">
                    النص المكتوب هنا يظهر كشريط إخباري متحرك وتنبيه بارز لجميع الطلاب في الصفحة الرئيسية.
                  </p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block font-mono">
                  معاينة مباشرة للشريط كما يراه الطلاب:
                </span>
                <p className="font-bold">{announcementText || 'لا يوجد إعلان نشط حالياً.'}</p>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نص الإعلان أو التنبيه العام:
                  </label>
                  <textarea
                    rows={3}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="اكتب التنبيه أو موعد الامتحانات أو التهنئة..."
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400 font-bold">إعلانات جاهزة سريعة:</span>
                  {[
                    '🔔 تنبيه هام: تم فتح باب التسجيل لمراجعات الفصل الدراسي الأول مع مستر يونس!',
                    '🌟 مبروك لجميع طلابنا المتفوقين في امتحانات الشهر ونتمنى دوام التميز.',
                    '⚡ تذكير: غداً موعد تسليم المهام الدراسية وحل تدريبات بنك الأسئلة.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnnouncementText(preset)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 text-[11px] transition cursor-pointer"
                    >
                      نموذج {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedAnnouncementToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم نشر الإعلان فورياً في المنصة!</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    className="mr-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>تحديث ونشر الإعلان للطلاب</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBTAB 4: STUDENTS & XP LEDGER */}
          {adminCmsTab === 'students' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>إدارة بيانات الطلاب ونقاط الـ XP والأوسمة</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكن للمسؤول تعديل نقاط خبرة الطالب، شعلة الالتزام، أو تحديث البيانات الأكاديمية.
                  </p>
                </div>
              </div>

              {/* Student Quick Edit Form */}
              <form onSubmit={handleSaveStudentProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الطالب المسجل:
                  </label>
                  <input
                    type="text"
                    value={editingStudentName}
                    onChange={(e) => setEditingStudentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نقاط الخبرة (XP):
                    </label>
                    <input
                      type="number"
                      value={editingXP}
                      onChange={(e) => setEditingXP(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      أيام الالتزام والمذاكرة (Streak):
                    </label>
                    <input
                      type="number"
                      value={editingStreak}
                      onChange={(e) => setEditingStreak(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>تحديث بيانات الطالب</span>
                </button>
              </form>
            </div>
          )}

          {/* SUBTAB 5: BACKUP & HOSTING */}
          {adminCmsTab === 'backup' && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
              <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>دليل استضافة ورفع المنصة على موقع مجاني:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  المنصة مبنية بنظام Full-Stack متكامل (Express + React + Google Gemini API) ويمكن رفعها مجاناً بسهولة:
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-emerald-400 block mb-1">1. موقع Render.com (مجاني تماماً):</strong>
                    <span>ارفع الكود على GitHub، ثم ادخل على Render واختر Web Service، وضع أمر البناء <code className="bg-black/40 px-1 py-0.5 rounded font-mono">npm run build</code> وأمر التشغيل <code className="bg-black/40 px-1 py-0.5 rounded font-mono">npm start</code>.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-cyan-400 block mb-1">2. موقع Railway.app أو Vercel:</strong>
                    <span>يدعم الاستضافة الفورية ويوفر شهادة SSL ونطاق مجاني فوري.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PARENT PORTAL (FOLLOW UP & PROGRESS)                        */}
      {/* ============================================================== */}
      {activeTab === 'parent' && (
        <div className="space-y-6">
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
                <span>طباعة التقرير الشهري</span>
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
      {/* 3. HONOR ROLL (لوحة الشرف)                                    */}
      {/* ============================================================== */}
      {activeTab === 'honor' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              لوحة الفخر والاعتزاز
            </span>
            <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
              لوحة الشرف لأوائل منصة عائلة حنيش 🏆
            </h2>
            <p className="text-xs text-slate-500">
              تكريم مستمر للطلاب الذين حققوا أعلى نقاط التزام وأعلى الدرجات في الاختبارات الإلكترونية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HONOR_STUDENTS.map((st, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3 relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 border-amber-400 shadow-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-heading font-black text-xl">
                  {st.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">{st.name}</h4>
                  <span className="text-[11px] text-slate-400 block">{st.grade}</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mt-1">{st.badge}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  معدل التميز: {st.average}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
