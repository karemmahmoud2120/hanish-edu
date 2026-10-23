<?php
require_once __DIR__ . '/auth.php';
track_visit();

$CSRF    = csrf_token();
$me      = current_user();
$role    = $me['role'] ?? null;
$heroMode  = site_setting('hero_mode', 'animated');
$heroMedia = site_setting('hero_media', '');
$pdo     = db();
$stageIdx    = (isset($_GET['stage']) && ctype_digit((string)$_GET['stage'])) ? (int)$_GET['stage'] : -1;
$stageFilter = isset(STAGES[$stageIdx]) ? STAGES[$stageIdx] : '';
$yearRaw     = (string)($_GET['year'] ?? '');
$yearFilter  = ($stageFilter !== '' && in_array($yearRaw, GRADE_YEARS[$stageIdx], true)) ? $yearRaw : '';
$where  = [];
$params = [];
if ($yearFilter !== '') {
    $where[] = grade_year_sql('lessons');
    $params  = year_params($yearFilter, $stageFilter);
} elseif ($stageFilter !== '') {
    $where[]  = 'stage = ?';
    $params[] = $stageFilter;
}
$stmtL = $pdo->prepare('SELECT * FROM lessons' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC');
$stmtL->execute($params);
$lessons       = $stmtL->fetchAll();
$totalLessons  = (int)$pdo->query('SELECT COUNT(*) FROM lessons')->fetchColumn();
$news    = $pdo->query("SELECT * FROM news WHERE type='news' AND " . publish_clause() . " ORDER BY pinned DESC, id DESC LIMIT 6")->fetchAll();
$announce = $pdo->query("SELECT * FROM news WHERE type='announcement' AND " . publish_clause() . " ORDER BY pinned DESC, id DESC LIMIT 6")->fetchAll();
$ministry = $pdo->query('SELECT * FROM ministry_links ORDER BY sort_order, id')->fetchAll();
$homeNotes = $pdo->query('SELECT * FROM notes ORDER BY id DESC LIMIT 6')->fetchAll();
$totalNotes = (int)$pdo->query('SELECT COUNT(*) FROM notes')->fetchColumn();
$totalNews  = (int)$pdo->query('SELECT COUNT(*) FROM news')->fetchColumn();
$examAll   = $pdo->query('SELECT * FROM exam_files ORDER BY id DESC LIMIT 12')->fetchAll();
$honorRows = $pdo->query("SELECT u.id, u.name, u.grade, r.score, r.max_score FROM exam_results r JOIN users u ON u.id = r.student_id WHERE u.role = 'student' AND r.max_score > 0")->fetchAll();
$byStudent = [];
foreach ($honorRows as $hr) {
    $sid = (int)$hr['id'];
    $byStudent[$sid]['name']  = $hr['name'];
    $byStudent[$sid]['grade'] = $hr['grade'];
    $byStudent[$sid]['sum']   = ($byStudent[$sid]['sum'] ?? 0) + (float)$hr['score'] / (float)$hr['max_score'] * 100;
    $byStudent[$sid]['n']     = ($byStudent[$sid]['n'] ?? 0) + 1;
}
$honorBy = [];
foreach ($byStudent as $st) {
    $stName = stage_of_grade($st['grade']) ?? 'غير محدد';
    $honorBy[$stName][] = ['name' => $st['name'], 'grade' => $st['grade'], 'avg' => round($st['sum'] / $st['n'], 1)];
}
foreach ($honorBy as $k => $list) {
    usort($honorBy[$k], fn($a, $b) => $b['avg'] <=> $a['avg']);
    $honorBy[$k] = array_slice($honorBy[$k], 0, 5);
}
$myAvg = null; $myLevelName = ''; $myLevelCls = '';
if ($role === 'student') {
    $mine = student_results((int)$me['id']);
    $t = 0.0; $c = 0;
    foreach ($mine as $r) {
        if ((float)$r['max_score'] > 0) { $t += (float)$r['score'] / (float)$r['max_score'] * 100; $c++; }
    }
    if ($c) { $myAvg = round($t / $c, 1); [$myLevelName, $myLevelCls] = level_info($myAvg); }
}
$schedules = [];
foreach (STAGES as $i => $st) { $schedules[$i] = site_setting('schedule_' . $i, ''); }
$studentCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='student'")->fetchColumn();
$ticker  = array_merge($announce, $news);

$flash    = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
$me       = current_user();
$role     = $me['role'] ?? null;
$userName = $me['name'] ?? '';
$isAdmin  = !empty($_SESSION['is_admin']);
$children = ($role === 'parent') ? linked_students((int)$me['id']) : [];
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; letter-spacing: .1px; }
        h1, h2, h3 { font-weight: 800; }
        .hero-live { background: #050b1f; }
        .aurora { position: absolute; inset: -20%; filter: blur(70px); opacity: .9; pointer-events: none; }
        .aurora span { position: absolute; border-radius: 9999px; mix-blend-mode: screen; animation: auroraMove 16s ease-in-out infinite; }
        .aurora span:nth-child(1) { width: 46%; height: 56%; background: #22d3ee; top: 4%; right: 6%; }
        .aurora span:nth-child(2) { width: 42%; height: 52%; background: #a855f7; bottom: 0; left: 4%; animation-delay: -5s; }
        .aurora span:nth-child(3) { width: 34%; height: 44%; background: #f59e0b; top: 28%; left: 36%; animation-delay: -9s; opacity: .55; }
        @keyframes auroraMove {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(70px, -45px) scale(1.15) rotate(40deg); }
            66% { transform: translate(-60px, 35px) scale(.9) rotate(-30deg); }
        }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px); background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%); mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%); animation: gridMove 20s linear infinite; }
        @keyframes gridMove { to { background-position: 48px 48px; } }
        .scan { position: absolute; left: 0; right: 0; height: 140px; background: linear-gradient(to bottom, transparent, rgba(45,212,191,.14), transparent); animation: scanMove 7s linear infinite; pointer-events: none; }
        @keyframes scanMove { from { top: -140px; } to { top: 100%; } }
        .vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,.8) 100%); pointer-events: none; }
        .hero-title-glow { text-shadow: 0 0 30px rgba(45,212,191,.35); }
        @media (prefers-reduced-motion: reduce) {
            .aurora span, .grid-bg, .scan { animation: none; }
        }
        @keyframes heroShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .gradient-primary { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-flex; gap: 3rem; white-space: nowrap; animation: marquee 30s linear infinite; }
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        .animate-blob { animation: blob 9s ease-in-out infinite; }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-floaty { animation: floaty 4s ease-in-out infinite; }
        .robot-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 45; display: flex; align-items: flex-end; gap: 10px; direction: rtl; pointer-events: none; }
        .robot-wrap > * { pointer-events: auto; }
        .robot { width: 92px; height: 110px; cursor: pointer; animation: robotFloat 3.2s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(15,23,42,.35)); }
        @keyframes robotFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .robot-eye, .robot-arm { transform-box: fill-box; }
        .robot-eye { transform-origin: center; animation: robotBlink 4.5s infinite; }
        @keyframes robotBlink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
        .robot-arm { transform-origin: top center; animation: robotWave 2.4s ease-in-out infinite; }
        @keyframes robotWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-28deg); } }
        .robot-bubble { position: relative; max-width: 230px; background: #fff; color: #0f172a; border-radius: 16px; padding: 10px 14px; font-weight: 800; font-size: 14px; line-height: 1.6; box-shadow: 0 12px 28px rgba(15,23,42,.18); transition: opacity .35s ease, transform .35s ease; margin-bottom: 26px; }
        .robot-bubble::after { content: ""; position: absolute; top: 50%; right: -8px; transform: translateY(-50%); border-style: solid; border-width: 8px 0 8px 8px; border-color: transparent transparent transparent #fff; }
        .robot-bubble.fade { opacity: 0; transform: translateY(4px); }
        @media (max-width: 640px) {
            .robot-wrap { bottom: 14px; right: 10px; }
            .robot { width: 66px; height: 80px; }
            .robot-bubble { max-width: 160px; font-size: 12px; margin-bottom: 18px; }
        }
        .svc-bar::-webkit-scrollbar { display: none; }
        .svc-chip { flex-shrink: 0; padding: .5rem 1rem; border-radius: 9999px; background: #f1f5f9; color: #0f172a; font-weight: 700; font-size: 14px; transition: background .2s, transform .2s; }
        .svc-chip:hover { background: #d1fae5; transform: translateY(-1px); }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
        .reveal.show { opacity: 1; transform: none; }
        .hidden { display: none !important; }
        .modal { position: fixed; inset: 0; z-index: 50; display: none; align-items: center; justify-content: center; padding: 1rem; background: rgba(15,23,42,.6); backdrop-filter: blur(4px); }
        .modal.open { display: flex; }
    </style>
    <?= theme_assets() ?>
    <?= pwa_head() ?>
</head>
<body class="bg-slate-50 text-slate-800 antialiased">

    <!-- شريط الأخبار المتحرك -->
    <div class="bg-gradient-to-r from-amber-600 via-emerald-700 to-teal-800 text-white py-2.5 text-xs sm:text-sm font-bold overflow-hidden relative z-50">
        <div class="flex whitespace-nowrap overflow-hidden">
            <div class="animate-marquee">
                <?php
                $items = $ticker ?: [['title' => 'نعتز ونفتخر بذكرى انتصارات أكتوبر المجيدة 🇪🇬']];
                for ($k = 0; $k < 2; $k++):
                    foreach ($items as $t): ?>
                        <span>📢 <?= e($t['title']) ?></span>
                    <?php endforeach;
                endfor; ?>
            </div>
        </div>
    </div>

    <!-- النافبار -->
    <nav class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="index.php" class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl shadow-md animate-floaty">🐘</div>
                <div>
                    <span class="font-extrabold text-xl text-slate-900 block leading-tight">منصة عائلة حنيش</span>
                    <span class="text-xs text-emerald-600 font-semibold">بوابة التعليم المتكاملة</span>
                </div>
            </a>
            <div class="hidden md:flex items-center gap-7 font-semibold text-slate-600">
                <a href="#sections" class="hover:text-emerald-600 transition">الأقسام</a>
                
                
                <a href="#stages" class="hover:text-emerald-600 transition">المراحل</a>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
                <?= theme_button() ?>
                <button type="button" id="installBtn" onclick="installApp()" class="hidden px-4 py-2.5 rounded-xl bg-amber-400 text-slate-900 font-bold text-sm shadow hover:scale-105 transition">📲 حمّل التطبيق</button>
                <?php if ($role): ?>
                    <?php if ($role === 'student'): ?>
                        <a href="student.php" class="px-4 py-2.5 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition">بوابتي 🎒</a>
                    <?php else: ?>
                        <button onclick="openModal('dashboardModal')" class="px-4 py-2.5 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition">لوحتي 🏠</button>
                    <?php endif; ?>
                <?php else: ?>
                    <button onclick="openAuth('login')" class="px-4 py-2.5 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition">دخول 🔐</button>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <!-- الهيرو -->
    <!-- شريط الخدمات -->
    <div class="bg-white/95 border-b border-slate-200 shadow-sm">
        <form action="search.php" method="get" class="max-w-7xl mx-auto px-3 pt-2.5 flex gap-2">
            <input name="q" required maxlength="100" placeholder="🔍 ابحث في الدروس والملازم والأخبار..." class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm">
            <button class="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-bold">بحث</button>
        </form>
        <div class="svc-bar max-w-7xl mx-auto px-3 py-2.5 flex gap-2 overflow-x-auto whitespace-nowrap" style="scrollbar-width:none">
                <button type="button" onclick="openSection('lessons')" class="svc-chip">📚 الدروس</button>
                <button type="button" onclick="openSection('notes')" class="svc-chip">📘 الملازم</button>
                <button type="button" onclick="openSection('news')" class="svc-chip">📢 الأخبار</button>
                <button type="button" onclick="openSection('ministry')" class="svc-chip">🔗 روابط تهمك</button>
                <button type="button" onclick="openSection('sec-exams')" class="svc-chip">🧪 الامتحانات</button>
                <button type="button" onclick="openSection('sec-honor')" class="svc-chip">🏆 لوحة الشرف</button>
                <button type="button" onclick="openSection('sec-schedule')" class="svc-chip">📅 الجدول</button>
                <button type="button" onclick="openSection('sec-faq')" class="svc-chip">❓ الأسئلة</button>
                <button type="button" onclick="openSection('sec-level')" class="svc-chip">📊 اختبر مستواك</button>
                <button type="button" onclick="openSection('sec-contact')" class="svc-chip">📞 تواصل معنا</button>
                <a href="games.php" class="svc-chip">🎮 الألعاب</a>
        </div>
    </div>

    <section class="relative hero-live overflow-hidden">
        <canvas id="heroCanvas" class="absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>
        <div class="aurora"><span></span><span></span><span></span></div>
        <div class="grid-bg"></div>
        <div class="scan"></div>
        <div class="vignette"></div>
        <?php if ($heroMode === 'image' && $heroMedia !== ''): ?>
            <div class="absolute inset-0 bg-cover bg-center" style="background-image:url('<?= e($heroMedia) ?>')"></div>
            <div class="absolute inset-0 bg-slate-900/60"></div>
        <?php elseif ($heroMode === 'video' && $heroMedia !== ''): ?>
            <video class="absolute inset-0 w-full h-full object-cover" src="<?= e($heroMedia) ?>" autoplay muted loop playsinline></video>
            <div class="absolute inset-0 bg-slate-900/60"></div>
        <?php endif; ?>
        <div class="absolute inset-0 pointer-events-none opacity-30">
            <div class="animate-blob absolute top-10 right-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl"></div>
            <div class="animate-blob absolute bottom-10 left-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl" style="animation-delay:-4s"></div>
        </div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center text-white">
            <div class="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-medium mb-6">
                <span class="text-xl">🎓</span>
                <span>منصة تعليمية متكاملة لأبناء عائلة حنيش</span>
            </div>
            <h1 class="reveal hero-title-glow text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                منصة عائلة حنيش التعليمية
                <br>
                <span class="bg-gradient-to-l from-amber-300 to-teal-200 bg-clip-text text-transparent">تعلّم، تابع، وتفوّق</span>
            </h1>
            <p class="reveal text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed">
                دروس مشروحة لكل المراحل، ومتابعة مستمرة لأولياء الأمور، ومساعد ذكي يجيب على أسئلتك في أي وقت.
            </p>
            <div class="reveal flex flex-col sm:flex-row gap-4 justify-center">
                <button onclick="openAuth('register')" class="px-8 py-4 rounded-2xl bg-amber-400 text-slate-900 font-bold text-lg shadow-xl hover:bg-amber-300 transition hover:scale-105">🚀 ابدأ الآن مجاناً</button>
                <a href="#sections" class="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition text-center">🔗 روابط تهمك</a>
            </div>

            <div class="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div class="reveal bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 hover:-translate-y-1 transition">
                    <div class="text-3xl font-extrabold text-emerald-300"><span class="counter" data-target="12">0</span></div>
                    <div class="text-sm text-slate-200 mt-1">مرحلة دراسية</div>
                </div>
                <div class="reveal bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 hover:-translate-y-1 transition">
                    <div class="text-3xl font-extrabold text-emerald-300"><span class="counter" data-target="<?= $totalLessons ?>">0</span></div>
                    <div class="text-sm text-slate-200 mt-1">درس مشروح</div>
                </div>
                <div class="reveal bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 hover:-translate-y-1 transition">
                    <div class="text-3xl font-extrabold text-emerald-300"><span class="counter" data-target="<?= $studentCount ?>">0</span></div>
                    <div class="text-sm text-slate-200 mt-1">طالب مسجل</div>
                </div>
                <div class="reveal bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 hover:-translate-y-1 transition">
                    <div class="text-3xl font-extrabold text-emerald-300">24/7</div>
                    <div class="text-sm text-slate-200 mt-1">مساعد ذكي</div>
                </div>
            </div>
        </div>
    </section>

    <!-- روابط وزارة التربية والتعليم -->
    <!-- أقسام المنصة -->
    <section id="sections" class="py-16 bg-slate-50 border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal text-center mb-10">
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">اختر القسم اللي يهمك</h2>
                <p class="text-slate-600">اضغط على أي قسم لتفتحه</p>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <button type="button" onclick="openSection('lessons')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📚</div>
                    <div class="font-extrabold text-slate-900 text-lg">الدروس والفيديوهات</div>
                    <div class="text-sm text-slate-500 mt-1"><?= $totalLessons ?> درس</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('notes')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📘</div>
                    <div class="font-extrabold text-slate-900 text-lg">الملازم والمذكرات</div>
                    <div class="text-sm text-slate-500 mt-1"><?= $totalNotes ?> ملزمة</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('news')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📢</div>
                    <div class="font-extrabold text-slate-900 text-lg">الأخبار والإعلانات</div>
                    <div class="text-sm text-slate-500 mt-1"><?= $totalNews ?> خبر وإعلان</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('ministry')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">🔗</div>
                    <div class="font-extrabold text-slate-900 text-lg">روابط تهمك</div>
                    <div class="text-sm text-slate-500 mt-1"><?= count($ministry) ?> رابط</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>

                <button type="button" onclick="openSection('sec-exams')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">🧪</div>
                    <div class="font-extrabold text-slate-900 text-lg">الامتحانات</div>
                    <div class="text-sm text-slate-500 mt-1"><?= count($examAll) ?> ملف امتحان</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('sec-honor')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">🏆</div>
                    <div class="font-extrabold text-slate-900 text-lg">لوحة الشرف</div>
                    <div class="text-sm text-slate-500 mt-1">أوائل كل مرحلة</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('sec-schedule')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📅</div>
                    <div class="font-extrabold text-slate-900 text-lg">الجدول الدراسي</div>
                    <div class="text-sm text-slate-500 mt-1">حصص ومواعيد الامتحانات</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('sec-faq')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">❓</div>
                    <div class="font-extrabold text-slate-900 text-lg">الأسئلة الشائعة</div>
                    <div class="text-sm text-slate-500 mt-1">إجابات سريعة</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('sec-level')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📊</div>
                    <div class="font-extrabold text-slate-900 text-lg">اختبر مستواك</div>
                    <div class="text-sm text-slate-500 mt-1">مستواك الدراسي</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
                <button type="button" onclick="openSection('sec-contact')" class="reveal group text-right p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow hover:shadow-2xl hover:-translate-y-1 transition">
                    <div class="text-4xl mb-3 group-hover:scale-110 transition">📞</div>
                    <div class="font-extrabold text-slate-900 text-lg">تواصل معنا</div>
                    <div class="text-sm text-slate-500 mt-1">ابعت لنا رسالة</div>
                    <div class="mt-4 text-emerald-600 font-bold text-sm">افتح القسم ←</div>
                </button>
            </div>
        </div>
    </section>

    <section id="ministry" class="py-16 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal text-center mb-10">
                <h2 class="text-3xl font-extrabold text-slate-900 mb-2">🔗 روابط تهمك</h2>
                <p class="text-slate-600">مواقع ومصادر مختارة تهمك</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php if (!$ministry): ?>
                    <div class="col-span-3 text-center text-slate-500 py-6">لم تُضف روابط بعد.</div>
                <?php endif; ?>
                <?php foreach ($ministry as $m): ?>
                    <a href="<?= e($m['url']) ?>" target="_blank" rel="noopener noreferrer"
                       class="reveal group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50 border border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div class="w-16 h-16 rounded-2xl bg-white shadow flex items-center justify-center text-3xl group-hover:scale-110 transition"><?= e($m['icon']) ?></div>
                        <div class="flex-1">
                            <div class="font-extrabold text-slate-900"><?= e($m['title']) ?></div>
                            <div class="text-xs text-slate-500 mt-1 truncate"><?= e($m['url']) ?></div>
                        </div>
                        <span class="text-emerald-600 text-xl group-hover:-translate-x-1 transition">←</span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- الأخبار والإعلانات -->
    <section id="news" class="py-16 bg-slate-50 border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <h2 class="reveal text-2xl font-extrabold text-slate-900 mb-6">📰 آخر الأخبار</h2>
                <div class="space-y-4">
                    <?php if (!$news): ?><p class="text-slate-500">لا توجد أخبار حالياً.</p><?php endif; ?>
                    <?php foreach ($news as $n): ?>
                        <article class="reveal bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition">
                            <div class="flex items-center gap-2 mb-2">
                                <?php if ($n['pinned']): ?><span class="text-xs font-bold text-purple-700">📌 مثبت</span><?php endif; ?>
                                <span class="text-xs text-slate-400"><?= e(substr($n['created_at'], 0, 10)) ?></span>
                            </div>
                            <h3 class="text-lg font-bold text-slate-900 mb-2"><?= e($n['title']) ?></h3>
                            <p class="text-slate-600 text-sm leading-relaxed"><?= e($n['body']) ?></p>
                        </article>
                    <?php endforeach; ?>
                </div>
            </div>
            <div>
                <h2 class="reveal text-2xl font-extrabold text-slate-900 mb-6">📢 الإعلانات</h2>
                <div class="space-y-4">
                    <?php if (!$announce): ?><p class="text-slate-500">لا توجد إعلانات حالياً.</p><?php endif; ?>
                    <?php foreach ($announce as $a): ?>
                        <div class="reveal rounded-2xl p-5 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:-translate-y-1 transition">
                            <div class="font-extrabold mb-1">📢 <?= e($a['title']) ?></div>
                            <p class="text-sm text-amber-50 leading-relaxed"><?= e($a['body']) ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- الدروس -->
    <section id="lessons" class="py-16 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal mb-10">
                <h2 class="text-3xl font-extrabold text-slate-900 mb-2">📚 أحدث الدروس والفيديوهات</h2>
                <p class="text-slate-600 text-sm">محتوى تم اعتماده ورفعه بواسطة إدارة المنصة</p>
            </div>

            <form method="get" action="index.php#lessons" class="flex flex-wrap items-center gap-3 mb-8">
                <select id="filterStage" name="stage" onchange="fillFilterYears(this)" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">
                    <option value="">كل المراحل</option>
                    <?php foreach (STAGES as $i => $st): ?>
                        <option value="<?= $i ?>" <?= $stageIdx === $i ? 'selected' : '' ?>><?= e($st) ?></option>
                    <?php endforeach; ?>
                </select>
                <select id="filterYear" name="year" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">
                    <?php if ($stageFilter === ''): ?>
                        <option value="">اختر المرحلة أولاً</option>
                    <?php else: ?>
                        <option value="">كل السنوات</option>
                        <?php foreach (GRADE_YEARS[$stageIdx] as $y): ?>
                            <option value="<?= e($y) ?>" <?= $yearFilter === $y ? 'selected' : '' ?>><?= e($y) ?></option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
                <button class="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold shadow hover:opacity-95 transition">تصفية</button>
                <?php if ($stageFilter !== ''): ?>
                    <a href="index.php#lessons" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition">إلغاء التصفية</a>
                <?php endif; ?>
                <span class="text-sm text-slate-500 mr-auto">عدد الدروس المعروضة: <?= count($lessons) ?></span>
            </form>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php if (!$lessons): ?>
                    <div class="col-span-3 text-center py-10 text-slate-500">لا توجد دروس مضافة حالياً.</div>
                <?php endif; ?>
                <?php foreach ($lessons as $l): ?>
                    <div class="reveal bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:shadow-xl transition space-y-4">
                        <h3 class="text-lg font-extrabold text-slate-900"><?= e($l['title']) ?></h3>
                        <?= video_embed_html($l['video']) ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- البوابات -->
    <!-- الملازم والمذكرات -->
    <section id="notes" class="py-16 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal mb-10">
                <h2 class="text-3xl font-extrabold text-slate-900 mb-2">📘 الملازم والمذكرات</h2>
                <p class="text-slate-600 text-sm">أحدث الملازم والمذكرات المرفوعة للمراحل المختلفة</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php if (!$homeNotes): ?>
                    <div class="col-span-3 text-center py-8 text-slate-500">لا توجد ملازم حالياً.</div>
                <?php endif; ?>
                <?php foreach ($homeNotes as $hn): ?>
                    <div class="reveal bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition flex flex-col justify-between gap-4">
                        <div>
                            <span class="text-xs font-bold px-2 py-0.5 rounded <?= $hn['file_type'] === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700' ?>"><?= strtoupper(e($hn['file_type'])) ?></span>
                            <h3 class="font-extrabold text-lg mt-2"><?= e($hn['title']) ?></h3>
                            <p class="text-sm text-slate-500"><?= e($hn['subject']) ?> · <?= e($hn['stage']) ?></p>
                        </div>
                        <a href="<?= e($hn['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="text-center px-4 py-2.5 rounded-xl gradient-primary text-white font-bold transition">فتح / تحميل</a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- البوابات -->
    <section id="roles" class="py-16 bg-slate-50 border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal text-center mb-12">
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">اختر بوابة الدخول الخاصة بك</h2>
                <p class="text-slate-600">بوابات مخصصة تضمن الخصوصية والتجربة المثلى لكل مستخدم</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div onclick="openAuth('login','student')" class="reveal cursor-pointer bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2 text-center group">
                    <div class="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition">🎒</div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-3">بوابة الطالب</h3>
                    <p class="text-slate-600 text-sm mb-6 leading-relaxed">استعرض دروسك وتابع تقدمك بسهولة.</p>
                    <span class="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow">دخول الطالب</span>
                </div>
                <div onclick="openAuth('login','parent')" class="reveal cursor-pointer bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2 text-center group">
                    <div class="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition">👨‍👩‍👧‍👦</div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-3">بوابة ولي الأمر</h3>
                    <p class="text-slate-600 text-sm mb-6 leading-relaxed">تابع مستوى أبنائك وتقدمهم الدراسي.</p>
                    <span class="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow">دخول ولي الأمر</span>
                </div>
                
            </div>
        </div>
    </section>

    <!-- المراحل -->
    <section id="stages" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="reveal text-center mb-14">
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">المراحل الدراسية المتاحة</h2>
                <p class="text-slate-600 text-lg">من الأول الابتدائي حتى الثالث الثانوي</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="reveal rounded-3xl p-8 text-white bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl hover:-translate-y-2 transition">
                    <div class="text-6xl mb-4 animate-floaty">🧒</div>
                    <h3 class="text-2xl font-extrabold mb-2">المرحلة الابتدائية</h3>
                    <div class="text-white/90 text-sm font-semibold mb-4 bg-white/20 inline-block px-3 py-1 rounded-lg">الصفوف 1 - 6 ابتدائي</div>
                    <p class="text-white/95 leading-relaxed">تأسيس ممتاز في القراءة والرياضيات والعلوم الأساسية.</p>
                </div>
                <div class="reveal rounded-3xl p-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl hover:-translate-y-2 transition">
                    <div class="text-6xl mb-4 animate-floaty">🧑‍🎓</div>
                    <h3 class="text-2xl font-extrabold mb-2">المرحلة الإعدادية</h3>
                    <div class="text-white/90 text-sm font-semibold mb-4 bg-white/20 inline-block px-3 py-1 rounded-lg">الصفوف 1 - 3 إعدادي</div>
                    <p class="text-white/95 leading-relaxed">مناهج العلوم والرياضيات واللغات المتقدمة.</p>
                </div>
                <div class="reveal rounded-3xl p-8 text-white bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-xl hover:-translate-y-2 transition">
                    <div class="text-6xl mb-4 animate-floaty">🎓</div>
                    <h3 class="text-2xl font-extrabold mb-2">المرحلة الثانوية</h3>
                    <div class="text-white/90 text-sm font-semibold mb-4 bg-white/20 inline-block px-3 py-1 rounded-lg">الصفوف 1 - 3 ثانوي</div>
                    <p class="text-white/95 leading-relaxed">التحضير للجامعات بأقسام علمي وأدبي.</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="flex items-center justify-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-xl">🐘</div>
                <div class="font-extrabold text-white text-lg"><?= e(APP_NAME) ?></div>
            </div>
            <?php if ($ministry): ?>
                <div class="flex flex-wrap items-center justify-center gap-4 mb-4 text-sm">
                    <?php foreach ($ministry as $m): ?>
                        <a href="<?= e($m['url']) ?>" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 transition"><?= e($m['title']) ?></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <p class="text-sm">© 2026 — جميع الحقوق محفوظة لمنصة عائلة حنيش الكرام. نعتز بذكرى انتصارات أكتوبر المجيدة.</p>
        </div>
    </footer>

<div class="robot-wrap" id="robotWrap">
        <svg class="robot" viewBox="0 0 120 140" onclick="showPhrase()" role="button" aria-label="رسالة تحفيزية">
            <defs>
                <linearGradient id="robotGrad" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stop-color="#2dd4bf"/>
                    <stop offset="1" stop-color="#1d4ed8"/>
                </linearGradient>
            </defs>
            <line x1="60" y1="10" x2="60" y2="22" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
            <circle cx="60" cy="8" r="6" fill="#fbbf24">
                <animate attributeName="opacity" values="1;.25;1" dur="1.4s" repeatCount="indefinite"/>
            </circle>
            <rect x="26" y="22" width="68" height="54" rx="18" fill="url(#robotGrad)"/>
            <rect x="38" y="38" width="44" height="22" rx="8" fill="#0f172a"/>
            <g class="robot-eye"><circle cx="50" cy="49" r="5" fill="#5eead4"/></g>
            <g class="robot-eye"><circle cx="70" cy="49" r="5" fill="#5eead4"/></g>
            <rect x="38" y="82" width="44" height="34" rx="10" fill="url(#robotGrad)"/>
            <circle cx="60" cy="99" r="6" fill="#fbbf24"/>
            <rect x="14" y="84" width="14" height="30" rx="7" fill="#1d4ed8"/>
            <rect class="robot-arm" x="92" y="84" width="14" height="30" rx="7" fill="#1d4ed8"/>
        </svg>
        <div class="flex flex-col items-end gap-2">
            <div class="robot-bubble" id="robotBubble"><span id="robotText">أهلاً بيك! 👋</span></div>
            <button type="button" id="musicBtn" onclick="toggleMusic()" class="px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-bold shadow-lg hover:scale-105 transition">🎵 تشغيل الموسيقى</button>
            <button type="button" id="speakBtn" onclick="speakServices()" class="px-3 py-1.5 rounded-full bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg hover:scale-105 transition">🔊 استمع للترحيب</button>
        </div>
    </div>

    <!-- مساعد الدردشة -->
    <div class="fixed bottom-6 left-6 z-50">
        <div id="chatBox" class="hidden w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-4 flex flex-col">
            <div class="gradient-primary p-4 text-white flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-xl">🤖</span>
                    <div>
                        <h4 class="font-bold text-sm">مساعد عائلة حنيش الذكي</h4>
                        <span class="text-xs text-emerald-100">متصل الآن</span>
                    </div>
                </div>
                <button onclick="toggleChat()" class="text-white/80 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div id="chatMessages" class="p-4 h-72 overflow-y-auto space-y-3 bg-slate-50 text-sm">
                <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 max-w-[85%] text-slate-700">
                    أهلاً بك! اسألني عن أي درس أو مادة دراسية وسأجيبك فوراً.
                </div>
            </div>
            <div class="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input type="text" id="chatInput" onkeydown="if(event.key==='Enter') sendMessage()" placeholder="اكتب سؤالك هنا..." class="flex-1 px-3 py-2 text-sm bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <button onclick="sendMessage()" class="px-4 py-2 gradient-primary text-white text-sm font-bold rounded-xl shadow hover:opacity-90 transition">إرسال</button>
            </div>
        </div>
        <button onclick="toggleChat()" class="w-14 h-14 rounded-full gradient-primary text-white text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition">💬</button>
    </div>

    <!-- نافذة الدخول والتسجيل -->
    <div id="authModal" class="modal">
        <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onclick="closeModal('authModal')" class="absolute top-5 left-5 text-slate-400 hover:text-slate-700 text-2xl font-bold">&times;</button>
            <div class="text-center mb-5">
                <div class="w-14 h-14 rounded-2xl gradient-primary text-white text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">🎓</div>
                <h3 id="authTitle" class="text-2xl font-extrabold text-slate-900">مرحباً بك</h3>
            </div>

            <div class="grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-6">
                <button id="tabLogin" onclick="switchAuth('login')" class="py-2.5 rounded-lg font-bold transition">تسجيل الدخول</button>
                <button id="tabRegister" onclick="switchAuth('register')" class="py-2.5 rounded-lg font-bold transition">حساب جديد</button>
            </div>

            <div id="roleToggle" class="grid grid-cols-2 gap-3 mb-6">
                <button type="button" id="roleStudent" onclick="setAuthRole('student')" class="py-3 rounded-xl border-2 font-bold transition">🎒 طالب</button>
                <button type="button" id="roleParent" onclick="setAuthRole('parent')" class="py-3 rounded-xl border-2 font-bold transition">👨‍👩‍👧 ولي أمر</button>
            </div>

            <form id="loginForm" method="post" action="actions.php" class="space-y-4">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="login_role">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input type="email" name="email" required class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                    <input type="password" name="password" required class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <button type="submit" class="w-full py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-lg hover:opacity-95 transition">دخول</button>
            </form>

            <form id="registerForm" method="post" action="actions.php" class="space-y-4 hidden">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="register">
                <input type="hidden" name="role" id="regRole" value="student">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">الاسم</label>
                    <input type="text" name="name" required maxlength="100" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input type="email" name="email" required class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">كلمة المرور (6 أحرف على الأقل)</label>
                    <input type="password" name="password" required minlength="6" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div id="gradeWrap" class="space-y-3">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
                        <select name="stage" id="regStage" onchange="fillYears()" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="">اختر المرحلة</option>
                            <?php foreach (STAGES as $i => $st): ?>
                                <option value="<?= $i ?>"><?= e($st) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-1">السنة الدراسية</label>
                        <select name="year" id="regYear" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="">اختر المرحلة أولاً</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="w-full py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-lg hover:opacity-95 transition">إنشاء الحساب</button>
            </form>
        </div>
    </div>

    <?php if ($role): ?>
    <!-- بوابة الطالب / ولي الأمر -->
    <div id="dashboardModal" class="modal">
        <div class="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onclick="closeModal('dashboardModal')" class="absolute top-5 left-5 text-slate-400 hover:text-slate-700 text-2xl font-bold">&times;</button>
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl <?= $role === 'student' ? 'bg-emerald-600' : 'bg-blue-600' ?> text-white flex items-center justify-center text-2xl shadow"><?= $role === 'student' ? '🎒' : '👨‍👩‍👧‍👦' ?></div>
                    <div>
                        <h3 class="text-2xl font-extrabold text-slate-900"><?= $role === 'student' ? 'بوابة الطالب' : 'بوابة ولي الأمر' ?></h3>
                        <p class="text-xs font-bold <?= $role === 'student' ? 'text-emerald-600' : 'text-blue-600' ?>">مرحباً <?= e($userName) ?></p>
                    </div>
                </div>
                <form method="post" action="actions.php">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="logout">
                    <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 transition">تسجيل الخروج</button>
                </form>
            </div>

            <?php if ($role === 'student'): ?>
                <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-center">
                    <div class="text-sm font-bold text-slate-700 mb-2">كود الربط مع ولي الأمر</div>
                    <div class="text-3xl font-extrabold tracking-widest text-emerald-700"><?= e($me['link_code']) ?></div>
                    <p class="text-xs text-slate-500 mt-2">أعط هذا الكود لولي أمرك ليتابع مستواك</p>
                </div>
                <h4 class="text-lg font-bold text-slate-900 mb-4">📝 نتائجي ومستواي</h4>
                <div class="mb-8"><?= results_html(student_results((int)$me['id'])) ?></div>
                <h4 class="text-lg font-bold text-slate-900 mb-4">📖 الدروس المتاحة</h4>
                <div class="grid sm:grid-cols-2 gap-4">
                    <?php foreach ($lessons as $l): ?>
                        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                            <div>
                                <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded"><?= e($l['subject']) ?></span>
                                <h5 class="font-bold text-slate-900 mt-2 mb-1"><?= e($l['title']) ?></h5>
                                <p class="text-xs text-slate-600"><?= e($l['description']) ?></p>
                            </div>
                            <a href="<?= e($l['video']) ?>" target="_blank" rel="noopener noreferrer" class="mt-4 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold text-center block hover:bg-emerald-700 transition">بدء الدرس 📖</a>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <form method="post" action="actions.php" class="flex gap-3 mb-8">
                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                    <input type="hidden" name="action" value="link_student">
                    <input type="text" name="code" required maxlength="6" placeholder="كود الطالب (6 أحرف)" class="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 uppercase tracking-widest">
                    <button class="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold">ربط الطالب</button>
                </form>
                <?php if (!$children): ?>
                    <div class="text-center text-slate-500 py-8">لم تربط أي طالب بعد. اطلب من ابنك كود الربط من حسابه.</div>
                <?php endif; ?>
                <div class="space-y-4">
                    <?php foreach ($children as $c): ?>
                        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                            <div class="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h5 class="font-bold text-slate-900 text-lg"><?= e($c['name']) ?></h5>
                                    <span class="text-xs text-slate-500"><?= e($c['grade'] ?: 'لم يحدد الصف') ?></span>
                                </div>
                                <form method="post" action="actions.php" onsubmit="return confirm('إلغاء متابعة هذا الطالب؟');">
                                    <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                    <input type="hidden" name="action" value="unlink_student">
                                    <input type="hidden" name="student_id" value="<?= (int)$c['id'] ?>">
                                    <button class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">إلغاء المتابعة</button>
                                </form>
                            </div>
                            <a href="report.php?student=<?= (int)$c['id'] ?>" target="_blank" class="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">📄 تقرير الشهر</a>
                            <?= results_html(student_results((int)$c['id'])) ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- محتوى الأقسام الجديدة (تفتح في النافذة) -->
    <div id="sec-exams" class="hidden">
        <div class="py-6 px-2 sm:px-4">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-2">🧪 الامتحانات</h2>
            <p class="text-slate-600 mb-6">ملفات الامتحانات بتتحمّل من هنا، والامتحانات الإلكترونية بتتحل من بوابة الطالب.</p>
            <?php if (!$examAll): ?><p class="text-slate-500">لا توجد ملفات امتحانات حالياً.</p><?php endif; ?>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <?php foreach ($examAll as $ex): ?>
                    <div class="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col gap-3">
                        <div>
                            <span class="text-xs font-bold px-2 py-0.5 rounded <?= $ex['file_type'] === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700' ?>"><?= strtoupper(e($ex['file_type'])) ?></span>
                            <h3 class="font-extrabold mt-2"><?= e($ex['title']) ?></h3>
                            <p class="text-sm text-slate-500"><?= e($ex['subject']) ?> · <?= e($ex['stage']) ?></p>
                        </div>
                        <a href="<?= e($ex['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="text-center px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm">فتح / تحميل</a>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="mt-8">
                <?php if ($role === 'student'): ?>
                    <a href="student.php?sec=exams" class="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold">ادخل الامتحانات الإلكترونية ←</a>
                <?php else: ?>
                    <button type="button" onclick="closeSection(); openAuth('login','student')" class="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold">سجّل دخول الطالب للامتحانات الإلكترونية</button>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div id="sec-honor" class="hidden">
        <div class="py-6 px-2 sm:px-4">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-2">🏆 لوحة الشرف</h2>
            <p class="text-slate-600 mb-8">أوائل كل مرحلة حسب متوسط نتائج الاختبارات.</p>
            <div class="grid md:grid-cols-3 gap-6">
                <?php foreach (STAGES as $stName): $list = $honorBy[$stName] ?? []; ?>
                    <div class="bg-white rounded-2xl p-5 border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-4"><?= e($stName) ?></h3>
                        <?php if (!$list): ?><p class="text-sm text-slate-500">لا توجد نتائج بعد.</p><?php endif; ?>
                        <ol class="space-y-3">
                            <?php foreach ($list as $pos => $hp): ?>
                                <li class="flex items-center justify-between gap-3">
                                    <span class="font-bold"><?= ['🥇', '🥈', '🥉'][$pos] ?? ($pos + 1) . '.' ?> <?= e($hp['name']) ?></span>
                                    <span class="text-sm font-bold text-emerald-700"><?= e((string)$hp['avg']) ?>%</span>
                                </li>
                            <?php endforeach; ?>
                        </ol>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div id="sec-schedule" class="hidden">
        <div class="py-6 px-2 sm:px-4">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-6">📅 الجدول الدراسي</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <?php foreach (STAGES as $i => $stName): ?>
                    <div class="bg-white rounded-2xl p-5 border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-3"><?= e($stName) ?></h3>
                        <?php if (trim($schedules[$i]) === ''): ?>
                            <p class="text-sm text-slate-500">لم يُضف الجدول بعد.</p>
                        <?php else: ?>
                            <div class="text-sm text-slate-700 leading-relaxed whitespace-pre-line"><?= e($schedules[$i]) ?></div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div id="sec-faq" class="hidden">
        <div class="py-6 px-2 sm:px-4 max-w-3xl">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-6">❓ الأسئلة الشائعة</h2>
            <div class="space-y-3">
                <details class="bg-white rounded-xl p-4 border border-slate-200"><summary class="font-bold cursor-pointer">إزاي أسجل حساب؟</summary><p class="mt-3 text-sm text-slate-600">من زرار الدخول اختار "حساب جديد"، وبعدين اختار طالب أو ولي أمر وعبّي البيانات.</p></details>
                <details class="bg-white rounded-xl p-4 border border-slate-200"><summary class="font-bold cursor-pointer">إيه كود الربط؟</summary><p class="mt-3 text-sm text-slate-600">كود من 6 أحرف بيظهر في حساب الطالب، وولي الأمر يدخله في بوابته عشان يتابع نتايج ابنه.</p></details>
                <details class="bg-white rounded-xl p-4 border border-slate-200"><summary class="font-bold cursor-pointer">الامتحانات بتتصحح إزاي؟</summary><p class="mt-3 text-sm text-slate-600">الامتحانات الإلكترونية بتتصحح فوراً وبتتسجل في نتايجك. كل امتحان بيتحل مرة واحدة.</p></details>
                <details class="bg-white rounded-xl p-4 border border-slate-200"><summary class="font-bold cursor-pointer">ليه مش شايف دروس صفي؟</summary><p class="mt-3 text-sm text-slate-600">الدروس بتظهر حسب الصف اللي اخترته عند التسجيل. لو فيه غلط، تواصل معنا وهنعدله.</p></details>
                <details class="bg-white rounded-xl p-4 border border-slate-200"><summary class="font-bold cursor-pointer">نسيت كلمة المرور؟</summary><p class="mt-3 text-sm text-slate-600">ابعت لنا من قسم تواصل معنا بالبريد المسجل، والإدارة هتساعدك.</p></details>
            </div>
        </div>
    </div>

    <div id="sec-level" class="hidden">
        <div class="py-6 px-2 sm:px-4 max-w-3xl">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-6">📊 اختبر مستواك</h2>
            <?php if ($role === 'student' && $myAvg !== null): ?>
                <div class="bg-white rounded-2xl p-6 border border-slate-200 text-center">
                    <div class="text-sm text-slate-500">متوسطك في الاختبارات</div>
                    <div class="text-5xl font-extrabold text-emerald-700 my-2"><?= e((string)$myAvg) ?>%</div>
                    <span class="inline-block px-4 py-1.5 rounded-full font-extrabold <?= $myLevelCls ?>">مستواك: <?= e($myLevelName) ?></span>
                </div>
            <?php elseif ($role === 'student'): ?>
                <p class="text-slate-600">لسه مفيش نتايج اختبارات ليك. ادخل الامتحانات الإلكترونية، ومستواك هيتحدد بعد أول امتحان.</p>
            <?php else: ?>
                <p class="text-slate-600 mb-4">سجّل دخول كطالب عشان تشوف مستواك بعد الامتحانات.</p>
                <button type="button" onclick="closeSection(); openAuth('login','student')" class="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">سجّل دخول الطالب</button>
            <?php endif; ?>
            <div class="mt-8 bg-white rounded-2xl p-5 border border-slate-200 text-sm space-y-2">
                <div class="font-extrabold mb-2">مقياس المستوى</div>
                <div>ممتاز: 90% فأكثر</div>
                <div>جيد جداً: من 80% لأقل من 90%</div>
                <div>جيد: من 65% لأقل من 80%</div>
                <div>مقبول: من 50% لأقل من 65%</div>
                <div>يحتاج دعم: أقل من 50%</div>
            </div>
        </div>
    </div>

    <div id="sec-contact" class="hidden">
        <div class="py-6 px-2 sm:px-4 max-w-xl">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-2">📞 تواصل معنا</h2>
            <p class="text-slate-600 mb-6">اكتب رسالتك وهتوصل للإدارة مباشرة.</p>
            <form method="post" action="actions.php" class="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="send_message">
                <input name="name" required maxlength="100" placeholder="اسمك" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200">
                <input type="email" name="email" required placeholder="بريدك الإلكتروني" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200">
                <textarea name="message" required maxlength="2000" rows="5" placeholder="اكتب رسالتك" class="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200"></textarea>
                <button class="w-full py-3 rounded-xl gradient-primary text-white font-bold">إرسال الرسالة</button>
            </form>
        </div>
    </div>

    <!-- نافذة القسم -->
    <div id="sectionModal" class="modal" style="z-index:55">
        <div class="bg-slate-50 rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto relative">
            <div class="sticky top-0 z-10 flex justify-end p-4 bg-slate-50/90 backdrop-blur">
                <button type="button" onclick="closeSection()" class="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition">إغلاق ✕</button>
            </div>
            <div id="sectionModalBody" class="px-2 sm:px-6 pb-8"></div>
        </div>
    </div>

    <!-- تنبيهات -->
    <div id="notificationModal" class="modal" style="z-index:60">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <div id="notifIcon" class="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">✨</div>
            <h3 id="notifTitle" class="text-xl font-extrabold text-slate-900 mb-2">تنبيه</h3>
            <p id="notifText" class="text-slate-600 text-sm mb-6 leading-relaxed"></p>
            <button onclick="closeModal('notificationModal')" class="w-full py-3 rounded-xl gradient-primary text-white font-bold shadow hover:opacity-95 transition">حسناً</button>
        </div>
    </div>

    <script>
        const CSRF     = <?= json_encode($CSRF) ?>;
        const GRADE_YEARS = <?= json_encode(GRADE_YEARS, JSON_UNESCAPED_UNICODE) ?>;
        const IS_ADMIN = <?= json_encode($isAdmin) ?>;
        const ROLE     = <?= json_encode($role) ?>;
        const FLASH    = <?= json_encode($flash, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>;

        function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('open'); }
        function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
        document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', ev => { if (ev.target === m) m.classList.remove('open'); }));

        function showNotification(title, text, ok = true) {
            document.getElementById('notifTitle').textContent = title;
            document.getElementById('notifText').textContent = text;
            document.getElementById('notifIcon').textContent = ok ? '✨' : '⚠️';
            openModal('notificationModal');
        }

        function switchAuth(mode) {
            const isLogin = mode === 'login';
            document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
            document.getElementById('registerForm').classList.toggle('hidden', isLogin);
            document.getElementById('roleToggle').classList.toggle('hidden', isLogin);
            document.getElementById('authTitle').textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
            const on = 'bg-white shadow text-emerald-700', off = 'text-slate-500';
            document.getElementById('tabLogin').className = 'py-2.5 rounded-lg font-bold transition ' + (isLogin ? on : off);
            document.getElementById('tabRegister').className = 'py-2.5 rounded-lg font-bold transition ' + (!isLogin ? on : off);
        }

        function setAuthRole(role) {
            document.getElementById('regRole').value = role;
            const isStudent = role === 'student';
            document.getElementById('gradeWrap').classList.toggle('hidden', !isStudent);
            document.getElementById('regStage').required = isStudent;
            document.getElementById('regYear').required = isStudent;
            const on = 'border-emerald-500 bg-emerald-50 text-emerald-800', off = 'border-slate-200 text-slate-600';
            document.getElementById('roleStudent').className = 'py-3 rounded-xl border-2 font-bold transition ' + (isStudent ? on : off);
            document.getElementById('roleParent').className = 'py-3 rounded-xl border-2 font-bold transition ' + (!isStudent ? on : off);
        }

        function fillYears() {
            const stage = document.getElementById('regStage').value;
            const yearSel = document.getElementById('regYear');
            yearSel.innerHTML = '';
            yearSel.add(new Option(stage === '' ? 'اختر المرحلة أولاً' : 'اختر السنة الدراسية', ''));
            if (stage !== '' && GRADE_YEARS[stage]) {
                GRADE_YEARS[stage].forEach((name, i) => yearSel.add(new Option(name, String(i))));
            }
        }

        function fillFilterYears(stageEl) {
            const st = stageEl.value;
            const sel = stageEl.form.querySelector('select[name="year"]');
            sel.innerHTML = '';
            sel.add(new Option(st === '' ? 'اختر المرحلة أولاً' : 'كل السنوات', ''));
            if (st !== '' && GRADE_YEARS[st]) {
                GRADE_YEARS[st].forEach(y => sel.add(new Option(y, y)));
            }
        }

        function openAuth(mode, role = 'student') {
            setAuthRole(role);
            switchAuth(mode);
            openModal('authModal');
        }

        function toggleChat() { document.getElementById('chatBox').classList.toggle('hidden'); }

        function addBubble(text, who) {
            const box = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.className = who === 'user'
                ? 'bg-emerald-600 text-white p-3 rounded-xl shadow-sm ml-auto max-w-[85%]'
                : 'bg-white p-3 rounded-xl shadow-sm border border-slate-100 max-w-[85%] text-slate-700';
            div.textContent = text;
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        }

        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text) return;
            addBubble(text, 'user');
            input.value = '';

            const fd = new FormData();
            fd.append('csrf', CSRF);
            fd.append('message', text);

            try {
                const res = await fetch('ask.php', { method: 'POST', body: fd, credentials: 'same-origin' });
                const raw = await res.text();
                let reply;
                try {
                    reply = JSON.parse(raw).reply;
                } catch (e) {
                    reply = raw.trim().startsWith('<')
                        ? 'الخادم رجّع صفحة بدل الرد (غالباً حماية الاستضافة بتمنع التطبيق). جرّب من المتصفح، أو كلّم الدعم.'
                        : 'رد غير متوقع من الخادم (رمز ' + res.status + ').';
                }
                addBubble(reply, 'bot');
            } catch (err) {
                addBubble('تعذر الوصول إلى الخادم. تحقق من اتصال الإنترنت.', 'bot');
            }
        }

        function initHeroCanvas() {
            const canvas = document.getElementById('heroCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let w = 0, h = 0, dots = [];

            function resize() {
                w = canvas.width = canvas.offsetWidth;
                h = canvas.height = canvas.offsetHeight;
                const count = Math.min(80, Math.floor((w * h) / 16000));
                dots = Array.from({ length: count }, () => ({
                    x: Math.random() * w, y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                    r: Math.random() * 2 + 1
                }));
            }
            resize();
            window.addEventListener('resize', resize);

            function frame() {
                ctx.clearRect(0, 0, w, h);
                for (const d of dots) {
                    d.x += d.vx; d.y += d.vy;
                    if (d.x < 0 || d.x > w) d.vx *= -1;
                    if (d.y < 0 || d.y > h) d.vy *= -1;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(251,191,36,0.75)';
                    ctx.fill();
                }
                for (let i = 0; i < dots.length; i++) {
                    for (let j = i + 1; j < dots.length; j++) {
                        const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
                        if (dist < 120) {
                            ctx.strokeStyle = 'rgba(45,212,191,' + ((1 - dist / 120) * 0.35) + ')';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(dots[i].x, dots[i].y);
                            ctx.lineTo(dots[j].x, dots[j].y);
                            ctx.stroke();
                        }
                    }
                }
                requestAnimationFrame(frame);
            }
            frame();
        }

        const ROBOT_PHRASES = [
            'انت أقدر مما تتخيل 💪',
            'كل درس بتذاكره بيقربك من حلمك ✨',
            'خطوة صغيرة كل يوم بتعمل فرق كبير 🚀',
            'ركّز وإنت هتوصل 🎯',
            'الفشل مش نهاية، ده مجرد درس جديد 🌱',
            'العلم نور، وانت الشعلة 🔥',
            'ابدأ دلوقتي، والمستقبل مستنيك 🌟',
            'اتعلّم حاجة جديدة النهارده 📚'
        ];
        let robotIdx = 0;

        function showPhrase() {
            if (window.speechSynthesis && window.speechSynthesis.speaking) return;
            if (welcomeBubbleActive) return;
            const bubble = document.getElementById('robotBubble');
            const text = document.getElementById('robotText');
            if (!bubble || !text) return;
            bubble.classList.add('fade');
            setTimeout(() => {
                text.textContent = ROBOT_PHRASES[robotIdx % ROBOT_PHRASES.length];
                robotIdx++;
                bubble.classList.remove('fade');
            }, 350);
        }

        function initRobot() {
            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!reduce) setInterval(showPhrase, 6000);
        }

        // موسيقى تحفيزية مولّدة في المتصفح (بدون ملفات صوت، وبدون مشاكل حقوق)
        let audioCtx = null, musicOn = false, schedulerId = null, nextNoteTime = 0, stepCount = 0;
        const MUSIC_BPM = 112;
        const STEP_SEC = 60 / MUSIC_BPM / 4;
        const MELODY = [523.25, 659.25, 783.99, 659.25, 698.46, 783.99, 880.00, 783.99];

        function kick(t) {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.frequency.setValueAtTime(130, t);
            o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
            g.gain.setValueAtTime(0.8, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.connect(g).connect(audioCtx.destination);
            o.start(t); o.stop(t + 0.22);
        }

        function hat(t) {
            const len = 0.04, buf = audioCtx.createBuffer(1, audioCtx.sampleRate * len, audioCtx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
            const src = audioCtx.createBufferSource(), g = audioCtx.createGain();
            src.buffer = buf; g.gain.value = 0.12;
            src.connect(g).connect(audioCtx.destination);
            src.start(t);
        }

        function pluck(freq, t) {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            o.connect(g).connect(audioCtx.destination);
            o.start(t); o.stop(t + 0.32);
        }

        function scheduleStep(step, t) {
            if (step % 4 === 0) kick(t);
            if (step % 2 === 0) hat(t);
            if (step % 2 === 0) pluck(MELODY[(step / 2) % MELODY.length], t);
        }

        function musicScheduler() {
            while (nextNoteTime < audioCtx.currentTime + 0.2) {
                scheduleStep(stepCount % 16, nextNoteTime);
                nextNoteTime += STEP_SEC;
                stepCount++;
            }
        }

        function toggleMusic() {
            const btn = document.getElementById('musicBtn');
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (musicOn) {
                clearInterval(schedulerId);
                schedulerId = null;
                musicOn = false;
                btn.textContent = '🎵 تشغيل الموسيقى';
            } else {
                nextNoteTime = audioCtx.currentTime + 0.05;
                stepCount = 0;
                schedulerId = setInterval(musicScheduler, 25);
                musicOn = true;
                btn.textContent = '⏸️ إيقاف الموسيقى';
            }
        }

        // ترحيب صوتي تلقائي عند دخول الصفحة
        const WELCOME_SCRIPT = [
            'مرحباً بكم في منصة عائلة حنيش التعليمية.',
            'هنا تتعلم. المنصة توفر لك الروابط المهمة التي تفيدك في العملية التعليمية.',
            'وتوفر لك أحدث الدروس والفيديوهات لجميع المواد، لكل مراحل التعليم الأساسي.',
            'وكلمتين تحفيزيين: أنت أقدر مما تتخيل، والنجاح يبدأ بخطوة.',
            'اتفضل، ابدأ دلوقتي!'
        ];

        let speechStarted = false;   // اتسمع الصوت فعلاً مرة
        let speechRunning = false;   // الترحيب شغال دلوقتي
        let arVoice = null;

        function pickArabicVoice() {
            const voices = window.speechSynthesis.getVoices();
            arVoice = voices.find(v => /^ar/i.test(v.lang)) || null;
            return arVoice;
        }
        if ('speechSynthesis' in window) {
            pickArabicVoice();
            window.speechSynthesis.onvoiceschanged = pickArabicVoice;
        }

        function setSpeakBtn(speaking) {
            const b = document.getElementById('speakBtn');
            if (b) b.textContent = speaking ? '⏹️ إيقاف الصوت' : '🔊 استمع للترحيب';
        }

        function setBubble(text) {
            const bubble = document.getElementById('robotBubble');
            const el = document.getElementById('robotText');
            if (!bubble || !el) return;
            bubble.classList.add('fade');
            setTimeout(() => {
                el.textContent = text;
                bubble.classList.remove('fade');
            }, 200);
        }

        function noAudio() {
            speechRunning = false;
            window.speechSynthesis.cancel();
            setSpeakBtn(false);
        }

        // ينطق الجمل واحدة ورا التانية، والجملة التالية بتبدأ بعد ما اللي قبلها تخلص
        function speakLine(i) {
            if (!speechRunning) return;
            if (i >= WELCOME_SCRIPT.length) {
                speechRunning = false;
                setSpeakBtn(false);
                setTimeout(showPhrase, 1500);
                return;
            }
            const line = WELCOME_SCRIPT[i];
            const u = new SpeechSynthesisUtterance(line);
            u.lang = arVoice.lang;
            u.voice = arVoice;
            u.rate = 0.95;
            u.pitch = 1.05;
            u.volume = 1;
            const started = Date.now();
            u.onstart = () => { speechStarted = true; setBubble(line); };
            u.onend = () => {
                if (!speechRunning) return;
                if (!speechStarted || Date.now() - started < 250) { noAudio(); return; }
                speakLine(i + 1);
            };
            u.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                if (e.error === 'not-allowed') { speechRunning = false; setSpeakBtn(false); return; }
                noAudio();
            };
            window.speechSynthesis.speak(u);
        }

        function startSpeech() {
            if (!('speechSynthesis' in window)) {
                setBubble('المتصفح ده مش بيدعم الصوت، جرّب كروم أو سفاري.');
                return;
            }
            if (!arVoice) {
                // الصوت العربي لسه بيتحمّل، ولو مش موجود نكتفي بالنص عشان ما يتقريش عربي بصوت إنجليزي
                pickArabicVoice();
                if (!arVoice) { setSpeakBtn(false); return; }
            }
            window.speechSynthesis.cancel();
            speechRunning = true;
            setSpeakBtn(true);
            setTimeout(() => speakLine(0), 150);
        }

        // زرار التحكم: تشغيل / إيقاف
        function speakServices() {
            if (speechRunning) {
                window.speechSynthesis.cancel();
                speechRunning = false;
                setSpeakBtn(false);
                return;
            }
            startSpeech();
        }

        // عبارات الترحيب بتظهر في فقاعة الروبوت، حتى لو الصوت مش شغال
        let welcomeBubbleActive = false;
        function playBubbleWelcome() {
            welcomeBubbleActive = true;
            let i = 0;
            const step = () => {
                if (speechStarted) { welcomeBubbleActive = false; return; }
                if (i < WELCOME_SCRIPT.length) {
                    setBubble(WELCOME_SCRIPT[i]);
                    i++;
                    setTimeout(step, 4200);
                } else {
                    welcomeBubbleActive = false;
                    setTimeout(showPhrase, 1500);
                }
            };
            step();
        }

        // المتصفح بيمنع الصوت قبل أول تفاعل، فبنجرب فوراً ولو اتمنع نستنى أول حركة من الزائر
        function autoWelcome() {
            if (!('speechSynthesis' in window)) return;
            const events = ['click', 'keydown', 'touchstart', 'pointerdown', 'scroll'];
            const cleanup = () => events.forEach(ev => window.removeEventListener(ev, onGesture, true));
            function onGesture(e) {
                if (e.target && e.target.closest && e.target.closest('#speakBtn, #musicBtn')) return;
                if (speechStarted) { cleanup(); return; }
                if (!speechRunning) startSpeech();
            }
            events.forEach(ev => window.addEventListener(ev, onGesture, true));
            startSpeech();
            playBubbleWelcome();
        }

        // أقسام المنصة تُفتح في نافذة بدل ما تظهر فوق بعض
        function openSection(id) {
            const src = document.getElementById(id);
            const body = document.getElementById('sectionModalBody');
            if (!src || !body) return;
            body.innerHTML = '';
            const clone = src.cloneNode(true);
            clone.classList.remove('hidden');
            clone.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));
            body.appendChild(clone);
            openModal('sectionModal');
        }

        function closeSection() {
            closeModal('sectionModal');
            document.getElementById('sectionModalBody').innerHTML = '';
        }

        function hideStackedSections() {
            ['lessons', 'notes', 'news', 'ministry'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });
        }

        // تحميل التطبيق على الموبايل (PWA)
        let deferredPrompt = null;
        const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallBtn();
        });
        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            const b = document.getElementById('installBtn');
            if (b) b.classList.add('hidden');
        });

        function showInstallBtn() {
            const b = document.getElementById('installBtn');
            if (b && !isStandalone) b.classList.remove('hidden');
        }

        function installApp() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.finally(() => { deferredPrompt = null; });
                return;
            }
            if (isIOS) {
                showNotification('تحميل التطبيق', 'على iPhone: اضغط زرار المشاركة (⬆️) في متصفح Safari، واختار "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).');
                return;
            }
            showNotification('تحميل التطبيق', 'من قايمة المتصفح (⋮) اختار "Install app" أو "تثبيت التطبيق" أو "Add to Home screen".');
        }

        function animateCounters() {
            document.querySelectorAll('.counter').forEach(el => {
                const target = parseInt(el.dataset.target, 10) || 0;
                const steps = 40;
                let i = 0;
                const timer = setInterval(() => {
                    i++;
                    el.textContent = Math.round(target * i / steps);
                    if (i >= steps) clearInterval(timer);
                }, 30);
            });
        }

        window.addEventListener('DOMContentLoaded', () => {
            setAuthRole('student');
            switchAuth('login');
            initHeroCanvas();
            initRobot();
            if (isIOS && !isStandalone) showInstallBtn();
            autoWelcome();

            const observer = new IntersectionObserver(entries => {
                entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('show'); observer.unobserve(en.target); } });
            }, { threshold: 0.12 });
            document.querySelectorAll('.reveal').forEach((el, idx) => {
                el.style.transitionDelay = (idx % 6) * 80 + 'ms';
                observer.observe(el);
            });

            const statsObserver = new IntersectionObserver(entries => {
                if (entries.some(en => en.isIntersecting)) { animateCounters(); statsObserver.disconnect(); }
            });
            const counterBox = document.querySelector('.counter');
            if (counterBox) statsObserver.observe(counterBox);

            hideStackedSections();
            const qs = new URLSearchParams(location.search);
            if (qs.has('stage') || qs.has('year')) openSection('lessons');
            if (ROLE === 'parent') openModal('dashboardModal');
            if (FLASH) showNotification(FLASH.title, FLASH.text, FLASH.ok);
        });
    </script>
</body>
</html>
