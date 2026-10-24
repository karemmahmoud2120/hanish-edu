import React, { useState } from 'react';
import { AcademicLogo } from './AcademicLogo';
import { PLATFORM_IMAGES } from '../assets/images';
import {
  Heart,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Users,
  Award,
  Send,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Compass,
  GraduationCap,
  FileCheck,
  Flame,
  Globe2,
  Check,
} from 'lucide-react';

interface AboutUsProps {
  onNavigateCurriculum?: () => void;
  onNavigateKnowEgypt?: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({
  onNavigateCurriculum,
  onNavigateKnowEgypt,
}) => {
  // Feedback Form State
  const [senderName, setSenderName] = useState('');
  const [senderRole, setSenderRole] = useState<'طالب' | 'ولي أمر' | 'معلم'>('ولي أمر');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) return;

    // Save to local feedback store
    const existing = JSON.parse(localStorage.getItem('hanish_feedbacks') || '[]');
    existing.unshift({
      id: Date.now(),
      senderName,
      senderRole,
      senderEmail,
      message,
      date: new Date().toLocaleDateString('ar-EG'),
    });
    localStorage.setItem('hanish_feedbacks', JSON.stringify(existing));

    setIsSubmitted(true);
    setSenderName('');
    setSenderEmail('');
    setMessage('');
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Showcase Section */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Content Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 w-fit mb-4">
              <AcademicLogo className="w-4 h-4" />
              <span>مبادرة تعليمية مصرية رائدة ومستدامة</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white leading-tight mb-4">
              نحن نؤمن بأن <span className="text-emerald-600 dark:text-emerald-400">التعليم الممتاز</span>{' '}
              حق لكل طالب في مصر
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-6 font-medium">
              انطلقت <strong className="text-slate-900 dark:text-white font-bold">منصة عائلة حنيش التعليمية</strong> من رغبة أصيلة في بناء بيئة أكاديمية متكاملة تدمج مناهج وزارة التربية والتعليم المصرية مع أحدث تقنيات الذكاء الاصطناعي التوليدي والأساليب التربوية الحديثة، لتمكين الطلاب وأولياء أمورهم من تحقيق التفوق العلمي دون أي استغلال تجاري.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onNavigateCurriculum && (
                <button
                  onClick={onNavigateCurriculum}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>استكشف المناهج والدروس</span>
                </button>
              )}

              {onNavigateKnowEgypt && (
                <button
                  onClick={onNavigateKnowEgypt}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>اكتشف قسم اعرف بلدك مصر</span>
                </button>
              )}
            </div>

            {/* Quick stats unboxed */}
            <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t border-slate-100 dark:border-slate-800 text-center sm:text-right">
              <div>
                <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">100%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">مناهج مصرية معتمدة</div>
              </div>
              <div>
                <div className="font-heading font-black text-2xl text-emerald-600 dark:text-emerald-400">3 مراحل</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">ابتدائي · إعدادي · ثانوي</div>
              </div>
              <div>
                <div className="font-heading font-black text-2xl text-blue-600 dark:text-blue-400">مجاناً</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">خدمة للعلم والمجتمع</div>
              </div>
            </div>
          </div>

          {/* Real Photo Column */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
            <img
              src={PLATFORM_IMAGES.eduHeroStudents}
              alt="طلاب مصريون في مكتبة أكاديمية يدرسون معاً"
              className="w-full h-full object-cover object-center"
            />
            {/* Deep dark gradient shield without any white wash overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-300">بيئة دراسية محفزة تجمع بين وقار العلم وتكنولوجيا المستقبل</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Story and Founding Purpose */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
              مسيرة العطاء
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              قصة تأسيس منصة عائلة حنيش
            </h2>
            <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full" />
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4 text-base leading-relaxed">
            <p>
              تأسست المنصة بقرار واعي من عائلة حنيش لتقديم نموذج يحتذى به في المسؤولية المجتمعية والتربوية. في ظل الضغوط المتزايدة للدروس الخصوصية وأعباء الكتب الخارجية والمنصات الربحية المغلقة، جاءت فكرة تأسيس منصة أكاديمية شاملة ومجانية تلبي احتياجات الطالب المصري من الصف الرابع الابتدائي وحتى الثالث الثانوي.
            </p>
            <p>
              لم نرد لمنصتنا أن تكون مجرد مستودع فيديوهات تقليدي؛ بل حرصنا على أن تكون منظومة تعلم ذكية تفاعلية توفر للطلاب: كراسات امتحانات وزارية محلولة، بطاقات استرجاع تكرار متباعد (Leitner System)، مؤقت بومودورو للتركيز مع سبورة تفاعلية، ومعلم ذكاء اصطناعي (مستر يونس وجيميني) يشرح بالعامية المصرية الودودة والفصحى السلسة.
            </p>
            <p className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-medium">
              «نحن نرى في كل طالب مصري باحثاً وعالماً كأحمد زويل، وجراحاً نابغة كمجدي يعقوب، ومفكراً كطه حسين. غايتنا ليست مجرد تحصيل الدرجات، بل بناء عقل نقدي يعتز بهويته ويسهم في نهضة وطنه.»
            </p>
          </div>
        </div>
      </section>

      {/* 3. The Four Core Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
            مبادئنا الثابتة
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
            ركائز المنصة الأربعة
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mx-auto">
            تستند المنصة إلى معايير تربوية وتكنولوجية دقيقة تضمن أعلى جودة تعليمية وأقصى درجات الأمان
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              ١. أصالة المنهج المصري والالتزام بالمعايير
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              جميع الوحدات والدروس والكراسات الامتحانية مصممة ومراجعة وفق التوزيع الزمني المعتمد من وزارة التربية والتعليم والتعليم الفني المصرية، مع تحديث فوري للمحتوى لكل مرحلة دراسية.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              ٢. الذكاء الاصطناعي الأكاديمي الموجه
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              نوظف نماذج جوجل جيميني المتطورة ومستر يونس كمرشدين علميين يقدمون أمثلة واقعية، بطاقات تلخيص فورية، واستوديو لتوليد الرسوم التوضيحية البيولوجية والفيزيائية لدعم الفهم البصري.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              ٣. الشراكة الثلاثية ومتابعة ولي الأمر
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              تمتلك المنصة بوابة مستقلة لأولياء الأمور تتيح لهم مراقبة الدرجات، نتائج الاختبارات، ساعات المذاكرة الفعالة، ورسائل التنبيه التلقائية دون الحاجة للدخول بحساب الطالب أو التطفل على خصوصيته.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              ٤. تعزيز الهوية الوطنية والاعتزاز بحضارة مصر
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              نخصص قسماً تفاعلياً متكاملاً (اعرف بلدك) يعرف الطلاب بمحافظات مصر الـ 27، وتاريخها العريق، ومشاهير العلماء المصريين، لغرس الفخر الوطني والمسؤولية تجاه مستقبل الوطن.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Academic Leadership & Ethics */}
      <section className="bg-slate-950 text-slate-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
              الأمانة والمسؤولية
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-amber-300">
              ميثاق الشرف الأخلاقي والأمان الرقمي
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-center space-y-2 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-emerald-300">أمان الخصوصية 100%</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                لا نطلب بطاقات ائتمانية ولا نجمع بيانات شخصية لبيعها لمعلنين؛ جميع بيانات الطلاب مشفرة ومحفوظة بأعلى درجات السرية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-center space-y-2 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-sky-300">بيئة خالية من التشتيت</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                صفر إعلانات تجارية مزعجة أو روابط مشبوهة، مع وضع تركيز ليلي مريح للعين لحصص المذاكرة المسائية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-center space-y-2 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-amber-300">إشراف أكاديمي مستمر</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                فريق من المعلمين والموجهين المتخصصين يراجعون بنوك الأسئلة والنماذج الاسترشادية دورياً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contact & Feedback Form */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
              صوتكم يهمنا
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              تواصل مع إدارة المنصة وأرسل مقترحاتك
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              نرحب باقتراحات أولياء الأمور والطلاب والمعلمين لتطوير المنصة وإضافة محتوى جديد
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-emerald-800 dark:text-emerald-200">
                تم استلام رسالتك ومقترحك بنجاح!
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                شكراً لمشاركتك القيّمة. يقوم المشرف العام على المنصة بمراجعة الرسائل دورياً للعمل بها.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الاسم الكريم *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثال: أ. أحمد مصطفى"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الصفة
                  </label>
                  <select
                    value={senderRole}
                    onChange={(e) => setSenderRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ولي أمر">ولي أمر طالب</option>
                    <option value="طالب">طالب / طالبة</option>
                    <option value="معلم">معلم / مشرف تربوي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني أو رقم الهاتف (اختياري للرد)
                </label>
                <input
                  type="text"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="name@example.com أو 010xxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نص الرسالة أو المقترح أو الدرس المطلوب إضافته *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب هنا ملاحظاتك أو الدروس والمواد التي ترغب في توفير نماذج إضافية لها..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none custom-scroll"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال المقترح إلى إدارة المنصة</span>
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>contact@hanish.edu.eg</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>جمهورية مصر العربية · القاهرة والجيزة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>منصة أكاديمية عائلية غير ربحية</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
