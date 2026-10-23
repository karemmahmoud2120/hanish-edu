<?php
require_once __DIR__ . '/auth.php';

$CSRF  = csrf_token();
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
$staff = current_staff();

if (!$staff): ?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>دخول فريق الإدارة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Cairo', sans-serif; }</style>
    <?= theme_assets() ?>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-6">
            <div class="text-5xl mb-2">🛡️</div>
            <h1 class="text-2xl font-extrabold text-slate-900">دخول فريق الإدارة</h1>
        </div>
        <?php if ($flash): ?>
            <div class="mb-4 p-3 rounded-xl text-sm font-bold <?= $flash['ok'] ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800' ?>">
                <?= e($flash['title']) ?>: <?= e($flash['text']) ?>
            </div>
        <?php endif; ?>
        <form method="post" action="actions.php" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
            <input type="hidden" name="action" value="login_admin">
            <input type="email" name="email" required placeholder="البريد الإلكتروني" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100">
            <input type="password" name="password" required placeholder="كلمة المرور" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100">
            <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">دخول</button>
        </form>
    </div>
</body>
</html>
<?php
exit;
endif;

$pdo     = db();
$isOwner = $staff['is_owner'];

$tabs = ['overview' => '📊 نظرة عامة'];
if (can($staff, 'lessons')) $tabs['lessons'] = '📚 الدروس';
if (can($staff, 'news'))    $tabs['news']    = '📰 الأخبار والإعلانات';
if (can($staff, 'links'))   $tabs['links']   = '🔗 روابط تهمك';
if (can($staff, 'users'))   $tabs['users']   = '👥 المستخدمون';
if (can($staff, 'site'))    $tabs['site']    = '🎬 واجهة الموقع';
if (can($staff, 'grades'))  $tabs['grades']  = '📝 الدرجات والاختبارات';
if (can($staff, 'exams'))   $tabs['exams']   = '🧪 الامتحانات الإلكترونية';
if (can($staff, 'channels')) $tabs['channels'] = '📡 القنوات والمراجعة';
if (can($staff, 'notes')) $tabs['notes'] = '📚 الملازم والمذكرات';
if (can($staff, 'site'))     $tabs['schedule'] = '📅 الجداول الدراسية';
if (can($staff, 'messages')) $tabs['messages'] = '✉️ رسائل التواصل';
if ($isOwner) $tabs['backup'] = '💾 النسخ الاحتياطي';
if (can($staff, 'lessons')) $tabs['questions'] = '❓ أسئلة الدروس';
if (can($staff, 'lessons')) $tabs['curriculum'] = '📘 المناهج والمواد';
if (can($staff, 'users')) $tabs['stats'] = '📈 الإحصائيات';
if ($isOwner)               $tabs['staff']   = '🛡️ فريق الإدارة';
$tabs['settings'] = '⚙️ حسابي';

$tab = $_GET['tab'] ?? 'overview';
if (!isset($tabs[$tab])) {
    $tab = 'overview';
}

$counts = [
    'lessons'  => (int)$pdo->query('SELECT COUNT(*) FROM lessons')->fetchColumn(),
    'news'     => (int)$pdo->query("SELECT COUNT(*) FROM news WHERE type='news'")->fetchColumn(),
    'announce' => (int)$pdo->query("SELECT COUNT(*) FROM news WHERE type='announcement'")->fetchColumn(),
    'links'    => (int)$pdo->query('SELECT COUNT(*) FROM ministry_links')->fetchColumn(),
    'students' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='student'")->fetchColumn(),
    'parents'  => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='parent'")->fetchColumn(),
    'ties'     => (int)$pdo->query('SELECT COUNT(*) FROM parent_links')->fetchColumn(),
];

$lessons  = $pdo->query('SELECT * FROM lessons ORDER BY id DESC')->fetchAll();
$newsRows = $pdo->query('SELECT * FROM news ORDER BY pinned DESC, id DESC')->fetchAll();
$linkRows = $pdo->query('SELECT * FROM ministry_links ORDER BY sort_order, id')->fetchAll();

$roleParam  = (string)($_GET['role'] ?? 'all');
$userFilter = in_array($roleParam, ['all', 'student', 'parent'], true) ? $roleParam : 'all';
$search     = trim((string)($_GET['q'] ?? ''));
$sql    = 'SELECT id, role, name, email, grade, link_code, created_at FROM users WHERE 1=1';
$params = [];
if ($userFilter !== 'all') { $sql .= ' AND role = ?'; $params[] = $userFilter; }
if ($search !== '')        { $sql .= ' AND (name LIKE ? OR email LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; }
$stmt = $pdo->prepare($sql . ' ORDER BY id DESC');
$stmt->execute($params);
$users = $stmt->fetchAll();

$recentUsers = $pdo->query('SELECT name, role, created_at FROM users ORDER BY id DESC LIMIT 5')->fetchAll();
$staffRows   = $isOwner ? $pdo->query('SELECT id, name, email, permissions, is_owner, active FROM staff ORDER BY is_owner DESC, id')->fetchAll() : [];
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>لوحة الإدارة - <?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; }
        .fade-in { animation: fadeIn .5s ease both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    </style>
    <?= theme_assets() ?>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen">

<header class="bg-gradient-to-l from-purple-700 to-indigo-800 text-white shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
            <span class="text-3xl">🐘</span>
            <div>
                <div class="font-extrabold text-lg leading-tight">لوحة الإدارة</div>
                <div class="text-xs text-purple-200"><?= e($staff['name']) ?> · <?= $isOwner ? 'المالك' : 'عضو فريق' ?></div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <?= theme_button() ?>
            <a href="index.php" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition">الموقع</a>
            <form method="post" action="actions.php">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="logout_admin">
                <button class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold transition">خروج</button>
            </form>
        </div>
    </div>
</header>

<main class="max-w-7xl mx-auto px-4 py-8">

    <?php if ($flash): ?>
        <div class="fade-in mb-6 rounded-2xl px-5 py-4 font-bold <?= $flash['ok'] ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200' ?>">
            <?= e($flash['title']) ?>: <span class="font-normal"><?= e($flash['text']) ?></span>
        </div>
    <?php endif; ?>

    <nav class="flex flex-wrap gap-2 mb-8">
        <?php foreach ($tabs as $key => $label): ?>
            <a href="admin.php?tab=<?= $key ?>"
               class="px-5 py-2.5 rounded-xl font-bold text-sm transition <?= $tab === $key ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200' ?>">
                <?= $label ?>
            </a>
        <?php endforeach; ?>
    </nav>

    <?php if ($tab === 'overview'): ?>
        <section class="fade-in">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <?php
                $cards = [
                    ['📚 الدروس', $counts['lessons'], 'from-emerald-500 to-teal-600'],
                    ['📰 الأخبار', $counts['news'], 'from-blue-500 to-indigo-600'],
                    ['📢 الإعلانات', $counts['announce'], 'from-amber-500 to-orange-600'],
                    ['🔗 روابط تهمك', $counts['links'], 'from-purple-500 to-fuchsia-600'],
                    ['🎒 الطلاب', $counts['students'], 'from-green-500 to-emerald-600'],
                    ['👨‍👩‍👧 أولياء الأمور', $counts['parents'], 'from-sky-500 to-blue-600'],
                    ['🔗 روابط الأبناء', $counts['ties'], 'from-rose-500 to-pink-600'],
                ];
                foreach ($cards as [$label, $value, $grad]): ?>
                    <div class="rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br <?= $grad ?> hover:scale-105 transition">
                        <div class="text-sm opacity-90"><?= $label ?></div>
                        <div class="text-4xl font-extrabold mt-2"><?= $value ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                <h3 class="font-extrabold text-lg mb-4">🆕 آخر المسجلين</h3>
                <?php if (!$recentUsers): ?><p class="text-slate-500 text-sm">لا يوجد مستخدمون بعد.</p><?php endif; ?>
                <ul class="divide-y divide-slate-100">
                    <?php foreach ($recentUsers as $ru): ?>
                        <li class="py-3 flex items-center justify-between text-sm">
                            <span class="font-bold"><?= e($ru['name']) ?></span>
                            <span class="text-slate-500"><?= $ru['role'] === 'student' ? '🎒 طالب' : '👨‍👩‍👧 ولي أمر' ?> · <?= e($ru['created_at']) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </section>

    <?php elseif ($tab === 'lessons'): ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200 mb-6">
            <h3 class="font-extrabold text-lg mb-2">📥 استيراد دروس بالجملة</h3>
            <p class="text-sm text-slate-600 mb-4">كل سطر درس بهذا الشكل، والأجزاء مفصولة بعلامة |:<br>
                <code class="text-xs bg-slate-100 px-2 py-1 rounded">المرحلة | المادة | العنوان | الرابط | وصف (اختياري)</code><br>
                مثال: <code class="text-xs bg-slate-100 px-2 py-1 rounded">ابتدائي | الرياضيات | الجمع والطرح | https://www.youtube.com/watch?v=xxxx | شرح مبسط</code>
                <br>المراحل المقبولة: ابتدائي، إعدادي، ثانوي. الحد 200 سطر في المرة، والروابط المكررة تُتخطى.</p>
            <form method="post" action="actions.php" class="space-y-3">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="bulk_lessons">
                <input type="hidden" name="tab" value="lessons">
                <textarea name="lines" rows="8" required placeholder="ضع سطراً لكل درس هنا..." class="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm"></textarea>
                <button class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">استيراد الدروس</button>
            </form>
        </section>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ درس واحد</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_lesson">
                    <input type="hidden" name="tab" value="lessons">
                    <input name="title" required maxlength="200" placeholder="عنوان الدرس" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <?= grade_range_selects() ?>
                    <input name="subject" required maxlength="100" placeholder="المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="url" name="video" required placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <textarea name="description" rows="3" required maxlength="1000" placeholder="وصف مختصر" class="w-full px-3 py-2 rounded-xl border border-slate-200"></textarea>
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">نشر الدرس</button>
                </form>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">📚 الدروس (<?= count($lessons) ?>)</h3>
                <div class="space-y-3">
                    <?php if (!$lessons): ?><p class="text-slate-500 text-sm">لا توجد دروس.</p><?php endif; ?>
                    <?php foreach ($lessons as $l): ?>
                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <div class="font-bold text-sm"><?= e($l['title']) ?></div>
                                <div class="text-xs text-purple-600"><?= e($l['subject']) ?> · <?= e($l['stage']) ?></div>
                            </div>
<div class="flex items-center gap-2">
                                <form method="post" action="actions.php" class="flex items-center gap-2">
                                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                    <input type="hidden" name="action" value="set_lesson_target">
                                    <input type="hidden" name="tab" value="lessons">
                                    <input type="hidden" name="id" value="<?= (int)$l['id'] ?>">
                                    <select name="target" required class="px-2 py-1 rounded-lg border border-slate-200 text-xs"><?= grade_target_options($l['grades'] && !str_contains((string)$l['grades'], ',') ? $l['grades'] : null) ?></select>
                                    <button class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">حفظ الصف</button>
                                </form>
                                                            <form method="post" action="actions.php" onsubmit="return confirm('حذف هذا الدرس؟');">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="delete_lesson">
                                <input type="hidden" name="tab" value="lessons">
                                <input type="hidden" name="id" value="<?= (int)$l['id'] ?>">
                                <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                            </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'news'): ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ خبر أو إعلان</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_news">
                    <input type="hidden" name="tab" value="news">
                    <select name="type" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <option value="news">📰 خبر</option>
                        <option value="announcement">📢 إعلان</option>
                    </select>
                    <input name="title" required maxlength="200" placeholder="العنوان" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <textarea name="body" rows="4" required maxlength="2000" placeholder="النص" class="w-full px-3 py-2 rounded-xl border border-slate-200"></textarea>
                    <div>
                        <label class="block text-xs font-bold mb-1">وقت النشر (اختياري، فاضي = ينزل فوراً)</label>
                        <input type="datetime-local" name="publish_at" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    </div>
                    <label class="flex items-center gap-2 text-sm font-bold">
                        <input type="checkbox" name="pinned" value="1" class="w-4 h-4"> تثبيت في أعلى القائمة 📌
                    </label>
                    <button class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition">نشر</button>
                </form>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">📰 الأخبار والإعلانات (<?= count($newsRows) ?>)</h3>
                <div class="space-y-3">
                    <?php if (!$newsRows): ?><p class="text-slate-500 text-sm">لا توجد أخبار.</p><?php endif; ?>
                    <?php foreach ($newsRows as $n): ?>
                        <div class="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs px-2 py-0.5 rounded-full font-bold <?= $n['type'] === 'announcement' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800' ?>">
                                        <?= $n['type'] === 'announcement' ? '📢 إعلان' : '📰 خبر' ?>
                                    </span>
                                    <?php if ($n['pinned']): ?><span class="text-xs text-purple-700 font-bold">📌 مثبت</span><?php endif; ?>
                                </div>
                                <div class="font-bold text-sm mt-1"><?= e($n['title']) ?></div>
                                <div class="text-xs text-slate-600 mt-1"><?= e($n['body']) ?></div>
                            </div>
                            <form method="post" action="actions.php" onsubmit="return confirm('حذف هذا العنصر؟');">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="delete_news">
                                <input type="hidden" name="tab" value="news">
                                <input type="hidden" name="id" value="<?= (int)$n['id'] ?>">
                                <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'links'): ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ رابط جديد</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_link">
                    <input type="hidden" name="tab" value="links">
                    <input name="title" required maxlength="200" placeholder="اسم الرابط" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="url" name="url" required placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input name="icon" maxlength="20" placeholder="أيقونة مثل 🏛️ أو 📝" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="number" name="sort_order" value="0" placeholder="ترتيب الظهور" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">إضافة الرابط</button>
                </form>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">🔗 روابط تهمك (<?= count($linkRows) ?>)</h3>
                <div class="space-y-3">
                    <?php if (!$linkRows): ?><p class="text-slate-500 text-sm">لا توجد روابط.</p><?php endif; ?>
                    <?php foreach ($linkRows as $lk): ?>
                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div class="flex items-center gap-3 min-w-0">
                                <span class="text-2xl"><?= e($lk['icon']) ?></span>
                                <div class="min-w-0">
                                    <div class="font-bold text-sm"><?= e($lk['title']) ?></div>
                                    <a href="<?= e($lk['url']) ?>" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 truncate block"><?= e($lk['url']) ?></a>
                                </div>
                            </div>
                            <form method="post" action="actions.php" onsubmit="return confirm('حذف هذا الرابط؟');">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="delete_link">
                                <input type="hidden" name="tab" value="links">
                                <input type="hidden" name="id" value="<?= (int)$lk['id'] ?>">
                                <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'users'): ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200 mb-6">
            <h3 class="font-extrabold text-lg mb-2">📥 استيراد مستخدمين من ملف CSV</h3>
            <p class="text-xs text-slate-500 mb-2">كل سطر: <code class="bg-slate-100 px-1 rounded">الاسم، البريد، كلمة المرور، الدور، الصف</code><br>
                الدور: <b>طالب</b> أو <b>ولي أمر</b>. الصف للطالب فقط، بالاسم الكامل مثل "الصف الأول الإعدادي". السطر الأول ممكن يكون عناوين وهيتتخطى. الحد 500 سطر.</p>
            <form method="post" action="actions.php" enctype="multipart/form-data" class="flex flex-wrap items-center gap-3">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="import_students">
                <input type="hidden" name="tab" value="users">
                <input type="file" name="csv" accept=".csv,text/csv" required class="text-sm">
                <button class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">استيراد</button>
            </form>
        </section>
        <section class="fade-in grid lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ إضافة طالب أو ولي أمر</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_user">
                    <input type="hidden" name="tab" value="users">
                    <select name="role" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <option value="student">🎒 طالب</option>
                        <option value="parent">👨‍👩‍👧 ولي أمر</option>
                    </select>
                    <input name="name" required maxlength="100" placeholder="الاسم" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="email" name="email" required placeholder="البريد الإلكتروني" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="text" name="password" required minlength="6" placeholder="كلمة المرور (6 أحرف على الأقل)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input name="grade" maxlength="50" placeholder="الصف الدراسي (للطالب)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">إنشاء الحساب</button>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 class="font-extrabold text-lg">👥 المستخدمون (<?= count($users) ?>)</h3>
                    <div class="flex flex-wrap gap-2">
                        <?php foreach (['all' => 'الكل', 'student' => 'الطلاب', 'parent' => 'أولياء الأمور'] as $k => $lbl): ?>
                            <a href="admin.php?tab=users&role=<?= $k ?>&q=<?= urlencode($search) ?>"
                               class="px-3 py-1.5 rounded-lg text-xs font-bold <?= $userFilter === $k ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>"><?= $lbl ?></a>
                        <?php endforeach; ?>
                    </div>
                </div>
                <form method="get" action="admin.php" class="flex gap-2 mb-4">
                    <input type="hidden" name="tab" value="users">
                    <input type="hidden" name="role" value="<?= e($userFilter) ?>">
                    <input name="q" value="<?= e($search) ?>" placeholder="ابحث بالاسم أو البريد" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    <button class="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm">بحث</button>
                </form>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-right">
                        <thead class="bg-slate-50 text-slate-600">
                            <tr><th class="p-2">الاسم</th><th class="p-2">البريد</th><th class="p-2">الدور</th><th class="p-2">كود الربط</th><th class="p-2">كلمة سر جديدة</th><th class="p-2"></th></tr>
                        </thead>
                        <tbody>
                            <?php if (!$users): ?>
                                <tr><td colspan="6" class="p-6 text-center text-slate-500">لا يوجد مستخدمون مطابقون.</td></tr>
                            <?php endif; ?>
                            <?php foreach ($users as $u): ?>
                                <tr class="border-t border-slate-100 align-middle">
                                    <td class="p-2 font-bold">
                                        <?= e($u['name']) ?>
                                        <div class="text-xs text-slate-500 font-normal"><?= e($u['grade'] ?: 'بدون صف') ?></div>
                                        <details class="mt-2">
                                            <summary class="text-xs text-blue-700 cursor-pointer font-bold">✏️ تعديل البيانات</summary>
                                            <form method="post" action="actions.php" class="mt-2 space-y-2 font-normal">
                                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                                <input type="hidden" name="action" value="update_user">
                                                <input type="hidden" name="tab" value="users">
                                                <input type="hidden" name="id" value="<?= (int)$u['id'] ?>">
                                                <input name="name" required maxlength="100" value="<?= e($u['name']) ?>" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs">
                                                <input type="email" name="email" required value="<?= e($u['email']) ?>" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs">
                                                <?php if ($u['role'] === 'student'): ?>
                                                    <select name="grade" required class="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"><?= grade_options_html($u['grade']) ?></select>
                                                <?php endif; ?>
                                                <button class="px-3 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold">حفظ</button>
                                            </form>
                                        </details>
                                    </td>
                                    <td class="p-2 text-xs"><?= e($u['email']) ?></td>
                                    <td class="p-2"><?= $u['role'] === 'student' ? '🎒 طالب' : '👨‍👩‍👧 ولي أمر' ?></td>
                                    <td class="p-2 font-mono tracking-widest"><?= e($u['link_code'] ?: '—') ?></td>
                                    <td class="p-2">
                                        <form method="post" action="actions.php" class="flex gap-1">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="reset_user_password">
                                            <input type="hidden" name="tab" value="users">
                                            <input type="hidden" name="id" value="<?= (int)$u['id'] ?>">
                                            <input type="text" name="password" minlength="6" placeholder="جديدة" class="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                                            <button class="px-2 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold">حفظ</button>
                                        </form>
                                    </td>
                                    <td class="p-2">
                                        <form method="post" action="actions.php" onsubmit="return confirm('حذف هذا المستخدم نهائياً؟');">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="delete_user">
                                            <input type="hidden" name="tab" value="users">
                                            <input type="hidden" name="id" value="<?= (int)$u['id'] ?>">
                                            <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'staff' && $isOwner): ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ إضافة عضو إدارة</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_staff">
                    <input type="hidden" name="tab" value="staff">
                    <input name="name" required maxlength="100" placeholder="الاسم" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="email" name="email" required placeholder="البريد الإلكتروني" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="text" name="password" required minlength="6" placeholder="كلمة المرور (6 أحرف على الأقل)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <p class="text-sm font-bold text-slate-700">الصلاحيات:</p>
                    <?php foreach (PERMISSIONS as $pk => $pl): ?>
                        <label class="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="perms[]" value="<?= $pk ?>" class="w-4 h-4"> <?= e($pl) ?>
                        </label>
                    <?php endforeach; ?>
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">إضافة</button>
                </form>
            </div>

            <div class="lg:col-span-2 space-y-4">
                <?php foreach ($staffRows as $sr):
                    $myPerms = $sr['permissions'] === '' ? [] : explode(',', $sr['permissions']); ?>
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <div class="font-extrabold"><?= e($sr['name']) ?> <?= $sr['is_owner'] ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mr-2">المالك</span>' : '' ?></div>
                                <div class="text-xs text-slate-500"><?= e($sr['email']) ?></div>
                            </div>
                            <?php if (!$sr['is_owner']): ?>
                                <div class="flex gap-2">
                                    <form method="post" action="actions.php">
                                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                        <input type="hidden" name="action" value="toggle_staff">
                                        <input type="hidden" name="tab" value="staff">
                                        <input type="hidden" name="id" value="<?= (int)$sr['id'] ?>">
                                        <button class="px-3 py-1.5 rounded-lg text-xs font-bold <?= $sr['active'] ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700' ?>"><?= $sr['active'] ? 'إيقاف' : 'تفعيل' ?></button>
                                    </form>
                                    <form method="post" action="actions.php" onsubmit="return confirm('حذف عضو الإدارة؟');">
                                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                        <input type="hidden" name="action" value="delete_staff">
                                        <input type="hidden" name="tab" value="staff">
                                        <input type="hidden" name="id" value="<?= (int)$sr['id'] ?>">
                                        <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                    </form>
                                </div>
                            <?php endif; ?>
                        </div>

                        <?php if ($sr['is_owner']): ?>
                            <p class="text-sm text-slate-600">صلاحيات كاملة على الموقع ولوحة الإدارة.</p>
                        <?php else: ?>
                            <form method="post" action="actions.php" class="space-y-3">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="update_staff">
                                <input type="hidden" name="tab" value="staff">
                                <input type="hidden" name="id" value="<?= (int)$sr['id'] ?>">
                                <div class="flex flex-wrap gap-4">
                                    <?php foreach (PERMISSIONS as $pk => $pl): ?>
                                        <label class="flex items-center gap-2 text-sm">
                                            <input type="checkbox" name="perms[]" value="<?= $pk ?>" <?= in_array($pk, $myPerms, true) ? 'checked' : '' ?> class="w-4 h-4"> <?= e($pl) ?>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                                <button class="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold">حفظ الصلاحيات</button>
                            </form>
                            <form method="post" action="actions.php" class="flex gap-2 mt-3">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="reset_staff_password">
                                <input type="hidden" name="tab" value="staff">
                                <input type="hidden" name="id" value="<?= (int)$sr['id'] ?>">
                                <input type="text" name="password" minlength="6" placeholder="كلمة سر جديدة" class="px-3 py-2 rounded-xl border border-slate-200 text-sm">
                                <button class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold">تغيير كلمة السر</button>
                            </form>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

    <?php elseif ($tab === 'site' && can($staff, 'site')):
        $heroMode  = site_setting('hero_mode', 'animated');
        $heroMedia = site_setting('hero_media', '');
        $isVideo   = (bool)preg_match('/\.(mp4|webm)(\?|$)/i', $heroMedia);
        $modes = ['animated' => '✨ متحركة (الافتراضية)', 'image' => '🖼️ صورة', 'video' => '🎞️ فيديو'];
    ?>
        <section class="fade-in grid lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                <h3 class="font-extrabold text-lg mb-4">🎬 خلفية الواجهة الرئيسية</h3>
                <form method="post" action="actions.php" enctype="multipart/form-data" class="space-y-4">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="save_hero">
                    <input type="hidden" name="tab" value="site">

                    <div class="space-y-2">
                        <?php foreach ($modes as $mk => $ml): ?>
                            <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                                <input type="radio" name="mode" value="<?= $mk ?>" <?= $heroMode === $mk ? 'checked' : '' ?> class="w-4 h-4">
                                <span class="font-bold"><?= $ml ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>

                    <div>
                        <label class="block text-sm font-bold mb-1">ارفع ملفاً من جهازك</label>
                        <input type="file" name="media" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" class="w-full text-sm">
                        <p class="text-xs text-slate-500 mt-1">للصورة: JPG أو PNG أو WebP. للفيديو: MP4 أو WebM. الحد 15 ميجا.</p>
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-1">أو ضع رابطاً مباشراً (https)</label>
                        <input type="url" name="media_url" placeholder="https://.../background.mp4" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                        <p class="text-xs text-slate-500 mt-1">الروابط من يوتيوب لا تعمل كخلفية، استخدم ملف MP4 أو WebM مباشراً.</p>
                    </div>

                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">حفظ الخلفية</button>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                <h3 class="font-extrabold text-lg mb-4">👁️ المعاينة الحالية</h3>
                <p class="text-sm mb-4">الوضع الحالي: <span class="font-bold text-purple-700"><?= e($modes[$heroMode] ?? $heroMode) ?></span></p>
                <?php if ($heroMode !== 'animated' && $heroMedia !== ''): ?>
                    <?php if ($heroMode === 'video' || $isVideo): ?>
                        <video src="<?= e($heroMedia) ?>" controls muted playsinline class="w-full rounded-xl bg-slate-900"></video>
                    <?php else: ?>
                        <img src="<?= e($heroMedia) ?>" alt="معاينة" class="w-full rounded-xl">
                    <?php endif; ?>
                    <p class="text-xs text-slate-500 mt-3 break-all"><?= e($heroMedia) ?></p>
                <?php else: ?>
                    <div class="h-48 rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-teal-800 flex items-center justify-center text-white font-bold">
                        الخلفية المتحركة الافتراضية
                    </div>
                <?php endif; ?>
            </div>
        </section>

    <?php elseif ($tab === 'grades' && can($staff, 'grades')):
        $studentsList = $pdo->query("SELECT id, name, grade FROM users WHERE role='student' ORDER BY name")->fetchAll();
        $resultRows   = $pdo->query("SELECT r.id, r.subject, r.title, r.score, r.max_score, r.exam_date, u.name AS student_name
                                     FROM exam_results r JOIN users u ON u.id = r.student_id
                                     ORDER BY r.id DESC LIMIT 100")->fetchAll();
    ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-4">➕ تسجيل نتيجة اختبار</h3>
                <?php if (!$studentsList): ?>
                    <p class="text-sm text-slate-500">لا يوجد طلاب مسجلون بعد.</p>
                <?php else: ?>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_result">
                    <input type="hidden" name="tab" value="grades">
                    <select name="student_id" required class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <option value="">اختر الطالب</option>
                        <?php foreach ($studentsList as $st): ?>
                            <option value="<?= (int)$st['id'] ?>"><?= e($st['name']) ?><?= $st['grade'] ? ' — ' . e($st['grade']) : '' ?></option>
                        <?php endforeach; ?>
                    </select>
                    <input name="subject" required maxlength="100" placeholder="المادة (مثال: الرياضيات)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input name="title" required maxlength="200" placeholder="اسم الاختبار (مثال: امتحان الشهر الأول)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <div class="grid grid-cols-2 gap-3">
                        <input type="number" step="0.5" min="0" name="score" required placeholder="الدرجة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <input type="number" step="0.5" min="1" name="max_score" value="100" required placeholder="النهائية" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    </div>
                    <input type="date" name="exam_date" value="<?= date('Y-m-d') ?>" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">حفظ النتيجة</button>
                </form>
                <?php endif; ?>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">📝 آخر النتائج المسجلة</h3>
                <div class="space-y-3">
                    <?php if (!$resultRows): ?><p class="text-slate-500 text-sm">لا توجد نتائج بعد.</p><?php endif; ?>
                    <?php foreach ($resultRows as $rr): ?>
                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <div class="font-bold text-sm"><?= e($rr['student_name']) ?> · <?= e($rr['subject']) ?></div>
                                <div class="text-xs text-slate-600"><?= e($rr['title']) ?> — <?= e((string)$rr['score']) ?> / <?= e((string)$rr['max_score']) ?> — <?= e($rr['exam_date']) ?></div>
                            </div>
                            <form method="post" action="actions.php" onsubmit="return confirm('حذف هذه النتيجة؟');">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="delete_result">
                                <input type="hidden" name="tab" value="grades">
                                <input type="hidden" name="id" value="<?= (int)$rr['id'] ?>">
                                <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'exams' && can($staff, 'exams')):
        $quizRows = $pdo->query("SELECT q.id, q.title, q.subject, q.stage,
                                        (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS qc,
                                        (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS attempts
                                 FROM quizzes q ORDER BY q.id DESC")->fetchAll();
        $fileRows = $pdo->query("SELECT * FROM exam_files ORDER BY id DESC")->fetchAll();
    ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-3">
                <div class="grid lg:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-extrabold text-lg mb-2">📄 رفع امتحان ملف (PDF أو Word)</h3>
                        <p class="text-xs text-slate-500 mb-4">الصيغ المسموحة: PDF و DOC و DOCX، بحد أقصى 200 ميجا. الملف يظهر للطلاب في الصف أو المرحلة المحددة.</p>
                        <form method="post" action="actions.php" enctype="multipart/form-data" class="space-y-3">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="action" value="upload_exam_file">
                            <input type="hidden" name="tab" value="exams">
                            <?= grade_range_selects() ?>
                            <input name="subject" required maxlength="100" placeholder="المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                            <input name="title" required maxlength="200" placeholder="اسم الامتحان (مثال: امتحان نصف العام)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                            <input type="file" name="exam_file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="w-full text-sm">
                            <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">رفع الامتحان</button>
                        </form>
                    </div>

                    <div>
                        <h3 class="font-extrabold text-lg mb-2">🗂️ ملفات الامتحانات (<?= count($fileRows) ?>)</h3>
                        <div class="space-y-2 max-h-80 overflow-y-auto">
                            <?php if (!$fileRows): ?><p class="text-sm text-slate-500">لا توجد ملفات مرفوعة بعد.</p><?php endif; ?>
                            <?php foreach ($fileRows as $fr): ?>
                                <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                    <div class="min-w-0">
                                        <div class="font-bold text-sm truncate"><?= e($fr['title']) ?> <span class="text-xs text-purple-600">(<?= strtoupper(e($fr['file_type'])) ?>)</span></div>
                                        <div class="text-xs text-slate-500"><?= e($fr['subject']) ?> · <?= e($fr['stage']) ?></div>
                                    </div>
                                    <div class="flex gap-2 shrink-0">
                                        <a href="<?= e($fr['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">فتح</a>
                                        <form method="post" action="actions.php" onsubmit="return confirm('حذف الملف؟');">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="delete_exam_file">
                                            <input type="hidden" name="tab" value="exams">
                                            <input type="hidden" name="id" value="<?= (int)$fr['id'] ?>">
                                            <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                        </form>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-1 h-fit">
                <h3 class="font-extrabold text-lg mb-2">🧪 امتحان إلكتروني جديد</h3>
                <p class="text-xs text-slate-500 mb-4">أضف الأسئلة واحداً تلو الآخر، ويتصحح الامتحان تلقائياً للطالب.</p>
                <form id="quizForm" method="post" action="actions.php" onsubmit="return buildQuestions();" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_quiz">
                    <input type="hidden" name="tab" value="exams">
                    <input name="title" required maxlength="200" placeholder="عنوان الامتحان" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input name="subject" required maxlength="100" placeholder="المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <?= grade_range_selects() ?>

                    <div id="qList" class="space-y-3"></div>
                    <button type="button" onclick="addQ()" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm">+ إضافة سؤال</button>

                    <textarea id="questionsOut" name="questions" class="hidden"></textarea>
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">إنشاء الامتحان</button>
                </form>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">🧪 الامتحانات الإلكترونية (<?= count($quizRows) ?>)</h3>
                <div class="space-y-3">
                    <?php if (!$quizRows): ?><p class="text-slate-500 text-sm">لا توجد امتحانات بعد.</p><?php endif; ?>
                    <?php foreach ($quizRows as $qr): ?>
                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <div class="font-bold text-sm"><?= e($qr['title']) ?></div>
                                <div class="text-xs text-purple-600"><?= e($qr['subject']) ?> · <?= e($qr['stage']) ?></div>
                                <div class="text-xs text-slate-500 mt-1"><?= (int)$qr['qc'] ?> سؤال · أدّاه <?= (int)$qr['attempts'] ?> طالب</div>
                            </div>
                            <form method="post" action="actions.php" onsubmit="return confirm('حذف الامتحان ونتائجه؟');">
                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                <input type="hidden" name="action" value="delete_quiz">
                                <input type="hidden" name="tab" value="exams">
                                <input type="hidden" name="id" value="<?= (int)$qr['id'] ?>">
                                <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">حذف</button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <script>
            function addQ() {
                const wrap = document.createElement('div');
                wrap.className = 'qrow p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2';
                wrap.innerHTML =
                    '<input class="q-text w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="نص السؤال">' +
                    [1, 2, 3, 4].map(i => '<input class="q-opt w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="الخيار ' + i + '">').join('') +
                    '<div class="flex items-center gap-2 text-sm">' +
                        '<span class="font-bold">الإجابة الصحيحة:</span>' +
                        '<select class="q-correct px-2 py-1 rounded-lg border border-slate-200">' +
                            '<option value="1">الخيار 1</option><option value="2">الخيار 2</option>' +
                            '<option value="3">الخيار 3</option><option value="4">الخيار 4</option>' +
                        '</select>' +
                        '<button type="button" onclick="this.closest(\'.qrow\').remove()" class="mr-auto text-red-600 text-xs font-bold">حذف السؤال</button>' +
                    '</div>';
                document.getElementById('qList').appendChild(wrap);
            }

            function buildQuestions() {
                const rows = document.querySelectorAll('#qList .qrow');
                if (!rows.length) { alert('أضف سؤالاً واحداً على الأقل'); return false; }
                const lines = [];
                for (const r of rows) {
                    const clean = v => v.trim().replace(/\|/g, '/');
                    const q = clean(r.querySelector('.q-text').value);
                    const opts = [...r.querySelectorAll('.q-opt')].map(i => clean(i.value));
                    if (!q || opts.some(o => o === '')) { alert('أكمل نص كل سؤال وخياراته الأربعة'); return false; }
                    lines.push([q, ...opts, r.querySelector('.q-correct').value].join(' | '));
                }
                document.getElementById('questionsOut').value = lines.join('\n');
                return true;
            }

            addQ();
        </script>

    <?php elseif ($tab === 'channels' && can($staff, 'channels')):
        $channelRows = $pdo->query('SELECT * FROM channels ORDER BY id DESC')->fetchAll();
        $pendingRows = $pdo->query("SELECT p.id, p.title, p.thumb, p.url, p.published, p.description, c.title AS channel_title, c.stage, c.subject
                                    FROM pending_videos p JOIN channels c ON c.id = p.channel_row
                                    WHERE p.status = 'pending' ORDER BY p.id DESC LIMIT 60")->fetchAll();
        $liveWords = implode(', ', live_filter_words());
    ?>
        <section class="fade-in space-y-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 class="font-extrabold text-lg">🔄 تحديث فيديوهات القنوات</h3>
                    <p class="text-sm text-slate-500">يجلب آخر فيديوهات كل قناة مفعّلة، ويستبعد البث المباشر تلقائياً.</p>
                </div>
                <form method="post" action="actions.php">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="sync_channels">
                    <input type="hidden" name="tab" value="channels">
                    <button class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">تحديث الآن</button>
                </form>
            </div>

            <div class="grid lg:grid-cols-3 gap-6">
                <div class="space-y-6 h-fit">
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-2">🚫 فلتر البث المباشر</h3>
                        <p class="text-xs text-slate-500 mb-3">أي فيديو عنوانه يحتوي على إحدى هذه الكلمات يُستبعد. افصل بينها بفاصلة.</p>
                        <form method="post" action="actions.php" class="space-y-3">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="action" value="save_live_filter">
                            <input type="hidden" name="tab" value="channels">
                            <textarea name="words" rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"><?= e($liveWords) ?></textarea>
                            <button class="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm">حفظ الفلتر</button>
                        </form>
                    </div>

                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-4">➕ إضافة قناة</h3>
                        <form method="post" action="actions.php" class="space-y-3">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="action" value="add_channel">
                            <input type="hidden" name="tab" value="channels">
                            <input name="title" required maxlength="200" placeholder="اسم القناة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                            <input name="channel_id" required placeholder="معرف القناة (يبدأ بـ UC)" pattern="UC[A-Za-z0-9_-]{22}" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm">
                            <select name="stage" required class="w-full px-3 py-2 rounded-xl border border-slate-200">
                                <option value="">المرحلة</option>
                                <?php foreach (STAGES as $i => $st): ?><option value="<?= $i ?>"><?= e($st) ?></option><?php endforeach; ?>
                            </select>
                            <input name="subject" required maxlength="100" placeholder="المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                            <button class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm">إضافة القناة</button>
                        </form>
                    </div>

                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-4">📡 القنوات (<?= count($channelRows) ?>)</h3>
                        <div class="space-y-3">
                            <?php if (!$channelRows): ?><p class="text-sm text-slate-500">لا توجد قنوات مضافة.</p><?php endif; ?>
                            <?php foreach ($channelRows as $cr): ?>
                                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <div class="font-bold text-sm truncate"><?= e($cr['title']) ?></div>
                                        <div class="text-xs text-purple-600"><?= e($cr['subject']) ?> · <?= e($cr['stage']) ?></div>
                                        <div class="text-[11px] text-slate-400">آخر تحديث: <?= e($cr['last_checked'] ?: 'لم يُحدَّث بعد') ?></div>
                                    </div>
                                    <form method="post" action="actions.php" onsubmit="return confirm('حذف القناة وفيديوهاتها المعلقة؟');">
                                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                        <input type="hidden" name="action" value="delete_channel">
                                        <input type="hidden" name="tab" value="channels">
                                        <input type="hidden" name="id" value="<?= (int)$cr['id'] ?>">
                                        <button class="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                    </form>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h3 class="font-extrabold text-lg mb-4">🕵️ قيد المراجعة (<?= count($pendingRows) ?>)</h3>
                    <?php if (!$pendingRows): ?>
                        <p class="text-sm text-slate-500">لا توجد فيديوهات بانتظار المراجعة. اضغط "تحديث الآن" لجلب أحدث الفيديوهات.</p>
                    <?php endif; ?>
                    <div class="space-y-4">
                        <?php foreach ($pendingRows as $pv): ?>
                            <div class="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <?php if ($pv['thumb']): ?>
                                    <img src="<?= e($pv['thumb']) ?>" alt="" class="w-full sm:w-44 h-auto rounded-lg object-cover">
                                <?php endif; ?>
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-sm"><?= e($pv['title']) ?></div>
                                    <div class="text-xs text-slate-500 mt-1"><?= e($pv['channel_title']) ?> · <?= e($pv['subject']) ?> · <?= e($pv['stage']) ?> · <?= e($pv['published']) ?></div>
                                    <a href="<?= e($pv['url']) ?>" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 break-all">فتح الفيديو على يوتيوب</a>
                                    <div class="flex gap-2 mt-3">
                                        <form method="post" action="actions.php">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="approve_video">
                                            <input type="hidden" name="tab" value="channels">
                                            <input type="hidden" name="id" value="<?= (int)$pv['id'] ?>">
                                            <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">✅ اعتماد ونشر</button>
                                        </form>
                                        <form method="post" action="actions.php">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="reject_video">
                                            <input type="hidden" name="tab" value="channels">
                                            <input type="hidden" name="id" value="<?= (int)$pv['id'] ?>">
                                            <button class="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">رفض</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'notes' && can($staff, 'notes')):
        $noteRows = $pdo->query('SELECT * FROM notes ORDER BY id DESC')->fetchAll();
    ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit">
                <h3 class="font-extrabold text-lg mb-2">📤 رفع ملزمة أو مذكرة</h3>
                <p class="text-xs text-slate-500 mb-4">الصيغ: PDF و DOC و DOCX و PPT و PPTX، بحد أقصى 200 ميجا.</p>
                <form method="post" action="actions.php" enctype="multipart/form-data" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="upload_note">
                    <input type="hidden" name="tab" value="notes">
                    <?= grade_range_selects() ?>
                    <input name="subject" required maxlength="100" placeholder="المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input name="title" required maxlength="200" placeholder="عنوان الملزمة (مثال: ملزمة الباب الأول)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <input type="file" name="note_file" required accept=".pdf,.doc,.docx,.ppt,.pptx" class="w-full text-sm">
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">رفع</button>
                </form>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2">
                <h3 class="font-extrabold text-lg mb-4">📚 الملازم والمذكرات (<?= count($noteRows) ?>)</h3>
                <div class="space-y-3">
                    <?php if (!$noteRows): ?><p class="text-slate-500 text-sm">لا توجد ملازم بعد.</p><?php endif; ?>
                    <?php foreach ($noteRows as $nr): ?>
                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div class="min-w-0">
                                <div class="font-bold text-sm truncate"><?= e($nr['title']) ?> <span class="text-xs text-purple-600">(<?= strtoupper(e($nr['file_type'])) ?>)</span></div>
                                <div class="text-xs text-slate-500"><?= e($nr['subject']) ?> · <?= e($nr['stage']) ?></div>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <a href="<?= e($nr['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">فتح</a>
                                <form method="post" action="actions.php" onsubmit="return confirm('حذف الملزمة؟');">
                                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                    <input type="hidden" name="action" value="delete_note">
                                    <input type="hidden" name="tab" value="notes">
                                    <input type="hidden" name="id" value="<?= (int)$nr['id'] ?>">
                                    <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'schedule' && can($staff, 'site')): ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200">
            <h3 class="font-extrabold text-lg mb-1">📅 الجداول الدراسية</h3>
            <p class="text-sm text-slate-500 mb-6">اكتب جدول الحصص أو مواعيد الامتحانات لكل مرحلة، وكل سطر هيظهر كما هو للطلاب.</p>
            <form method="post" action="actions.php" class="space-y-5">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="save_schedule">
                <input type="hidden" name="tab" value="schedule">
                <?php foreach (STAGES as $i => $st): ?>
                    <div>
                        <label class="block font-bold mb-1"><?= e($st) ?></label>
                        <textarea name="sched[<?= $i ?>]" rows="6" maxlength="4000" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"><?= e(site_setting('schedule_' . $i, '')) ?></textarea>
                    </div>
                <?php endforeach; ?>
                <button class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">حفظ الجداول</button>
            </form>
        </section>

    <?php elseif ($tab === 'messages' && can($staff, 'messages')):
        $msgRows = $pdo->query('SELECT * FROM messages ORDER BY id DESC LIMIT 100')->fetchAll();
    ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200">
            <h3 class="font-extrabold text-lg mb-4">✉️ رسائل التواصل (<?= count($msgRows) ?>)</h3>
            <div class="space-y-3">
                <?php if (!$msgRows): ?><p class="text-slate-500 text-sm">لا توجد رسائل بعد.</p><?php endif; ?>
                <?php foreach ($msgRows as $mr): ?>
                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="font-bold text-sm"><?= e($mr['name']) ?> <span class="text-xs text-slate-500 font-normal">· <?= e($mr['email']) ?> · <?= e($mr['created_at']) ?></span></div>
                            <p class="text-sm text-slate-700 mt-1 whitespace-pre-line"><?= e($mr['message']) ?></p>
                        </div>
                        <form method="post" action="actions.php" onsubmit="return confirm('حذف الرسالة؟');">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="action" value="delete_message">
                            <input type="hidden" name="tab" value="messages">
                            <input type="hidden" name="id" value="<?= (int)$mr['id'] ?>">
                            <button class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                        </form>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

    <?php elseif ($tab === 'backup' && $isOwner): ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200 max-w-2xl">
            <h3 class="font-extrabold text-lg mb-2">💾 نسخة احتياطية كاملة</h3>
            <p class="text-sm text-slate-600 mb-4">بتحمّل كل قاعدة البيانات (الدروس والمستخدمين والنتائج والإعدادات)، ومعاها الملفات المرفوعة لو السيرفر بيدعم الضغط.</p>
            <form method="post" action="actions.php">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="backup">
                <button class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition">تحميل النسخة الاحتياطية</button>
            </form>
            <p class="text-xs text-slate-500 mt-4">لاستعادة النسخة: ادخل phpMyAdmin من لوحة InfinityFree، واختار قاعدة البيانات، وبعدين Import واختار ملف <code>database.sql</code>.</p>
        </section>

    <?php elseif ($tab === 'stats' && can($staff, 'users')):
        $totalViews = (int)$pdo->query('SELECT COALESCE(SUM(views), 0) FROM page_views')->fetchColumn();
        $todayViews = (int)$pdo->query("SELECT COALESCE(SUM(views), 0) FROM page_views WHERE day = '" . date('Y-m-d') . "'")->fetchColumn();
        $days = array_reverse($pdo->query('SELECT day, views FROM page_views ORDER BY day DESC LIMIT 14')->fetchAll());
        $dayVals = array_column($days, 'views');
        $maxDay = $dayVals ? max(1, max($dayVals)) : 1;
        $topLessons = $pdo->query('SELECT l.title, l.subject, COALESCE(v.views, 0) AS views
                                   FROM lessons l LEFT JOIN lesson_views v ON v.lesson_id = l.id
                                   ORDER BY views DESC, l.id DESC LIMIT 10')->fetchAll();
        $examAttempts = (int)$pdo->query('SELECT COUNT(*) FROM quiz_attempts')->fetchColumn();
    ?>
        <section class="fade-in space-y-6">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow"><div class="text-sm opacity-90">إجمالي الزيارات</div><div class="text-4xl font-extrabold mt-2"><?= $totalViews ?></div></div>
                <div class="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow"><div class="text-sm opacity-90">زيارات اليوم</div><div class="text-4xl font-extrabold mt-2"><?= $todayViews ?></div></div>
                <div class="rounded-2xl p-5 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow"><div class="text-sm opacity-90">الطلاب</div><div class="text-4xl font-extrabold mt-2"><?= $counts['students'] ?></div></div>
                <div class="rounded-2xl p-5 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow"><div class="text-sm opacity-90">أولياء الأمور</div><div class="text-4xl font-extrabold mt-2"><?= $counts['parents'] ?></div></div>
                <div class="rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow"><div class="text-sm opacity-90">الدروس</div><div class="text-4xl font-extrabold mt-2"><?= $counts['lessons'] ?></div></div>
                <div class="rounded-2xl p-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow"><div class="text-sm opacity-90">محاولات الامتحانات</div><div class="text-4xl font-extrabold mt-2"><?= $examAttempts ?></div></div>
            </div>

            <div class="grid lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h3 class="font-extrabold text-lg mb-4">📈 الزيارات آخر 14 يوم</h3>
                    <?php if (!$days): ?><p class="text-sm text-slate-500">لا توجد زيارات مسجلة بعد.</p><?php endif; ?>
                    <div class="flex items-end gap-2 h-44">
                        <?php foreach ($days as $dv):
                            $h = max(3, (int)round($dv['views'] / $maxDay * 160)); ?>
                            <div class="flex-1 flex flex-col items-center justify-end gap-1" title="<?= e($dv['day']) ?>: <?= (int)$dv['views'] ?>">
                                <span class="text-[10px] font-bold text-slate-600"><?= (int)$dv['views'] ?></span>
                                <div class="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-fuchsia-400" style="height: <?= $h ?>px"></div>
                                <span class="text-[10px] text-slate-500"><?= e(substr($dv['day'], 5)) ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h3 class="font-extrabold text-lg mb-1">🔥 الدروس الأكثر ظهوراً</h3>
                    <p class="text-xs text-slate-500 mb-4">بيتحسب مرة كل ما الطالب يفتح قسم الدروس، مش عدد التشغيل الفعلي للفيديو.</p>
                    <ol class="space-y-3">
                        <?php if (!$topLessons): ?><li class="text-sm text-slate-500">لا توجد بيانات بعد.</li><?php endif; ?>
                        <?php foreach ($topLessons as $i => $tl): ?>
                            <li class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <div class="min-w-0"><div class="font-bold text-sm truncate"><?= $i + 1 ?>. <?= e($tl['title']) ?></div><div class="text-xs text-purple-600"><?= e($tl['subject']) ?></div></div>
                                <span class="font-extrabold text-emerald-700 shrink-0"><?= (int)$tl['views'] ?></span>
                            </li>
                        <?php endforeach; ?>
                    </ol>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'questions' && can($staff, 'lessons')):
        $pendingQ = $pdo->query("SELECT q.id, q.question, q.created_at, u.name AS student, l.title AS lesson
                                 FROM lesson_questions q JOIN users u ON u.id = q.user_id JOIN lessons l ON l.id = q.lesson_id
                                 WHERE q.status = 'pending' ORDER BY q.id DESC LIMIT 100")->fetchAll();
        $doneQ = $pdo->query("SELECT q.id, q.question, q.answer, q.status, u.name AS student, l.title AS lesson
                              FROM lesson_questions q JOIN users u ON u.id = q.user_id JOIN lessons l ON l.id = q.lesson_id
                              WHERE q.status <> 'pending' ORDER BY q.id DESC LIMIT 50")->fetchAll();
    ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 lg:col-span-2 space-y-4">
                <h3 class="font-extrabold text-lg">📥 أسئلة بانتظار المراجعة (<?= count($pendingQ) ?>)</h3>
                <?php if (!$pendingQ): ?><p class="text-sm text-slate-500">مفيش أسئلة جديدة.</p><?php endif; ?>
                <?php foreach ($pendingQ as $pq): ?>
                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div class="text-xs text-purple-600"><?= e($pq['lesson']) ?> · <?= e($pq['student']) ?> · <?= e($pq['created_at']) ?></div>
                        <div class="font-bold"><?= e($pq['question']) ?></div>
                        <form method="post" action="actions.php" class="flex flex-wrap gap-2">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="tab" value="questions">
                            <input type="hidden" name="id" value="<?= (int)$pq['id'] ?>">
                            <input name="answer" maxlength="2000" placeholder="اكتب الرد..." class="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <button name="action" value="answer_question" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">اعتماد الرد ونشره</button>
                            <button name="action" value="reject_question" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold">رفض</button>
                        </form>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="space-y-6 h-fit">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h3 class="font-extrabold text-lg mb-2">🚫 كلمات ممنوعة</h3>
                    <p class="text-xs text-slate-500 mb-3">أي سؤال فيه كلمة من القايمة بيترفض تلقائياً. افصل بفاصلة.</p>
                    <form method="post" action="actions.php" class="space-y-2">
                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                        <input type="hidden" name="action" value="save_blocked_words">
                        <input type="hidden" name="tab" value="questions">
                        <textarea name="words" rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"><?= e(site_setting('blocked_words', '')) ?></textarea>
                        <button class="w-full py-2 rounded-xl bg-slate-800 text-white text-sm font-bold">حفظ</button>
                    </form>
                </div>
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h3 class="font-extrabold text-lg mb-3">🗂️ آخر المعالجة</h3>
                    <div class="space-y-2 max-h-80 overflow-y-auto">
                        <?php foreach ($doneQ as $dq): ?>
                            <div class="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <span class="font-bold <?= $dq['status'] === 'approved' ? 'text-emerald-700' : 'text-red-600' ?>"><?= $dq['status'] === 'approved' ? 'معتمد' : 'مرفوض' ?></span>
                                · <?= e($dq['question']) ?>
                                <form method="post" action="actions.php" class="inline">
                                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                    <input type="hidden" name="action" value="delete_question">
                                    <input type="hidden" name="tab" value="questions">
                                    <input type="hidden" name="id" value="<?= (int)$dq['id'] ?>">
                                    <button class="text-red-600 font-bold mr-1">حذف</button>
                                </form>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </section>

    <?php elseif ($tab === 'curriculum' && can($staff, 'lessons')):
        $curRows = $pdo->query('SELECT id, grade, subject FROM curriculum ORDER BY grade, subject')->fetchAll();
        $byGrade = [];
        foreach ($curRows as $cr) { $byGrade[$cr['grade']][] = $cr; }
    ?>
        <section class="fade-in grid lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit space-y-4">
                <h3 class="font-extrabold text-lg">➕ إضافة مادة لصف</h3>
                <form method="post" action="actions.php" class="space-y-3">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="add_curriculum">
                    <input type="hidden" name="tab" value="curriculum">
                    <select name="grade" required class="w-full px-3 py-2 rounded-xl border border-slate-200"><?= grade_options_html(null) ?></select>
                    <input name="subject" required maxlength="100" placeholder="اسم المادة" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                    <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">إضافة</button>
                </form>
                <div class="text-xs text-slate-500 border-t border-slate-200 pt-4 space-y-2">
                    <p>المواد دي بتظهر للطالب في مستر يونس حسب صفه. راجع القايمة على الكتب الرسمية في موقع الوزارة، وعدّل أي مادة مش مطابقة.</p>
                    <a href="https://moe.gov.eg" target="_blank" rel="noopener noreferrer" class="inline-block text-blue-700 font-bold">🔗 موقع وزارة التربية والتعليم</a>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-4">
                <?php foreach (GRADE_YEARS as $si => $years): foreach ($years as $y): ?>
                    <div class="bg-white rounded-2xl p-5 shadow border border-slate-200">
                        <div class="font-extrabold mb-3"><?= e($y) ?> <span class="text-xs text-slate-500 font-normal">· <?= e(STAGES[$si]) ?></span></div>
                        <div class="flex flex-wrap gap-2">
                            <?php foreach ($byGrade[$y] ?? [] as $sub): ?>
                                <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-bold">
                                    <?= e($sub['subject']) ?>
                                    <form method="post" action="actions.php" onsubmit="return confirm('حذف المادة؟');">
                                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                        <input type="hidden" name="action" value="delete_curriculum">
                                        <input type="hidden" name="tab" value="curriculum">
                                        <input type="hidden" name="id" value="<?= (int)$sub['id'] ?>">
                                        <button class="text-red-600 font-extrabold leading-none">×</button>
                                    </form>
                                </span>
                            <?php endforeach; ?>
                            <?php if (empty($byGrade[$y])): ?><span class="text-sm text-slate-500">لا توجد مواد لهذا الصف.</span><?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; endforeach; ?>
            </div>
        </section>

    <?php elseif ($tab === 'settings'): ?>
        <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200 max-w-lg">
            <h3 class="font-extrabold text-lg mb-1">⚙️ تغيير كلمة المرور</h3>
            <p class="text-sm text-slate-500 mb-4">الحساب: <?= e($staff['email']) ?></p>
            <form method="post" action="actions.php" class="space-y-3">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="change_my_password">
                <input type="hidden" name="tab" value="settings">
                <input type="password" name="current" required placeholder="كلمة المرور الحالية" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                <input type="password" name="new" required minlength="6" placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                <button class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition">حفظ كلمة المرور الجديدة</button>
            </form>
        </section>
    <?php endif; ?>
</main>
</body>
</html>