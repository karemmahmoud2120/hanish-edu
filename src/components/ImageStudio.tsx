import React, { useState } from 'react';
import { Palette, Sparkles, Upload, Download, RefreshCw, Image as ImageIcon, ZoomIn, Copy, Check, SlidersHorizontal, Info } from 'lucide-react';

interface ImageStudioProps {
  onAddXP: (points: number) => void;
  selectedGrade: string;
}

interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: string;
  isEdit?: boolean;
}

const PRESET_PROMPTS = [
  {
    title: 'تركيب الخلية النباتية',
    prompt: 'رسم توضيحي علمي دقيق للخلية النباتية يوضح الجدار الخلوي، البلاستيدات الخضراء، والفجوة العصارية بأسلوب كتاب العلوم المدرسي الملون فائق الدقة',
    subject: 'العلوم والأحياء',
  },
  {
    title: 'الدائرة الكهربائية البسيطة',
    prompt: 'مخطط فيزيائي تعليمي لدائرة كهربائية بسيطة تضم بطارية، مفتاح تشغيل، ومصباح مضيء وأسهم تبين اتجاه التيار الكهربائي بوضوح',
    subject: 'الفيزياء',
  },
  {
    title: 'المجوعة الشمسية ومدارات الكواكب',
    prompt: 'رسم تعليمي فضائي ثلاثي الأبعاد للشمس وكواكب المجموعة الشمسية الثمانية مع مسارات مدارية واضحة وتسميات ملونة',
    subject: 'الدراسات والعلوم',
  },
  {
    title: 'مثلث فيثاغورس والهندسة',
    prompt: 'رسم هندسي رياضي ملون يوضح نظرية فيثاغورس على مثلث قائم الزاوية مع المربعات المنشأة على الأضلاع بالألوان',
    subject: 'الرياضيات',
  },
  {
    title: 'خريطة تضاريس نهر النيل بمصر',
    prompt: 'خريطة جغرافية تعليمية مبسطة تظهر مجرى نهر النيل والدلتا والبحرين المتوسط والأحمر بأسلوب أطلس مدرسي مشرق',
    subject: 'الدراسات الاجتماعية',
  },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({ onAddXP, selectedGrade }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4' | '9:16'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImageItem | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const [gallery, setGallery] = useState<GeneratedImageItem[]>([
    {
      id: 'init-1',
      url: '/assets/aistudio/apple-touch-icon_97f7784d.png',
      prompt: 'شعار منصة عائلة حنيش التعليمية وقبعة التخرج المتألقة',
      aspectRatio: '1:1',
      createdAt: 'اليوم',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEdit = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setErrorMsg('اكتب وصفاً تعليمياً دقيقاً للرسم المطلوب.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt + ` (وسيلة تعليمية مناسبة لـ ${selectedGrade})`,
          aspectRatio,
          imageSize,
          base64Image: uploadedImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توليد الصورة بنموذج gemini-nano-banana-2.1');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        url: data.imageUrl,
        prompt: cleanPrompt,
        aspectRatio: data.aspectRatio || aspectRatio,
        createdAt: 'الآن',
        isEdit: !!uploadedImage,
      };

      setGallery((prev) => [newItem, ...prev]);
      onAddXP(30);
      setPreviewImage(newItem);
      setUploadedImage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بالنموذج. تأكد من تفعيل مفتاح Gemini المعتمد.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مدعوم بنموذج Google: gemini-nano-banana-2.1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            استوديو الوسائل والرسوم التعليمية الذكية
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            حوّل أي فكرة درس أو معادلة أو تجربة علمية إلى رسوم توضيحية عالية الدقة وبطاقات مفاهيمية جاهزة لمذكرتك الدراسية.
          </p>
        </div>

        <div className="shrink-0 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <span className="text-2xl block mb-1">🎨</span>
          <span className="text-xs font-bold text-purple-200">توليد وتعديل الرسوم</span>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Creator Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <span>{uploadedImage ? 'وضع تعديل الصورة المرفوعة' : 'إنشاء رسم توضيحي جديد'}</span>
            </h3>

            {uploadedImage && (
              <button
                onClick={() => setUploadedImage(null)}
                className="text-xs text-rose-500 hover:underline font-bold"
              >
                إلغاء وضع التعديل ✕
              </button>
            )}
          </div>

          {/* Uploaded Reference Box if editing */}
          {uploadedImage && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center gap-4">
              <img src={uploadedImage} alt="Reference" className="w-20 h-20 object-cover rounded-xl border border-purple-300 shrink-0" />
              <div className="text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <span className="font-bold block">الصورة جاهزة للتعديل بنموذج gemini-nano-banana-2.1:</span>
                <p className="opacity-80">اكتب بالأسفل ما تريد تغييره أو إضافته على هذه الصورة (مثال: أضف تسميات، غير الألوان، اجعلها خريطة ذهنية).</p>
              </div>
            </div>
          )}

          {/* Prompt Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {uploadedImage ? 'أمر التعديل على الصورة:' : 'وصف الرسم أو الوسيلة التعليمية:'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                uploadedImage
                  ? 'اكتب ماذا تريد تعديله في الصورة (مثال: أضف أسماء أجزاء الزهرة باللغة العربية، واجعل الخلفية بيضاء نقية)...'
                  : 'اكتب وصفاً للرسم التعليمي (مثال: رسم توضيحي ثلاثي الأبعاد للقلب البشري مع صماماته والشرايين بلونيها الأحمر والأزرق)...'
              }
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-medium"
            />
          </div>

          {/* Aspect Ratio & Quality Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                نسبة الأبعاد (Aspect Ratio):
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                {(['1:1', '16:9', '4:3', '3:4', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-lg transition-all ${
                      aspectRatio === ratio
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                دقة الوضوح (Resolution):
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                {(['1K', '2K'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-2 rounded-lg transition-all ${
                      imageSize === sz
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sz === '1K' ? '1K قياسي' : '2K فائق الوضوح'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Image Upload Trigger */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 cursor-pointer">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>{uploadedImage ? 'تغيير الصورة المرفوعة' : 'رفع صورة لتعديلها بنموذج Gemini'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <span className="text-[11px] text-slate-400 font-mono">gemini-nano-banana-2.1</span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateOrEdit}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-purple-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري معالجة وتوليد الرسم بنموذج Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{uploadedImage ? 'تطبيق التعديلات على الصورة' : 'توليد الرسم التوضيحي الآن'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Presets & Quick Tips */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>نماذج جاهزة للمناهج المصرية</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اضغط على أي نموذج لتعبئة الوصف وتجربة التوليد الفوري:
            </p>

            <div className="space-y-2.5">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.prompt)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700/60 text-right transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      {p.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {p.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Info className="w-4 h-4 text-blue-500" />
              <span>نصائح للحصول على أفضل رسم توضيحي:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pr-1 text-[11px] leading-relaxed">
              <li>حدد المادة واسم الدرس بالتفصيل (مثل: الأحياء، الدورة الدموية، الجبر).</li>
              <li>اطلب تحديد الأجزاء والبيانات التوضيحية باللغة العربية.</li>
              <li>استخدم نسبة 16:9 للشاشات العريضة والشروح الأفقية، أو 1:1 لبطاقات المذاكرة المربعة.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gallery of Created Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            <span>معرض الرسوم والوسائل التوضيحية ({gallery.length})</span>
          </h3>
          <span className="text-xs text-slate-500">الصور تحفظ تلقائياً لاستخدامها في المذاكرة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div className="relative overflow-hidden bg-slate-950 aspect-square flex items-center justify-center">
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewImage(img)}
                    className="p-2.5 rounded-full bg-white text-slate-900 shadow hover:scale-110 transition cursor-pointer"
                    title="تكبير ومعاينة"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <a
                    href={img.url}
                    download={`hanish-edu-${img.id}.png`}
                    className="p-2.5 rounded-full bg-emerald-600 text-white shadow hover:scale-110 transition cursor-pointer"
                    title="تحميل الصورة"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {img.isEdit && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow">
                    معدلة
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>الأبعاد: {img.aspectRatio}</span>
                  <span>{img.createdAt}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {img.prompt}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setUploadedImage(img.url);
                      setPrompt(`عدل على هذه الصورة: `);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    تعديل بأمر جديد ✏️
                  </button>

                  <button
                    onClick={() => copyPrompt(img.id, img.prompt)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition cursor-pointer"
                    title="نسخ الوصف"
                  >
                    {copiedPromptId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                {previewImage.prompt}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img src={previewImage.url} alt={previewImage.prompt} className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">تم الإنشاء بنموذج: gemini-nano-banana-2.1</span>
              <a
                href={previewImage.url}
                download="hanish-edu-illustration.png"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الرسم بدقة عالية</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
