<?php
require_once __DIR__ . '/auth.php';

$me = current_user();
if (!$me || $me['role'] !== 'student') {
    flash('سجّل الدخول أولاً', 'هذه الصفحة لحسابات الطلاب فقط.', false);
    header('Location: index.php');
    exit;
}

$CSRF  = csrf_token();
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

$pdo   = db();
$uid   = (int)$me['id'];
$stage = stage_of_grade($me['grade']);

$sections = [
    'home'    => ['🏠', 'الرئيسية'],
    'lessons' => ['📚', 'الدروس'],
    'notes'   => ['📘', 'الملازم والمذكرات'],
    'plan'    => ['🎯', 'خطة المذاكرة'],
    'favs'    => ['⭐', 'المفضلة'],
    'cards'   => ['🃏', 'بطاقات المراجعة'],
    'exams'   => ['📝', 'الامتحانات'],
    'results' => ['📊', 'نتائجي'],
    'account' => ['👤', 'حسابي'],
];
$sec = $_GET['sec'] ?? 'home';
if (!isset($sections[$sec])) {
    $sec = 'home';
}

// النتائج والمستوى
$results = student_results($uid);
$sum = 0.0;
$n   = 0;
foreach ($results as $r) {
    if ((float)$r['max_score'] > 0) {
        $sum += (float)$r['score'] / (float)$r['max_score'] * 100;
        $n++;
    }
}
$avg = $n ? round($sum / $n, 1) : null;
[$lvl, $lvlCls] = level_info((float)($avg ?? 0));

// الدروس حسب المرحلة
$subjectFilter = trim((string)($_GET['subject'] ?? ''));
$lessons  = [];
$subjects = [];
if ($stage !== null) {
    $subjects = $pdo->prepare('SELECT DISTINCT subject FROM lessons WHERE ' . grade_exact_sql('lessons') . ' ORDER BY subject');
    $subjects->execute(exact_params((string)$me['grade']));
    $subjects = $subjects->fetchAll(PDO::FETCH_COLUMN);

    $sql = 'SELECT * FROM lessons WHERE ' . grade_exact_sql('lessons');
    $params = exact_params((string)$me['grade']);
    if ($subjectFilter !== '') {
        $sql .= ' AND subject = ?';
        $params[] = $subjectFilter;
    }
    $stmt = $pdo->prepare($sql . ' ORDER BY id DESC');
    $stmt->execute($params);
    $lessons = $stmt->fetchAll();
}

// الامتحانات الخاصة بالمرحلة مع حالة كل امتحان للطالب
$quizzes = [];
if ($stage !== null) {
    $stmt = $pdo->prepare('SELECT q.id, q.title, q.subject, a.score, a.total,
                                  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS qcount
                           FROM quizzes q
                           LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.student_id = ?
                           WHERE ' . grade_exact_sql('q') . ' ORDER BY q.id DESC');
    $stmt->execute(array_merge([$uid], exact_params((string)$me['grade'])));
    $quizzes = $stmt->fetchAll();
}

// ملفات الامتحانات (PDF / Word) لمرحلة الطالب
$examFiles = [];
if ($stage !== null) {
    $stmt = $pdo->prepare('SELECT * FROM exam_files WHERE ' . grade_exact_sql('exam_files') . ' ORDER BY id DESC');
    $stmt->execute(exact_params((string)$me['grade']));
    $examFiles = $stmt->fetchAll();
}

// الملازم والمذكرات لصف الطالب
$notesList = [];
if ($stage !== null) {
    $stmt = $pdo->prepare('SELECT * FROM notes WHERE ' . grade_exact_sql('notes') . ' ORDER BY id DESC');
    $stmt->execute(exact_params((string)$me['grade']));
    $notesList = $stmt->fetchAll();
}

// خطة المذاكرة والمفضلة والنقاط
$tasks = $pdo->prepare('SELECT * FROM study_tasks WHERE user_id = ? ORDER BY done ASC, due_date ASC, id ASC');
$tasks->execute([$uid]);
$tasks = $tasks->fetchAll();
$favSet = [];
$favRows = $pdo->prepare('SELECT item_type, item_id FROM favorites WHERE user_id = ?');
$favRows->execute([$uid]);
foreach ($favRows->fetchAll() as $fr) { $favSet[$fr['item_type'] . ':' . $fr['item_id']] = true; }
$favLessons = $pdo->prepare("SELECT l.* FROM lessons l JOIN favorites f ON f.item_id = l.id AND f.item_type = 'lesson' WHERE f.user_id = ? ORDER BY l.id DESC");
$favLessons->execute([$uid]);
$favLessons = $favLessons->fetchAll();
$favNotes = $pdo->prepare("SELECT n.* FROM notes n JOIN favorites f ON f.item_id = n.id AND f.item_type = 'note' WHERE f.user_id = ? ORDER BY n.id DESC");
$favNotes->execute([$uid]);
$favNotes = $favNotes->fetchAll();
$pts = user_points($uid);

// بطاقات المراجعة
$decks = $pdo->prepare('SELECT deck, COUNT(*) AS cnt FROM flashcards WHERE user_id = ? GROUP BY deck ORDER BY deck');
$decks->execute([$uid]);
$decks = $decks->fetchAll();
$reviewDeck = mb_substr(trim((string)($_GET['deck'] ?? '')), 0, 100);
$curCard = null;
if ($reviewDeck !== '') {
    $cq = $pdo->prepare('SELECT * FROM flashcards WHERE user_id = ? AND deck = ? ORDER BY box ASC, RAND() LIMIT 1');
    $cq->execute([$uid, $reviewDeck]);
    $curCard = $cq->fetch() ?: null;
}

// امتحان مفتوح للإجابة
$openQuiz = null;
$openQuestions = [];
if ($sec === 'exams' && isset($_GET['quiz'])) {
    $qid = (int)$_GET['quiz'];
    foreach ($quizzes as $q) {
        if ((int)$q['id'] === $qid && $q['score'] === null && (int)$q['qcount'] > 0) {
            $openQuiz = $q;
            $stmt = $pdo->prepare('SELECT id, question, opt1, opt2, opt3, opt4 FROM quiz_questions WHERE quiz_id = ? ORDER BY id');
            $stmt->execute([$qid]);
            $openQuestions = $stmt->fetchAll();
            break;
        }
    }
}

// إعلانات وأخبار
$announce = $pdo->query("SELECT * FROM news WHERE type='announcement' AND " . publish_clause() . " ORDER BY pinned DESC, id DESC LIMIT 3")->fetchAll();
$news     = $pdo->query("SELECT * FROM news WHERE type='news' AND " . publish_clause() . " ORDER BY pinned DESC, id DESC LIMIT 3")->fetchAll();

$availableQuizzes = array_values(array_filter($quizzes, fn($q) => $q['score'] === null));
$nextQuiz = $availableQuizzes[0] ?? null;
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>بوابة الطالب - <?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; }
        .fade-in { animation: fadeIn .5s ease both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    </style>
    <?= pwa_head() ?>
    <?= theme_assets() ?>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen">

<header class="bg-gradient-to-l from-emerald-700 via-teal-700 to-blue-800 text-white shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">🎒</div>
            <div>
                <div class="font-extrabold text-lg leading-tight">أهلاً <?= e($me['name']) ?></div>
                <div class="text-xs text-emerald-100"><?= e($me['grade'] ?: 'لم يحدد الصف') ?></div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <a href="teacher.php" class="px-4 py-2 rounded-xl bg-white text-emerald-700 font-extrabold text-sm shadow hover:scale-105 transition"><span class="inline-flex items-center gap-2"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#mg)"/><circle cx="12" cy="10" r="4.6" fill="#f7d3b1"/><path d="M6.5 20 C7 15.5 9 14.5 12 14.5 C15 14.5 17 15.5 17.5 20 Z" fill="#1e3a8a"/><circle cx="10.4" cy="9.6" r=".9" fill="#0f172a"/><circle cx="13.6" cy="9.6" r=".9" fill="#0f172a"/></svg>مستر يونس</span></a>
            <?= theme_button() ?>
            <a href="index.php" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition">الموقع</a>
            <form method="post" action="actions.php">
                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                <input type="hidden" name="action" value="logout">
                <button class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold transition">خروج</button>
            </form>
        </div>
    </div>
</header>

<div class="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-4 gap-6">

    <aside class="lg:col-span-1">
        <nav class="bg-white rounded-2xl shadow border border-slate-200 p-3 flex lg:flex-col gap-2 overflow-x-auto">
            <?php foreach ($sections as $key => [$icon, $label]): ?>
                <a href="student.php?sec=<?= $key ?>"
                   class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition
                          <?= $sec === $key ? 'bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100' ?>">
                    <span class="text-xl"><?= $icon ?></span> <?= $label ?>
                </a>
            <?php endforeach; ?>
        </nav>
    </aside>

    <main class="lg:col-span-3 space-y-6">

        <?php if ($flash): ?>
            <div class="fade-in rounded-2xl px-5 py-4 font-bold <?= $flash['ok'] ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200' ?>">
                <?= e($flash['title']) ?>: <span class="font-normal"><?= e($flash['text']) ?></span>
            </div>
        <?php endif; ?>

        <?php if ($sec === 'home'): ?>
            <section class="fade-in space-y-6">
                <div class="bg-gradient-to-l from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div class="text-sm opacity-90">نقاطك</div>
                        <div class="text-4xl font-extrabold"><?= (int)$pts['points'] ?> ⭐</div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <?php foreach ($pts['badges'] as $bd): ?>
                            <span class="px-3 py-1.5 rounded-full bg-white/25 text-sm font-bold"><?= e($bd) ?></span>
                        <?php endforeach; ?>
                        <?php if (!$pts['badges']): ?><span class="text-sm opacity-90">ابدأ مذاكرتك واكسب شارات!</span><?php endif; ?>
                    </div>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow">
                        <div class="text-sm opacity-90">الدروس المتاحة</div>
                        <div class="text-3xl font-extrabold mt-1"><?= $stage ? count($lessons) : 0 ?></div>
                    </div>
                    <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
                        <div class="text-sm opacity-90">امتحانات متاحة</div>
                        <div class="text-3xl font-extrabold mt-1"><?= count($availableQuizzes) ?></div>
                    </div>
                    <div class="rounded-2xl p-5 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow">
                        <div class="text-sm opacity-90">المتوسط</div>
                        <div class="text-3xl font-extrabold mt-1"><?= $avg !== null ? $avg . '%' : '—' ?></div>
                    </div>
                    <div class="rounded-2xl p-5 bg-white shadow border border-slate-200">
                        <div class="text-sm text-slate-500">مستواك</div>
                        <div class="mt-2"><span class="px-3 py-1 rounded-full font-extrabold text-sm <?= $lvlCls ?>"><?= e($lvl) ?></span></div>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-4">📢 الإعلانات</h3>
                        <?php if (!$announce): ?><p class="text-slate-500 text-sm">لا توجد إعلانات حالياً.</p><?php endif; ?>
                        <div class="space-y-3">
                            <?php foreach ($announce as $a): ?>
                                <div class="rounded-xl p-4 bg-amber-50 border border-amber-200">
                                    <div class="font-bold"><?= e($a['title']) ?></div>
                                    <p class="text-sm text-slate-600 mt-1"><?= e($a['body']) ?></p>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h3 class="font-extrabold text-lg mb-4">📰 أخبار المنصة</h3>
                        <?php if (!$news): ?><p class="text-slate-500 text-sm">لا توجد أخبار حالياً.</p><?php endif; ?>
                        <div class="space-y-3">
                            <?php foreach ($news as $nw): ?>
                                <div class="rounded-xl p-4 bg-slate-50 border border-slate-200">
                                    <div class="font-bold"><?= e($nw['title']) ?></div>
                                    <p class="text-sm text-slate-600 mt-1"><?= e($nw['body']) ?></p>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <?php if ($nextQuiz): ?>
                    <div class="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div class="font-extrabold text-lg">عندك امتحان جديد 📝</div>
                            <div class="text-sm text-blue-100"><?= e($nextQuiz['title']) ?></div>
                        </div>
                        <a href="student.php?sec=exams&quiz=<?= (int)$nextQuiz['id'] ?>" class="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold hover:bg-blue-50 transition">ابدأ الآن</a>
                    </div>
                <?php endif; ?>
            </section>

        <?php elseif ($sec === 'lessons'): ?>
            <?php foreach ($lessons as $_l) { track_lesson_view((int)$_l['id']); } ?>
            <section class="fade-in space-y-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h2 class="text-2xl font-extrabold mb-1">📚 دروسك</h2>
                    <p class="text-sm text-slate-500 mb-4"><?= $stage ? e($stage) : 'حدّد صفك الدراسي لتظهر لك الدروس المناسبة' ?></p>
                    <?php if ($stage !== null): ?>
                        <form method="get" action="student.php" class="flex flex-wrap gap-3">
                            <input type="hidden" name="sec" value="lessons">
                            <select name="subject" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold">
                                <option value="">كل المواد</option>
                                <?php foreach ($subjects as $sub): ?>
                                    <option value="<?= e($sub) ?>" <?= $subjectFilter === $sub ? 'selected' : '' ?>><?= e($sub) ?></option>
                                <?php endforeach; ?>
                            </select>
                            <button class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">تصفية</button>
                        </form>
                    <?php endif; ?>
                </div>

                <div class="grid sm:grid-cols-2 gap-5">
                    <?php if ($stage !== null && !$lessons): ?>
                        <div class="sm:col-span-2 text-center text-slate-500 py-10 bg-white rounded-2xl border">لا توجد دروس لهذه المادة حالياً.</div>
                    <?php endif; ?>
                    <?php foreach ($lessons as $l): ?>
                        <div class="bg-white rounded-2xl p-5 shadow border border-slate-200 hover:shadow-xl transition space-y-4">
                            <div class="flex items-start justify-between gap-3"><h3 class="text-lg font-extrabold text-slate-900"><?= e($l['title']) ?></h3><?= fav_button('lesson', (int)$l['id'], $favSet) ?></div>
                            <?= video_embed_html($l['video']) ?>
                            <?= lesson_qa_html((int)$l['id'], $me) ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

        <?php elseif ($sec === 'notes'): ?>
            <section class="fade-in space-y-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h2 class="text-2xl font-extrabold mb-1">📘 الملازم والمذكرات</h2>
                    <p class="text-sm text-slate-500 mb-6"><?= $stage ? e($stage) : 'حدّد صفك الدراسي لتظهر لك الملازم المناسبة' ?></p>
                    <?php if ($stage !== null && !$notesList): ?>
                        <p class="text-slate-500">لا توجد ملازم لصفك حالياً.</p>
                    <?php endif; ?>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <?php foreach ($notesList as $nt): ?>
                            <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4">
                                <div>
                                    <span class="text-xs font-bold px-2 py-0.5 rounded <?= $nt['file_type'] === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700' ?>"><?= strtoupper(e($nt['file_type'])) ?></span>
                                    <div class="flex items-start justify-between gap-3"><h3 class="font-extrabold text-lg mt-2"><?= e($nt['title']) ?></h3><?= fav_button('note', (int)$nt['id'], $favSet) ?></div>
                                    <div class="text-sm text-slate-500"><?= e($nt['subject']) ?></div>
                                </div>
                                <a href="<?= e($nt['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition">فتح / تحميل</a>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </section>

        <?php elseif ($sec === 'plan'): ?>
            <section class="fade-in grid lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit space-y-4">
                    <h2 class="text-xl font-extrabold">🎯 أضف مهمة</h2>
                    <form method="post" action="actions.php" class="space-y-3">
                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                        <input type="hidden" name="action" value="add_task">
                        <input name="title" required maxlength="200" placeholder="مثال: مراجعة الباب الثالث في الفيزياء" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <input type="date" name="due_date" value="<?= date('Y-m-d') ?>" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <button class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">إضافة للخطة</button>
                    </form>
                    <div class="text-sm text-slate-600 border-t border-slate-200 pt-4">
                        المهام المكتملة: <b><?= (int)$pts['done'] ?></b> · كل مهمة بتدي 10 نقاط
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <?php
                    $today = date('Y-m-d');
                    $weekEnd = date('Y-m-d', strtotime('+7 days'));
                    $groups = ['late' => ['⏰ متأخرة', []], 'today' => ['📌 اليوم', []], 'week' => ['🗓️ هذا الأسبوع', []], 'later' => ['🔜 لاحقاً', []], 'done' => ['✅ مكتملة', []]];
                    foreach ($tasks as $tk) {
                        if ($tk['done']) { $g = 'done'; }
                        elseif ($tk['due_date'] < $today) { $g = 'late'; }
                        elseif ($tk['due_date'] === $today) { $g = 'today'; }
                        elseif ($tk['due_date'] <= $weekEnd) { $g = 'week'; }
                        else { $g = 'later'; }
                        $groups[$g][1][] = $tk;
                    }
                    ?>
                    <?php if (!$tasks): ?>
                        <div class="bg-white rounded-2xl p-6 border text-slate-500 text-center">خطتك فاضية. ابدأ بأول مهمة من الجنب.</div>
                    <?php endif; ?>
                    <?php foreach ($groups as $gk => $grp): if (!$grp[1]) continue; ?>
                        <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                            <h3 class="font-extrabold text-lg mb-4"><?= $grp[0] ?> (<?= count($grp[1]) ?>)</h3>
                            <div class="space-y-2">
                                <?php foreach ($grp[1] as $tk): ?>
                                    <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <form method="post" action="actions.php">
                                                <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                                <input type="hidden" name="action" value="toggle_task">
                                                <input type="hidden" name="id" value="<?= (int)$tk['id'] ?>">
                                                <button title="تم / رجوع" class="w-7 h-7 rounded-lg border-2 border-emerald-500 flex items-center justify-center text-emerald-600 font-bold"><?= $tk['done'] ? '✓' : '' ?></button>
                                            </form>
                                            <div class="min-w-0">
                                                <div class="font-bold text-sm <?= $tk['done'] ? 'line-through text-slate-400' : '' ?> truncate"><?= e($tk['title']) ?></div>
                                                <div class="text-xs text-slate-500"><?= e($tk['due_date']) ?></div>
                                            </div>
                                        </div>
                                        <form method="post" action="actions.php" onsubmit="return confirm('حذف المهمة؟');">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="delete_task">
                                            <input type="hidden" name="id" value="<?= (int)$tk['id'] ?>">
                                            <button class="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                        </form>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

        <?php elseif ($sec === 'favs'): ?>
            <section class="fade-in space-y-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h2 class="text-2xl font-extrabold mb-4">⭐ الدروس المفضلة</h2>
                    <?php if (!$favLessons): ?><p class="text-slate-500">لسه ما ضفتش دروس للمفضلة. اضغط ☆ جنب أي درس.</p><?php endif; ?>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <?php foreach ($favLessons as $fl): ?>
                            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                <div class="flex items-start justify-between gap-3"><h3 class="font-extrabold"><?= e($fl['title']) ?></h3><?= fav_button('lesson', (int)$fl['id'], $favSet) ?></div>
                                <?= video_embed_html($fl['video']) ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h2 class="text-2xl font-extrabold mb-4">⭐ الملازم المفضلة</h2>
                    <?php if (!$favNotes): ?><p class="text-slate-500">مفيش ملازم في المفضلة.</p><?php endif; ?>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <?php foreach ($favNotes as $fn): ?>
                            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                                <div class="min-w-0"><div class="font-extrabold truncate"><?= e($fn['title']) ?></div><div class="text-xs text-slate-500"><?= e($fn['subject']) ?></div></div>
                                <div class="flex items-center gap-2"><a href="<?= e($fn['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">فتح</a><?= fav_button('note', (int)$fn['id'], $favSet) ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </section>

        <?php elseif ($sec === 'cards'): ?>
            <section class="fade-in grid lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 h-fit space-y-4">
                    <h2 class="text-xl font-extrabold">➕ بطاقة جديدة</h2>
                    <form method="post" action="actions.php" class="space-y-3">
                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                        <input type="hidden" name="action" value="add_card">
                        <input name="deck" required maxlength="100" placeholder="اسم المجموعة (مثال: الفيزياء - الباب الأول)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <textarea name="front" required maxlength="1000" rows="3" placeholder="السؤال (الوجه الأول)" class="w-full px-3 py-2 rounded-xl border border-slate-200"></textarea>
                        <textarea name="back" required maxlength="1000" rows="3" placeholder="الإجابة (الوجه التاني)" class="w-full px-3 py-2 rounded-xl border border-slate-200"></textarea>
                        <button class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">إضافة البطاقة</button>
                    </form>
                </div>

                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h2 class="text-xl font-extrabold mb-4">🗂️ مجموعاتك</h2>
                        <?php if (!$decks): ?><p class="text-slate-500 text-sm">لسه ما ضفتش بطاقات. ابدأ من الفورم جنبك.</p><?php endif; ?>
                        <div class="flex flex-wrap gap-3">
                            <?php foreach ($decks as $dk): ?>
                                <a href="student.php?sec=cards&deck=<?= urlencode($dk['deck']) ?>" class="px-4 py-3 rounded-xl border-2 font-bold <?= $reviewDeck === $dk['deck'] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300' ?>">
                                    <?= e($dk['deck']) ?> <span class="text-xs text-slate-500">(<?= (int)$dk['cnt'] ?>)</span>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <?php if ($reviewDeck !== ''): ?>
                        <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 text-center space-y-5">
                            <h3 class="font-extrabold text-lg">مراجعة: <?= e($reviewDeck) ?></h3>
                            <?php if ($curCard): ?>
                                <div class="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-slate-200 text-xl font-extrabold min-h-[140px] flex items-center justify-center"><?= e($curCard['front']) ?></div>
                                <details class="rounded-2xl border border-slate-200 p-5">
                                    <summary class="cursor-pointer font-bold text-blue-700">اعرض الإجابة</summary>
                                    <p class="mt-4 text-lg"><?= e($curCard['back']) ?></p>
                                    <div class="flex justify-center gap-3 mt-6">
                                        <form method="post" action="actions.php">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="review_card">
                                            <input type="hidden" name="deck" value="<?= e($reviewDeck) ?>">
                                            <input type="hidden" name="id" value="<?= (int)$curCard['id'] ?>">
                                            <input type="hidden" name="result" value="again">
                                            <button class="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold">لسه محتاج أراجعها 🔁</button>
                                        </form>
                                        <form method="post" action="actions.php">
                                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                            <input type="hidden" name="action" value="review_card">
                                            <input type="hidden" name="deck" value="<?= e($reviewDeck) ?>">
                                            <input type="hidden" name="id" value="<?= (int)$curCard['id'] ?>">
                                            <input type="hidden" name="result" value="know">
                                            <button class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">عرفتها ✅</button>
                                        </form>
                                    </div>
                                </details>
                            <?php else: ?>
                                <p class="text-emerald-700 font-extrabold text-lg py-6">🎉 خلّصت المجموعة دي!</p>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($decks): ?>
                        <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                            <h3 class="font-extrabold mb-3">كل البطاقات</h3>
                            <p class="text-xs text-slate-500 mb-3">البطاقة اللي تعرفها بتظهر بعد وقت أطول، والبطاقة اللي ما عرفتهاش بتظهر تاني قريب.</p>
                            <?php
                            $allCards = $pdo->prepare('SELECT * FROM flashcards WHERE user_id = ? ORDER BY id DESC LIMIT 50');
                            $allCards->execute([$uid]);
                            foreach ($allCards->fetchAll() as $ac): ?>
                                <div class="flex items-start justify-between gap-3 py-2 border-t border-slate-100">
                                    <div class="min-w-0 text-sm"><b><?= e($ac['front']) ?></b> <span class="text-slate-500">— <?= e($ac['back']) ?></span> <span class="text-xs text-emerald-700">· صندوق <?= (int)$ac['box'] ?></span></div>
                                    <form method="post" action="actions.php" onsubmit="return confirm('حذف البطاقة؟');">
                                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                                        <input type="hidden" name="action" value="delete_card">
                                        <input type="hidden" name="id" value="<?= (int)$ac['id'] ?>">
                                        <button class="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
                                    </form>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </section>

        <?php elseif ($sec === 'exams'): ?>
            <section class="fade-in space-y-6">
                <?php if ($examFiles): ?>
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 mb-6">
                        <h2 class="text-xl font-extrabold mb-4">📄 ملفات الامتحانات</h2>
                        <div class="grid sm:grid-cols-2 gap-4">
                            <?php foreach ($examFiles as $ef): ?>
                                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                                    <div class="min-w-0">
                                        <span class="text-xs font-bold px-2 py-0.5 rounded <?= $ef['file_type'] === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700' ?>"><?= strtoupper(e($ef['file_type'])) ?></span>
                                        <div class="font-bold mt-1 truncate"><?= e($ef['title']) ?></div>
                                        <div class="text-xs text-slate-500"><?= e($ef['subject']) ?></div>
                                    </div>
                                    <a href="<?= e($ef['file_path']) ?>" target="_blank" rel="noopener noreferrer" class="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">فتح / تحميل</a>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <?php if ($openQuiz): ?>
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h2 class="text-2xl font-extrabold mb-1">📝 <?= e($openQuiz['title']) ?></h2>
                        <p class="text-sm text-slate-500 mb-6">المادة: <?= e($openQuiz['subject']) ?> · عدد الأسئلة: <?= count($openQuestions) ?></p>
                        <form method="post" action="actions.php" class="space-y-6">
                            <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                            <input type="hidden" name="action" value="submit_quiz">
                            <input type="hidden" name="quiz_id" value="<?= (int)$openQuiz['id'] ?>">
                            <?php foreach ($openQuestions as $i => $q): ?>
                                <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                                    <p class="font-extrabold mb-3"><?= $i + 1 ?>. <?= e($q['question']) ?></p>
                                    <div class="grid sm:grid-cols-2 gap-2">
                                        <?php for ($k = 1; $k <= 4; $k++): ?>
                                            <label class="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                                                <input type="radio" name="answers[<?= (int)$q['id'] ?>]" value="<?= $k ?>" required class="w-4 h-4">
                                                <span><?= e($q['opt' . $k]) ?></span>
                                            </label>
                                        <?php endfor; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                            <button class="w-full py-4 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-extrabold text-lg shadow hover:opacity-95 transition">تسليم الامتحان ✅</button>
                        </form>
                    </div>
                <?php else: ?>
                    <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h2 class="text-2xl font-extrabold mb-4">📝 الامتحانات</h2>
                        <?php if ($stage === null): ?>
                            <p class="text-slate-500">حدّد صفك الدراسي أولاً لتظهر لك الامتحانات.</p>
                        <?php elseif (!$quizzes): ?>
                            <p class="text-slate-500">لا توجد امتحانات لمرحلتك حالياً.</p>
                        <?php endif; ?>
                        <div class="space-y-3">
                            <?php foreach ($quizzes as $q): ?>
                                <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                    <div>
                                        <div class="font-extrabold"><?= e($q['title']) ?></div>
                                        <div class="text-xs text-slate-500"><?= e($q['subject']) ?> · <?= (int)$q['qcount'] ?> سؤال</div>
                                    </div>
                                    <?php if ($q['score'] !== null): ?>
                                        <span class="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">تم · <?= (int)$q['score'] ?> / <?= (int)$q['total'] ?></span>
                                    <?php elseif ((int)$q['qcount'] > 0): ?>
                                        <a href="student.php?sec=exams&quiz=<?= (int)$q['id'] ?>" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition">ابدأ الامتحان</a>
                                    <?php else: ?>
                                        <span class="text-sm text-slate-400">لا توجد أسئلة بعد</span>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </section>

        <?php elseif ($sec === 'results'): ?>
            <section class="fade-in bg-white rounded-2xl p-6 shadow border border-slate-200">
                <h2 class="text-2xl font-extrabold mb-4">📊 نتائجي ومستواي</h2>
                <a href="report.php?student=<?= $uid ?>" target="_blank" class="inline-block mb-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">📄 تقرير الشهر</a>
                <?= results_html($results) ?>
            </section>

        <?php elseif ($sec === 'account'): ?>
            <section class="fade-in grid md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200 space-y-3">
                    <h2 class="text-xl font-extrabold mb-2">👤 بياناتي</h2>
                    <div class="text-sm"><span class="text-slate-500">الاسم:</span> <span class="font-bold"><?= e($me['name']) ?></span></div>
                    <div class="text-sm"><span class="text-slate-500">البريد:</span> <span class="font-bold"><?= e($me['email']) ?></span></div>
                    <div class="text-sm"><span class="text-slate-500">الصف:</span> <span class="font-bold"><?= e($me['grade'] ?: '—') ?></span></div>
                    <div class="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div class="text-sm font-bold text-slate-700">كود الربط مع ولي الأمر</div>
                        <div class="text-3xl font-extrabold tracking-widest text-emerald-700 mt-1"><?= e($me['link_code']) ?></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl p-6 shadow border border-slate-200">
                    <h2 class="text-xl font-extrabold mb-4">🔐 تغيير كلمة المرور</h2>
                    <form method="post" action="actions.php" class="space-y-3">
                        <input type="hidden" name="csrf" value="<?= $CSRF ?>">
                        <input type="hidden" name="action" value="change_user_password">
                        <input type="password" name="current" required placeholder="كلمة المرور الحالية" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <input type="password" name="new" required minlength="6" placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)" class="w-full px-3 py-2 rounded-xl border border-slate-200">
                        <button class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition">حفظ</button>
                    </form>
                </div>
            </section>
        <?php endif; ?>
    </main>
</div>
</body>
</html>