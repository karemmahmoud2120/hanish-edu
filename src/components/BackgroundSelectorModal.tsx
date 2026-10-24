import React from 'react';
import { X, Check, Palette, Sparkles, LayoutGrid, Compass, Compass as GeometryIcon, Layers } from 'lucide-react';

export type BackgroundThemeId = 'academic' | 'arabesque' | 'blueprint' | 'campus' | 'minimal';

export interface BackgroundThemeOption {
  id: BackgroundThemeId;
  name: string;
  tagline: string;
  description: string;
  cssClass: string;
  previewBg: string;
}

export const BACKGROUND_THEMES: BackgroundThemeOption[] = [
  {
    id: 'academic',
    name: 'الشبكة الأكاديمية (Dot Matrix)',
    tagline: 'الأكثر تركيزاً وهدوءاً',
    description: 'نقاط مصفوفة هادئة تساعد على توازن البصر والتركيز أثناء حل المسائل والقراءة المطولة.',
    cssClass: 'theme-bg-academic',
    previewBg: 'radial-gradient(#059669 1px, transparent 1px)',
  },
  {
    id: 'arabesque',
    name: 'الأرابيسك والهندسة المصرية',
    tagline: 'أصالة العمارة والمعرفة',
    description: 'زخارف هندسية دقيقة مستوحاة من العمارة الإسلامية والتراث العلمي والجمالي العريق.',
    cssClass: 'theme-bg-arabesque',
    previewBg: 'repeating-linear-gradient(45deg, #059669 0, #059669 1px, transparent 0, transparent 8px)',
  },
  {
    id: 'blueprint',
    name: 'المخطط الهندسي (Blueprint)',
    tagline: 'مظهر دفتر الرياضيات والهندسة',
    description: 'خطوط مربعات هندسية دقيقة تعطي إحساس المختبرات العلمية وغرف التصميم الهندسي.',
    cssClass: 'theme-bg-blueprint',
    previewBg: 'linear-gradient(to right, #2563eb 1px, transparent 1px), linear-gradient(to bottom, #2563eb 1px, transparent 1px)',
  },
  {
    id: 'campus',
    name: 'الحرم الجامعي الحديث (Campus Ambient)',
    tagline: 'إضاءات ناعمة وتدرجات ألوان راقية',
    description: 'تدرجات هادئة من الزمردي والكحلي الأكاديمي والذهبي الدافئ تمنح المنصة حيوية أنيقة.',
    cssClass: 'theme-bg-campus',
    previewBg: 'radial-gradient(circle at 30% 30%, #10b981 0%, #3b82f6 50%, #f59e0b 100%)',
  },
  {
    id: 'minimal',
    name: 'البسيط الخالص (Clean Minimal)',
    tagline: 'خلفية مسطحة خالية من أي نقوش',
    description: 'سطح هادئ وناصع تماماً دون أي نقوش، مثالي لمن يفضل البساطة التامة.',
    cssClass: 'theme-bg-minimal',
    previewBg: '#e2e8f0',
  },
];

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: BackgroundThemeId;
  onSelectTheme: (themeId: BackgroundThemeId) => void;
}

export const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                خلفيات وأنماط المنصة الأكاديمية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر النمط البصري المناسب لراحتك الذهنية أثناء الدراسة والمتابعة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scroll">
          {BACKGROUND_THEMES.map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Visual Preview Box */}
                <div
                  className={`w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 relative overflow-hidden flex items-center justify-center ${theme.cssClass}`}
                >
                  <div className="absolute inset-0 opacity-40" />
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg relative z-10">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                      {theme.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {theme.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span>يتم حفظ اختيارك تلقائياً لجميع الجلسات القادمة</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            تطبيق وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
