import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, ArrowLeft, Bot, BookOpen, Calculator, Zap, GraduationCap, Copy, Check } from 'lucide-react';
import { InteractiveChalkboard } from './InteractiveChalkboard';

interface AITutorProps {
  selectedGrade: string;
  onAddXP: (points: number) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  model: string;
  timestamp: string;
}

interface LessonCard {
  title: string;
  text: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const PERSONAS = [
  {
    id: 'general',
    name: 'مستر يونس العام',
    badge: 'معلم المناهج الشامل',
    model: 'gemini-3.8-flash',
    icon: GraduationCap,
    desc: 'شرح مبسط وصبور لجميع المواد والمفاهيم المنهجية',
    systemInstruction:
      'أنت "مستر يونس"، معلم مصري خبير وودود وصبور جداً. تشرح مناهج وزارة التربية والتعليم المصرية بأسلوب شيق وجذاب يجمع بين دقة المعلومة وتبسيط الفكرة. استخدم أمثلة من البيئة المصرية، وشجع الطالب دوماً بعبارات تحفيزية مثل: "يا بطل"، "يا دكتور"، "أحسنت التفكير". تجنب الإطالة المملة وقدم المعلومات في نقاط واضحة.',
  },
  {
    id: 'stem',
    name: 'خبير الرياضيات والفيزياء',
    badge: 'تفكير متقدم ومعادلات',
    model: 'gemini-3.8-flash',
    icon: Calculator,
    desc: 'حل المسائل الرياضية والفيزيائية المعقدة خطوة بخطوة بالاستنتاج المنطقي',
    systemInstruction:
      'أنت أستاذ الرياضيات والفيزياء المتخصص في حل المسائل والتفكير العلمي الدقيق للمناهج المصرية. عند تقديم أي مسألة، اتبع الخطوات الأكاديمية: 1) المعطيات والمطلوب، 2) القانون المستخدم، 3) خطوات التعويض الحسابي بالتفصيل، 4) الناتج مع وحدة القياس الدقيقة وتنبيه الطالب لأي خدع شائعة في الامتحان.',
  },
  {
    id: 'flash',
    name: 'المجيب السريع الخاطف',
    badge: 'تعريفات ومصطلحات سريعة',
    model: 'gemini-3.1-flash-lite',
    icon: Zap,
    desc: 'إجابات فورية مختصرة لتعريفات الكلمات والمصطلحات والتواريخ المهمة',
    systemInstruction:
      'أنت محرك الإجابات السريعة والمصطلحات المباشرة للطالب. أجب باختصار شديد وتركيز عالٍ في حدود سطرين أو ثلاثة باللغة العربية الفصحى البسيطة والمباشرة دون مقدمات مطولة.',
  },
  {
    id: 'exam',
    name: 'مدرب الامتحانات والمراجعة',
    badge: 'توقعات ونماذج امتحانية',
    model: 'gemini-3.8-flash',
    icon: BookOpen,
    desc: 'تدريب على أنماط أسئلة الامتحانات واستراتيجيات نيل الدرجة النهائية',
    systemInstruction:
      'أنت موجه أول وخبير امتحانات الشهادات التعليمية في مصر. تدرب الطلاب على أحدث مواصفات الورقة الامتحانية، وتبين لهم الكلمات المفتاحية التي يبحث عنها المصحح، وتصوغ لهم أسئلة المتفوقين وطرق الإجابة النموذجية.',
  },
];

export const AITutor: React.FC<AITutorProps> = ({ selectedGrade, onAddXP }) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'blackboard'>('chat');

  // Active speech and audio state
  const [isTalking, setIsTalking] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Chatbot Mode State
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `أهلاً بك يا بطل في قاعة مستر يونس الذكية! أنا معلمك المتحدث لمرحلة ${selectedGrade}. يمكنك سؤالي عن أي درس أو مسألة، أو الضغط على زر الميكروفون والصوت للاستماع لشرحي بصوت الذكاء الاصطناعي مباشرة.`,
      model: PERSONAS[0].model,
      timestamp: 'الآن',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Stop any active audio
  const stopSpeech = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTalking(false);
    setIsGeneratingVoice(false);
  };

  // High quality voice narration using Gemini TTS with fallback
  const speakText = async (text: string) => {
    if (!isAudioEnabled) return;
    stopSpeech();

    const clean = text
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[0-9]+\.\s/g, '')
      .trim()
      .slice(0, 350);

    if (!clean) return;

    setIsGeneratingVoice(true);

    try {
      // 1. Try Gemini Real AI TTS endpoint
      const res = await fetch('/api/gemini/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voiceName: 'Puck' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          activeAudioRef.current = audio;

          audio.onplay = () => {
            setIsGeneratingVoice(false);
            setIsTalking(true);
          };
          audio.onended = () => {
            setIsTalking(false);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsTalking(false);
            activeAudioRef.current = null;
          };

          await audio.play();
          return;
        }
      }
      throw new Error('TTS server fallback');
    } catch {
      // 2. Fallback to browser SpeechSynthesis
      setIsGeneratingVoice(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'ar-EG';
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find((v) => /^ar/i.test(v.lang));
        if (arVoice) utterance.voice = arVoice;

        utterance.onstart = () => setIsTalking(true);
        utterance.onend = () => setIsTalking(false);
        utterance.onerror = () => setIsTalking(false);

        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Chat message send
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      model: activePersona.model,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build history for multi-turn
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activePersona.model,
          systemInstruction: activePersona.systemInstruction + `\nالطالب في: ${selectedGrade}`,
          messages: history,
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر الرد');

      const modelMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        content: data.reply,
        model: activePersona.model,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, modelMsg]);
      onAddXP(10);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `عذراً، حدث خطأ أثناء معالجة السؤال: ${err.message || 'حاول مرة أخرى.'}`,
        model: activePersona.model,
        timestamp: 'الآن',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-right">
          {/* Mr. Younis Animated Avatar */}
          <div className={`relative w-20 h-20 shrink-0 transition-transform ${isTalking ? 'scale-105' : ''}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
              {/* Animated aura ring */}
              {isTalking && (
                <circle cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="3" opacity="0.6" className="animate-ping" />
              )}
              {/* Head */}
              <circle cx="50" cy="44" r="22" fill="#fbd5b5" />
              {/* Hair */}
              <path d="M28 42 C28 24 40 18 52 18 C64 18 72 24 72 42 C68 32 58 28 50 28 C42 28 32 32 28 42 Z" fill="#1e293b" />
              {/* Glasses */}
              <rect x="33" y="38" width="14" height="11" rx="4" fill="none" stroke="#0284c7" strokeWidth="2" />
              <rect x="53" y="38" width="14" height="11" rx="4" fill="none" stroke="#0284c7" strokeWidth="2" />
              <line x1="47" y1="43" x2="53" y2="43" stroke="#0284c7" strokeWidth="2" />
              {/* Eyes */}
              <circle cx="40" cy="43" r="2.5" fill="#0f172a" />
              <circle cx="60" cy="43" r="2.5" fill="#0f172a" />
              {/* Cheeks */}
              <ellipse cx="36" cy="51" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4" />
              <ellipse cx="64" cy="51" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4" />
              {/* Mouth */}
              {isTalking ? (
                <ellipse cx="50" cy="55" rx="4.5" ry="3.5" fill="#991b1b" className="animate-pulse" />
              ) : (
                <path d="M45 54 Q50 58 55 54" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
              )}
              {/* Clothes */}
              <path d="M22 88 C22 72 36 66 50 66 C64 66 78 72 78 88 Z" fill="#1e3a8a" />
              <polygon points="50,66 45,78 55,78" fill="#fbbf24" />
            </svg>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
              AI
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-heading font-extrabold text-white">قاعة مستر يونس الذكية</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                {selectedGrade}
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              معلمك التفاعلي الصبور المجهز بالصوت الذكي الحقيقي ونماذج Google Gemini.
            </p>

            {/* Quick Voice Play Test & Status */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={() => {
                  if (isTalking) {
                    stopSpeech();
                  } else {
                    speakText(`يا هلا بيك يا بطل! أنا مستر يونس، مدرسك الخاص لمنهج ${selectedGrade}. جاهز أشرحلك أي درس وأجاوب على كل استفساراتك.`);
                  }
                }}
                disabled={isGeneratingVoice}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {isGeneratingVoice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تجهيز صوت الذكاء الاصطناعي...</span>
                  </>
                ) : isTalking ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>إيقاف صوت المعلم</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>جرّب صوت مستر يونس الآن 🎙️</span>
                  </>
                )}
              </button>

              {isTalking && (
                <span className="text-[11px] text-emerald-300 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-bounce"></span>
                  <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-bounce delay-100"></span>
                  <span className="inline-block w-1.5 h-2 bg-emerald-400 animate-bounce delay-200"></span>
                  <span className="mr-1">مستر يونس يتحدث الآن...</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'chat'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>روبوت محادثة جيميني (المتحدث)</span>
          </button>
          <button
            onClick={() => setActiveMode('blackboard')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'blackboard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>السبورة التفاعلية</span>
          </button>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE CHALKBOARD & LESSON CARDS */}
      {activeMode === 'blackboard' && (
        <InteractiveChalkboard
          selectedGrade={selectedGrade}
          onAddXP={onAddXP}
        />
      )}

      {/* MODE 2: MULTI-TURN GEMINI CHAT */}
      {activeMode === 'chat' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Persona / Tutor Role Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>اختر تخصص المعلم الذكي</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              اختر دور المعلم المتخصص الذي يناسب سؤالك الحالي، لتوجيه محرك Gemini للإجابة بدقة متناهية:
            </p>

            <div className="space-y-2.5">
              {PERSONAS.map((p) => {
                const IconComponent = p.icon;
                const isSelected = activePersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePersona(p)}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm truncate">{p.name}</span>
                        <span className="text-[10px] font-mono opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                          {p.model.replace('gemini-', '')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px] overflow-hidden">
            {/* Header of Chat */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{activePersona.name}</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    النموذج النشط: <code className="font-mono text-emerald-600 dark:text-emerald-400">{activePersona.model}</code> · {selectedGrade}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  setChatMessages([
                    {
                      id: 'welcome-reset',
                      role: 'model',
                      content: `أهلاً بك مجدداً يا بطل! مستر يونس (${activePersona.name}) مستعد لاستقبال أسئلتك الجديدة في ${selectedGrade}.`,
                      model: activePersona.model,
                      timestamp: 'الآن',
                    },
                  ])
                }
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>محادثة جديدة</span>
              </button>
            </div>

            {/* Scrollable Messages Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scroll">
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white shadow-sm'
                      }`}
                    >
                      {isUser ? 'طالب' : 'يونس'}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line group relative ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tl-none shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none border border-slate-200 dark:border-slate-700/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] opacity-60 mb-1">
                        <span>{isUser ? 'أنت' : activePersona.name}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.content}</p>

                      {!isUser && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => copyText(msg.id, msg.content)}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded transition cursor-pointer"
                            title="نسخ النص"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              if (isTalking) {
                                stopSpeech();
                              } else {
                                speakText(msg.content);
                              }
                            }}
                            className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded transition cursor-pointer flex items-center gap-1"
                            title={isTalking ? 'إيقاف الصوت' : 'استمع للإجابة بصوت الذكاء الاصطناعي'}
                          >
                            {isTalking ? (
                              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span className="text-[10px] font-bold text-slate-500">
                              {isTalking ? 'إيقاف' : 'استمع 🔊'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    يونس
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
                    <span>مستر يونس بيفكر ويجهز الشرح...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اسأل مستر يونس عن أي درس أو مسألة..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>إرسال</span>
                <Send className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
