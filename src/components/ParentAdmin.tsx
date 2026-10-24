import React, { useEffect, useState } from 'react';
import {
  StudentProfile,
  ExamResult,
  LessonItem,
  BookletItem,
  QuizItem,
  QuizQuestion,
  UsefulLink,
  getQuizPassingPercentage,
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
  Youtube,
  Loader2,
} from 'lucide-react';
import { StudentProgressChart } from './StudentProgressChart';
import { createPasswordCredential } from '../utils/authStorage';
import { ADMIN_PERMISSION_LABELS, AdminPermission, hasAdminPermission, isSupervisor } from '../utils/adminPermissions';

interface YouTubeChannelVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
}

interface YouTubeChannelVideosResponse {
  videos: YouTubeChannelVideo[];
  nextPageToken: string | null;
  source?: 'public-feed' | 'youtube-api';
  error?: string;
}

const getYouTubeVideoId = (url: string) =>
  url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)?.[1];

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
  registeredUsers: AuthUser[];
  onUpdateRegisteredUser: (user: AuthUser) => void;
  onDeleteRegisteredUser: (userId: string) => void;
  lessons?: LessonItem[];
  booklets?: BookletItem[];
  quizzes?: QuizItem[];
  onAddQuiz?: (quiz: QuizItem) => void;
  onDeleteQuiz?: (quizId: string) => void;
  usefulLinks?: UsefulLink[];
  onAddUsefulLink?: (link: UsefulLink) => void;
  onDeleteUsefulLink?: (linkId: string) => void;
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
  registeredUsers,
  onUpdateRegisteredUser,
  onDeleteRegisteredUser,
  lessons = [],
  booklets = [],
  quizzes = [],
  onAddQuiz,
  onDeleteQuiz,
  usefulLinks = [],
  onAddUsefulLink,
  onDeleteUsefulLink,
  platformAnnouncement = 'مرحباً بكم في منصة عائلة حنيش التعليمية لعام 2026! تم تفعيل السبورة التفاعلية ومستر يونس الذكي.',
  onUpdateAnnouncement,
  onUpdateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'admin' | 'honor'>(
    currentRole === 'admin' ? 'admin' : 'parent'
  );

  // Admin CMS Sub-tabs
  const [adminCmsTab, setAdminCmsTab] = useState<'lessons' | 'quizzes' | 'announcements' | 'students' | 'accounts' | 'backup' | 'links'>(
    'lessons'
  );
  const [editingAccount, setEditingAccount] = useState<AuthUser | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountFormMode, setAccountFormMode] = useState<'profile' | 'password'>('profile');
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountRole, setAccountRole] = useState<AuthUser['role']>('student');
  const [accountType, setAccountType] = useState<'admin' | 'supervisor'>('admin');
  const [supervisorTitle, setSupervisorTitle] = useState('');
  const [accountPermissions, setAccountPermissions] = useState<AdminPermission[]>([]);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [accountGrade, setAccountGrade] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirmation, setAccountPasswordConfirmation] = useState('');

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
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [youtubeStageId, setYoutubeStageId] = useState<LessonItem['stageId']>('prep');
  const [youtubeGrade, setYoutubeGrade] = useState('الصف الأول الإعدادي');
  const [youtubeSubject, setYoutubeSubject] = useState('اللغة العربية');
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeChannelVideo[]>([]);
  const [selectedYoutubeVideoIds, setSelectedYoutubeVideoIds] = useState<string[]>([]);
  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState<string | null>(null);
  const [isLoadingYoutubeVideos, setIsLoadingYoutubeVideos] = useState(false);
  const [youtubeImportError, setYoutubeImportError] = useState<string | null>(null);
  const [youtubeImportNotice, setYoutubeImportNotice] = useState<string | null>(null);

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
  const [newQuizQuestions, setNewQuizQuestions] = useState<QuizQuestion[]>([{
    id: `question-${Date.now()}`,
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  }]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState('مصادر تعليمية');

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
  const isPlatformOwner = currentUser?.role === 'admin' && !isSupervisor(currentUser);
  const canManage = (permission: AdminPermission) => hasAdminPermission(currentUser, permission);
  const availableAdminTabs = [
    { id: 'lessons' as const, permission: 'lessons' as const },
    { id: 'quizzes' as const, permission: 'quizzes' as const },
    { id: 'announcements' as const, permission: 'announcements' as const },
    { id: 'students' as const, permission: 'students' as const },
    { id: 'accounts' as const, permission: 'accounts' as const },
    { id: 'backup' as const, permission: 'backup' as const },
    { id: 'links' as const, permission: 'links' as const },
  ].filter(({ permission }) => canManage(permission));
  const firstAvailableAdminTab = availableAdminTabs[0]?.id || 'lessons';
  const importedYouTubeVideoIds = new Set(
    lessons.map((lesson) => getYouTubeVideoId(lesson.videoUrl)).filter((id): id is string => Boolean(id))
  );
  const selectableYoutubeVideos = youtubeVideos.filter((video) => !importedYouTubeVideoIds.has(video.videoId));
  const selectedYoutubeVideos = youtubeVideos.filter((video) =>
    selectedYoutubeVideoIds.includes(video.videoId) && !importedYouTubeVideoIds.has(video.videoId)
  );

  useEffect(() => {
    if (!availableAdminTabs.some(({ id }) => id === adminCmsTab)) {
      setAdminCmsTab(firstAvailableAdminTab);
    }
  }, [adminCmsTab, currentUser?.id, currentUser?.permissions, firstAvailableAdminTab]);

  const beginAccountEdit = (user: AuthUser, mode: 'profile' | 'password') => {
    setIsCreatingAccount(false);
    setEditingAccount(user);
    setAccountFormMode(mode);
    setAccountName(user.name);
    setAccountEmail(user.email);
    setAccountRole(user.role);
    setAccountType(user.accountType || (user.email.toLowerCase().includes('supervisor') ? 'supervisor' : 'admin'));
    setSupervisorTitle(user.supervisorTitle || 'مشرف');
    setAccountPermissions(user.permissions || []);
    setAccountGrade(user.gradeName || 'الصف الأول الإعدادي');
    setAccountPassword('');
    setAccountPasswordConfirmation('');
  };

  const beginAccountCreate = () => {
    setEditingAccount(null);
    setIsCreatingAccount(true);
    setAccountFormMode('profile');
    setAccountName('');
    setAccountEmail('');
    setAccountRole('student');
    setAccountType('admin');
    setSupervisorTitle('');
    setAccountPermissions([]);
    setAccountGrade('الصف الأول الإعدادي');
    setAccountPassword('');
    setAccountPasswordConfirmation('');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage('accounts')) {
      alert('ليس لديك صلاحية إدارة الحسابات.');
      return;
    }
    if (!isPlatformOwner && (accountRole === 'admin' || editingAccount?.role === 'admin')) {
      alert('يمكن لمدير المنصة فقط إنشاء الحسابات الإدارية أو تعديلها.');
      return;
    }
    if (isCreatingAccount) {
      const cleanName = accountName.trim();
      const cleanEmail = accountEmail.trim().toLowerCase();
      if (!cleanName || !cleanEmail || accountPassword.length < 8) {
        alert('يرجى إدخال الاسم والبريد وكلمة مرور من 8 أحرف على الأقل.');
        return;
      }
      if (accountPassword !== accountPasswordConfirmation) {
        alert('تأكيد كلمة المرور غير مطابق.');
        return;
      }
      if (registeredUsers.some((user) => user.email.toLowerCase() === cleanEmail)) {
        alert('يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.');
        return;
      }
      try {
        const credential = await createPasswordCredential(accountPassword);
        const newUser: AuthUser = {
          id: `usr-${crypto.randomUUID()}`,
          name: cleanName,
          email: cleanEmail,
          role: accountRole,
          accountType: accountRole === 'admin' ? accountType : undefined,
          supervisorTitle: accountRole === 'admin' && accountType === 'supervisor'
            ? supervisorTitle.trim() || 'مشرف'
            : undefined,
          permissions: accountRole === 'admin' && accountType === 'supervisor' ? accountPermissions : undefined,
          provider: 'email',
          ...credential,
          gradeName: accountRole === 'student' ? accountGrade : undefined,
          stageId: accountRole === 'student'
            ? accountGrade.includes('ابتدائي')
              ? 'primary'
              : accountGrade.includes('إعدادي')
              ? 'prep'
              : 'secondary'
            : undefined,
          createdAt: new Date().toISOString(),
        };
        onUpdateRegisteredUser(newUser);
        setIsCreatingAccount(false);
        setAccountPassword('');
        setAccountPasswordConfirmation('');
      } catch (error) {
        console.error('تعذر إنشاء الحساب.', error);
        alert(error instanceof Error ? error.message : 'تعذر إنشاء الحساب.');
      }
      return;
    }
    if (!editingAccount) return;
    if (accountFormMode === 'password') {
      if (accountPassword.trim().length < 8) {
        alert('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
        return;
      }
      if (accountPassword !== accountPasswordConfirmation) {
        alert('تأكيد كلمة المرور غير مطابق.');
        return;
      }
      try {
        const credential = await createPasswordCredential(accountPassword);
        const { password: _legacyPassword, ...userWithoutLegacyPassword } = editingAccount;
        onUpdateRegisteredUser({ ...userWithoutLegacyPassword, ...credential });
        setEditingAccount(null);
        setAccountPassword('');
        setAccountPasswordConfirmation('');
      } catch (error) {
        console.error('تعذر تغيير كلمة المرور.', error);
        alert(error instanceof Error ? error.message : 'تعذر تغيير كلمة المرور.');
      }
      return;
    }

    const cleanName = accountName.trim();
    const cleanEmail = accountEmail.trim();
    if (!cleanName || !cleanEmail) {
      alert('يرجى إدخال الاسم والبريد الإلكتروني.');
      return;
    }
    if (registeredUsers.some((user) => user.id !== editingAccount.id && user.email.toLowerCase() === cleanEmail.toLowerCase())) {
      alert('يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.');
      return;
    }
    const { password: _legacyPassword, ...accountWithoutLegacyPassword } = editingAccount;
    onUpdateRegisteredUser({
      ...accountWithoutLegacyPassword,
      name: cleanName,
      email: cleanEmail,
      role: accountRole,
      accountType: accountRole === 'admin' ? accountType : undefined,
      supervisorTitle: accountRole === 'admin' && accountType === 'supervisor'
        ? supervisorTitle.trim() || 'مشرف'
        : undefined,
      permissions: accountRole === 'admin' && accountType === 'supervisor' ? accountPermissions : undefined,
      gradeName: accountRole === 'student' ? accountGrade : undefined,
      stageId: accountRole === 'student'
        ? accountGrade.includes('ابتدائي')
          ? 'primary'
          : accountGrade.includes('إعدادي')
          ? 'prep'
          : 'secondary'
        : undefined,
    });
    setEditingAccount(null);
  };

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

  const handleFetchYoutubeVideos = async (loadMore = false) => {
    const channelId = youtubeChannelId.trim();
    if (!/^UC[\w-]{22}$/.test(channelId)) {
      setYoutubeImportError('أدخل معرف قناة YouTube صالحًا، ويبدأ عادةً بـ UC.');
      return;
    }
    setIsLoadingYoutubeVideos(true);
    setYoutubeImportError(null);
    setYoutubeImportNotice(null);
    if (!loadMore) {
      setYoutubeVideos([]);
      setSelectedYoutubeVideoIds([]);
      setYoutubeNextPageToken(null);
    }

    try {
      const response = await fetch('/api/youtube/channel-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          maxResults: 50,
          ...(loadMore && youtubeNextPageToken ? { pageToken: youtubeNextPageToken } : {}),
        }),
      });
      const data = await response.json() as YouTubeChannelVideosResponse;
      if (!response.ok) throw new Error(data.error || 'تعذر جلب فيديوهات القناة.');
      const fetchedVideos = Array.isArray(data.videos) ? data.videos : [];
      if (!loadMore && data.source === 'public-feed') {
        setYoutubeImportNotice(
          fetchedVideos.length > 0
            ? 'تم جلب أحدث فيديوهات القناة العامة دون API key. حدّد الفيديوهات ثم اضغط «استيراد المحدد».'
            : 'لم يتم العثور على فيديوهات عامة في قناة اليوتيوب.'
        );
      } else if (!loadMore && fetchedVideos.length === 0) {
        setYoutubeImportNotice('لم يتم العثور على فيديوهات عامة في قناة اليوتيوب.');
      }
      setYoutubeVideos((current) => {
        const combined = loadMore ? [...current, ...fetchedVideos] : fetchedVideos;
        return [...new Map(combined.map((video) => [video.videoId, video])).values()];
      });
      setSelectedYoutubeVideoIds((current) => {
        const fetchedIds = fetchedVideos
          .filter((video) => !importedYouTubeVideoIds.has(video.videoId))
          .map((video) => video.videoId);
        return [...new Set(loadMore ? [...current, ...fetchedIds] : fetchedIds)];
      });
      setYoutubeNextPageToken(data.nextPageToken || null);
    } catch (error) {
      console.error('تعذر استيراد فيديوهات قناة YouTube.', error);
      setYoutubeImportError(error instanceof Error ? error.message : 'تعذر جلب فيديوهات القناة.');
    } finally {
      setIsLoadingYoutubeVideos(false);
    }
  };

  const handleImportSelectedYoutubeVideos = () => {
    if (!canManage('lessons')) {
      setYoutubeImportError('ليس لديك صلاحية إدارة الدروس.');
      return;
    }
    if (selectedYoutubeVideos.length === 0) {
      setYoutubeImportError('اختر فيديو واحدًا على الأقل لاستيراده.');
      return;
    }

    selectedYoutubeVideos.forEach((video) => {
      const description = video.description.trim();
      const lesson: LessonItem = {
        id: `yt-${video.videoId}`,
        title: video.title,
        stageId: youtubeStageId,
        gradeName: youtubeGrade,
        subject: youtubeSubject.trim() || 'شرح عام',
        videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        duration: 'فيديو تعليمي على YouTube',
        description: description || `شرح تعليمي من قناة YouTube: ${video.title}`,
        summaryPoints: [],
        views: 0,
        likes: 0,
        questions: [],
      };
      onAddLesson(lesson);
    });

    setYoutubeImportNotice(`تم استيراد ${selectedYoutubeVideos.length} فيديو إلى ${youtubeGrade}.`);
    setYoutubeImportError(null);
    setSelectedYoutubeVideoIds([]);
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
    if (!newQuizTitle.trim() || !newQuizSubject.trim()) return;
    if (newQuizQuestions.some((question) =>
      !question.question.trim() || question.options.some((option) => !option.trim())
    )) {
      alert('يرجى كتابة نص كل سؤال وجميع الاختيارات قبل نشر الاختبار.');
      return;
    }

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
      passingScore: Number(newQuizPassing),
      passingScoreType: 'percentage',
      questions: newQuizQuestions.map((question) => ({
        ...question,
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()),
        explanation: question.explanation.trim(),
      })),
    };

    if (onAddQuiz) {
      onAddQuiz(item);
      setNewQuizTitle('');
      setNewQuizQuestions([{
        id: `question-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
      }]);
      alert('تمت إضافة الاختبار بنجاح في بنك الأسئلة!');
    }
  };

  const handleCreateUsefulLink = (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddUsefulLink) return;
    try {
      const url = new URL(newLinkUrl.trim());
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        alert('يجب أن يبدأ الرابط بـ https:// أو http://.');
        return;
      }
      onAddUsefulLink({
        id: `link-${crypto.randomUUID()}`,
        title: newLinkTitle.trim(),
        url: url.toString(),
        description: newLinkDescription.trim(),
        category: newLinkCategory.trim(),
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkDescription('');
      alert('تم نشر الرابط في قسم روابط تهمك.');
    } catch {
      alert('يرجى إدخال رابط صحيح يبدأ بـ https:// أو http://.');
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
  const filteredRegisteredUsers = registeredUsers.filter((user) => {
    const query = accountSearchQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    const roleLabel = user.role === 'admin'
      ? user.supervisorTitle || (isSupervisor(user) ? 'مشرف' : 'أدمن')
      : user.role === 'parent' ? 'ولي أمر' : 'طالب';
    return `${user.name} ${user.email} ${roleLabel}`.toLocaleLowerCase().includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-right">
      {/* Top Segmented Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Tab Button (Shown for admins) */}
          {currentUser?.role === 'admin' && (
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
              {currentUser?.name || 'مدير المنصة'} ({isPlatformOwner ? 'مدير المنصة' : currentUser?.supervisorTitle || 'مشرف بصلاحيات محددة'})
            </span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. ADMIN CMS CONTROL CENTER                                   */}
      {/* ============================================================== */}
      {activeTab === 'admin' && currentUser?.role === 'admin' && (
        <div className="space-y-6">
          {/* Admin Hero Header */}
          <div className="admin-console-hero bg-gradient-to-l from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
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

            {canManage('backup') && <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onExportBackup}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>نسخة احتياطية (JSON)</span>
              </button>
            </div>}
          </div>
          {availableAdminTabs.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              لم يتم منحك صلاحيات لإدارة أقسام لوحة التحكم. تواصل مع مدير المنصة لتحديث صلاحياتك.
            </div>
          )}

          {/* CMS Sub-Navigation Tabs */}
          <div className="admin-cms-nav flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto text-xs font-bold">
            {canManage('lessons') && <button
              onClick={() => setAdminCmsTab('lessons')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'lessons'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>إدارة وتعديل الدروس ({lessons.length})</span>
            </button>}

            {canManage('quizzes') && <button
              onClick={() => setAdminCmsTab('quizzes')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'quizzes'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>بنك الاختبارات والأسئلة ({quizzes.length})</span>
            </button>}

            {canManage('links') && <button
              onClick={() => setAdminCmsTab('links')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'links'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>روابط تهمك ({usefulLinks.length})</span>
            </button>}

            {canManage('announcements') && <button
              onClick={() => setAdminCmsTab('announcements')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'announcements'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>شريط التنبيهات والإعلانات</span>
            </button>}

            {canManage('students') && <button
              onClick={() => setAdminCmsTab('students')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'students'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الطلاب ونقاط الـ XP</span>
            </button>}

            {canManage('accounts') && <button
              onClick={() => setAdminCmsTab('accounts')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'accounts'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>إدارة الحسابات ({registeredUsers.length})</span>
            </button>}

            {canManage('backup') && <button
              onClick={() => setAdminCmsTab('backup')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                adminCmsTab === 'backup'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>الاستضافة والنسخ الاحتياطي</span>
            </button>}
          </div>

          {/* SUBTAB 1: LESSONS CMS (Add, Edit, Delete, Filter) */}
          {adminCmsTab === 'lessons' && canManage('lessons') && (
            <div className="space-y-6">
              <section className="rounded-3xl border border-red-200 bg-gradient-to-br from-white via-red-50/40 to-slate-50 p-5 shadow-sm dark:border-red-950/70 dark:from-slate-900 dark:via-red-950/10 dark:to-slate-900 sm:p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-red-100 pb-4 dark:border-red-950/60 sm:flex-row sm:items-center">
                  <div className="text-right">
                    <h3 className="flex items-center gap-2 font-heading text-base font-extrabold text-slate-900 dark:text-white">
                      <Youtube className="h-5 w-5 text-red-600" />
                      <span>استيراد شروحات قناة YouTube بالجملة</span>
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      اجلب فيديوهات القناة، اختر ما يناسب المرحلة والصف والمادة، ثم أضفها إلى قائمة الدروس دفعة واحدة.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-[11px] font-extrabold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    حتى 50 فيديو في كل صفحة
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 lg:col-span-2">
                    معرف القناة
                    <input
                      type="text"
                      value={youtubeChannelId}
                      onChange={(event) => setYoutubeChannelId(event.target.value)}
                      placeholder="مثال: UCxxxxxxxxxxxxxxxxxxxxxx"
                      dir="ltr"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left font-mono dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    المرحلة الدراسية
                    <select
                      value={youtubeStageId}
                      onChange={(event) => {
                        const stageId = event.target.value as LessonItem['stageId'];
                        const stage = STAGES.find((item) => item.id === stageId);
                        setYoutubeStageId(stageId);
                        setYoutubeGrade(stage?.years[0] || '');
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الصف المستهدف
                    <select
                      value={youtubeGrade}
                      onChange={(event) => setYoutubeGrade(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {STAGES.find((stage) => stage.id === youtubeStageId)?.years.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    المادة التي ستُسند إليها الفيديوهات
                    <input
                      type="text"
                      value={youtubeSubject}
                      onChange={(event) => setYoutubeSubject(event.target.value)}
                      placeholder="مثال: العلوم"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isLoadingYoutubeVideos}
                      onClick={() => void handleFetchYoutubeVideos()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isLoadingYoutubeVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                      {isLoadingYoutubeVideos ? 'جارٍ جلب الفيديوهات...' : 'جلب فيديوهات القناة'}
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  استخدم معرف القناة الذي يبدأ بـ UC، وليس اسم المستخدم أو رابط القناة. مفتاح YouTube API مطلوب على الخادم فقط.
                </p>
                {youtubeImportError && (
                  <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    {youtubeImportError}
                  </p>
                )}
                {youtubeImportNotice && (
                  <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {youtubeImportNotice}
                  </p>
                )}

                {youtubeVideos.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        الفيديوهات المتاحة: {youtubeVideos.length}
                        {importedYouTubeVideoIds.size > 0 && ` · موجودة مسبقًا: ${youtubeVideos.length - selectableYoutubeVideos.length}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedYoutubeVideoIds(selectableYoutubeVideos.map((video) => video.videoId))}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          تحديد غير المستورد
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedYoutubeVideoIds([])}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          إلغاء التحديد
                        </button>
                        <button
                          type="button"
                          disabled={selectedYoutubeVideos.length === 0}
                          onClick={handleImportSelectedYoutubeVideos}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          استيراد المحدد ({selectedYoutubeVideos.length})
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[430px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
                      {youtubeVideos.map((video) => {
                        const alreadyImported = importedYouTubeVideoIds.has(video.videoId);
                        return (
                          <label
                            key={video.videoId}
                            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                              alreadyImported
                                ? 'border-slate-100 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                                : 'border-slate-100 bg-white hover:border-red-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={alreadyImported}
                              checked={selectedYoutubeVideoIds.includes(video.videoId) && !alreadyImported}
                              onChange={(event) => setSelectedYoutubeVideoIds((current) =>
                                event.target.checked
                                  ? [...new Set([...current, video.videoId])]
                                  : current.filter((id) => id !== video.videoId)
                              )}
                              className="h-4 w-4 accent-red-600"
                            />
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt="" loading="lazy" className="h-16 w-28 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800" />
                            ) : (
                              <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30">
                                <Youtube className="h-6 w-6" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1 text-right">
                              <span className="line-clamp-2 block text-xs font-extrabold text-slate-800 dark:text-slate-100">{video.title}</span>
                              <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
                                {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('ar-EG') : 'تاريخ النشر غير متاح'}
                                {alreadyImported ? ' · تم استيراده مسبقًا' : ''}
                              </span>
                            </span>
                            <a
                              href={`https://www.youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                              aria-label={`فتح فيديو ${video.title} على يوتيوب`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </label>
                        );
                      })}
                    </div>

                    {youtubeNextPageToken && (
                      <button
                        type="button"
                        disabled={isLoadingYoutubeVideos}
                        onClick={() => void handleFetchYoutubeVideos(true)}
                        className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        {isLoadingYoutubeVideos ? 'جارٍ تحميل المزيد...' : 'تحميل 50 فيديو أخرى'}
                      </button>
                    )}
                  </div>
                )}
              </section>

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
          {adminCmsTab === 'quizzes' && canManage('quizzes') && (
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

                  <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">أسئلة الاختبار</h4>
                        <p className="mt-1 text-[11px] text-slate-500">أضف سؤالًا واكتب اختياراته وحدد الإجابة الصحيحة.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewQuizQuestions((questions) => [...questions, {
                          id: `question-${crypto.randomUUID()}`,
                          question: '',
                          options: ['', '', '', ''],
                          correctIndex: 0,
                          explanation: '',
                        }])}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 font-extrabold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                      >
                        <Plus className="h-4 w-4" />
                        إضافة سؤال
                      </button>
                    </div>
                    {newQuizQuestions.map((question, questionIndex) => (
                      <section key={question.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-200">السؤال {questionIndex + 1}</h5>
                          {newQuizQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setNewQuizQuestions((questions) => questions.filter((item) => item.id !== question.id))}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف السؤال
                            </button>
                          )}
                        </div>
                        <textarea
                          required
                          rows={2}
                          value={question.question}
                          onChange={(event) => setNewQuizQuestions((questions) => questions.map((item) =>
                            item.id === question.id ? { ...item, question: event.target.value } : item
                          ))}
                          placeholder="اكتب نص السؤال"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctIndex === optionIndex}
                                onChange={() => setNewQuizQuestions((questions) => questions.map((item) =>
                                  item.id === question.id ? { ...item, correctIndex: optionIndex } : item
                                ))}
                                aria-label={`تحديد الاختيار ${optionIndex + 1} إجابة صحيحة`}
                              />
                              <input
                                required
                                value={option}
                                onChange={(event) => setNewQuizQuestions((questions) => questions.map((item) =>
                                  item.id === question.id
                                    ? { ...item, options: item.options.map((current, index) => index === optionIndex ? event.target.value : current) }
                                    : item
                                ))}
                                placeholder={`الاختيار ${optionIndex + 1}${question.correctIndex === optionIndex ? ' (الصحيح)' : ''}`}
                                className="min-w-0 flex-1 bg-transparent py-2.5 outline-none"
                              />
                            </label>
                          ))}
                        </div>
                        <input
                          value={question.explanation}
                          onChange={(event) => setNewQuizQuestions((questions) => questions.map((item) =>
                            item.id === question.id ? { ...item, explanation: event.target.value } : item
                          ))}
                          placeholder="شرح الإجابة (اختياري، يظهر بعد التسليم)"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </section>
                    ))}
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
                            {getQuizPassingPercentage(q)}%
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

          {adminCmsTab === 'links' && canManage('links') && (
            <div className="space-y-6">
              <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm dark:border-teal-900/60 dark:bg-slate-900">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    <LinkIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-slate-900 dark:text-white">إضافة رابط مفيد</h3>
                    <p className="mt-1 text-xs text-slate-500">تظهر الروابط المنشورة للطلاب في قسم «روابط تهمك».</p>
                  </div>
                </div>
                <form onSubmit={handleCreateUsefulLink} className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    اسم الرابط
                    <input required value={newLinkTitle} onChange={(event) => setNewLinkTitle(event.target.value)} placeholder="اسم الموقع أو الخدمة" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    الرابط
                    <input required type="url" value={newLinkUrl} onChange={(event) => setNewLinkUrl(event.target.value)} placeholder="https://example.edu" dir="ltr" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-mono dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    التصنيف
                    <input required value={newLinkCategory} onChange={(event) => setNewLinkCategory(event.target.value)} placeholder="مصادر تعليمية" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    وصف مختصر
                    <input value={newLinkDescription} onChange={(event) => setNewLinkDescription(event.target.value)} placeholder="ما فائدة هذا الرابط؟" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-teal-600">
                    <Plus className="h-4 w-4" />
                    نشر الرابط
                  </button>
                </form>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h4 className="mb-4 font-heading text-sm font-extrabold text-slate-900 dark:text-white">الروابط المنشورة ({usefulLinks.length})</h4>
                {usefulLinks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">لا توجد روابط مضافة.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usefulLinks.map((link) => (
                      <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{link.title}</p>
                          <span dir="ltr" className="block truncate text-left text-[11px] text-teal-700 dark:text-teal-300">{link.url}</span>
                        </div>
                        {onDeleteUsefulLink && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`حذف الرابط "${link.title}"؟`)) onDeleteUsefulLink(link.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            حذف
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* SUBTAB 3: ANNOUNCEMENTS CMS */}
          {adminCmsTab === 'announcements' && canManage('announcements') && (
            <div className="account-management-panel bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
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
          {adminCmsTab === 'students' && canManage('students') && (
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

          {adminCmsTab === 'accounts' && canManage('accounts') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>إدارة المستخدمين المسجلين ({registeredUsers.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    تعديل بيانات الحسابات والأدوار أو تغيير كلمات المرور وحذف الحسابات المسجلة محلياً.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2">
                    ملاحظة: التخزين محلي في هذا المتصفح فقط، ولا يحمي الحسابات من مالك الجهاز أو من تعديل localStorage.
                  </p>
                </div>
                <button type="button" onClick={beginAccountCreate} className="shrink-0 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>إضافة مستخدم</span>
                </button>
              </div>

              {(editingAccount || isCreatingAccount) && (
                <form onSubmit={handleSaveAccount} className="supervisor-permissions p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {accountFormMode === 'password' ? `تغيير كلمة مرور ${editingAccount?.name}` : isCreatingAccount ? 'إنشاء حساب مستخدم' : `تعديل بيانات ${editingAccount?.name}`}
                      </h4>
                      {accountRole === 'admin' && accountType === 'supervisor' && (
                        <p className="text-[11px] text-violet-700 dark:text-violet-300 mt-1">
                          {accountPermissions.length} صلاحية محددة مفعلة
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => { setEditingAccount(null); setIsCreatingAccount(false); setAccountPassword(''); setAccountPasswordConfirmation(''); }} className="p-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800" aria-label="إغلاق">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {accountFormMode === 'password' ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        كلمة المرور الجديدة
                        <input type="password" minLength={8} required value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" dir="ltr" autoComplete="new-password" />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تأكيد كلمة المرور
                        <input type="password" minLength={8} required value={accountPasswordConfirmation} onChange={(event) => setAccountPasswordConfirmation(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" dir="ltr" autoComplete="new-password" />
                      </label>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        الاسم
                        <input type="text" required value={accountName} onChange={(event) => setAccountName(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        البريد الإلكتروني
                        <input type="email" required value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" dir="ltr" />
                      </label>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        نوع الحساب
                        <select value={accountRole} onChange={(event) => setAccountRole(event.target.value as AuthUser['role'])} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <option value="student">طالب</option>
                          <option value="parent">ولي أمر</option>
                          {isPlatformOwner && <option value="admin">إدارة</option>}
                        </select>
                      </label>
                      {accountRole === 'admin' && isPlatformOwner && (
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          الصفة الإدارية
                          <select value={accountType} onChange={(event) => setAccountType(event.target.value as 'admin' | 'supervisor')} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <option value="admin">أدمن</option>
                            <option value="supervisor">مشرف بصلاحيات مخصصة</option>
                          </select>
                        </label>
                      )}
                      {accountRole === 'admin' && accountType === 'supervisor' && isPlatformOwner && (
                        <fieldset className="supervisor-permissions sm:col-span-2 rounded-2xl p-4 space-y-4">
                          <legend className="px-1 text-xs font-bold text-violet-700 dark:text-violet-300">هوية المشرف ونطاق صلاحياته</legend>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            المسمى الوظيفي داخل المنصة
                            <input
                              type="text"
                              maxLength={40}
                              value={supervisorTitle}
                              onChange={(event) => setSupervisorTitle(event.target.value)}
                              placeholder="مثال: مشرف المحتوى"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                            />
                          </label>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">قوالب سريعة</p>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">اختَر نقطة بداية ثم عدّل الصلاحيات يدويًا.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { name: 'إدارة المحتوى', permissions: ['lessons', 'quizzes'] as AdminPermission[] },
                                { name: 'شؤون الطلاب', permissions: ['students', 'accounts'] as AdminPermission[] },
                                { name: 'التواصل والإعلانات', permissions: ['announcements'] as AdminPermission[] },
                                { name: 'إدارة شاملة', permissions: Object.keys(ADMIN_PERMISSION_LABELS) as AdminPermission[] },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => setAccountPermissions(preset.permissions)}
                                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
                                >
                                  {preset.name}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setAccountPermissions([])}
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                إلغاء الكل
                              </button>
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {(Object.entries(ADMIN_PERMISSION_LABELS) as [AdminPermission, string][]).map(([permission, label]) => (
                              <label key={permission} className="permission-chip flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={accountPermissions.includes(permission)}
                                  onChange={(event) => setAccountPermissions((current) =>
                                    event.target.checked
                                      ? [...new Set([...current, permission])]
                                      : current.filter((item) => item !== permission)
                                  )}
                                  className="accent-violet-600"
                                />
                                <span className="flex-1">{label}</span>
                                {accountPermissions.includes(permission) && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )}
                      {accountRole === 'student' && (
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          الصف الدراسي
                          <select value={accountGrade} onChange={(event) => setAccountGrade(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {STAGES.flatMap((stage) => stage.years).map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                          </select>
                        </label>
                      )}
                      {isCreatingAccount && (
                        <>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            كلمة المرور (8 أحرف على الأقل)
                            <input type="password" minLength={8} required value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" dir="ltr" autoComplete="new-password" />
                          </label>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            تأكيد كلمة المرور
                            <input type="password" minLength={8} required value={accountPasswordConfirmation} onChange={(event) => setAccountPasswordConfirmation(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" dir="ltr" autoComplete="new-password" />
                          </label>
                        </>
                      )}
                    </div>
                  )}
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>{accountFormMode === 'password' ? 'حفظ كلمة المرور' : 'حفظ بيانات الحساب'}</span>
                  </button>
                </form>
              )}

              {registeredUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">لا توجد حسابات مسجلة حتى الآن.</p>
              ) : (
                <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'إجمالي الحسابات', count: registeredUsers.length, color: 'text-slate-800 dark:text-white' },
                    { label: 'المشرفون', count: registeredUsers.filter((user) => user.role === 'admin' && isSupervisor(user)).length, color: 'text-violet-700 dark:text-violet-300' },
                    { label: 'الطلاب وأولياء الأمور', count: registeredUsers.filter((user) => user.role !== 'admin').length, color: 'text-emerald-700 dark:text-emerald-300' },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{metric.label}</p>
                      <p className={`mt-1 text-2xl font-black tabular-nums ${metric.color}`}>{metric.count}</p>
                    </div>
                  ))}
                </div>
                <label className="relative block">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={accountSearchQuery}
                    onChange={(event) => setAccountSearchQuery(event.target.value)}
                    placeholder="ابحث بالاسم أو البريد الإلكتروني أو نوع الحساب"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs min-w-[720px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">الاسم</th>
                        <th className="p-3">البريد الإلكتروني</th>
                        <th className="p-3">الدور</th>
                        <th className="p-3">تاريخ التسجيل</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRegisteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{user.name}{user.id === currentUser?.id && <span className="mr-2 text-[10px] text-emerald-600">(الحساب الحالي)</span>}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300" dir="ltr">{user.email}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {user.role === 'admin' && isSupervisor(user) ? (
                              <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                {user.supervisorTitle || 'مشرف'} · {user.permissions?.length || 0} صلاحية
                              </span>
                            ) : user.role === 'admin' ? 'مدير المنصة' : user.role === 'parent' ? 'ولي أمر' : 'طالب'}
                          </td>
                          <td className="p-3 text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '—'}</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              {(isPlatformOwner || user.role !== 'admin') && (
                                <>
                                  <button type="button" onClick={() => beginAccountEdit(user, 'profile')} className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                    <Edit3 className="w-3.5 h-3.5" /><span>تعديل</span>
                                  </button>
                                  <button type="button" onClick={() => beginAccountEdit(user, 'password')} className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                                    <KeyRound className="w-3.5 h-3.5" /><span>كلمة المرور</span>
                                  </button>
                                  <button type="button" onClick={() => {
                                    if (window.confirm(`هل تريد حذف حساب ${user.name}؟`)) onDeleteRegisteredUser(user.id);
                                  }} className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" /><span>حذف</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRegisteredUsers.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">لا توجد حسابات تطابق عبارة البحث.</p>
                  )}
                </div>
                </>
              )}
            </div>
          )}

          {/* SUBTAB 5: BACKUP & HOSTING */}
          {adminCmsTab === 'backup' && canManage('backup') && (
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
