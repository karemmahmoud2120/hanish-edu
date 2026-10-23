<?php
require_once __DIR__ . '/auth.php';

$q = mb_substr(trim((string)($_GET['q'] ?? '')), 0, 100);
$lessons = $notes = $news = [];
if ($q !== '') {
    $like = '%' . $q . '%';
    $st = db()->prepare('SELECT * FROM lessons WHERE title LIKE ? OR subject LIKE ? OR description LIKE ? ORDER BY id DESC LIMIT 30');
    $st->execute([$like, $like, $like]);
    $lessons = $st->fetchAll();

    $st = db()->prepare('SELECT * FROM notes WHERE title LIKE ? OR subject LIKE ? ORDER BY id DESC LIMIT 30');
    $st->execute([$like, $like]);
    $notes = $st->fetchAll();

    $st = db()->prepare('SELECT * FROM news WHERE (title LIKE ? OR body LIKE ?) AND ' . publish_clause() . ' ORDER BY id DESC LIMIT 20');
    $st->execute([$like, $like]);
    $news = $st->fetchAll();
}
$total = count($lessons) + count($notes) + count($news);
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>بحث - <?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    <style>body { font-family: 'Tajawal', sans-serif; }</style>
    <?= theme_assets() ?>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
<header class="bg-gradient-to-l from-emerald-700 to-blue-800 text-white">
    <div class="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <a href="index.php" class="font-extrabold text-lg">🐘 <?= e(APP_NAME) ?></a>
        <div class="flex items-center gap-2"><?= theme_button() ?><a href="index.php" class="px-4 py-2 rounded-xl bg-white/15 font-bold text-sm">الرئيسية</a></div>
    </div>
</header>

<main class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <form action="search.php" method="get" class="flex gap-2">
        <input name="q" value="<?= e($q) ?>" required maxlength="100" placeholder="🔍 ابحث عن درس أو ملزمة أو خبر..." class="flex-1 px-5 py-3 rounded-2xl border border-slate-200 text-lg">
        <button class="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold">بحث</button>
    </form>

    <?php if ($q === ''): ?>
        <p class="text-slate-500 text-center py-10">اكتب كلمة للبحث في الدروس والملازم والأخبار.</p>
    <?php else: ?>
        <p class="font-bold text-slate-600">نتائج البحث عن "<?= e($q) ?>": <?= $total ?></p>

        <?php if ($lessons): ?>
            <section>
                <h2 class="text-xl font-extrabold mb-3">📚 الدروس (<?= count($lessons) ?>)</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                    <?php foreach ($lessons as $l): ?>
                        <a href="<?= e($l['video']) ?>" target="_blank" rel="noopener noreferrer" class="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition block">
                            <div class="text-xs text-emerald-700 font-bold"><?= e($l['subject']) ?> · <?= e($l['stage']) ?></div>
                            <div class="font-extrabold mt-1"><?= e($l['title']) ?></div>
                        </a>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($notes): ?>
            <section>
                <h2 class="text-xl font-extrabold mb-3">📘 الملازم (<?= count($notes) ?>)</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                    <?php foreach ($notes as $n): ?>
                        <a href="<?= e($n['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition block">
                            <div class="text-xs text-blue-700 font-bold"><?= strtoupper(e($n['file_type'])) ?> · <?= e($n['subject']) ?></div>
                            <div class="font-extrabold mt-1"><?= e($n['title']) ?></div>
                        </a>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($news): ?>
            <section>
                <h2 class="text-xl font-extrabold mb-3">📢 الأخبار والإعلانات (<?= count($news) ?>)</h2>
                <div class="space-y-3">
                    <?php foreach ($news as $nw): ?>
                        <div class="p-4 rounded-2xl bg-white border border-slate-200">
                            <div class="text-xs font-bold <?= $nw['type'] === 'announcement' ? 'text-amber-700' : 'text-blue-700' ?>"><?= $nw['type'] === 'announcement' ? '📢 إعلان' : '📰 خبر' ?></div>
                            <div class="font-extrabold mt-1"><?= e($nw['title']) ?></div>
                            <p class="text-sm text-slate-600 mt-1"><?= e($nw['body']) ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($total === 0): ?>
            <p class="text-slate-500 text-center py-10">مفيش نتائج للبحث ده. جرّب كلمة تانية.</p>
        <?php endif; ?>
    <?php endif; ?>
</main>
</body>
</html>
