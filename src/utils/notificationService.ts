import { NotificationItem, ScheduledStudySession, NotificationSettings } from '../types/notifications';
import { StudyTask } from '../data/curriculumData';

const STORAGE_KEY_NOTIFICATIONS = 'hanish_notifications';
const STORAGE_KEY_SESSIONS = 'hanish_scheduled_sessions';
const STORAGE_KEY_SETTINGS = 'hanish_notification_settings';
const STORAGE_KEY_DEADLINES_NOTIFIED = 'hanish_notified_deadlines';

const getUserStorageKey = (key: string, userId: string) => `${key}_${userId}`;

const migrateLegacyValue = (key: string, userId: string): string | null => {
  const userKey = getUserStorageKey(key, userId);
  const saved = localStorage.getItem(userKey);
  if (saved !== null) return saved;

  const migrationKey = `${key}_legacy_migrated`;
  if (localStorage.getItem(migrationKey) === 'true') return null;

  const legacyValue = localStorage.getItem(key);
  if (legacyValue !== null) localStorage.setItem(userKey, legacyValue);
  localStorage.setItem(migrationKey, 'true');
  return legacyValue;
};

// Get default or stored settings
export const getNotificationSettings = (userId: string): NotificationSettings => {
  const saved = migrateLegacyValue(STORAGE_KEY_SETTINGS, userId);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return {
    browserNotificationsEnabled: 'Notification' in window && Notification.permission === 'granted',
    soundEnabled: true,
  };
};

export const saveNotificationSettings = (userId: string, settings: NotificationSettings) => {
  localStorage.setItem(getUserStorageKey(STORAGE_KEY_SETTINGS, userId), JSON.stringify(settings));
};

// Request Browser Notification Permission
export const requestBrowserNotificationPermission = async (userId: string): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    const settings = getNotificationSettings(userId);
    saveNotificationSettings(userId, { ...settings, browserNotificationsEnabled: granted });
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Synthesize pleasant acoustic chime using Web Audio API
export const playNotificationChime = (userId: string) => {
  const settings = getNotificationSettings(userId);
  if (!settings.soundEnabled) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Play a gentle two-tone chord: 523.25 Hz (C5) then 659.25 Hz (E5)
    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + startOffset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };

    playTone(523.25, 0, 0.4); // C5
    playTone(659.25, 0.12, 0.5); // E5
    playTone(783.99, 0.24, 0.6); // G5
  } catch (e) {
    // AudioContext might be blocked until user gesture, safe to ignore
  }
};

// Dispatch a native browser notification
export const dispatchNativeBrowserNotification = (title: string, body: string, id: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: id,
      dir: 'rtl',
      lang: 'ar',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.warn('Native notification failed:', e);
  }
};

// Load all notifications from local storage
export const getStoredNotifications = (userId: string): NotificationItem[] => {
  const saved = migrateLegacyValue(STORAGE_KEY_NOTIFICATIONS, userId);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return [];
};

// Save notifications to local storage
export const saveNotifications = (userId: string, notifications: NotificationItem[]) => {
  localStorage.setItem(getUserStorageKey(STORAGE_KEY_NOTIFICATIONS, userId), JSON.stringify(notifications.slice(0, 40)));
};

// Load scheduled study sessions
export const getScheduledStudySessions = (userId: string): ScheduledStudySession[] => {
  const saved = migrateLegacyValue(STORAGE_KEY_SESSIONS, userId);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return [];
};

// Save scheduled study sessions
export const saveScheduledStudySessions = (userId: string, sessions: ScheduledStudySession[]) => {
  localStorage.setItem(getUserStorageKey(STORAGE_KEY_SESSIONS, userId), JSON.stringify(sessions));
};

export const clearUserNotificationData = (userId: string) => {
  [
    STORAGE_KEY_NOTIFICATIONS,
    STORAGE_KEY_SESSIONS,
    STORAGE_KEY_SETTINGS,
    STORAGE_KEY_DEADLINES_NOTIFIED,
  ].forEach((key) => localStorage.removeItem(getUserStorageKey(key, userId)));
};

// Add a scheduled study session
export const addScheduledStudySession = (
  userId: string,
  title: string,
  targetTime: number,
  durationMinutes: number = 25,
  subject: string = 'عامة'
): ScheduledStudySession => {
  const newSession: ScheduledStudySession = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    targetTime,
    durationMinutes,
    subject,
    notified: false,
  };

  const sessions = getScheduledStudySessions(userId);
  const updated = [...sessions, newSession];
  saveScheduledStudySessions(userId, updated);
  return newSession;
};

// Remove a scheduled study session
export const removeScheduledStudySession = (userId: string, sessionId: string) => {
  const sessions = getScheduledStudySessions(userId);
  const updated = sessions.filter((s) => s.id !== sessionId);
  saveScheduledStudySessions(userId, updated);
};

// Check for approaching task deadlines
export const checkTaskDeadlines = (
  userId: string,
  tasks: StudyTask[],
  onTriggerNotification: (item: NotificationItem) => void
) => {
  if (!tasks || tasks.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Track which tasks were already notified today to prevent spamming
  const notifiedMap = JSON.parse(
    migrateLegacyValue(STORAGE_KEY_DEADLINES_NOTIFIED, userId) || '{}'
  );
  let hasChanges = false;

  tasks.forEach((task) => {
    if (task.done) return;

    const notifKey = `${task.id}_${task.dueDate}_${todayStr}`;
    if (notifiedMap[notifKey]) return; // already notified today

    let shouldNotify = false;
    let urgencyTitle = '';
    let urgencyBody = '';

    if (task.dueDate === todayStr) {
      shouldNotify = true;
      urgencyTitle = `⏳ موعد تسليم مهمة اليوم: ${task.title}`;
      urgencyBody = `المهمة "${task.title}" الخاصة بمادة (${task.subject}) مستحقة اليوم! أنجزها لحصد +${task.xpPoints} XP.`;
    } else if (task.dueDate === tomorrowStr) {
      shouldNotify = true;
      urgencyTitle = `📅 تذكير بمهمة غداً: ${task.title}`;
      urgencyBody = `تذكير بموعد استحقاق مهمة (${task.title}) غداً. استعد لإنجازها في الوقت المناسب.`;
    } else if (task.dueDate < todayStr) {
      shouldNotify = true;
      urgencyTitle = `⚠️ مهمة متأخرة: ${task.title}`;
      urgencyBody = `تجاوزت هذه المهمة موعد تسليمها المقرر (${task.dueDate}). يُفضل إنجازها الآن في BrainHub للحفاظ على تفوقك.`;
    }

    if (shouldNotify) {
      notifiedMap[notifKey] = Date.now();
      hasChanges = true;

      const item: NotificationItem = {
        id: `notif-task-${task.id}-${Date.now()}`,
        title: urgencyTitle,
        body: urgencyBody,
        type: 'task_deadline',
        timestamp: Date.now(),
        read: false,
        actionTab: 'brain-hub',
        actionLabel: 'الانتقال لقائمة المهام',
      };

      onTriggerNotification(item);
    }
  });

  if (hasChanges) {
    localStorage.setItem(getUserStorageKey(STORAGE_KEY_DEADLINES_NOTIFIED, userId), JSON.stringify(notifiedMap));
  }
};

// Check upcoming scheduled study sessions
export const checkScheduledStudySessions = (
  userId: string,
  onTriggerNotification: (item: NotificationItem) => void
) => {
  const sessions = getScheduledStudySessions(userId);
  const now = Date.now();
  let hasChanges = false;

  const updated = sessions.map((sess) => {
    // If target time is reached or passed (within 1 hour window) and not notified yet
    if (!sess.notified && now >= sess.targetTime && now - sess.targetTime < 60 * 60 * 1000) {
      hasChanges = true;

      const item: NotificationItem = {
        id: `notif-sess-${sess.id}`,
        title: `🎯 حان الآن موعد جلسة المذاكرة: ${sess.title}`,
        body: `جلسة دراسة مادة (${sess.subject}) لمدة ${sess.durationMinutes} دقيقة جاهزة للبدء الآن. افتح وضع التركيز ومؤقت بومودورو!`,
        type: 'study_session',
        timestamp: Date.now(),
        read: false,
        actionTab: 'brain-hub',
        actionPayload: { openFocusMode: true },
        actionLabel: 'بدء جلسة التركيز الآن 🚀',
      };

      onTriggerNotification(item);
      return { ...sess, notified: true };
    }
    return sess;
  });

  if (hasChanges) {
    saveScheduledStudySessions(userId, updated);
  }
};
