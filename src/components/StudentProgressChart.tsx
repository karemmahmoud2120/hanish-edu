import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ExamResult } from '../data/curriculumData';
import { TrendingUp, Award, Calendar, BarChart3, LineChart, Target, ArrowUpRight } from 'lucide-react';

interface StudentProgressChartProps {
  examResults: ExamResult[];
  studentName?: string;
  isDark?: boolean;
}

export const StudentProgressChart: React.FC<StudentProgressChartProps> = ({
  examResults,
  studentName,
  isDark,
}) => {
  const [chartType, setChartType] = useState<'timeline' | 'subjects'>('timeline');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extract unique subjects
  const subjects = useMemo(() => {
    return Array.from(new Set(examResults.map((r) => r.subject)));
  }, [examResults]);

  // Filter and sort results chronologically
  const timelineData = useMemo(() => {
    const filtered = examResults.filter(
      (r) => selectedSubject === 'all' || r.subject === selectedSubject
    );

    return [...filtered]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r, idx) => {
        const pct = Math.round((r.score / r.maxScore) * 100);
        return {
          idx: idx + 1,
          date: r.date.slice(5), // MM-DD
          fullDate: r.date,
          percentage: pct,
          quizTitle: r.quizTitle,
          subject: r.subject,
          scoreLabel: `${r.score} / ${r.maxScore}`,
        };
      });
  }, [examResults, selectedSubject]);

  // Subject averages comparison
  const subjectsData = useMemo(() => {
    const map: Record<string, { totalPct: number; count: number }> = {};
    examResults.forEach((r) => {
      const pct = (r.score / r.maxScore) * 100;
      if (!map[r.subject]) {
        map[r.subject] = { totalPct: 0, count: 0 };
      }
      map[r.subject].totalPct += pct;
      map[r.subject].count += 1;
    });

    return Object.entries(map).map(([subject, data]) => ({
      subject,
      average: Math.round(data.totalPct / data.count),
      count: data.count,
    }));
  }, [examResults]);

  // Key KPI stats
  const stats = useMemo(() => {
    if (timelineData.length === 0) {
      return { avg: 0, max: 0, trend: 0, count: 0 };
    }
    const percentages = timelineData.map((d) => d.percentage);
    const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const max = Math.max(...percentages);

    const firstScore = timelineData[0].percentage;
    const latestScore = timelineData[timelineData.length - 1].percentage;
    const trend = latestScore - firstScore;

    return { avg, max, trend, count: timelineData.length };
  }, [timelineData]);

  // Custom Chart Tooltip in Arabic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50 text-right min-w-[190px]">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
            <span>{data.fullDate || data.date}</span>
            <span className="font-bold text-emerald-400">{data.subject}</span>
          </div>
          {data.quizTitle && (
            <div className="font-bold text-white text-xs line-clamp-1">{data.quizTitle}</div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-300">الدرجة المحققة:</span>
            <span className="font-mono font-bold text-white tabular-nums">{data.scoreLabel || `${data.average}%`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">النسبة المئوية:</span>
            <span className="font-mono font-black text-emerald-400 text-sm tabular-nums">
              {data.percentage !== undefined ? `${data.percentage}%` : `${data.average}%`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const strokeColor = '#10b981';
  const gridColor = isDark ? '#1f2937' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
              سجل تقدم ومستوى الدرجات بمرور الوقت
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {studentName ? `مخطط التحصيل الأكاديمي للطالب ${studentName}` : 'مؤشرات الأداء التراكمي وتطور الاستيعاب في الاختبارات'}
          </p>
        </div>

        {/* View and Filter Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Subject Filter Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs font-bold py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">جميع المواد</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Toggle between Timeline & Subject Average */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartType('timeline')}
              className={`p-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartType === 'timeline'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="تطور الدرجات الزمني"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>الخط الزمني</span>
            </button>
            <button
              onClick={() => setChartType('subjects')}
              className={`p-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartType === 'subjects'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="مقارنة المواد"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>المواد</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 block font-bold">المتوسط العام</span>
          <span className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
            {stats.avg}%
          </span>
          <span className="text-[10px] text-slate-400">محسوب من {stats.count} اختبارات</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 block font-bold">أعلى نتيجة محققة</span>
          <span className="text-xl font-heading font-black text-blue-600 dark:text-blue-400 tabular-nums block">
            {stats.max}%
          </span>
          <span className="text-[10px] text-slate-400">درجة التميز</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 block font-bold">معدل التطور والتحسن</span>
          <span
            className={`text-xl font-heading font-black tabular-nums flex items-center gap-1 ${
              stats.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {stats.trend >= 0 ? `+${stats.trend}%` : `${stats.trend}%`}
            {stats.trend >= 0 && <ArrowUpRight className="w-4 h-4" />}
          </span>
          <span className="text-[10px] text-slate-400">مقارنة بأول اختبار</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 block font-bold">حالة الاستيعاب</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate mt-1">
            {stats.avg >= 90 ? '🌟 متفوق وواثق' : stats.avg >= 80 ? '✨ جيد جداً ومستمر' : '📈 في مسار التحسن'}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">تقييم مستمر</span>
        </div>
      </div>

      {/* Main Chart Graphic Canvas */}
      <div className="h-72 w-full pt-2">
        {timelineData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            لا توجد نتائج اختبارات مسجلة لهذه المادة بعد.
          </div>
        ) : chartType === 'timeline' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={strokeColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                activeDot={{ r: 6, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="subject"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="average" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>يتحدث المخطط البياني تلقائياً عند إتمام أي اختبار إلكتروني جديد على المنصة.</span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">RECHARTS ANALYTICS ENGINE</span>
      </div>
    </div>
  );
};
