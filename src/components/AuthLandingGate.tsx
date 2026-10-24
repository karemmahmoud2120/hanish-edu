import React, { useState } from 'react';
import { STAGES } from '../data/curriculumData';
import { AuthUser } from './AuthModal';
import { AcademicLogo } from './AcademicLogo';
import {
  Lock,
  Mail,
  User,
  Shield,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  BookOpen,
  Award,
  Sun,
  Moon,
  ChevronLeft,
  Crown,
  FileSpreadsheet,
  Bot,
  Zap,
  Flame,
  Check,
  Compass,
  Atom,
  Dna,
  Binary,
  Volume2,
  X,
  Play,
  TrendingUp,
  Palette,
  Globe2,
  Info,
  Layers,
} from 'lucide-react';
import { PLATFORM_IMAGES } from '../assets/images';
import { AboutUs } from './AboutUs';
import { KnowYourCountry } from './KnowYourCountry';
import { createPasswordCredential, readRegisteredUsers, saveRegisteredUsers, verifyPassword } from '../utils/authStorage';
import { authenticateWithSocialProvider } from '../utils/socialAuth';

interface AuthLandingGateProps {
  onLoginSuccess: (user: AuthUser) => void;
  isDark: boolean;
  toggleTheme: () => void;
  selectedGrade: string;
  activeBgTheme?: string;
  onOpenBgSelector?: () => void;
}

export const AuthLandingGate: React.FC<AuthLandingGateProps> = ({
  onLoginSuccess,
  isDark,
  toggleTheme,
  selectedGrade,
  activeBgTheme = 'academic',
  onOpenBgSelector,
}) => {
  // Modal / Drawer state for quick login
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [role, setRole] = useState<'student' | 'parent' | 'admin' | 'supervisor'>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Preview modal for About Us and Know Your Country
  const [previewSection, setPreviewSection] = useState<'none' | 'about-us' | 'know-your-country'>('none');
  const [heroVisualMode, setHeroVisualMode] = useState<'library_photo' | 'cockpit'>('library_photo');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentGrade, setCurrentGrade] = useState(selectedGrade || 'الصف الأول الإعدادي');
  const [parentLinkCode, setParentLinkCode] = useState('');

  // Interactive Stage Showcase Tab
  const [activeStageTab, setActiveStageTab] = useState<'primary' | 'prep' | 'secondary'>('prep');

  // Loading & error states
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate unique student link code
  const generateLinkCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HN';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleQuickStudentLogin = (gradeParam?: string) => {
    if (gradeParam) setCurrentGrade(gradeParam);
    setAuthMode('register');
    openAuthWithRole('student');
  };

  const handleQuickParentLogin = () => {
    setAuthMode('register');
    openAuthWithRole('parent');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (role !== 'student' && role !== 'parent') {
      setErrorMsg('تسجيل الدخول الاجتماعي متاح للطلاب وأولياء الأمور فقط.');
      return;
    }
    setErrorMsg(null);
    setIsSocialLoading(provider);
    try {
      const user = await authenticateWithSocialProvider(provider, role);
      onLoginSuccess(user);
    } catch (error) {
      console.error(`تعذر تسجيل الدخول عبر ${provider}.`, error);
      setErrorMsg(error instanceof Error ? error.message : 'تعذر تسجيل الدخول عبر هذا المزود.');
    } finally {
      setIsSocialLoading(null);
    }
  };

  // Email Submit Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    let savedUsers: AuthUser[];
    try {
      savedUsers = readRegisteredUsers();
    } catch (error) {
      console.error('تعذر قراءة سجل الحسابات المحفوظ.', error);
      setErrorMsg('تعذر قراءة سجل الحسابات. يرجى إعادة تحميل الصفحة.');
      setIsSubmitting(false);
      return;
    }
    const existingUser = savedUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
    try {
      if (authMode === 'login') {
        if (!existingUser) {
          setErrorMsg('لا يوجد حساب بهذا البريد الإلكتروني. أنشئ حساباً أولاً.');
          return;
        }
        const verification = await verifyPassword(existingUser, password);
        if (!verification.valid) {
          setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
          return;
        }
        if (verification.upgradedUser) {
          saveRegisteredUsers(savedUsers.map((user) => user.id === existingUser.id ? verification.upgradedUser! : user));
        }
        onLoginSuccess(verification.upgradedUser || existingUser);
        return;
      }

      if (role === 'admin' || role === 'supervisor') {
        setErrorMsg('إنشاء حسابات الإدارة متاح لمدير المنصة فقط.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
        return;
      }
      if (existingUser) {
        setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
        return;
      }
      const credential = await createPasswordCredential(password);
      const stageId = currentGrade.includes('ابتدائي')
        ? 'primary'
        : currentGrade.includes('إعدادي')
        ? 'prep'
        : 'secondary';
      const assignedRole = role;
      const user: AuthUser = {
        id: `usr-${crypto.randomUUID()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        accountType: undefined,
        provider: 'email',
        ...credential,
        gradeName: assignedRole === 'student' ? currentGrade : undefined,
        stageId: assignedRole === 'student' ? stageId : undefined,
        linkCode: assignedRole === 'student' ? generateLinkCode() : parentLinkCode || undefined,
        createdAt: new Date().toISOString(),
      };
      saveRegisteredUsers([user, ...savedUsers]);
      onLoginSuccess(user);
    } catch (error) {
      console.error('تعذر إكمال عملية المصادقة.', error);
      setErrorMsg(error instanceof Error ? error.message : 'تعذر إكمال عملية المصادقة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAuthWithRole = (targetRole: 'student' | 'parent' | 'admin' | 'supervisor') => {
    setRole(targetRole);
    setErrorMsg(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className={`min-h-screen theme-bg-${activeBgTheme || 'academic'} text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white`}>
      {/* 3-Zone Top Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Wordmark Zone */}
          <div className="flex items-center gap-3">
            <AcademicLogo className="w-11 h-11" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  منصة عائلة حنيش التعليمية
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  الإصدار 2026
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                الصرح التعليمي الأكاديمي للمناهج المصرية والذكاء الاصطناعي
              </span>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-extrabold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => openAuthWithRole('student')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-500" />
              <span>اعرف بلدك 🇪🇬</span>
            </button>

            <button
              onClick={() => setPreviewSection('about-us')}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-teal-500" />
              <span>من نحن</span>
            </button>

            <a href="#stages" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              المراحل التعليمية
            </a>
            <a href="#ai-tutor" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-500" />
              <span>مستر يونس AI</span>
            </a>
            <a href="#parent" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              بوابة ولي الأمر
            </a>
            <a href="#security" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              أمان المنصة
            </a>
          </nav>

          {/* Action Zone: Theme Toggle & Login CTA */}
          <div className="flex items-center gap-2.5">
            {onOpenBgSelector && (
              <button
                onClick={onOpenBgSelector}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="تغيير خلفية ونمط المنصة"
                aria-label="خلفيات المنصة"
              >
                <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="تبديل المظهر"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => openAuthWithRole('student')}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 transition flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>تسجيل الدخول / البدء</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Landing Showcase Content */}
      <main className="flex-1 w-full space-y-20 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left/Start Column: Vision & Calls to action */}
            <div className="lg:col-span-7 space-y-6 text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black shadow-sm">
                <span>🇪🇬</span>
                <span>المناهج المصرية المعتمدة 2026 · الذكاء الاصطناعي الأكاديمي</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                تعلّم بذكاء، وتفوّق بشغف في{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-teal-500 to-indigo-600">
                  منصة عائلة حنيش 🎓
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                بوابتك الرقمية الشاملة لجميع صفوف التعليم المصري (الابتدائي، الإعدادي، والثانوي).
                نجمع لك بين شروحات المناهج المفصلة، معلم الذكاء الاصطناعي <strong>مستر يونس</strong> بصوت عربي طبيعي،
                استوديو الرسوم التوضيحية العلمية، والمتابعة اللحظية لولي الأمر.
              </p>

              {/* Quick Action Role Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => openAuthWithRole('student')}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-700/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>دخول الطلاب والمتفوقين</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>

                <button
                  onClick={() => openAuthWithRole('parent')}
                  className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-extrabold text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <HeartHandshake className="w-5 h-5 text-blue-600" />
                  <span>بوابة ولي الأمر</span>
                </button>
              </div>

              {/* Registration shortcut */}
              <div className="pt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">ابدأ باستخدام حسابك أو أنشئ حساباً جديداً.</span>
                <button
                  onClick={() => handleQuickStudentLogin()}
                  className="text-emerald-600 dark:text-emerald-400 font-black hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>إنشاء حساب طالب</span>
                </button>
              </div>
            </div>

            {/* Hero Right/End Column: Real Educational Library Photography & Mockup Switcher */}
            <div className="lg:col-span-5 space-y-3">
              {/* Dual Visual Switcher Header */}
              <div className="p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('library_photo')}
                  className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    heroVisualMode === 'library_photo'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بيئة المذاكرة والتميز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('cockpit')}
                  className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    heroVisualMode === 'cockpit'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>لوحة تحكم الطالب</span>
                </button>
              </div>

              {heroVisualMode === 'library_photo' ? (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl group">
                  <div className="relative h-72 sm:h-80 overflow-hidden">
                    <img
                      src={PLATFORM_IMAGES.eduHeroStudents}
                      alt="طلاب مصريون في مكتبة أكاديمية"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                      <AcademicLogo className="w-3.5 h-3.5" />
                      <span>صرح أكاديمي متميز لطلاب مصر</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 bg-white dark:bg-slate-900 text-right">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-black text-slate-900 dark:text-white text-base">
                        مجتمع علمي محفز على الإتقان
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        دروس · بنوك أسئلة · ذكاء اصطناعي
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      نوفر لأبنائنا في مختلف مراحل التعليم بيئة هادئة وقورة تجمع بين كتب الوزارة وأحدث تقنيات الفهم السريع والخرائط الذهنية.
                    </p>
                    <button
                      onClick={() => openAuthWithRole('student')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>ابدأ رحلة التفوق الآن</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Cockpit Preview */
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 shadow-2xl border border-emerald-900/50 space-y-5 text-right">
                  {/* Glowing status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-300">مباشر · لوحة الطالب الذكية</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">الصف الأول الإعدادي</span>
                  </div>

                  {/* Simulated Student Cockpit Header */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">مرحباً بك يا بطل 🌟</span>
                    <h3 className="text-xl font-heading font-black text-white">أحمد محمود حنيش</h3>
                    <div className="flex items-center gap-3 text-xs text-emerald-400 pt-1">
                      <span className="flex items-center gap-1 font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>5 أيام متتالية</span>
                      </span>
                      <span>·</span>
                      <span className="text-slate-300">المستوى 4 · بطل العلوم</span>
                    </div>
                  </div>

                  {/* Progress bar preview */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                      <span>نقاط الخبرة: 850 / 1000 XP</span>
                      <span className="text-emerald-400 font-bold">85%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-emerald-400 to-teal-400 w-[85%]" />
                    </div>
                  </div>

                  {/* Mr Younis AI snippet */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-blue-400" />
                        <span>مستر يونس (معلم الذكاء الاصطناعي)</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        <span>صوت عربي نقي</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      "أهلاً يا أحمد! التفاعلات الكيميائية ببساطة هي كسر روابط المواد المتفاعلة لتكوين روابط جديدة تنتج مواد بخصائص مختلفة تماماً!"
                    </p>
                  </div>

                  {/* Direct Action */}
                  <button
                    onClick={() => openAuthWithRole('student')}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>انضم الآن وافتح حسابك الكامل</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Key Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400 font-mono">
                +12,400
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">طالب وطالبة مسجلين</p>
              <span className="text-[10px] text-slate-400 block">في جميع محافظات مصر</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-heading font-black text-blue-600 dark:text-blue-400 font-mono">
                +480
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">درس تفاعلي وملزمة</p>
              <span className="text-[10px] text-slate-400 block">شروحات فيديو واختبارات</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-heading font-black text-amber-500 font-mono">
                100%
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">مطابقة للمناهج المصرية</p>
              <span className="text-[10px] text-slate-400 block">وفق أحدث كتب الوزارة</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-heading font-black text-purple-600 dark:text-purple-400 font-mono">
                99.4%
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">معدل تفوق الطلاب</p>
              <span className="text-[10px] text-slate-400 block">نتائج الامتحانات الشهرية والنهائية</span>
            </div>
          </div>

          {/* EGYPTIAN NATIONAL HERITAGE & DISCOVERY BANNER */}
          <div className="mt-14 rounded-3xl overflow-hidden border border-slate-800 relative bg-slate-950 text-slate-100 shadow-2xl">
            <div className="grid lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-6 sm:p-10 space-y-4 text-right relative z-10 bg-slate-950/90 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span>جديد المنصة: موسوعة اعرف بلدك مصر 🇪🇬</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-amber-300 leading-tight">
                  اكتشف عبقرية مصر: <span className="text-emerald-400">27 محافظة</span>، 7000 عام حضارة، ورواد نوبل والعلوم
                </h2>
                <p className="text-slate-100 text-xs sm:text-sm leading-relaxed font-medium">
                  قسماً تفاعلياً جديداً ومستقلاً يتيح للطلاب وأولياء الأمور استكشاف تاريخ كل محافظة ومعالمها ومشاهيرها، مع مسابقة تفاعلية وطنية تكافئك بنقاط الخبرة وشهادة التقدير.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => openAuthWithRole('student')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>تصفح قسم اعرف بلدك الآن مجاناً</span>
                  </button>
                  <button
                    onClick={() => setPreviewSection('about-us')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>تعرف على قصة المنصة (من نحن)</span>
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 relative h-56 sm:h-72 lg:h-full min-h-[240px]">
                <img
                  src={PLATFORM_IMAGES.knowEgyptBanner}
                  alt="مصر مهد الحضارات ومنارة العلم"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-slate-950/40" />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* EDUCATIONAL STAGES SHOWCASE */}
        <section id="stages" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              تغطية تعليمية شاملة
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white">
              المراحل الدراسية في منصة حنيش 📚
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              تم إعداد وتنسيق محتوى كل مرحلة وفق الخصائص العمرية ومتطلبات نظام التقويم المصري الحديث.
            </p>
          </div>

          {/* Stage Selector Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveStageTab('primary')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeStageTab === 'primary'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              المرحلة الابتدائية (الصفوف 1 - 6)
            </button>

            <button
              onClick={() => setActiveStageTab('prep')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeStageTab === 'prep'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              المرحلة الإعدادية (الصفوف 1 - 3)
            </button>

            <button
              onClick={() => setActiveStageTab('secondary')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeStageTab === 'secondary'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              المرحلة الثانوية (الصفوف 1 - 3)
            </button>
          </div>

          {/* Stage Content Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl grid md:grid-cols-3 gap-6 items-center text-right">
            {activeStageTab === 'primary' && (
              <>
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                    <Award className="w-3.5 h-3.5" />
                    <span>تأسيس المهارات وبناء الشغف العلمي</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                    التعليم الابتدائي: من الصف الأول حتى السادس الابتدائي
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    نقدم للأطفال أسلوباً تعليمياً شيقاً يجمع بين الرسوم الكرتونية الجذابة، تبسيط المفاهيم العلمية والرياضية، وحل التحديات التفاعلية لكسب الأوسمة ونقاط الخبرة.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">🌱 اكتشاف الطبيعة والعلوم</span>
                      <span className="text-[11px] text-slate-500">الحواس، الكائنات الحية، والنظام البيئي.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">🔢 الرياضيات الذكية</span>
                      <span className="text-[11px] text-slate-500">العمليات الحسابية، القياس، والهندسة المبسطة.</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                    🎒
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    ابدأ تجربة المرحلة الابتدائية
                  </h4>
                  <p className="text-[11px] text-slate-500">محتوى ملائم للأعمار من ٦ إلى ١٢ سنة.</p>
                  <button
                    onClick={() => handleQuickStudentLogin('الصف السادس الابتدائي')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
                  >
                    إنشاء حساب للمرحلة الابتدائية
                  </button>
                </div>
              </>
            )}

            {activeStageTab === 'prep' && (
              <>
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                    <Atom className="w-3.5 h-3.5" />
                    <span>بناء التفكير النقدي والمعملي</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                    التعليم الإعدادي: من الصف الأول حتى الثالث الإعدادي (الشهادة الإعدادية)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    تركيز مكثف على العلوم المدمجة: تركيب الذرة، الجدول الدوري الحديث، التفاعلات الكيميائية، انقسام الخلية، والتكاثر في الكائنات الحية مع أسئلة امتحانات المحافظات السابقة.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">⚛️ الكيمياء والفيزياء</span>
                      <span className="text-[11px] text-slate-500">المعادلات الكيميائية، السرعة، والعجلة.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">🧬 الأحياء والكون</span>
                      <span className="text-[11px] text-slate-500">الانقسام الميتوزي والميوزي وتمدد الكون.</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                    🔬
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    ابدأ تجربة المرحلة الإعدادية
                  </h4>
                  <p className="text-[11px] text-slate-500">جاهز لامتحانات الفصل الدراسي الأول والثاني.</p>
                  <button
                    onClick={() => handleQuickStudentLogin('الصف الأول الإعدادي')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
                  >
                    إنشاء حساب للمرحلة الإعدادية
                  </button>
                </div>
              </>
            )}

            {activeStageTab === 'secondary' && (
              <>
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>طريقك للقمة والثانوية العامة</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                    المرحلة الثانوية: الصف الأول، الثاني، والثالث الثانوي العام
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    منظومة متطورة تحاكي نظام التابلت وأسئلة الفهم والتحليل في الكيمياء العضوية، الفيزياء الكهربية والحديثة، والأحياء الجزيئية والـ DNA مع استوديو محاكاة للرسومات العلمية.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">🧪 الكيمياء التخصصية</span>
                      <span className="text-[11px] text-slate-500">الكيمياء الكهربية، الاتزان، والتحليل الكيميائي.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">⚡ الفيزياء والمسائل الحديثة</span>
                      <span className="text-[11px] text-slate-500">قوانين كيرشوف، الحث الكهرومغناطيسي، وأشعة الليزر.</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-purple-50 dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                    🎓
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    ابدأ تجربة المرحلة الثانوية
                  </h4>
                  <p className="text-[11px] text-slate-500">تدريب مكثف على أسئلة قياس مستويات التفكير العليا.</p>
                  <button
                    onClick={() => handleQuickStudentLogin('الصف الثالث الثانوي')}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
                  >
                    إنشاء حساب للمرحلة الثانوية
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* MR YOUNIS AI SPOTLIGHT */}
        <section id="ai-tutor" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 border border-blue-800/40 shadow-2xl grid lg:grid-cols-12 gap-8 items-center text-right">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>الذكاء الاصطناعي الأكاديمي الحصري</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white">
                تحدّث مباشرة مع <span className="text-blue-400">مستر يونس 🤖</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                معلمك الافتراضي الذكي المدعوم بنموذج Google Gemini. يفهم اللهجة المصرية والمصطلحات المدرسية بدقة متناهية،
                ويشرح لك أصعب المسائل الفيزيائية والمعادلات الكيميائية خطوة بخطوة مع توليد رسومات بيانية توضيحية ونطق صوتي عربي ممتع.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>شرح تفاعلي بالصوت العربي الطبيعي والنص المقروء.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توليد رسوم بيانية ومخططات علمية توضيحية في ثوانٍ معدودة.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>متاح طوال اليوم للإجابة عن أسئلة الواجبات والاستعداد للامتحان.</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => openAuthWithRole('student')}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>جرّب التحدث مع مستر يونس الآن</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-3">
                <span className="text-xs font-bold text-slate-400 block">أسئلة شائعة يطرحها الطلاب على مستر يونس:</span>
                
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <span>"يا مستر، إزاي أوازن معادلة تفاعل الصوديوم مع الماء؟"</span>
                  <span className="text-[10px] text-blue-400 font-mono font-bold">كيمياء</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <span>"اشرح لي قانون كيرشوف الأول مع رسم الدائرة الكهربية"</span>
                  <span className="text-[10px] text-purple-400 font-mono font-bold">فيزياء</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                  <span>"ما هي مراحل انقسام السنتروسوم في الخلية الحية؟"</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">أحياء</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PARENT & SUPERVISOR SECTION */}
        <section id="parent" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl grid md:grid-cols-2 gap-8 items-center text-right">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>شراكة حقيقية بين البيت والمدرسة</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
                بوابة ولي الأمر: راقب تقدم ابنك لحظة بلحظة 👨‍👩‍👧‍👦
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                لا مزيد من القلق! بنظام كود الربط السري السريع (مثل HN8293)، يمكن لولي الأمر متابعة درجات الامتحانات،
                نسبة إنجاز الدروس، ساعات المذاكرة الفعلية، وتوصيات المعلمين عبر رسوم بيانية واضحة.
              </p>

              <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>تحديث فوري لدرجات الاختبارات الإلكترونية فور تسليمها.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>متابعة شعلة الالتزام اليومي ومعدل حل المهام الدراسية.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>إمكانية تصدير تقارير الإنجاز بتنسيق رسمي ومشاركتها مع المعلمين.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openAuthWithRole('parent')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
                >
                  الدخول لبوابة ولي الأمر
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">نموذج تقرير ولي الأمر</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">كود الربط: HN7742</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">امتحان مراجعة وحدة الكيمياء</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">19 / 20 (95%)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">اختبار سريع في الفيزياء</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">10 / 10 (100%)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                💡 إشعار المنصة: الطالب أحمد أظهر تقدماً متميزاً بنسبة +15% هذا الأسبوع مع مستر يونس.
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM TRUST & PRIVACY */}
        <section id="security" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-right">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Shield className="w-4 h-4" />
                <span>حماية متقدمة وخصوصية كاملة للطلاب</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                بيئة تعليمية آمنة 100% ومطابقة لمعايير التربية والتعليم 🛡️
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                جميع بيانات الطلاب ودرجات الاختبارات مشفرة ومحفوظة بأعلى درجات الأمان والخصوصية لضمان تجربة تعليمية هادفة وخالية من أي مشتتات.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => openAuthWithRole('student')}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <GraduationCap className="w-4 h-4" />
                <span>انضم كطالب متميز الآن</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* UNIFIED AUTH MODAL / PORTAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="soft-auth-shell relative w-full max-w-lg rounded-[28px] shadow-2xl p-6 sm:p-8 space-y-5 text-right overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-emerald-50 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                  🔐
                </div>
                <div>
                  <h3 className="text-base font-heading font-black text-slate-900 dark:text-white">
                    بوابة الدخول الموحدة للمنصة
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    اختر صفتك وسجّل دخولك للوصول إلى كامل الخدمات
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                حدد نوع الحساب:
              </label>
              <div className="auth-role-pill grid grid-cols-2 gap-2 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'student'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>دخول الطلاب</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('parent');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'parent'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>أولياء الأمور</span>
                </button>
              </div>
            </div>

            {/* Login / Register Toggle */}
            {(role === 'student' || role === 'parent') && (
              <div className="flex items-center justify-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`text-xs font-black pb-2 transition cursor-pointer ${
                    authMode === 'login'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`text-xs font-black pb-2 transition cursor-pointer ${
                    authMode === 'register'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  إنشاء حساب جديد
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Standard Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم بالكامل:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === 'student' ? 'مثال: كريم محمود حنيش' : 'مثال: محمود حنيش'}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'admin'
                        ? 'admin@hanish.edu.eg'
                        : role === 'supervisor'
                        ? 'supervisor@hanish.edu.eg'
                        : 'user@example.com'
                    }
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={authMode === 'register' ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-left"
                    dir="ltr"
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  />
                </div>
                {authMode === 'register' && (
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    تُشتق كلمة المرور قبل حفظها، لكن localStorage محلي ويمكن لمالك الجهاز تعديله؛ لا تستخدم كلمة مرور حساسة.
                  </p>
                )}
              </div>

              {/* Student Grade in Register Mode */}
              {role === 'student' && authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الصف الدراسي:
                  </label>
                  <select
                    value={currentGrade}
                    onChange={(e) => setCurrentGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {STAGES.map((st) => (
                      <optgroup key={st.id} label={st.name}>
                        {st.years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent link code */}
              {role === 'parent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود ربط الطالب (اختياري لمتابعة درجات ابنك):
                  </label>
                  <input
                    type="text"
                    value={parentLinkCode}
                    onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                    placeholder="مثال: HN8293"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase tracking-widest text-center"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-2xl text-white font-black text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : role === 'supervisor'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : role === 'parent'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <span>{isSubmitting ? 'جارٍ التحقق...' : authMode === 'login' ? 'دخول المنصة' : 'إنشاء الحساب وبدء التعلم'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>

            {/* Registration shortcuts */}
            {role === 'student' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">ليس لديك حساب طالب؟</span>
                <button
                  type="button"
                  onClick={() => handleQuickStudentLogin()}
                  className="text-emerald-600 dark:text-emerald-400 font-black hover:underline cursor-pointer"
                >
                  إنشاء حساب طالب
                </button>
              </div>
            )}

            {role === 'parent' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">ليس لديك حساب ولي أمر؟</span>
                <button
                  type="button"
                  onClick={handleQuickParentLogin}
                  className="text-blue-600 dark:text-blue-400 font-black hover:underline cursor-pointer"
                >
                  إنشاء حساب ولي أمر
                </button>
              </div>
            )}

            {/* Social Logins */}
            <div className="space-y-2 pt-2">
              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400">
                  أو الدخول المباشر بحسابك
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isSocialLoading !== null}
                  className="social-button google py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isSocialLoading === 'google' ? 'جارٍ الربط...' : 'Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isSocialLoading !== null}
                  className="social-button facebook py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>{isSocialLoading === 'facebook' ? 'جارٍ الربط...' : 'Facebook'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Exploration Modal: Know Your Country & About Us */}
      {previewSection !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Navigation Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <AcademicLogo className="w-8 h-8" />
                <div>
                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    {previewSection === 'know-your-country' ? '🇪🇬 موسوعة اعرف بلدك مصر' : '📖 من نحن: قصة ورسالة المنصة'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    استكشف محتوى المنصة بحرية ودون الحاجة لتسجيل حساب مسبق
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewSection === 'about-us' ? (
                  <button
                    onClick={() => openAuthWithRole('student')}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer border border-amber-500/20"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>اعرف بلدك</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setPreviewSection('about-us')}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1 cursor-pointer border border-teal-500/20"
                  >
                    <Info className="w-3.5 h-3.5 text-teal-600" />
                    <span>من نحن</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewSection('none')}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-8 overflow-y-auto custom-scroll flex-1">
              {previewSection === 'know-your-country' ? (
                <KnowYourCountry onAddXP={() => {}} />
              ) : (
                <AboutUs
                  onNavigateCurriculum={() => {
                    setPreviewSection('none');
                    handleQuickStudentLogin();
                  }}
                  onNavigateKnowEgypt={() => openAuthWithRole('student')}
                />
              )}
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                أعجبك المحتوى؟ انضم لآلاف المتفوقين في جميع محافظات مصر
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewSection('none');
                    openAuthWithRole('student');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow cursor-pointer"
                >
                  تسجيل الدخول / فتح حساب
                </button>
                <button
                  onClick={() => setPreviewSection('none')}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 text-center transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <AcademicLogo className="w-6 h-6 inline-block" />
            <span>منصة عائلة حنيش التعليمية الأكاديمية · الإصدار المطور 2026</span>
          </div>
          <p>
            منظومة متكاملة لجميع صفوف التعليم المصري مدعومة بالذكاء الاصطناعي الأكاديمي لحماية تفوق وريادة أبنائنا.
          </p>
          <p className="text-[11px] opacity-75">
            🇪🇬 نعتز بروح نصر أكتوبر المجيد ونغرس العزيمة والإصرار في نفوس كل جيل.
          </p>
        </div>
      </footer>
    </div>
  );
};
