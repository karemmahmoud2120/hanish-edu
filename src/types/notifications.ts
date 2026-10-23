export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'study_session' | 'task_deadline' | 'achievement' | 'general';
  timestamp: number;
  read: boolean;
  actionTab?: string;
  actionPayload?: any;
  actionLabel?: string;
  sound?: boolean;
}

export interface ScheduledStudySession {
  id: string;
  title: string;
  targetTime: number; // timestamp in ms
  durationMinutes: number;
  subject: string;
  notified: boolean;
}

export interface NotificationSettings {
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
}
