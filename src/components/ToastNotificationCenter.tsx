import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Timer,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  Trash2,
  Check,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { NotificationItem, NotificationSettings } from '../types/notifications';
import {
  getStoredNotifications,
  saveNotifications,
  getNotificationSettings,
  saveNotificationSettings,
  requestBrowserNotificationPermission,
  playNotificationChime,
  dispatchNativeBrowserNotification,
} from '../utils/notificationService';

interface ToastNotificationCenterProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeToast: NotificationItem | null;
  setActiveToast: (toast: NotificationItem | null) => void;
  onNavigateTab: (tab: string, payload?: any) => void;
  isOpenDrawer: boolean;
  setIsOpenDrawer: (open: boolean) => void;
}

export const ToastNotificationCenter: React.FC<ToastNotificationCenterProps> = ({
  notifications,
  setNotifications,
  activeToast,
  setActiveToast,
  onNavigateTab,
  isOpenDrawer,
  setIsOpenDrawer,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'denied';
  });

  // Auto-dismiss active toast after 7 seconds
  useEffect(() => {
    if (!activeToast) return;

    // Play chime and send browser notification
    playNotificationChime();
    dispatchNativeBrowserNotification(activeToast.title, activeToast.body, activeToast.id);

    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);

    return () => clearTimeout(timer);
  }, [activeToast]);

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    const updated = { ...settings, browserNotificationsEnabled: granted };
    setSettings(updated);
    saveNotificationSettings(updated);

    if (granted) {
      // Trigger a success toast
      const welcomeNotif: NotificationItem = {
        id: `perm-success-${Date.now()}`,
        title: '🔔 تم تفعيل إشعارات المتصفح بنجاح!',
        body: 'ستصلك الآن تنبيهات مواعيد المذاكرة وتسليم المهام حتى لو كنت خارج نافذة المنصة.',
        type: 'general',
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => [welcomeNotif, ...prev]);
      setActiveToast(welcomeNotif);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: nextVal };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (nextVal) {
      playNotificationChime();
    }
  };

  const handleDismissToast = () => {
    if (activeToast) {
      // Mark as read in notifications
      setNotifications((prev) =>
        prev.map((n) => (n.id === activeToast.id ? { ...n, read: true } : n))
      );
    }
    setActiveToast(null);
  };

  const handleToastAction = (toast: NotificationItem) => {
    if (toast.actionTab) {
      onNavigateTab(toast.actionTab, toast.actionPayload);
    }
    handleDismissToast();
    setIsOpenDrawer(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* 1. FLOATING TOAST BANNER */}
      {activeToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-bounce-short"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/80 text-slate-900 dark:text-white shadow-2xl p-4 sm:p-5 space-y-3 text-right">
            {/* Top decorative gradient edge */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    activeToast.type === 'study_session'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : activeToast.type === 'task_deadline'
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}
                >
                  {activeToast.type === 'study_session' && <Timer className="w-5 h-5 animate-pulse" />}
                  {activeToast.type === 'task_deadline' && <Clock className="w-5 h-5" />}
                  {activeToast.type === 'general' && <Bell className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    {activeToast.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">تنبيه فوري الآن · منصة حنيش</span>
                </div>
              </div>

              <button
                onClick={handleDismissToast}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {activeToast.body}
            </p>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              {activeToast.actionLabel ? (
                <button
                  type="button"
                  onClick={() => handleToastAction(activeToast)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{activeToast.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleDismissToast}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                تخطي لاحقاً
              </button>
            </div>

            {/* Visual timeout bar */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 animate-shrink-width" />
            </div>
          </div>
        </aside>
      )}

      {/* 2. NOTIFICATIONS DRAWER / MODAL */}
      {isOpenDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-right max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>مركز التنبيهات وإشعارات المذاكرة</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
                        {unreadCount} جديد
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    تذكيرات تلقائية بمواعيد المهام وجلسات بومودورو
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpenDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Settings Bar: Native Notifications & Sound */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 shrink-0 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    إشعارات المتصفح (Browser Notification):
                  </span>
                </div>

                {permissionStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" />
                    <span>مفعلة في المتصفح</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow cursor-pointer"
                  >
                    تفعيل الإشعارات الآن 🔔
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  صوت التنبيه الموسيقي الخفيف:
                </span>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`p-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-[11px] font-bold ${
                    settings.soundEnabled
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {settings.soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>الصوت يعمل</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>الصوت مكتوم</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List Action Buttons */}
            <div className="flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-bold">سجل التنبيهات الأخيرة:</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                    🔕
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    لا توجد تنبيهات جديدة حتى الآن
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    ستظهر هنا تنبيهات مواعيد المهام وجلسات المذاكرة المجدولة في 'BrainHub'.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border text-right transition-all space-y-2 ${
                      item.read
                        ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                        : 'bg-white dark:bg-slate-800 border-emerald-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'study_session' ? (
                          <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : item.type === 'task_deadline' ? (
                          <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <h5 className="font-heading font-black text-xs text-slate-900 dark:text-white">
                          {item.title}
                        </h5>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.body}
                    </p>

                    {item.actionLabel && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleToastAction(item)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Test Trigger Button for immediate validation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">اختبار نظام الإشعارات:</span>
              <button
                type="button"
                onClick={() => {
                  const testItem: NotificationItem = {
                    id: `test-${Date.now()}`,
                    title: '🎯 تنبيه تجريبي: بدء جلسة مذاكرة في BrainHub',
                    body: 'جلسة تركيز الأحياء (الخلية والانقسام الميتوزي) لمدة 25 دقيقة جاهزة للبدء الآن!',
                    type: 'study_session',
                    timestamp: Date.now(),
                    read: false,
                    actionTab: 'brain-hub',
                    actionPayload: { openFocusMode: true },
                    actionLabel: 'بدء جلسة التركيز ومؤقت بومودورو 🎯',
                  };
                  setNotifications((prev) => [testItem, ...prev]);
                  setActiveToast(testItem);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
              >
                🔔 إرسال تنبيه تجريبي الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
