import React, { useState } from 'react';
import { AuthUser } from './AuthModal';
import { Shield, Lock, Mail, Crown, ArrowRight, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { createPasswordCredential, readRegisteredUsers, saveRegisteredUsers, verifyPassword } from '../utils/authStorage';

interface AdminPortalGateProps {
  onLoginSuccess: (user: AuthUser) => void;
  onExitAdmin: () => void;
  isDark: boolean;
}

export const AdminPortalGate: React.FC<AdminPortalGateProps> = ({
  onLoginSuccess,
  onExitAdmin,
  isDark,
}) => {
  const [email, setEmail] = useState('admin@hanish.edu.eg');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    let savedUsers: AuthUser[];
    try {
      savedUsers = readRegisteredUsers();
    } catch (error) {
      console.error('تعذر قراءة سجل الحسابات المحفوظ.', error);
      setErrorMsg('تعذر قراءة سجل الحسابات. يرجى إعادة تحميل الصفحة.');
      return;
    }
    const savedAdmin = savedUsers.find(
      (user) => user.email.toLowerCase() === cleanEmail && user.role === 'admin'
    );
    if (savedAdmin) {
      try {
        const verification = await verifyPassword(savedAdmin, password);
        if (!verification.valid) {
          setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
          return;
        }
        if (verification.upgradedUser) {
          saveRegisteredUsers(savedUsers.map((user) => user.id === savedAdmin.id ? verification.upgradedUser! : user));
        }
        setIsLoading(true);
        onLoginSuccess(verification.upgradedUser || savedAdmin);
      } catch (error) {
        console.error('تعذر التحقق من بيانات المسؤول.', error);
        setErrorMsg(error instanceof Error ? error.message : 'تعذر التحقق من بيانات المسؤول.');
      }
      return;
    }

    if (savedUsers.some((user) => user.role === 'admin')) {
      setErrorMsg('لا يوجد حساب إداري بهذا البريد الإلكتروني.');
      return;
    }
    if (savedUsers.some((user) => user.email.toLowerCase() === cleanEmail)) {
      setErrorMsg('هذا البريد الإلكتروني مستخدم بالفعل لحساب آخر.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('عند إعداد أول حساب إداري، يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
      return;
    }
    try {
      setIsLoading(true);
      const credential = await createPasswordCredential(password);
      const adminUser: AuthUser = {
        id: `admin-${crypto.randomUUID()}`,
        name: 'مدير المنصة',
        email: cleanEmail,
        role: 'admin',
        accountType: 'admin',
        provider: 'email',
        ...credential,
        createdAt: new Date().toISOString(),
      };
      saveRegisteredUsers([adminUser, ...savedUsers]);
      onLoginSuccess(adminUser);
    } catch (error) {
      console.error('تعذر إعداد حساب المسؤول.', error);
      setErrorMsg(error instanceof Error ? error.message : 'تعذر إعداد حساب المسؤول.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-purple-900/30 via-indigo-900/20 to-slate-900/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Secret Admin Modal Box */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-purple-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 space-y-6 text-right">
        {/* Top Decorative Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 rounded-t-3xl" />

        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-900/50">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg text-white">
                  بوابة إدارة المنصة السرية
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                إعداد أول مدير محلياً أو تسجيل دخول حساب إدارة مسجل
              </p>
            </div>
          </div>
        </div>

        {/* Secure Admin Portal Notice */}
        <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center shrink-0 text-purple-300">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">منطقة إدارة المنصة المحمية</span>
            <span className="text-[11px] text-slate-400">إذا لم يوجد مدير على هذا المتصفح، سيُنشئ الإرسال أول حساب إدارة. بعد ذلك يلزم استخدام الحساب المسجل.</span>
            <span className="text-[10px] text-amber-300 block mt-1">تنبيه: localStorage لا يوفر حماية خادمية؛ يمكن لمالك المتصفح تعديل بياناته. لا تستخدمه لحماية بيانات حساسة أو كبديل لمصادقة الإنتاج.</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute right-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pr-10 pl-3 py-3 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-xs text-white text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور السرية:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute right-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بالإدارة"
                className="w-full pr-10 pl-3 py-3 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-xs text-white text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>جاري التحقق من الصلاحيات...</span>
              </span>
            ) : (
              <>
                <Crown className="w-4 h-4 text-amber-300" />
                <span>تسجيل الدخول أو إعداد حساب الإدارة</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full text-center text-xs text-slate-400 hover:text-white transition py-1.5 cursor-pointer"
          >
            ← العودة إلى بوابة الطلاب والمنصة العامة
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] text-slate-500 font-mono">
        <p>رابط الدخول السري: <span className="text-purple-400">?portal=admin</span> أو <span className="text-purple-400">/#admin</span></p>
        <p className="mt-1 opacity-75">منصة عائلة حنيش التعليمية 2026 · نظام الإدارة المتقدم</p>
      </div>
    </div>
  );
};
