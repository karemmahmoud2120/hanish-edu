import React, { useState } from 'react';
import { STAGES } from '../data/curriculumData';
import { X, Check, Lock, Mail, User, Shield, GraduationCap, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';
import { createPasswordCredential, readRegisteredUsers, saveRegisteredUsers, verifyPassword } from '../utils/authStorage';
import { authenticateWithSocialProvider } from '../utils/socialAuth';
import type { AdminPermission } from '../utils/adminPermissions';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  accountType?: 'admin' | 'supervisor';
  supervisorTitle?: string;
  permissions?: AdminPermission[];
  providerId?: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
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
  const [role, setRole] = useState<'student' | 'parent'>('student');
  React.useEffect(() => {
    setRole(defaultRole === 'admin' ? 'student' : defaultRole === 'parent' ? 'parent' : 'student');
  }, [defaultRole]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(currentGrade || 'الصف الأول الإعدادي');
  const [parentLinkCode, setParentLinkCode] = useState('');

  // Loading & Animation states
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const closeAuthForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setParentLinkCode('');
    setErrorMsg(null);
    onClose();
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const socialRole: 'student' | 'parent' = role === 'parent' ? 'parent' : 'student';
    setErrorMsg(null);
    setIsSocialLoading(provider);
    try {
      const user = await authenticateWithSocialProvider(provider, socialRole);
      onLoginSuccess(user);
      closeAuthForm();
    } catch (error) {
      console.error(`تعذر تسجيل الدخول عبر ${provider}.`, error);
      setErrorMsg(error instanceof Error ? error.message : 'تعذر تسجيل الدخول عبر هذا المزود.');
    } finally {
      setIsSocialLoading(null);
    }
  };

  // 2. Email & Password Submission Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
    const registeredEmailExists = savedUsers.some((user) => user.email.toLowerCase() === email.trim().toLowerCase());
    if (authMode === 'register' && registeredEmailExists) {
      setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
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
        closeAuthForm();
        return;
      }

      if (password.length < 8) {
        setErrorMsg('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
        return;
      }
      const credential = await createPasswordCredential(password);
      const stageId = selectedGrade.includes('ابتدائي')
        ? 'primary'
        : selectedGrade.includes('إعدادي')
        ? 'prep'
        : 'secondary';

      const user: AuthUser = {
        id: `usr-${crypto.randomUUID()}`,
        name: name.trim() || email.split('@')[0],
        email: email.trim().toLowerCase(),
        role,
        accountType: undefined,
        avatar: undefined,
        provider: 'email',
        ...credential,
        gradeName: role === 'student' ? selectedGrade : undefined,
        stageId: role === 'student' ? stageId : undefined,
        linkCode: role === 'student' ? generateLinkCode() : parentLinkCode || undefined,
        createdAt: new Date().toISOString(),
      };

      saveRegisteredUsers([user, ...savedUsers]);
      onLoginSuccess(user);
      closeAuthForm();
    } catch (error) {
      console.error('تعذر إكمال عملية المصادقة.', error);
      setErrorMsg(error instanceof Error ? error.message : 'تعذر إكمال عملية المصادقة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={closeAuthForm}
    >
      <div
        className="soft-auth-shell rounded-[28px] max-w-lg w-full p-5 sm:p-7 text-right space-y-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        <button
          onClick={closeAuthForm}
          className="absolute left-4 top-4 w-9 h-9 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white text-2xl shrink-0">
            🎓
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
              {authMode === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب جديد'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر حسابك المناسب وابدأ رحلتك التعليمية في دقائق
            </p>
          </div>
        </div>

        <div className="auth-role-pill grid grid-cols-2 gap-2 p-1.5 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'student'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>طالب</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('parent')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'parent'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>ولي أمر</span>
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={isSocialLoading !== null || isSubmitting}
            onClick={() => handleSocialLogin('google')}
            className="social-button google w-full py-3 px-4 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {isSocialLoading === 'google' ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></span>
                <span>جاري الاتصال بحساب Google...</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>المتابعة بحساب Google ({role === 'student' ? 'كطالب' : 'كولي أمر'})</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSocialLoading !== null || isSubmitting}
            onClick={() => handleSocialLogin('facebook')}
            className="social-button facebook w-full py-3 px-4 rounded-2xl text-white text-xs font-bold shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
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
                minLength={authMode === 'register' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
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
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {authMode === 'login' ? 'دخول فوري للمنصة' : 'إنشاء وتفعيل الحساب'}
          </button>
        </form>
      </div>
    </div>
  );
};
