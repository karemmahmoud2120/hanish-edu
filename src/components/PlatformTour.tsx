import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Globe2,
  Image,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PlatformTourProps {
  onNavigate: (tab: string) => void;
}

interface TourScene {
  title: string;
  eyebrow: string;
  narration: string;
  description: string;
  destination: string;
  action: string;
  icon: LucideIcon;
  accent: string;
  previewTitle: string;
  previewItems: string[];
}

const TOUR_SCENES: TourScene[] = [
  {
    title: 'رحلتك التعليمية تبدأ من هنا',
    eyebrow: 'منصة عائلة حنيش التعليمية',
    narration: 'أهلاً يا بطل! أنا مستر يونس. هعرّفك بسرعة على أدوات المنصة اللي هتساعدك تتعلم وتكتشف وتبدع.',
    description: 'جولة سريعة في أهم أدوات المنصة، من الشرح الذكي وحتى الألعاب والمناهج.',
    destination: 'curriculum',
    action: 'ابدأ من المناهج',
    icon: Sparkles,
    accent: 'from-teal-500 to-emerald-400',
    previewTitle: 'مساحة تعلم متكاملة',
    previewItems: ['شرح ومراجعة', 'اكتشاف وتجربة', 'تقدم وإنجاز'],
  },
  {
    title: 'مستر يونس يشرح لك بطريقتك',
    eyebrow: 'مساعدك التعليمي الذكي',
    narration: 'اسألني عن أي فكرة في دروسك، واختار طريقة الشرح المناسبة ليك. ولو محتاج تفهم خطوة بخطوة، نقدر نكمل على السبورة الذكية.',
    description: 'اسأل عن درس أو مسألة، واستفد من الشرح المبسط والسبورة التفاعلية.',
    destination: 'ai-tutor',
    action: 'قابل مستر يونس',
    icon: Brain,
    accent: 'from-blue-500 to-cyan-400',
    previewTitle: 'قاعة مستر يونس الذكية',
    previewItems: ['اسأل عن أي درس', 'شرح خطوة بخطوة', 'السبورة التفاعلية'],
  },
  {
    title: 'حوّل أفكارك إلى صور تعليمية',
    eyebrow: 'استوديو الرسوم الذكية',
    narration: 'عايز تشوف تركيب الخلية أو المجموعة الشمسية؟ اكتب وصف الصورة التعليمية اللي في خيالك، واستوديو الرسوم الذكية يساعدك تحول الفكرة لصورة.',
    description: 'اكتب وصفًا مناسبًا للدرس، وشاهد رسومات تعليمية تساعدك على الفهم.',
    destination: 'image-studio',
    action: 'جرّب استوديو الصور',
    icon: Image,
    accent: 'from-fuchsia-500 to-violet-400',
    previewTitle: 'استوديو الصور التعليمية',
    previewItems: ['اكتب فكرة الصورة', 'حدد شكلها وحجمها', 'احفظها في معرضك'],
  },
  {
    title: 'اكتشف حكاية بلدك',
    eyebrow: 'اعرف بلدك',
    narration: 'في قسم اعرف بلدك هنكتشف مع بعض تاريخ مصر وجغرافيتها ومعالمها، من خلال محتوى تفاعلي يقرب لك المعلومة.',
    description: 'تعرف على مصر ومعالمها وتاريخها من خلال مساحة تفاعلية ممتعة.',
    destination: 'know-your-country',
    action: 'اكتشف اعرف بلدك',
    icon: Globe2,
    accent: 'from-amber-500 to-orange-400',
    previewTitle: 'جولة في مصر',
    previewItems: ['تاريخ وحضارة', 'جغرافيا ومعالم', 'اكتشاف تفاعلي'],
  },
  {
    title: 'منهجك ودرجاتك في مكان واحد',
    eyebrow: 'المناهج والدروس',
    narration: 'اختار صفك ومادتك، وبعدها تصفح الدروس والملخصات والاختبارات. كل حاجة مترتبة علشان توصل للمعلومة بسرعة.',
    description: 'تصفح دروس صفك وملخصاته واختباراته من مساحة واحدة.',
    destination: 'curriculum',
    action: 'افتح قائمة المناهج',
    icon: BookOpen,
    accent: 'from-emerald-500 to-teal-400',
    previewTitle: 'مكتبتك الدراسية',
    previewItems: ['اختر الصف والمادة', 'شاهد شرح الدرس', 'اختبر فهمك'],
  },
  {
    title: 'اكتب وارسم على السبورة الذكية',
    eyebrow: 'السبورة التفاعلية',
    narration: 'على السبورة تقدر تكتب وترسم وتحل، ومستر يونس يساعدك تلخص فكرة الدرس ويختبر فهمك بأسئلة قصيرة.',
    description: 'استخدم أدوات الرسم والشرح، ثم راجع المفاهيم وحل الأسئلة.',
    destination: 'ai-tutor',
    action: 'اذهب إلى مستر يونس',
    icon: WandSparkles,
    accent: 'from-lime-500 to-emerald-400',
    previewTitle: 'سبورة الشرح الذكية',
    previewItems: ['اكتب وارسم', 'راجع ملخص الدرس', 'تدرّب على سؤال'],
  },
];

const getArabicVoice = () =>
  window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ar'));

export const PlatformTour: React.FC<PlatformTourProps> = ({ onNavigate }) => {
  const [activeScene, setActiveScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(true);
  const [narrationAvailable, setNarrationAvailable] = useState(true);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const scene = TOUR_SCENES[activeScene];
  const SceneIcon = scene.icon;

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setNarrationAvailable(false);
      return;
    }

    const updateVoiceAvailability = () => {
      setNarrationAvailable(true);
    };
    window.speechSynthesis.addEventListener('voiceschanged', updateVoiceAvailability);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoiceAvailability);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis?.cancel();
      activeAudioRef.current?.pause();
      activeAudioRef.current = null;
      return;
    }

    let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
    const advanceScene = () => setActiveScene((current) => (current + 1) % TOUR_SCENES.length);

    if (isNarrationEnabled) {
      const controller = new AbortController();
      const speakWithBrowser = () => {
        if (controller.signal.aborted) return;
        if (!('speechSynthesis' in window)) {
          setNarrationAvailable(false);
          timeout = globalThis.setTimeout(advanceScene, 8500);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(scene.narration);
        utterance.lang = 'ar-EG';
        utterance.rate = 0.92;
        utterance.pitch = 1.04;
        const arabicVoice = getArabicVoice();
        if (arabicVoice) utterance.voice = arabicVoice;
        utterance.onend = advanceScene;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };

      fetch('/api/gemini/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.narration, voiceName: 'Puck' }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('Gemini voice unavailable');
          const data = await response.json() as { audioUrl?: string };
          if (!data.audioUrl) throw new Error('Gemini voice response did not include audio');
          if (controller.signal.aborted) return;
          const audio = new Audio(data.audioUrl);
          activeAudioRef.current = audio;
          audio.onended = advanceScene;
          audio.onerror = speakWithBrowser;
          await audio.play();
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.warn('تعذر تشغيل صوت مستر يونس المولد؛ سيتم استخدام صوت المتصفح.', error);
          speakWithBrowser();
        });

      return () => {
        controller.abort();
        window.speechSynthesis.cancel();
        if (timeout !== undefined) globalThis.clearTimeout(timeout);
        activeAudioRef.current?.pause();
        activeAudioRef.current = null;
      };
    } else {
      timeout = globalThis.setTimeout(advanceScene, 8500);
    }

    return () => {
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
    };
  }, [activeScene, isNarrationEnabled, isPlaying, scene.narration]);

  const goToScene = (index: number) => {
    setActiveScene((index + TOUR_SCENES.length) % TOUR_SCENES.length);
  };

  const togglePlayback = () => {
    if (!('speechSynthesis' in window)) setNarrationAvailable(false);
    setIsPlaying((playing) => !playing);
  };

  return (
    <section className="platform-tour mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="جولة تعريفية بالمنصة">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="text-right">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5" />
            جولة تعريفية مع مستر يونس
          </span>
          <h1 className="mt-3 font-heading text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            اكتشف إمكانيات منصتك
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            فيديو توضيحي تفاعلي يستعرض أهم الأقسام والأدوات التعليمية، مع تعليق صوتي عربي عند توفره في جهازك.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {activeScene + 1} من {TOUR_SCENES.length} مشاهد
        </span>
      </header>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
        <div key={activeScene} className="tour-screen relative grid min-h-[360px] items-center gap-8 overflow-hidden p-6 sm:min-h-[430px] sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative z-10 space-y-5 text-right">
            <span className="text-xs font-black tracking-wide text-teal-700 dark:text-teal-300">{scene.eyebrow}</span>
            <h2 className="font-heading text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
              {scene.title}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              {scene.description}
            </p>
            <blockquote className="border-r-2 border-teal-500 pr-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
              «{scene.narration}»
            </blockquote>
            <button
              type="button"
              onClick={() => onNavigate(scene.destination)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-teal-600"
            >
              {scene.action}
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md">
            <div className="tour-preview-card rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${scene.accent} text-white shadow-lg`}>
                  <SceneIcon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400">منصة عائلة حنيش</span>
                  <span className="font-heading text-base font-black text-slate-900 dark:text-white">{scene.previewTitle}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {scene.previewItems.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-right dark:border-slate-800 dark:bg-slate-800/70">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${scene.accent} text-xs font-black text-white`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">{item}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
                {TOUR_SCENES.map((item, index) => (
                  <span
                    key={item.eyebrow}
                    className={`h-1.5 flex-1 rounded-full transition-all ${index === activeScene ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-slate-950 text-teal-300 shadow-xl dark:border-slate-900">
              <span className="text-xl" role="img" aria-label="مستر يونس">👨‍🏫</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={togglePlayback}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600"
              aria-label={isPlaying ? 'إيقاف الجولة مؤقتًا' : 'تشغيل الجولة'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'إيقاف مؤقت' : 'شغّل الجولة'}
            </button>
            <button
              type="button"
              onClick={() => setIsNarrationEnabled((enabled) => !enabled)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={isNarrationEnabled ? 'كتم التعليق الصوتي' : 'تشغيل التعليق الصوتي'}
              title={narrationAvailable ? (isNarrationEnabled ? 'كتم صوت مستر يونس' : 'تشغيل صوت مستر يونس') : 'التعليق الصوتي غير مدعوم في هذا المتصفح'}
            >
              {isNarrationEnabled && narrationAvailable ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => goToScene(activeScene - 1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="المشهد السابق"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToScene(activeScene + 1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="المشهد التالي"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-right">
            {narrationAvailable ? 'يمكنك تشغيل الجولة أو التنقل بين المشاهد يدويًا.' : 'التعليق الصوتي غير مدعوم في هذا المتصفح؛ اقرأ النص الظاهر أو تنقّل بين المشاهد.'}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOUR_SCENES.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.eyebrow}
              type="button"
              onClick={() => {
                goToScene(index);
                setIsPlaying(false);
              }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${
                index === activeScene
                  ? 'border-teal-500 bg-teal-50 shadow-sm dark:bg-teal-950/30'
                  : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.eyebrow}</span>
                <span className="mt-0.5 block truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">{item.title}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
