<?php
require_once __DIR__ . '/auth.php';

$me = current_user();
if (!$me) {
    exit('سجّل الدخول أولاً لعرض التقرير.');
}
$sid = (int)($_GET['student'] ?? 0);
if (!can_view_report($me, $sid)) {
    exit('ليس لديك صلاحية لعرض هذا التقرير.');
}
$stmt = db()->prepare("SELECT id, name, grade FROM users WHERE id = ? AND role = 'student'");
$stmt->execute([$sid]);
$student = $stmt->fetch();
if (!$student) {
    exit('الطالب غير موجود.');
}

$month = preg_match('/^\d{4}-\d{2}$/', (string)($_GET['month'] ?? '')) ? (string)$_GET['month'] : date('Y-m');
$start = $month . '-01';
$end   = date('Y-m-t', strtotime($start));

$pdo = db();
$st = $pdo->prepare('SELECT subject, title, score, max_score, exam_date FROM exam_results
                     WHERE student_id = ? AND exam_date BETWEEN ? AND ? ORDER BY exam_date');
$st->execute([$sid, $start, $end]);
$rows = $st->fetchAll();

$st = $pdo->prepare('SELECT COUNT(*) FROM study_tasks WHERE user_id = ? AND done = 1 AND due_date BETWEEN ? AND ?');
$st->execute([$sid, $start, $end]);
$tasksDone = (int)$st->fetchColumn();

$sum = 0.0; $n = 0;
foreach ($rows as $r) {
    if ((float)$r['max_score'] > 0) { $sum += (float)$r['score'] / (float)$r['max_score'] * 100; $n++; }
}
$avg = $n ? round($sum / $n, 1) : null;
[$lvl, $cls] = level_info((float)($avg ?? 0));
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير <?= e($student['name']) ?> - <?= e($month) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 p-4">
<div class="max-w-3xl mx-auto bg-white rounded-3xl shadow p-8 space-y-6">
    <div class="no-print flex flex-wrap items-center justify-between gap-3">
        <form method="get" class="flex items-center gap-2">
            <input type="hidden" name="student" value="<?= $sid ?>">
            <input type="month" name="month" value="<?= e($month) ?>" class="px-3 py-2 rounded-xl border border-slate-200">
            <button class="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm">عرض</button>
        </form>
        <button onclick="window.print()" class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">🖨️ طباعة / حفظ كـ PDF</button>
    </div>

    <div class="text-center border-b border-slate-200 pb-6">
        <div class="text-4xl">🐘</div>
        <h1 class="text-2xl font-extrabold mt-2"><?= e(APP_NAME) ?></h1>
        <h2 class="text-lg font-bold text-emerald-700 mt-1">تقرير شهر <?= e($month) ?></h2>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 text-sm">
        <div><span class="text-slate-500">الطالب:</span> <b><?= e($student['name']) ?></b></div>
        <div><span class="text-slate-500">الصف:</span> <b><?= e($student['grade'] ?: '—') ?></b></div>
    </div>

    <div class="grid grid-cols-3 gap-4 text-center">
        <div class="p-4 rounded-2xl bg-slate-50 border"><div class="text-sm text-slate-500">المتوسط</div><div class="text-2xl font-extrabold"><?= $avg !== null ? e((string)$avg) . '%' : '—' ?></div></div>
        <div class="p-4 rounded-2xl bg-slate-50 border"><div class="text-sm text-slate-500">المستوى</div><div class="mt-1"><span class="px-3 py-1 rounded-full font-extrabold <?= $cls ?>"><?= e($lvl) ?></span></div></div>
        <div class="p-4 rounded-2xl bg-slate-50 border"><div class="text-sm text-slate-500">مهام مكتملة</div><div class="text-2xl font-extrabold"><?= $tasksDone ?></div></div>
    </div>

    <div>
        <h3 class="font-extrabold text-lg mb-3">نتائج الاختبارات</h3>
        <?php if (!$rows): ?>
            <p class="text-slate-500 text-sm">مفيش اختبارات في الشهر ده.</p>
        <?php else: ?>
            <table class="w-full text-sm text-right">
                <thead class="bg-slate-50 text-slate-600"><tr><th class="p-2">التاريخ</th><th class="p-2">المادة</th><th class="p-2">الاختبار</th><th class="p-2">الدرجة</th></tr></thead>
                <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr class="border-t border-slate-100">
                        <td class="p-2"><?= e($r['exam_date']) ?></td>
                        <td class="p-2 font-bold"><?= e($r['subject']) ?></td>
                        <td class="p-2"><?= e($r['title']) ?></td>
                        <td class="p-2"><?= e((string)$r['score']) ?> / <?= e((string)$r['max_score']) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <p class="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">تم إنشاء التقرير آلياً في <?= date('Y-m-d') ?></p>
</div>
</body>
</html>
