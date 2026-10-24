import React, { useState } from 'react';
import { STAGES, SUBJECTS_BY_STAGE, LessonItem, BookletItem, QuizItem, getQuizPassingPercentage } from '../data/curriculumData';
import { Play, FileText, CheckCircle2, Clock, ThumbsUp, Eye, Download, MessageSquare, Award, ArrowRight, Check, X, RotateCcw } from 'lucide-react';

interface CurriculumExplorerProps {
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  lessons: LessonItem[];
  booklets: BookletItem[];
  quizzes: QuizItem[];
  onAddXP: (points: number) => void;
  onSaveQuizResult: (quizTitle: string, subject: string, score: number, maxScore: number) => void;
}

export const CurriculumExplorer: React.FC<CurriculumExplorerProps> = ({
  selectedGrade,
  setSelectedGrade,
  lessons,
  booklets,
  quizzes,
  onAddXP,
  onSaveQuizResult,
}) => {
  const [activeSection, setActiveSection] = useState<'lessons' | 'booklets' | 'quizzes'>('lessons');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeVideoLesson, setActiveVideoLesson] = useState<LessonItem | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [lessonList, setLessonList] = useState<LessonItem[]>(lessons);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPage, setQuizPage] = useState(0);

  // Identify current stage from selected grade
  const currentStage = STAGES.find((s) => (s.years as readonly string[]).includes(selectedGrade)) || STAGES[1];
  const availableSubjects = SUBJECTS_BY_STAGE[currentStage.id] || [];

  // Filter items by grade and subject
  const filteredLessons = lessonList.filter((l) => {
    const matchesGrade = l.gradeName === selectedGrade || l.stageId === currentStage.id;
    const matchesSubject = selectedSubject === 'all' || l.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  const filteredBooklets = booklets.filter((b) => {
    const matchesGrade = b.gradeName === selectedGrade || b.stageId === currentStage.id;
    const matchesSubject = selectedSubject === 'all' || b.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesGrade = q.gradeName === selectedGrade || q.stageId === currentStage.id;
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });
  const quizResultPercentage = activeQuiz
    ? Math.round((quizScore / activeQuiz.questions.length) * 100)
    : 0;
  const quizPassingPercentage = activeQuiz ? getQuizPassingPercentage(activeQuiz) : 0;

  // Handle like toggle
  const handleLikeLesson = (lessonId: string) => {
    setLessonList((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, likes: l.likes + 1 } : l))
    );
  };

  // Handle student question submission
  const handleAddQuestion = (lessonId: string) => {
    if (!newQuestionText.trim()) return;

    setLessonList((prev) =>
      prev.map((l) => {
        if (l.id === lessonId) {
          return {
            ...l,
            questions: [
              ...l.questions,
              {
                id: `q-${Date.now()}`,
                studentName: 'أنت',
                question: newQuestionText.trim(),
                answer: 'تم استلام سؤالك وسيتم اعتماده وشرحه قريباً بواسطة المعلم.',
                date: 'الآن',
              },
            ],
          };
        }
        return l;
      })
    );

    setNewQuestionText('');
    onAddXP(5);
  };

  // Quiz submission
  const handleFinishQuiz = () => {
    if (!activeQuiz) return;
    if (!activeQuiz.questions.every((question) => quizAnswers[question.id] !== undefined)) return;
    let calculatedScore = 0;
    activeQuiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        calculatedScore++;
      }
    });

    setQuizScore(calculatedScore);
    setQuizFinished(true);
    onSaveQuizResult(activeQuiz.title, activeQuiz.subject, calculatedScore, activeQuiz.questions.length);
    onAddXP(calculatedScore * 10);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Stage Selector Header Banner */}
      <div className="bg-gradient-to-l from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/20 text-xs font-bold">
            <span>{currentStage.icon}</span>
            <span>{currentStage.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            المناهج والدروس المعتمدة: {selectedGrade}
          </h2>
          <p className="text-slate-200 text-sm max-w-2xl leading-relaxed">
            {currentStage.description} استعرض شروحات الفيديو والملخصات واختبارات قياس الفهم المصممة لصفك.
          </p>
        </div>

        {/* Grade switch pills */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/30 backdrop-blur rounded-2xl max-w-sm">
          {currentStage.years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedGrade(y)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === y
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {y.replace('الصف ', '').replace(' الإعدادي', ' ع').replace(' الابتدائي', ' ب').replace(' الثانوي', ' ث')}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs & Subject Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          {/* Main Content Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('lessons')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'lessons'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>الدروس والفيديوهات ({filteredLessons.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('booklets')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'booklets'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>الملازم والمذكرات ({filteredBooklets.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('quizzes')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'quizzes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>الامتحانات الإلكترونية ({filteredQuizzes.length})</span>
            </button>
          </div>

          {/* Subject Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              جميع المواد
            </button>
            {availableSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. LESSONS VIEW */}
      {activeSection === 'lessons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              لا توجد شروحات مضافة حالياً لهذه المادة في {selectedGrade}. تصفح المواد الأخرى أو استشر مستر يونس.
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail / Video launch */}
                  <div
                    onClick={() => setActiveVideoLesson(lesson)}
                    className="relative aspect-video bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-all overflow-hidden"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current mr-0.5" />
                    </div>
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-mono font-bold">
                      {lesson.duration}
                    </span>
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {lesson.subject}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {lesson.description}
                    </p>

                    {/* Summary points */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      {lesson.summaryPoints.slice(0, 2).map((pt, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lesson.views}</span>
                    </span>
                    <button
                      onClick={() => handleLikeLesson(lesson.id)}
                      className="flex items-center gap-1 hover:text-emerald-600 transition cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{lesson.likes}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveVideoLesson(lesson)}
                    className="font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>فتح الشرح والنقاش</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. BOOKLETS VIEW */}
      {activeSection === 'booklets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooklets.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              لا توجد مذكرات مرفوعة لهذه المادة حالياً.
            </div>
          ) : (
            filteredBooklets.map((booklet) => (
              <div
                key={booklet.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-black text-xs uppercase border border-rose-200 dark:border-rose-900/60">
                      {booklet.fileType}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{booklet.subject}</span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                    {booklet.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {booklet.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>الحجم: {booklet.fileSize}</span>
                    <span>·</span>
                    <span>{booklet.pages} صفحة</span>
                  </div>
                </div>

                <a
                  href={booklet.downloadUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`جاري تحميل مذكرة: ${booklet.title}`);
                    onAddXP(10);
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل المذكرة (PDF)</span>
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. QUIZZES VIEW */}
      {activeSection === 'quizzes' && (
        <div className="space-y-6">
          {!activeQuiz ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  لا توجد اختبارات إلكترونية مضافة لهذه المادة حالياً.
                </div>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                          {quiz.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{quiz.durationMinutes} دقائق</span>
                        </span>
                      </div>

                      <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white leading-snug">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        عدد الأسئلة: {quiz.questions.length} أسئلة اختيار من متعدد مع التصحيح الفوري والتوضيح.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuiz(quiz);
                        setQuizAnswers({});
                        setQuizFinished(false);
                        setQuizScore(0);
                        setQuizPage(0);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>ابدأ الاختبار الآن</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Active Quiz Player Canvas */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                    {activeQuiz.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    المادة: {activeQuiz.subject} · {activeQuiz.questions.length} أسئلة
                  </span>
                </div>

                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  الخروج للقائمة
                </button>
              </div>

              {/* Quiz Questions List */}
              <div className="space-y-6">
                {activeQuiz.questions.slice(quizPage, quizPage + 1).map((q) => {
                  const userAnswer = quizAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        س {quizPage + 1}: {q.question}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = userAnswer === optIndex;
                          const isCorrect = q.correctIndex === optIndex;

                          let choiceStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400';
                          if (quizFinished) {
                            if (isCorrect) {
                              choiceStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                            } else if (isSelected && !isCorrect) {
                              choiceStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                            }
                          } else if (isSelected) {
                            choiceStyle = 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-100 font-bold';
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizFinished}
                              onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                              className={`p-3 rounded-xl border text-right text-xs transition flex items-center justify-between cursor-pointer ${choiceStyle}`}
                            >
                              <span>{opt}</span>
                              {quizFinished && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                              {quizFinished && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizFinished && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl mt-2 leading-relaxed">
                          💡 <b>التفسير النموذجي:</b> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit or Result Action */}
              <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <button
                    type="button"
                    onClick={() => setQuizPage((page) => Math.max(0, page - 1))}
                    disabled={quizPage === 0}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    السؤال السابق
                  </button>
                  <div className="min-w-0 flex-1 text-center">
                    <span>صفحة {quizPage + 1} من {activeQuiz.questions.length}</span>
                    <div className="mx-auto mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${((quizPage + 1) / activeQuiz.questions.length) * 100}%` }} />
                    </div>
                  </div>
                  {!quizFinished && quizPage < activeQuiz.questions.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setQuizPage((page) => Math.min(activeQuiz.questions.length - 1, page + 1))}
                      className="rounded-xl bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-600"
                    >
                      السؤال التالي
                    </button>
                  )}
                  {quizFinished && quizPage < activeQuiz.questions.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setQuizPage((page) => Math.min(activeQuiz.questions.length - 1, page + 1))}
                      className="rounded-xl bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-600"
                    >
                      السؤال التالي
                    </button>
                  )}
                </div>
                {!quizFinished ? (
                  quizPage === activeQuiz.questions.length - 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {activeQuiz.questions.every((question) => quizAnswers[question.id] !== undefined)
                          ? 'تمت الإجابة عن جميع الأسئلة، يمكنك التسليم.'
                          : `أجبت عن ${Object.keys(quizAnswers).length} من ${activeQuiz.questions.length} سؤالًا. أكمل الإجابات قبل التسليم.`}
                      </p>
                      <button
                        onClick={handleFinishQuiz}
                        disabled={!activeQuiz.questions.every((question) => quizAnswers[question.id] !== undefined)}
                        className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-extrabold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        تسليم الامتحان واعتماد النتيجة ✅
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      درجتك في هذا الاختبار:{' '}
                      <span className="text-xl font-extrabold text-emerald-600">
                        {quizScore} من {activeQuiz.questions.length}
                      </span>{' '}
                      ({quizResultPercentage}%)
                      <span className={`ms-2 rounded-full px-2.5 py-1 text-xs ${quizResultPercentage >= quizPassingPercentage
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {quizResultPercentage >= quizPassingPercentage ? 'ناجح' : 'تحتاج إلى مراجعة'} · درجة النجاح {quizPassingPercentage}%
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizFinished(false);
                          setQuizScore(0);
                          setQuizPage(0);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة الاختبار</span>
                      </button>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
                      >
                        تمت المراجعة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Lesson & Q&A Modal */}
      {activeVideoLesson && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveVideoLesson(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white truncate max-w-lg">
                  {activeVideoLesson.title}
                </h3>
                <span className="text-xs text-emerald-600 font-bold">{activeVideoLesson.subject} · {activeVideoLesson.gradeName}</span>
              </div>
              <button
                onClick={() => setActiveVideoLesson(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <iframe
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
                title={activeVideoLesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">وصف الدرس وأهم النقاط:</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {activeVideoLesson.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-2">
                  {activeVideoLesson.summaryPoints.map((pt, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions & Discussion Thread */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>أسئلة واستفسارات الطلاب عن هذا الدرس ({activeVideoLesson.questions.length})</span>
                </h4>

                <div className="space-y-3 max-h-56 overflow-y-auto custom-scroll pr-1">
                  {activeVideoLesson.questions.length === 0 ? (
                    <p className="text-xs text-slate-500">لا توجد استفسارات بعد، كن أول من يسأل المعلم عن أي نقطة غامضة!</p>
                  ) : (
                    activeVideoLesson.questions.map((q) => (
                      <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{q.studentName}</span>
                          <span>{q.date}</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white">{q.question}</p>
                        {q.answer && (
                          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[11px] mt-1">
                            👨‍🏫 <b>رد المعلم:</b> {q.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Submit new question */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="اكتب سؤالك عن هذه النقطة في الدرس..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleAddQuestion(activeVideoLesson.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    إرسال السؤال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
