import React, { useState, useEffect } from 'react';
import { STAGES } from '../data/curriculumData';
import { AuthUser } from './AuthModal';
import { AcademicLogo } from './AcademicLogo';
import {
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  HeartHandshake,
  Gamepad2,
  Palette,
  Smartphone,
  Download,
  Share2,
  Monitor,
  User,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  GraduationCap,
  Shield,
  KeyRound,
  Bell,
  Eye,
  Globe2,
  Info,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  currentRole: 'student' | 'parent' | 'admin';
  setCurrentRole: (role: 'student' | 'parent' | 'admin') => void;
  isDark: boolean;
  toggleTheme: () => void;
  isNightFocus?: boolean;
  toggleNightFocus?: () => void;
  onOpenBgSelector?: () => void;
  xpPoints: number;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  selectedGrade,
  setSelectedGrade,
  currentRole,
  setCurrentRole,
  isDark,
  toggleTheme,
  isNightFocus = false,
  toggleNightFocus,
  onOpenBgSelector,
  xpPoints,
  currentUser,
  onOpenAuth,
  onLogout,
  unreadNotificationCount = 0,
  onOpenNotifications,
}) => {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  const copyLinkCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Zone 1: Wordmark Brand */}
          <div
            className="flex items-center gap-3 shrink-0 cursor-pointer"
            onClick={() => setCurrentTab('curriculum')}
          >
            <AcademicLogo className="w-11 h-11" />
            <div>
              <span className="font-heading font-extrabold text-lg text-slate-900 dark:text-white leading-tight block">
                منصة عائلة حنيش
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
                بوابة التعليم الأكاديمية المتكاملة
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setCurrentTab('curriculum')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'curriculum'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>المناهج والدروس</span>
            </button>

            <button
              onClick={() => setCurrentTab('know-your-country')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'know-your-country'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe2 className="w-4 h-4 text-amber-600" />
              <span>اعرف بلدك 🇪🇬</span>
            </button>

            <button
              onClick={() => setCurrentTab('about-us')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'about-us'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4 text-teal-600" />
              <span>من نحن</span>
            </button>

            <button
              onClick={() => setCurrentTab('ai-tutor')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'ai-tutor'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>مستر يونس</span>
            </button>

            <button
              onClick={() => setCurrentTab('image-studio')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'image-studio'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-600" />
              <span>الرسوم الذكية</span>
            </button>

            <button
              onClick={() => setCurrentTab('brain-hub')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'brain-hub'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-amber-600" />
              <span>المذاكرة والألعاب</span>
            </button>

            {/* Show Admin Portal tab ONLY if logged in as Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('parent-admin')}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  currentTab === 'parent-admin'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>لوحة الأدمن</span>
              </button>
            )}

            {/* Show Parent Portal tab ONLY if logged in as Parent */}
            {currentUser?.role === 'parent' && (
              <button
                onClick={() => setCurrentTab('parent-admin')}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  currentTab === 'parent-admin'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-indigo-600" />
                <span>بوابة ولي الأمر</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Auth Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs items-center gap-1.5 transition-all cursor-pointer"
              title="تثبيت المنصة كتطبيق على هاتفك أو جهازك"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>حمّل التطبيق</span>
            </button>

            {/* Quick Grade Select */}
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2 px-3 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                title="اختر الصف الدراسي"
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

            {/* User Account / Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition cursor-pointer text-xs"
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-xl object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}

                  <div className="hidden md:block text-right">
                    <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      {currentUser.role === 'student'
                        ? '🎒 طالب'
                        : currentUser.role === 'parent'
                        ? '👨‍👩‍👧 ولي أمر'
                        : '👑 مدير المنصة (Admin)'}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Account Menu Dropdown */}
                {showUserMenu && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 z-50 text-right animate-fade-in text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {currentUser.role === 'admin' ? '👑' : currentUser.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {currentUser.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">{currentUser.email}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>نوع الحساب:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {currentUser.role === 'student'
                            ? 'طالب مسجل'
                            : currentUser.role === 'parent'
                            ? 'ولي أمر'
                            : 'مدير المنصة (Super Admin)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>طريقة الدخول:</span>
                        <span className="font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {currentUser.provider}
                        </span>
                      </div>

                      {currentUser.role === 'student' && currentUser.linkCode && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mt-2 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                              كود ربط ولي الأمر:
                            </span>
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-widest text-sm">
                              {currentUser.linkCode}
                            </span>
                          </div>
                          <button
                            onClick={() => copyLinkCode(currentUser.linkCode!)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-emerald-600 hover:scale-105 transition"
                            title="نسخ كود الربط"
                          >
                            {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth();
                        }}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>تبديل الحساب</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="text-rose-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login / Register Trigger Button */
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>دخول / حساب جديد 🔐</span>
              </button>
            )}

            {/* XP Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-black tabular-nums">
              <span>⭐</span>
              <span>{xpPoints}</span>
              <span className="text-[10px] font-bold opacity-80">XP</span>
            </div>

            {/* Notification Bell Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="مركز التنبيهات وإشعارات المذاكرة"
              aria-label="مركز التنبيهات"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Background Theme Selector */}
            {onOpenBgSelector && (
              <button
                onClick={onOpenBgSelector}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="تغيير خلفية ونمط المنصة التعليمية"
                aria-label="تغيير خلفية المنصة"
              >
                <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}

            {/* Night Focus Study Mode Toggle */}
            <button
              onClick={toggleNightFocus}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isNightFocus
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-inner'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title={isNightFocus ? 'إلغاء وضع التركيز الليلي' : 'تفعيل وضع التركيز الليلي لتقليل إجهاد العين أثناء المذاكرة المتأخرة'}
              aria-label="وضع التركيز الليلي"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="hidden xl:inline text-[11px] font-bold">
                {isNightFocus ? 'تركيز ليلي نشط' : 'وضع التركيز'}
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
              aria-label="تبديل مظهر الموقع"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Subnav Strip */}
        <div className="lg:hidden flex items-center justify-around gap-1 px-2 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 overflow-x-auto text-xs font-bold custom-scroll">
          <button
            onClick={() => setCurrentTab('curriculum')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'curriculum' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            المناهج
          </button>
          <button
            onClick={() => setCurrentTab('know-your-country')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'know-your-country' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            اعرف بلدك 🇪🇬
          </button>
          <button
            onClick={() => setCurrentTab('about-us')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'about-us' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            من نحن
          </button>
          <button
            onClick={() => setCurrentTab('ai-tutor')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'ai-tutor' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            مستر يونس
          </button>
          <button
            onClick={() => setCurrentTab('image-studio')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'image-studio' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            الرسوم الذكية
          </button>
          <button
            onClick={() => setCurrentTab('brain-hub')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'brain-hub' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            المذاكرة
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('parent-admin')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
                currentTab === 'parent-admin' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              👑 الأدمن
            </button>
          )}

          {currentUser?.role === 'parent' && (
            <button
              onClick={() => setCurrentTab('parent-admin')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
                currentTab === 'parent-admin' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ولي الأمر
            </button>
          )}
        </div>
      </header>

      {/* Install App Guide Modal */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-right relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-md">
                📲
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  طريقة تحميل وتثبيت المنصة على جهازك
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تعمل المنصة كتطبيق ويب تقدمي (PWA) فائق السرعة بدون استهلاك لمساحة جهازك.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Android Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    لهواتف أندرويد (Google Chrome):
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    من قائمة المتصفح (الثلاث نقاط <b>⋮</b> في الزاوية العلوية)، اختر <b>"تثبيت التطبيق" (Install App)</b> أو <b>"إضافة إلى الشاشة الرئيسية"</b>.
                  </p>
                </div>
              </div>

              {/* iPhone & iPad Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    لهواتف آيفون وآيباد (Safari):
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    اضغط على زر المشاركة (المربع ذو السهم لأعلى <b>⬆️</b> أسفل الشاشة في Safari)، ثم اختر <b>"إضافة إلى الصفحة الرئيسية (Add to Home Screen)"</b>.
                  </p>
                </div>
              </div>

              {/* Desktop PC Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    لأجهزة الكمبيوتر واللابتوب (Chrome / Edge):
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    اضغط على أيقونة التثبيت (<b>🖥️ أو ➕</b>) في شريط عنوان المتصفح لتثبيته كتطبيق مستقل على سطح المكتب.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
              >
                فهمت الطريقة، شكراً!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
