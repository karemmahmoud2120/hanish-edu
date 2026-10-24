import React from 'react';
import { ExternalLink, Link2, ShieldCheck } from 'lucide-react';
import type { UsefulLink } from '../data/curriculumData';

interface UsefulLinksProps {
  links: UsefulLink[];
}

export const UsefulLinks: React.FC<UsefulLinksProps> = ({ links }) => (
  <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="useful-links-heading">
    <header className="rounded-3xl bg-gradient-to-l from-slate-900 via-teal-950 to-emerald-900 p-6 text-white shadow-xl sm:p-8">
      <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/10 px-3 py-1 text-xs font-bold text-teal-100">
        <Link2 className="h-4 w-4" />
        مصادر مختارة للطالب والأسرة
      </span>
      <h1 id="useful-links-heading" className="mt-4 font-heading text-2xl font-black sm:text-3xl">روابط تهمك</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200">
        وصول سريع إلى مواقع تعليمية ورسمية تساعدك في الدراسة والبحث.
      </p>
    </header>

    {links.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        لا توجد روابط منشورة حاليًا.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          let hostname = '';
          let safeUrl: string | null = null;
          try {
            const parsedUrl = new URL(link.url);
            if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
              safeUrl = parsedUrl.toString();
              hostname = parsedUrl.hostname.replace(/^www\./, '');
            }
          } catch {
            hostname = link.url;
          }
          return (
            <article key={link.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  <Link2 className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {link.category}
                </span>
              </div>
              <h2 className="mt-4 font-heading text-base font-extrabold text-slate-900 dark:text-white">{link.title}</h2>
              <p className="mt-2 flex-1 text-xs leading-6 text-slate-600 dark:text-slate-400">{link.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate" dir="ltr">{hostname}</span>
                </span>
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-teal-600"
                  >
                    زيارة الرابط
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600">رابط غير صالح</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
);
