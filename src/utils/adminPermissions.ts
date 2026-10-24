import type { AuthUser } from '../components/AuthModal';

export const ADMIN_PERMISSION_LABELS = {
  lessons: 'إدارة الدروس والمناهج',
  quizzes: 'إدارة الاختبارات والأسئلة',
  announcements: 'إدارة الإعلانات',
  students: 'إدارة سجل الطلاب',
  accounts: 'إدارة حسابات الطلاب وأولياء الأمور',
  backup: 'النسخ الاحتياطي والاستعادة',
  links: 'إدارة الروابط المفيدة',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSION_LABELS;

export const isSupervisor = (user: AuthUser | null | undefined) =>
  user?.role === 'admin' &&
  (user.accountType === 'supervisor' || user.email.toLowerCase().includes('supervisor'));

export const hasAdminPermission = (user: AuthUser | null | undefined, permission: AdminPermission) => {
  if (user?.role !== 'admin') return false;
  if (!isSupervisor(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};
