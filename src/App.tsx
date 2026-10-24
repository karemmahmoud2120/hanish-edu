import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CurriculumExplorer } from './components/CurriculumExplorer';
import { AITutor } from './components/AITutor';
import { ImageStudio } from './components/ImageStudio';
import { BrainHub } from './components/BrainHub';
import { ParentAdmin } from './components/ParentAdmin';
import { AuthModal, AuthUser } from './components/AuthModal';
import { AuthLandingGate } from './components/AuthLandingGate';
import { AdminPortalGate } from './components/AdminPortalGate';
import { StudentWelcomeHero } from './components/StudentWelcomeHero';
import { ToastNotificationCenter } from './components/ToastNotificationCenter';
import { AcademicLogo } from './components/AcademicLogo';
import { KnowYourCountry } from './components/KnowYourCountry';
import { AboutUs } from './components/AboutUs';
import { PlatformTour } from './components/PlatformTour';
import { UsefulLinks } from './components/UsefulLinks';
import { BackgroundSelectorModal, BackgroundThemeId } from './components/BackgroundSelectorModal';
import { createPasswordCredential, readRegisteredUsers, saveRegisteredUsers, toSessionUser } from './utils/authStorage';
import { Megaphone, AlertCircle, Sparkles } from 'lucide-react';
import { NotificationItem } from './types/notifications';
import {
  getStoredNotifications,
  saveNotifications,
  checkTaskDeadlines,
  checkScheduledStudySessions,
  clearUserNotificationData,
} from './utils/notificationService';
import {
  INITIAL_LESSONS,
  INITIAL_BOOKLETS,
  INITIAL_QUIZZES,
  INITIAL_USEFUL_LINKS,
  INITIAL_FLASHCARDS,
  INITIAL_TASKS,
  INITIAL_STUDENT,
  INITIAL_EXAM_RESULTS,
  LessonItem,
  BookletItem,
  QuizItem,
  UsefulLink,
  Flashcard,
  StudyTask,
  ExamResult,
  StudentProfile,
} from './data/curriculumData';

interface LocalUserData {
  flashcards: Flashcard[];
  tasks: StudyTask[];
  student: StudentProfile;
  examResults: ExamResult[];
  selectedGrade: string;
}

const readLocalUserData = (userId: string): LocalUserData => {
  const storageKey = `hanish_user_data_${userId}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return JSON.parse(stored) as LocalUserData;
    } catch (error) {
      console.error(`تعذر قراءة بيانات المستخدم ${userId}.`, error);
      throw new Error('بيانات الحساب المحفوظة غير صالحة. يرجى استعادة نسخة احتياطية أو مسح بيانات الحساب.');
    }
  }

  const migrationKey = 'hanish_legacy_user_data_migrated';
  let data: LocalUserData = {
    flashcards: INITIAL_FLASHCARDS,
    tasks: INITIAL_TASKS,
    student: INITIAL_STUDENT,
    examResults: INITIAL_EXAM_RESULTS,
    selectedGrade: 'الصف الأول الإعدادي',
  };
  if (localStorage.getItem(migrationKey) !== 'true') {
    data = {
      flashcards: JSON.parse(localStorage.getItem('hanish_flashcards') || JSON.stringify(INITIAL_FLASHCARDS)) as Flashcard[],
      tasks: JSON.parse(localStorage.getItem('hanish_tasks') || JSON.stringify(INITIAL_TASKS)) as StudyTask[],
      student: JSON.parse(localStorage.getItem('hanish_student') || JSON.stringify(INITIAL_STUDENT)) as StudentProfile,
      examResults: JSON.parse(localStorage.getItem('hanish_results') || JSON.stringify(INITIAL_EXAM_RESULTS)) as ExamResult[],
      selectedGrade: localStorage.getItem('hanish_grade') || 'الصف الأول الإعدادي',
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(migrationKey, 'true');
  }
  return data;
};

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('hanish_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hanish_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hanish_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Night Focus Study Mode (Auto-detection for 9 PM - 6 AM or persistent preference)
  const [isNightFocus, setIsNightFocus] = useState<boolean>(() => {
    const saved = localStorage.getItem('hanish_night_focus');
    if (saved !== null) return saved === 'true';
    const hour = new Date().getHours();
    return hour >= 21 || hour < 6;
  });

  useEffect(() => {
    if (isNightFocus) {
      document.documentElement.classList.add('night-focus');
      localStorage.setItem('hanish_night_focus', 'true');
    } else {
      document.documentElement.classList.remove('night-focus');
      localStorage.setItem('hanish_night_focus', 'false');
    }
  }, [isNightFocus]);

  const toggleNightFocus = () => setIsNightFocus((prev) => !prev);

  // Platform Background Themes (Academic, Arabesque, Blueprint, Campus, Minimal)
  const [bgTheme, setBgTheme] = useState<BackgroundThemeId>(() => {
    return (localStorage.getItem('hanish_bg_theme') as BackgroundThemeId) || 'academic';
  });
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false);

  const handleSelectBgTheme = (themeId: BackgroundThemeId) => {
    setBgTheme(themeId);
    localStorage.setItem('hanish_bg_theme', themeId);
  };

  // Active User / Auth State (Locked by default: user must authenticate)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('hanish_auth_user');
    if (!saved) return null;
    try {
      const sessionUser = JSON.parse(saved) as AuthUser;
      if (sessionUser.isGuest) return null;
      const registeredUser = readRegisteredUsers().find(
        (user) => user.id === sessionUser.id &&
          user.email.toLowerCase() === sessionUser.email.toLowerCase() &&
          user.role === sessionUser.role
      );
      return registeredUser ? toSessionUser({ ...registeredUser, ...sessionUser }) : null;
    } catch (error) {
      console.error('تعذر استعادة جلسة المستخدم.', error);
      return null;
    }
  });

  const hasValidRegisteredUsersStorage = useRef(true);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(() => {
    try {
      return readRegisteredUsers();
    } catch (error) {
      hasValidRegisteredUsersStorage.current = false;
      console.error('تعذر قراءة سجل المستخدمين المحفوظ.', error);
      return [];
    }
  });

  useEffect(() => {
    if (!hasValidRegisteredUsersStorage.current) return;
    saveRegisteredUsers(registeredUsers);
  }, [registeredUsers]);

  useEffect(() => {
    let isMounted = true;
    const upgradeLegacyPasswords = async () => {
      let changed = false;
      const migratedUsers = await Promise.all(registeredUsers.map(async (user) => {
        if (!user.password || user.passwordHash) return user;
        const credential = await createPasswordCredential(user.password);
        const { password: _legacyPassword, ...userWithoutLegacyPassword } = user;
        changed = true;
        return { ...userWithoutLegacyPassword, ...credential };
      }));
      if (changed && isMounted) {
        saveRegisteredUsers(migratedUsers);
        setRegisteredUsers(migratedUsers);
      }
    };
    upgradeLegacyPasswords().catch((error: unknown) => {
      console.error('تعذرت ترقية كلمات المرور القديمة إلى التخزين المشتق.', error);
    });
    return () => {
      isMounted = false;
    };
  }, [registeredUsers]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check if current URL is requesting the admin portal (?portal=admin or #admin)
  const checkIsAdminUrl = () => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get('portal') === 'admin' ||
      searchParams.get('admin') === 'true' ||
      searchParams.get('admin') === 'portal' ||
      window.location.hash === '#admin'
    );
  };

  const [isAdminPortalRequested, setIsAdminPortalRequested] = useState<boolean>(checkIsAdminUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminPortalRequested(checkIsAdminUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleExitAdminPortal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    url.searchParams.delete('admin');
    if (url.hash === '#admin') url.hash = '';
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
    setIsAdminPortalRequested(false);
  };

  // Tab & Role State
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (currentUser?.role === 'admin') return 'parent-admin';
    if (checkIsAdminUrl()) return 'parent-admin';
    return 'curriculum';
  });
  const [currentRole, setCurrentRole] = useState<'student' | 'parent' | 'admin'>(() => {
    return currentUser?.role || 'student';
  });

  // Notification & Toast State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    currentUser ? getStoredNotifications(currentUser.id) : []
  );
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [initialOpenFocusMode, setInitialOpenFocusMode] = useState(false);

  useEffect(() => {
    if (currentUser) saveNotifications(currentUser.id, notifications);
  }, [currentUser, notifications]);

  const handleTriggerNotification = (item: NotificationItem) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === item.id)) return prev;
      return [item, ...prev];
    });
    setActiveToast(item);
  };

  const handleNavigateFromNotification = (tab: string, payload?: any) => {
    setCurrentTab(tab);
    if (payload?.openFocusMode) {
      setInitialOpenFocusMode(true);
      setTimeout(() => setInitialOpenFocusMode(false), 800);
    }
  };

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return currentUser ? currentUser.gradeName || readLocalUserData(currentUser.id).selectedGrade : 'الصف الأول الإعدادي';
  });

  // Educational Data State (Persistent with LocalStorage)
  const [lessons, setLessons] = useState<LessonItem[]>(() => {
    const saved = localStorage.getItem('hanish_lessons');
    return saved ? JSON.parse(saved) : INITIAL_LESSONS;
  });

  const [booklets, setBooklets] = useState<BookletItem[]>(() => {
    const saved = localStorage.getItem('hanish_booklets');
    return saved ? JSON.parse(saved) : INITIAL_BOOKLETS;
  });

  const [quizzes, setQuizzes] = useState<QuizItem[]>(() => {
    const saved = localStorage.getItem('hanish_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [usefulLinks, setUsefulLinks] = useState(() => {
    const saved = localStorage.getItem('hanish_useful_links');
    return saved ? JSON.parse(saved) as typeof INITIAL_USEFUL_LINKS : INITIAL_USEFUL_LINKS;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    return currentUser ? readLocalUserData(currentUser.id).flashcards : INITIAL_FLASHCARDS;
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    return currentUser ? readLocalUserData(currentUser.id).tasks : INITIAL_TASKS;
  });

  const [student, setStudent] = useState<StudentProfile>(() => {
    return currentUser ? readLocalUserData(currentUser.id).student : INITIAL_STUDENT;
  });

  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    return currentUser ? readLocalUserData(currentUser.id).examResults : INITIAL_EXAM_RESULTS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('hanish_lessons', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('hanish_booklets', JSON.stringify(booklets));
  }, [booklets]);

  useEffect(() => {
    localStorage.setItem('hanish_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('hanish_useful_links', JSON.stringify(usefulLinks));
  }, [usefulLinks]);

  useEffect(() => {
    if (!currentUser || currentUser.isGuest) return;
    const userData: LocalUserData = { flashcards, tasks, student, examResults, selectedGrade };
    localStorage.setItem(`hanish_user_data_${currentUser.id}`, JSON.stringify(userData));
  }, [currentUser, flashcards, tasks, student, examResults, selectedGrade]);

  // Handle Auth Login Success
  const handleLoginSuccess = (user: AuthUser) => {
    if (user.isGuest) return;
    const sessionUser = toSessionUser(user);
    let userData: LocalUserData;
    try {
      userData = readLocalUserData(user.id);
    } catch (error) {
      console.error('تعذر تحميل بيانات المستخدم.', error);
      window.alert(error instanceof Error ? error.message : 'تعذر تحميل بيانات الحساب.');
      return;
    }
    setCurrentUser(sessionUser);
    setNotifications(getStoredNotifications(user.id));
    setActiveToast(null);
    setCurrentRole(user.role);
    localStorage.setItem('hanish_auth_user', JSON.stringify(sessionUser));
    setRegisteredUsers((previous) => {
      const existing = previous.find((registered) => registered.id === user.id);
      const nextUser = { ...existing, ...user };
      const nextUsers = existing
        ? previous.map((registered) => registered.id === user.id ? nextUser : registered)
        : [user, ...previous];
      saveRegisteredUsers(nextUsers);
      return nextUsers;
    });

    setFlashcards(userData.flashcards);
    setTasks(userData.tasks);
    setExamResults(userData.examResults);
    setStudent({
      ...userData.student,
      name: user.name,
      email: user.email,
      role: user.role,
      linkCode: user.linkCode || userData.student.linkCode,
      gradeName: user.gradeName || userData.student.gradeName,
    });
    setSelectedGrade(user.gradeName || userData.selectedGrade);

    if (user.gradeName) {
      setSelectedGrade(user.gradeName);
    }

    if (user.role === 'parent') {
      setCurrentTab('parent-admin');
    } else if (user.role === 'admin') {
      setCurrentTab('parent-admin');
    } else {
      setCurrentTab('curriculum');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hanish_auth_user');
    setCurrentRole('student');
    setCurrentTab('curriculum');
    setNotifications([]);
    setActiveToast(null);
  };

  // Gamification Handlers
  const handleAddXP = (points: number) => {
    setStudent((prev) => ({
      ...prev,
      xpPoints: prev.xpPoints + points,
    }));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextDone = !t.done;
          if (nextDone) handleAddXP(t.xpPoints);
          return { ...t, done: nextDone };
        }
        return t;
      })
    );
  };

  // Background monitor for scheduled sessions and task deadlines
  useEffect(() => {
    if (!currentUser) return;

    const runChecks = () => {
      checkScheduledStudySessions(currentUser.id, (item) => handleTriggerNotification(item));
      checkTaskDeadlines(currentUser.id, tasks, (item) => handleTriggerNotification(item));
    };

    // Initial check after 2.5 seconds
    const timeout = setTimeout(runChecks, 2500);

    // Periodic check every 25 seconds
    const interval = setInterval(runChecks, 25000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [tasks, currentUser]);

  const handleAddTask = (title: string, subject: string, xp: number, dueDate?: string) => {
    const newTask: StudyTask = {
      id: `tsk-${Date.now()}`,
      title,
      subject,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      done: false,
      xpPoints: xp,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateFlashcardBox = (cardId: string, newBox: number) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, box: newBox } : c))
    );
  };

  const handleAddFlashcard = (deck: string, front: string, back: string) => {
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      deck,
      front,
      back,
      box: 0,
      gradeName: selectedGrade,
    };
    setFlashcards((prev) => [newCard, ...prev]);
  };

  const handleSaveQuizResult = (
    quizTitle: string,
    subject: string,
    score: number,
    maxScore: number
  ) => {
    const newRes: ExamResult = {
      id: `res-${Date.now()}`,
      quizId: `qz-${Date.now()}`,
      quizTitle,
      subject,
      score,
      maxScore,
      date: new Date().toISOString().split('T')[0],
      gradeName: selectedGrade,
    };
    setExamResults((prev) => [newRes, ...prev]);
  };

  // Platform Announcement Marquee State
  const [platformAnnouncement, setPlatformAnnouncement] = useState<string>(() => {
    return (
      localStorage.getItem('hanish_announcement') ||
      '🔔 مرحباً بكم في منصة عائلة حنيش التعليمية لعام 2026! تم تفعيل السبورة التفاعلية الذكية وبنك الأسئلة المطور.'
    );
  });

  useEffect(() => {
    localStorage.setItem('hanish_announcement', platformAnnouncement);
  }, [platformAnnouncement]);

  const handleAddLesson = (lesson: LessonItem) => {
    setLessons((prev) => [lesson, ...prev]);
  };

  const handleUpdateLesson = (updated: LessonItem) => {
    setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const handleAddBooklet = (booklet: BookletItem) => {
    setBooklets((prev) => [booklet, ...prev]);
  };

  const handleDeleteBooklet = (bookletId: string) => {
    setBooklets((prev) => prev.filter((b) => b.id !== bookletId));
  };

  const handleAddQuiz = (quiz: QuizItem) => {
    setQuizzes((prev) => [quiz, ...prev]);
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const handleAddUsefulLink = (link: UsefulLink) => {
    setUsefulLinks((previous) => [link, ...previous]);
  };

  const handleDeleteUsefulLink = (linkId: string) => {
    setUsefulLinks((previous) => previous.filter((link) => link.id !== linkId));
  };

  const handleUpdateStudentProfile = (updated: StudentProfile) => {
    setStudent(updated);
  };

  const handleUpdateRegisteredUser = (updated: AuthUser) => {
    setRegisteredUsers((previous) => {
      const exists = previous.some((user) => user.id === updated.id);
      const nextUsers = exists
        ? previous.map((user) => user.id === updated.id ? updated : user)
        : [updated, ...previous];
      saveRegisteredUsers(nextUsers);
      return nextUsers;
    });
    if (currentUser?.id === updated.id) {
      const sessionUser = toSessionUser(updated);
      setCurrentUser(sessionUser);
      setCurrentRole(updated.role);
      localStorage.setItem('hanish_auth_user', JSON.stringify(sessionUser));
      setStudent((previous) => ({
        ...previous,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        gradeName: updated.gradeName || previous.gradeName,
      }));
      if (updated.gradeName) setSelectedGrade(updated.gradeName);
      if (updated.role !== 'admin') setCurrentTab('curriculum');
    }
  };

  const handleDeleteRegisteredUser = (id: string) => {
    setRegisteredUsers((previous) => {
      const nextUsers = previous.filter((user) => user.id !== id);
      saveRegisteredUsers(nextUsers);
      return nextUsers;
    });
    localStorage.removeItem(`hanish_user_data_${id}`);
    clearUserNotificationData(id);
    const missionPrefix = `hanish_missions_${id}_`;
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => key !== null && key.startsWith(missionPrefix))
      .forEach((key) => localStorage.removeItem(key));
    if (currentUser?.id === id) {
      setCurrentUser(null);
      setCurrentRole('student');
      setCurrentTab('curriculum');
      localStorage.removeItem('hanish_auth_user');
      setNotifications([]);
      setActiveToast(null);
    }
  };

  // Full platform backup export & import
  const handleExportBackup = () => {
    const payload = {
      lessons,
      booklets,
      quizzes,
      usefulLinks,
      flashcards,
      tasks,
      student,
      examResults,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hanish-edu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.lessons) setLessons(data.lessons);
      if (data.booklets) setBooklets(data.booklets);
      if (data.quizzes) setQuizzes(data.quizzes);
      if (data.usefulLinks) setUsefulLinks(data.usefulLinks);
      if (data.flashcards) setFlashcards(data.flashcards);
      if (data.tasks) setTasks(data.tasks);
      if (data.student) setStudent(data.student);
      if (data.examResults) setExamResults(data.examResults);
    } catch (e) {
      alert('خطأ في قراءة ملف النسخة الاحتياطية.');
    }
  };

  // 1. Secret Admin Portal Gate: Shown if ?portal=admin or #admin is accessed by non-admin
  if (isAdminPortalRequested && currentUser?.role !== 'admin') {
    return (
      <AdminPortalGate
        onLoginSuccess={handleLoginSuccess}
        onExitAdmin={handleExitAdminPortal}
        isDark={isDark}
      />
    );
  }

  // 2. Authentication Gate: Visitors cannot access services without logging in
  if (!currentUser) {
    return (
      <AuthLandingGate
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
        toggleTheme={toggleTheme}
        selectedGrade={selectedGrade}
        activeBgTheme={bgTheme}
        onOpenBgSelector={() => setIsBgSelectorOpen(true)}
      />
    );
  }

  return (
    <div className={`platform-shell min-h-screen theme-bg-${bgTheme} text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors`}>
      {/* Top Navbar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        currentRole={currentRole}
        setCurrentRole={(r) => {
          setCurrentRole(r);
          if (currentUser) {
            setCurrentUser({ ...currentUser, role: r });
          }
        }}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isNightFocus={isNightFocus}
        toggleNightFocus={toggleNightFocus}
        onOpenBgSelector={() => setIsBgSelectorOpen(true)}
        xpPoints={student.xpPoints}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {/* Guest / Demo Preview Mode Notice */}
      {currentUser?.isGuest && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-right">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                وضع المعاينة (زائر)
              </span>
              <span>
                أنت تتصفح المنصة كزائر تجريبي. يمكنك تجربة كافة الدروس والسبورة والذكاء الاصطناعي بحرية.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs cursor-pointer transition shadow"
              >
                تسجيل حساب دائم لحفظ النقاط
              </button>
              <button
                onClick={handleLogout}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Announcement Marquee Banner */}
      {platformAnnouncement && (
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 text-purple-100 border-b border-purple-800/50 py-2 px-4 text-xs font-bold shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0 text-amber-300 font-black">
              <Megaphone className="w-4 h-4" />
              <span>إعلان الإدارة:</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-right">{platformAnnouncement}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentUser && currentRole === 'student' && currentTab === 'curriculum' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <StudentWelcomeHero
              key={currentUser.id}
              userId={currentUser.id}
              studentName={currentUser.name || student.name || 'طالب متميز'}
              gradeName={selectedGrade}
              xpPoints={student.xpPoints}
              streakDays={student.streakDays}
              onAddXP={handleAddXP}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          </div>
        )}

        {currentTab === 'know-your-country' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <KnowYourCountry onAddXP={handleAddXP} />
          </div>
        )}

        {currentTab === 'useful-links' && <UsefulLinks links={usefulLinks} />}

        {currentTab === 'about-us' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <AboutUs
              onNavigateCurriculum={() => setCurrentTab('curriculum')}
              onNavigateKnowEgypt={() => setCurrentTab('know-your-country')}
            />
          </div>
        )}

        {currentTab === 'platform-tour' && (
          <PlatformTour onNavigate={setCurrentTab} />
        )}

        {currentTab === 'curriculum' && (
          <CurriculumExplorer
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            lessons={lessons}
            booklets={booklets}
            quizzes={quizzes}
            onAddXP={handleAddXP}
            onSaveQuizResult={handleSaveQuizResult}
          />
        )}

        {currentTab === 'ai-tutor' && (
          <AITutor
            selectedGrade={selectedGrade}
            onAddXP={handleAddXP}
          />
        )}

        {currentTab === 'image-studio' && (
          <ImageStudio
            onAddXP={handleAddXP}
            selectedGrade={selectedGrade}
          />
        )}

        {currentTab === 'brain-hub' && (
          <BrainHub
            key={currentUser.id}
            userId={currentUser.id}
            flashcards={flashcards}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateFlashcardBox={handleUpdateFlashcardBox}
            onAddFlashcard={handleAddFlashcard}
            onAddXP={handleAddXP}
            xpPoints={student.xpPoints}
            streakDays={student.streakDays}
            badges={student.badges}
            selectedGrade={selectedGrade}
            examResults={examResults}
            studentName={student.name}
            initialOpenFocusMode={initialOpenFocusMode}
            onTriggerNotification={(title, body, type) =>
              handleTriggerNotification({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                title,
                body,
                type,
                timestamp: Date.now(),
                read: false,
                actionTab: 'brain-hub',
                actionLabel: type === 'study_session' ? 'بدء جلسة التركيز الآن 🚀' : 'عرض قائمة المهام',
                actionPayload: type === 'study_session' ? { openFocusMode: true } : undefined,
              })
            }
          />
        )}

        {currentTab === 'parent-admin' && (currentUser?.role === 'admin' || currentUser?.role === 'parent') && (
          <ParentAdmin
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            student={student}
            examResults={examResults}
            onAddLesson={handleAddLesson}
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            onAddBooklet={handleAddBooklet}
            onDeleteBooklet={handleDeleteBooklet}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            currentUser={currentUser}
            registeredUsers={registeredUsers}
            onUpdateRegisteredUser={handleUpdateRegisteredUser}
            onDeleteRegisteredUser={handleDeleteRegisteredUser}
            lessons={lessons}
            booklets={booklets}
            quizzes={quizzes}
            onAddQuiz={handleAddQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            usefulLinks={usefulLinks}
            onAddUsefulLink={handleAddUsefulLink}
            onDeleteUsefulLink={handleDeleteUsefulLink}
            platformAnnouncement={platformAnnouncement}
            onUpdateAnnouncement={setPlatformAnnouncement}
            onUpdateStudent={handleUpdateStudentProfile}
          />
        )}
      </main>

      {/* Multi-Role Mock Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        defaultRole={currentRole}
        currentGrade={selectedGrade}
      />

      {/* Platform Background Themes Selector Modal */}
      <BackgroundSelectorModal
        isOpen={isBgSelectorOpen}
        onClose={() => setIsBgSelectorOpen(false)}
        activeTheme={bgTheme}
        onSelectTheme={handleSelectBgTheme}
      />

      {/* Toast Notification Center & Drawer */}
      <ToastNotificationCenter
        key={currentUser.id}
        userId={currentUser.id}
        notifications={notifications}
        setNotifications={setNotifications}
        activeToast={activeToast}
        setActiveToast={setActiveToast}
        onNavigateTab={handleNavigateFromNotification}
        isOpenDrawer={isNotificationDrawerOpen}
        setIsOpenDrawer={setIsNotificationDrawerOpen}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <AcademicLogo className="w-6 h-6 inline-block" />
            <span>منصة عائلة حنيش التعليمية الأكاديمية · الإصدار المطور 2026</span>
          </div>
          <p className="leading-relaxed">
            منظومة تعليمية متكاملة لجميع صفوف التعليم المصري مدعومة بالذكاء الاصطناعي من Google Gemini.
          </p>
          <p className="text-[11px] opacity-75">
            🇪🇬 نعتز ونفتخر بذكرى انتصارات أكتوبر المجيدة وروح العزيمة والتفوق.
          </p>
        </div>
      </footer>
    </div>
  );
}
