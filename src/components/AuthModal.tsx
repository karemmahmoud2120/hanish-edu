import React, { useState } from 'react';
import { STAGES } from '../data/curriculumData';
import { X, Check, Lock, Mail, User, Shield, GraduationCap, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  avatar?: string;
  provider: 'email' | 'google' | 'facebook' | 'guest';
  gradeName?: string;
  stageId?: 'primary' | 'prep' | 'secondary';
  linkCode?: string;
  createdAt: string;
  isGuest?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  defaultRole?: 'student' | 'parent' | 'admin';
  currentGrade: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultRole = 'student',
  currentGrade,
}) => {
  const [role, setRole] = useState<'student' | 'parent' | 'admin'>(defaultRole);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(currentGrade || 'الصف الأول الإعدادي');
  const [parentLinkCode, setParentLinkCode] = useState('');

  // Loading & Animation states
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStage = STAGES.find((s) => (s.years as readonly string[]).includes(selectedGrade)) || STAGES[1];

  // Helper to generate unique link code for students
  const generateLinkCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HN';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 1. Social Mock Login Handlers (Google / Facebook)
  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    setIsSocialLoading(provider);
    setErrorMsg(null);

    // Simulate realistic OAuth pop-up / handshake delay
    setTimeout(() => {
      let userName = '';
      let userEmail = '';
      let userAvatar = '';

      if (provider === 'google') {
        userName = role === 'student' ? 'كريم محمود حنيش' : role === 'parent' ? 'محمود حنيش (ولي أمر)' : 'أ. كمال حنيش (مشرف)';
        userEmail = role === 'student' ? 'karem.mahmoud.edu@gmail.com' : 'mahmoud.hanish@gmail.com';
        userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
      } else {
        userName = role === 'student' ? 'أحمد حنيش' : role === 'parent' ? 'ياسر حنيش' : 'م. أحمد المشرف';
        userEmail = 'ahmed.hanish.edu@facebook.com';
        userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      }

      const stageId = selectedGrade.includes('ابتدائي')
        ? 'primary'
        : selectedGrade.includes('إعدادي')
        ? 'prep'
        : 'secondary';

      const user: AuthUser = {
        id: `${provider}-${Date.now()}`,
        name: userName,
        email: userEmail,
        role,
        avatar: userAvatar,
        provider,
        gradeName: role === 'student' ? selectedGrade : undefined,
        stageId: role === 'student' ? stageId : undefined,
        linkCode: role === 'student' ? generateLinkCode() : parentLinkCode || undefined,
        createdAt: new Date().toISOString(),
      };

      setIsSocialLoading(null);
      onLoginSuccess(user);
      onClose();
    }, 1100);
  };

  // 2. Email & Password Submission Handler
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (authMode === 'register' && !name.trim()) {
      setErrorMsg('يرجى كتابة الاسم بالكامل.');
      return;
    }

    const stageId = selectedGrade.includes('ابتدائي')
      ? 'primary'
      : selectedGrade.includes('إعدادي')
      ? 'prep'
      : 'secondary';

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role,
      avatar: undefined,
      provider: 'email',
      gradeName: role === 'student' ? selectedGrade : undefined,
      stageId: role === 'student' ? stageId : undefined,
      linkCode: role === 'student' ? generateLinkCode() : parentLinkCode || undefined,
      createdAt: new Date().toISOString(),
    };

    onLoginSuccess(user);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-md shrink-0">
            🎓
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
              {authMode === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب جديد'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر دورك وطريقة الدخول للوصول المباشر لصلاحياتك
            </p>
          </div>
        </div>

        {/* 1. Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'student'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>طالب (🎒)</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('parent')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'parent'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>ولي أمر (👨‍👩‍👧)</span>
          </button>
        </div>

        {/* 2. One-Click Social Auth Simulation */}
        <div className="space-y-2.5 pt-1">
          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={isSocialLoading !== null}
            onClick={() => handleSocialLogin('google')}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {isSocialLoading === 'google' ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></span>
                <span>جاري الاتصال بحساب Google...</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>المتابعة بحساب Google ({role === 'student' ? 'كطالب' : role === 'parent' ? 'كولي أمر' : 'كمشرف'})</span>
              </>
            )}
          </button>

          {/* Facebook Sign-In Button */}
          <button
            type="button"
            disabled={isSocialLoading !== null}
            onClick={() => handleSocialLogin('facebook')}
            className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {isSocialLoading === 'facebook' ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>جاري الربط مع Facebook...</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>المتابعة بحساب Facebook</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 font-bold shrink-0">
            أو باستخدام البريد الإلكتروني
          </span>
        </div>

        {/* Mode Switcher: Login vs Register */}
        <div className="flex items-center justify-center gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`pb-1 border-b-2 transition ${
              authMode === 'login'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            تسجيل الدخول
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`pb-1 border-b-2 transition ${
              authMode === 'register'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الاسم بالكامل:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'student' ? 'مثال: كريم محمود حنيش' : 'اسمك الكريم'}
                  className="w-full px-3 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Student Grade Selector in Registration */}
          {role === 'student' && authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">الصف والمرحلة الدراسية:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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

          {/* Parent Student Link Code */}
          {role === 'parent' && authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">كود الطالب لربطه (اختياري):</label>
              <input
                type="text"
                maxLength={6}
                value={parentLinkCode}
                onChange={(e) => setParentLinkCode(e.target.value.toUpperCase())}
                placeholder="مثال: HN8293"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono uppercase tracking-widest text-center"
              />
              <span className="text-[10px] text-slate-400 block mt-1">يمكنك طلبه من حساب ابنك وربطه في أي وقت.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition cursor-pointer mt-2"
          >
            {authMode === 'login' ? 'دخول فوري للمنصة' : 'إنشاء وتفعيل الحساب'}
          </button>
        </form>
      </div>
    </div>
  );
};
