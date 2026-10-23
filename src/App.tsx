import React, { useState, useEffect } from 'react';
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
import { NotificationItem } from './types/notifications';
import {
  getStoredNotifications,
  saveNotifications,
  checkTaskDeadlines,
  checkScheduledStudySessions,
} from './utils/notificationService';
import {
  INITIAL_LESSONS,
  INITIAL_BOOKLETS,
  INITIAL_QUIZZES,
  INITIAL_FLASHCARDS,
  INITIAL_TASKS,
  INITIAL_STUDENT,
  INITIAL_EXAM_RESULTS,
  LessonItem,
  BookletItem,
  QuizItem,
  Flashcard,
  StudyTask,
  ExamResult,
  StudentProfile,
} from './data/curriculumData';

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

  // Active User / Auth State (Locked by default: user must authenticate)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('hanish_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Require login first! Platform services are locked until user signs in.
  });

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
  const [notifications, setNotifications] = useState<NotificationItem[]>(getStoredNotifications);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [initialOpenFocusMode, setInitialOpenFocusMode] = useState(false);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

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
    return currentUser?.gradeName || localStorage.getItem('hanish_grade') || 'الصف الأول الإعدادي';
  });

  useEffect(() => {
    localStorage.setItem('hanish_grade', selectedGrade);
  }, [selectedGrade]);

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

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('hanish_flashcards');
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('hanish_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [student, setStudent] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('hanish_student');
    return saved ? JSON.parse(saved) : INITIAL_STUDENT;
  });

  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    const saved = localStorage.getItem('hanish_results');
    return saved ? JSON.parse(saved) : INITIAL_EXAM_RESULTS;
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
    localStorage.setItem('hanish_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('hanish_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hanish_student', JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    localStorage.setItem('hanish_results', JSON.stringify(examResults));
  }, [examResults]);

  // Handle Auth Login Success
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('hanish_auth_user', JSON.stringify(user));

    if (user.gradeName) {
      setSelectedGrade(user.gradeName);
    }

    if (user.name) {
      setStudent((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
        linkCode: user.linkCode || prev.linkCode,
        gradeName: user.gradeName || prev.gradeName,
      }));
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
      checkScheduledStudySessions((item) => handleTriggerNotification(item));
      checkTaskDeadlines(tasks, (item) => handleTriggerNotification(item));
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

  const handleAddLesson = (lesson: LessonItem) => {
    setLessons((prev) => [lesson, ...prev]);
  };

  const handleAddBooklet = (booklet: BookletItem) => {
    setBooklets((prev) => [booklet, ...prev]);
  };

  // Full platform backup export & import
  const handleExportBackup = () => {
    const payload = {
      lessons,
      booklets,
      quizzes,
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
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
        xpPoints={student.xpPoints}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentUser && currentRole === 'student' && currentTab === 'curriculum' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <StudentWelcomeHero
              studentName={currentUser.name || student.name || 'طالب متميز'}
              gradeName={selectedGrade}
              xpPoints={student.xpPoints}
              streakDays={student.streakDays}
              onAddXP={handleAddXP}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          </div>
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

        {currentTab === 'parent-admin' && (
          <ParentAdmin
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            student={student}
            examResults={examResults}
            onAddLesson={handleAddLesson}
            onAddBooklet={handleAddBooklet}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            currentUser={currentUser}
            lessons={lessons}
            booklets={booklets}
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

      {/* Toast Notification Center & Drawer */}
      <ToastNotificationCenter
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
            <span>🐘</span>
            <span>منصة عائلة حنيش التعليمية الذكية · الإصدار المطور 2026</span>
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
