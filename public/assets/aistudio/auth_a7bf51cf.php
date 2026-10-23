<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function generate_link_code(): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $stmt = db()->prepare('SELECT 1 FROM users WHERE link_code = ?');
        $stmt->execute([$code]);
        $exists = (bool)$stmt->fetchColumn();
    } while ($exists);
    return $code;
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = db()->prepare('SELECT id, role, name, email, grade, link_code FROM users WHERE id = ?');
    $stmt->execute([(int)$_SESSION['user_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $row['grade'] = canonical_grade($row['grade']) ?? $row['grade'];
    return $row;
}

function linked_students(int $parentId): array
{
    $stmt = db()->prepare('SELECT u.id, u.name, u.grade FROM parent_links pl
                           JOIN users u ON u.id = pl.student_id
                           WHERE pl.parent_id = ?');
    $stmt->execute([$parentId]);
    return $stmt->fetchAll();
}

const PERMISSIONS = [
    'lessons' => 'الدروس',
    'news'    => 'الأخبار والإعلانات',
    'links'   => 'روابط تهمك',
    'users'   => 'المستخدمون',
    'site'    => 'واجهة الموقع',
    'grades'  => 'الدرجات والاختبارات',
    'exams'   => 'الامتحانات الإلكترونية',
    'channels' => 'القنوات والمراجعة',
    'notes'    => 'الملازم والمذكرات',
    'messages' => 'رسائل التواصل',
];

function current_staff(): ?array
{
    if (empty($_SESSION['staff_id'])) {
        return null;
    }
    $stmt = db()->prepare('SELECT id, name, email, permissions, is_owner, active FROM staff WHERE id = ?');
    $stmt->execute([(int)$_SESSION['staff_id']]);
    $s = $stmt->fetch();
    if (!$s || !(int)$s['active']) {
        unset($_SESSION['staff_id']);
        return null;
    }
    $s['perms']    = $s['permissions'] === '' ? [] : explode(',', $s['permissions']);
    $s['is_owner'] = (bool)$s['is_owner'];
    return $s;
}

function can(?array $staff, string $perm): bool
{
    if (!$staff) {
        return false;
    }
    if ($staff['is_owner']) {
        return true;
    }
    return in_array($perm, $staff['perms'], true);
}

function site_setting(string $key, string $default = ''): string
{
    $stmt = db()->prepare('SELECT v FROM site_settings WHERE k = ?');
    $stmt->execute([$key]);
    $v = $stmt->fetchColumn();
    return $v === false ? $default : (string)$v;
}

function set_site_setting(string $key, string $value): void
{
    db()->prepare('INSERT INTO site_settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)')
        ->execute([$key, $value]);
}

const GRADE_YEARS = [
    0 => ['الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي', 'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي'],
    1 => ['الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي'],
    2 => ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
];

function student_results(int $studentId): array
{
    $stmt = db()->prepare('SELECT subject, title, score, max_score, exam_date FROM exam_results
                           WHERE student_id = ? ORDER BY exam_date DESC, id DESC');
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function level_info(float $pct): array
{
    if ($pct >= 90) return ['ممتاز', 'bg-emerald-100 text-emerald-800'];
    if ($pct >= 80) return ['جيد جداً', 'bg-teal-100 text-teal-800'];
    if ($pct >= 65) return ['جيد', 'bg-blue-100 text-blue-800'];
    if ($pct >= 50) return ['مقبول', 'bg-amber-100 text-amber-800'];
    return ['يحتاج دعم', 'bg-red-100 text-red-800'];
}

function results_html(array $rows): string
{
    if (!$rows) {
        return '<div class="text-center text-slate-500 py-6 bg-white rounded-xl border border-slate-200">لا توجد نتائج اختبارات بعد.</div>';
    }

    $sum = 0.0;
    $n = 0;
    foreach ($rows as $r) {
        if ((float)$r['max_score'] > 0) {
            $sum += (float)$r['score'] / (float)$r['max_score'] * 100;
            $n++;
        }
    }
    $avg = $n ? $sum / $n : 0.0;
    [$lvl, $cls] = level_info($avg);

    $html = '<div class="flex flex-wrap items-center gap-3 mb-4">'
          . '<div class="px-4 py-2 rounded-xl font-extrabold ' . $cls . '">المستوى: ' . e($lvl) . '</div>'
          . '<div class="px-4 py-2 rounded-xl bg-slate-100 font-bold">المتوسط: ' . round($avg, 1) . '%</div>'
          . '<div class="px-4 py-2 rounded-xl bg-slate-100 font-bold">عدد الاختبارات: ' . count($rows) . '</div>'
          . '</div>';

    $html .= '<div class="overflow-x-auto"><table class="w-full text-sm text-right bg-white rounded-xl overflow-hidden">'
          . '<thead class="bg-slate-50 text-slate-600"><tr>'
          . '<th class="p-2">المادة</th><th class="p-2">الاختبار</th><th class="p-2">الدرجة</th><th class="p-2">النسبة</th><th class="p-2">التاريخ</th>'
          . '</tr></thead><tbody>';

    foreach ($rows as $r) {
        $sc  = (float)$r['score'];
        $max = (float)$r['max_score'];
        $pct = $max > 0 ? round($sc / $max * 100, 1) : 0;
        $html .= '<tr class="border-t border-slate-100">'
              . '<td class="p-2 font-bold">' . e($r['subject']) . '</td>'
              . '<td class="p-2">' . e($r['title']) . '</td>'
              . '<td class="p-2">' . e((string)$sc) . ' / ' . e((string)$max) . '</td>'
              . '<td class="p-2">' . e((string)$pct) . '%</td>'
              . '<td class="p-2 text-slate-500">' . e($r['exam_date']) . '</td>'
              . '</tr>';
    }
    return $html . '</tbody></table></div>';
}


// توحيد الكتابة العربية عشان المقارنة تبقى مرنة (أ/إ/آ، ة/ه، ى/ي، والمسافات)
function normalize_ar(string $s): string
{
    $s = str_replace(['أ', 'إ', 'آ', 'ٱ'], 'ا', $s);
    $s = str_replace('ة', 'ه', $s);
    $s = str_replace('ى', 'ي', $s);
    $s = preg_replace('/[\s()]+/u', ' ', $s);
    return trim((string)$s);
}

// يحوّل أي كتابة للصف (حتى لو مكتوب بشكل مختلف) لاسم الصف الرسمي، أو null لو مش معروف
function canonical_grade(?string $raw): ?string
{
    if ($raw === null || trim($raw) === '') {
        return null;
    }
    $n = normalize_ar($raw);
    foreach (GRADE_YEARS as $years) {
        foreach ($years as $y) {
            if (normalize_ar($y) === $n) {
                return $y;
            }
        }
    }
    $stageKey = str_contains($n, 'ابتدائ') ? 0
              : (str_contains($n, 'اعدادي') ? 1 : (str_contains($n, 'ثانوي') ? 2 : null));
    if ($stageKey === null) {
        return null;
    }
    $ordinals = ['الاول' => 0, 'الثاني' => 1, 'الثالث' => 2, 'الرابع' => 3, 'الخامس' => 4, 'السادس' => 5];
    foreach ($ordinals as $word => $idx) {
        if (str_contains($n, $word) && isset(GRADE_YEARS[$stageKey][$idx])) {
            return GRADE_YEARS[$stageKey][$idx];
        }
    }
    return null;
}

function grade_options_html(?string $selected): string
{
    $html = '<option value="">— بدون صف —</option>';
    foreach (GRADE_YEARS as $si => $years) {
        $html .= '<optgroup label="' . e(STAGES[$si]) . '">';
        foreach ($years as $y) {
            $html .= '<option value="' . e($y) . '"' . ($selected === $y ? ' selected' : '') . '>' . e($y) . '</option>';
        }
        $html .= '</optgroup>';
    }
    return $html;
}

function stage_of_grade(?string $grade): ?string
{
    $canon = canonical_grade($grade);
    if ($canon === null) {
        return null;
    }
    foreach (GRADE_YEARS as $si => $years) {
        if (in_array($canon, $years, true)) {
            return STAGES[$si];
        }
    }
    return null;
}

function live_filter_words(): array
{
    $raw = site_setting('live_filter_words', 'بث مباشر,مباشر,live');
    $words = array_map('trim', explode(',', $raw));
    return array_values(array_filter($words, fn($w) => $w !== ''));
}

function is_live_title(string $title, array $words): bool
{
    foreach ($words as $w) {
        if (mb_stripos($title, $w) !== false) {
            return true;
        }
    }
    return false;
}

// يرجع فيديوهات القناة من الـ RSS العام بدون مفتاح API
function fetch_channel_feed(string $channelId): array
{
    if (!function_exists('curl_init')) {
        return [];
    }
    $ch = curl_init('https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode($channelId));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $xml  = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($xml === false || $code !== 200) {
        return [];
    }

    libxml_use_internal_errors(true);
    $feed = simplexml_load_string((string)$xml);
    if ($feed === false) {
        return [];
    }

    $ytNs    = 'http://www.youtube.com/xml/schemas/2015';
    $mediaNs = 'http://search.yahoo.com/mrss/';
    $items = [];

    foreach ($feed->entry as $entry) {
        $yt    = $entry->children($ytNs);
        $media = $entry->children($mediaNs);
        $gm    = $media->group->children($mediaNs);

        $videoId = (string)$yt->videoId;
        if ($videoId === '') {
            continue;
        }
        $thumb = isset($gm->thumbnail) ? (string)$gm->thumbnail->attributes()['url'] : '';

        $items[] = [
            'video_id'    => $videoId,
            'title'       => (string)$entry->title,
            'description' => (string)$gm->description,
            'thumb'       => $thumb,
            'published'   => substr((string)$entry->published, 0, 10),
        ];
    }
    return $items;
}

function youtube_id(string $url): ?string
{
    if (preg_match('~(?:v=|youtu\.be/|embed/|shorts/)([A-Za-z0-9_-]{11})~', $url, $m)) {
        return $m[1];
    }
    return null;
}

// يعرض الفيديو داخل الصفحة: يوتيوب كمشغّل مدمج، وملفات MP4/WebM كمشغّل فيديو، وغير ذلك كرابط
function video_embed_html(string $url): string
{
    $yt = youtube_id($url);
    if ($yt !== null) {
        return '<div class="aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow">'
             . '<iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/' . e($yt) . '" '
             . 'title="فيديو الدرس" loading="lazy" allowfullscreen '
             . 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>'
             . '</div>';
    }
    if (preg_match('/\.(mp4|webm)(\?|$)/i', $url)) {
        return '<video class="w-full aspect-video rounded-xl bg-slate-900 shadow" controls preload="metadata" playsinline src="' . e($url) . '"></video>';
    }
    return '<a href="' . e($url) . '" target="_blank" rel="noopener noreferrer" '
         . 'class="block text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition">مشاهدة الشرح 📺</a>';
}

// ينشئ مجلد الرفع ويمنع تنفيذ ملفات PHP داخله
function ensure_upload_dir(string $dir): bool
{
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        return false;
    }
    $ht = $dir . '/.htaccess';
    if (!file_exists($ht)) {
        file_put_contents($ht, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|php5|phar)$\">\n    Require all denied\n</FilesMatch>\n");
    }
    return is_writable($dir);
}

function grade_flat_list(): array
{
    $out = [];
    foreach (GRADE_YEARS as $years) {
        foreach ($years as $y) {
            $out[] = $y;
        }
    }
    return $out;
}

// يرجع قائمة الصفوف بين صفين (شاملاً الطرفين)، أو null لو الاختيار غير صحيح
function grade_range(string $from, string $to): ?array
{
    $flat = grade_flat_list();
    $a = array_search($from, $flat, true);
    $b = array_search($to, $flat, true);
    if ($a === false || $b === false) {
        return null;
    }
    if ($a > $b) {
        [$a, $b] = [$b, $a];
    }
    return array_slice($flat, $a, $b - $a + 1);
}

// المحتوى ظاهر للصف المحدد (أو لمرحلة المحتوى القديم)
function item_visible_to(array $row, ?string $grade): bool
{
    if ($grade === null || $grade === '') {
        return false;
    }
    if (!empty($row['grades'])) {
        return in_array($grade, explode(',', $row['grades']), true);
    }
    return $row['stage'] === stage_of_grade($grade);
}

// شرط SQL: المحتوى الخاص بمرحلة الطالب (كل صفوف المرحلة)
function grade_visibility_sql(string $alias): string
{
    return "$alias.stage = ?";
}

function vis_params(string $grade, string $stage): array
{
    return [$stage];
}

// شرط SQL لفلتر السنة في الصفحة الرئيسية: الصف المحدد بالظبط (أو المحتوى القديم للمرحلة)
function grade_year_sql(string $alias): string
{
    return "((($alias.grades IS NOT NULL AND $alias.grades <> '') AND $alias.grades LIKE ?) "
         . "OR (($alias.grades IS NULL OR $alias.grades = '') AND $alias.stage = ?))";
}

function year_params(string $year, string $stage): array
{
    return ['%' . $year . '%', $stage];
}

// خانة واحدة: المرحلة كاملة (s0/s1/s2) أو صف محدد
function target_range(string $target): ?array
{
    if (preg_match('/^s([0-2])$/', $target, $m)) {
        return GRADE_YEARS[(int)$m[1]];
    }
    return grade_range($target, $target);
}

function grade_range_selects(): string
{
    $opts = '<optgroup label="المرحلة كاملة">';
    foreach (GRADE_YEARS as $si => $years) {
        $opts .= '<option value="s' . $si . '">كل ' . e(STAGES[$si]) . '</option>';
    }
    $opts .= '</optgroup>';
    foreach (GRADE_YEARS as $si => $years) {
        $opts .= '<optgroup label="' . e(STAGES[$si]) . '">';
        foreach ($years as $y) {
            $opts .= '<option value="' . e($y) . '">' . e($y) . '</option>';
        }
        $opts .= '</optgroup>';
    }
    return '<div><label class="block text-xs font-bold mb-1">المرحلة / الصف</label>'
         . '<select name="target" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">'
         . '<option value="">اختر</option>' . $opts . '</select></div>';
}


// ===== النسخ الاحتياطي =====
function build_sql_dump(): string
{
    $pdo = db();
    $out = "-- نسخة احتياطية " . date('Y-m-d H:i:s') . "\nSET FOREIGN_KEY_CHECKS=0;\n";
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) {
        $create = $pdo->query("SHOW CREATE TABLE `$t`")->fetch(PDO::FETCH_NUM)[1];
        $out .= "DROP TABLE IF EXISTS `$t`;\n" . $create . ";\n";
        $rows = $pdo->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $cols = implode('`, `', array_keys($row));
            $vals = implode(', ', array_map(fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), $row));
            $out .= "INSERT INTO `$t` (`$cols`) VALUES ($vals);\n";
        }
    }
    return $out . "SET FOREIGN_KEY_CHECKS=1;\n";
}

// ===== الوضع الليلي =====
function theme_assets(): string
{
    return <<<'HTML'
<style>
html.dark body { background: #0b1120 !important; color: #e2e8f0 !important; }
html.dark .bg-white { background-color: #111a2e !important; }
html.dark .bg-white\/90, html.dark .bg-white\/95 { background-color: rgba(17,26,46,.94) !important; }
html.dark .bg-slate-50 { background-color: #0f172a !important; }
html.dark .bg-slate-100 { background-color: #16213a !important; }
html.dark .bg-slate-50\/90 { background-color: rgba(15,23,42,.9) !important; }
html.dark .text-slate-900, html.dark .text-slate-800 { color: #f1f5f9 !important; }
html.dark .text-slate-700 { color: #cbd5e1 !important; }
html.dark .text-slate-600, html.dark .text-slate-500 { color: #94a3b8 !important; }
html.dark .border-slate-200, html.dark .border-slate-100 { border-color: #263247 !important; }
html.dark .svc-chip { background: #1e293b !important; color: #e2e8f0 !important; }
html.dark input, html.dark select, html.dark textarea { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }
html.dark details summary { color: #f1f5f9; }
</style>
<script>
(function () {
    if (localStorage.getItem('hanish_theme') === 'dark') document.documentElement.classList.add('dark');
})();
function toggleTheme() {
    const on = document.documentElement.classList.toggle('dark');
    localStorage.setItem('hanish_theme', on ? 'dark' : 'light');
}
</script>
HTML;
}

function theme_button(): string
{
    return '<button type="button" onclick="toggleTheme()" title="الوضع الليلي" class="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 font-bold text-sm hover:scale-105 transition">🌙</button>';
}

// ===== النقاط والشارات =====
function user_points(int $uid): array
{
    $pdo = db();
    $count = function (string $sql) use ($pdo, $uid): int {
        $st = $pdo->prepare($sql);
        $st->execute([$uid]);
        return (int)$st->fetchColumn();
    };
    $done  = $count('SELECT COUNT(*) FROM study_tasks WHERE user_id = ? AND done = 1');
    $quiz  = $count('SELECT COUNT(*) FROM quiz_attempts WHERE student_id = ?');
    $favs  = $count('SELECT COUNT(*) FROM favorites WHERE user_id = ?');
    $points = $done * 10 + $quiz * 20 + $favs * 2;

    $badges = [];
    if ($done >= 1)  $badges[] = '🌱 أول خطوة';
    if ($done >= 10) $badges[] = '🔥 مجتهد';
    if ($quiz >= 3)  $badges[] = '📝 بطل الامتحانات';
    if ($favs >= 5)  $badges[] = '⭐ صاحب مفضلة';
    if ($points >= 200) $badges[] = '💎 متفوق';

    return ['points' => $points, 'done' => $done, 'quizzes' => $quiz, 'favs' => $favs, 'badges' => $badges];
}

// ===== المفضلة =====
function fav_button(string $type, int $id, array $favSet): string
{
    $on   = isset($favSet[$type . ':' . $id]);
    $sec  = $type === 'lesson' ? 'lessons' : 'notes';
    return '<form method="post" action="actions.php" class="shrink-0">'
         . '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">'
         . '<input type="hidden" name="action" value="toggle_favorite">'
         . '<input type="hidden" name="type" value="' . e($type) . '">'
         . '<input type="hidden" name="id" value="' . $id . '">'
         . '<input type="hidden" name="sec" value="' . $sec . '">'
         . '<button type="submit" title="المفضلة" class="text-2xl leading-none hover:scale-110 transition">' . ($on ? '⭐' : '☆') . '</button>'
         . '</form>';
}


// ===== الإحصائيات =====
function track_visit(): void
{
    try {
        db()->prepare('INSERT INTO page_views (day, views) VALUES (?, 1) ON DUPLICATE KEY UPDATE views = views + 1')
            ->execute([date('Y-m-d')]);
    } catch (Throwable $ex) {
        // الإحصائيات مش بتوقف الصفحة
    }
}

function track_lesson_view(int $lessonId): void
{
    try {
        db()->prepare('INSERT INTO lesson_views (lesson_id, views) VALUES (?, 1) ON DUPLICATE KEY UPDATE views = views + 1')
            ->execute([$lessonId]);
    } catch (Throwable $ex) {
        // تجاهل
    }
}

// ===== تقارير أولياء الأمور =====
function can_view_report(array $me, int $studentId): bool
{
    if ($me['role'] === 'student') {
        return (int)$me['id'] === $studentId;
    }
    if ($me['role'] === 'parent') {
        $st = db()->prepare('SELECT 1 FROM parent_links WHERE parent_id = ? AND student_id = ?');
        $st->execute([(int)$me['id'], $studentId]);
        return (bool)$st->fetchColumn();
    }
    return false;
}


// الطالب يشوف بس المحتوى المحدد لسنته (من غير المحتوى القديم اللي لمرحلة كاملة)
function grade_exact_sql(string $alias): string
{
    return "($alias.grades IS NOT NULL AND $alias.grades <> '' AND $alias.grades LIKE ?)";
}

function exact_params(string $grade): array
{
    return ['%' . $grade . '%'];
}

// خيارات قائمة منسدلة: كل مرحلة كاملة، وكل صف على حدة
function grade_target_options(?string $selected = null): string
{
    $html = '<option value="">اختر</option><optgroup label="المرحلة كاملة">';
    foreach (GRADE_YEARS as $si => $years) {
        $val = 's' . $si;
        $html .= '<option value="' . $val . '"' . ($selected === $val ? ' selected' : '') . '>كل ' . e(STAGES[$si]) . '</option>';
    }
    $html .= '</optgroup>';
    foreach (GRADE_YEARS as $si => $years) {
        $html .= '<optgroup label="' . e(STAGES[$si]) . '">';
        foreach ($years as $y) {
            $html .= '<option value="' . e($y) . '"' . ($selected === $y ? ' selected' : '') . '>' . e($y) . '</option>';
        }
        $html .= '</optgroup>';
    }
    return $html;
}


// الأخبار والإعلانات المجدولة: بتظهر أول ما وقتها يجي (من غير تشغيل يدوي)
function publish_clause(string $alias = ''): string
{
    $col = $alias === '' ? 'publish_at' : $alias . '.publish_at';
    return "($col IS NULL OR $col <= '" . date('Y-m-d H:i:s') . "')";
}

// رابط الـ PWA وتسجيل الـ Service Worker
function pwa_head(): string
{
    return '<link rel="manifest" href="manifest.json">'
         . '<meta name="theme-color" content="#047857">'
         . '<meta name="apple-mobile-web-app-capable" content="yes">'
         . '<link rel="icon" href="icon-192.png" type="image/png">'
         . '<link rel="apple-touch-icon" href="icon-192.png">'
         . '<script>if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); }); }</script>';
}

// الأسئلة المعتمدة على درس معين (تظهر للطالب تحت الفيديو)
function lesson_qa_html(int $lessonId, array $me): string
{
    $st = db()->prepare("SELECT q.question, q.answer, u.name FROM lesson_questions q
                         JOIN users u ON u.id = q.user_id
                         WHERE q.lesson_id = ? AND q.status = 'approved' ORDER BY q.id DESC LIMIT 5");
    $st->execute([$lessonId]);
    $items = $st->fetchAll();

    $html = '<div class="pt-3 border-t border-slate-200 space-y-3">';
    $html .= '<div class="font-bold text-sm">❓ أسئلة الدرس</div>';
    if (!$items) {
        $html .= '<p class="text-xs text-slate-500">لا توجد أسئلة معتمدة بعد.</p>';
    }
    foreach ($items as $it) {
        $html .= '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">'
              . '<div class="font-bold">' . e($it['question']) . '</div>'
              . '<div class="text-xs text-slate-500 mb-1">— ' . e($it['name']) . '</div>'
              . '<div class="text-emerald-800">✅ ' . e((string)$it['answer']) . '</div></div>';
    }
    $html .= '<form method="post" action="actions.php" class="space-y-2">'
          . '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">'
          . '<input type="hidden" name="action" value="ask_question">'
          . '<input type="hidden" name="lesson_id" value="' . $lessonId . '">'
          . '<textarea name="question" required maxlength="500" rows="2" placeholder="اسأل عن نقطة في الدرس..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"></textarea>'
          . '<button class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">إرسال السؤال</button>'
          . '<span class="text-[11px] text-slate-500 block">السؤال بيظهر بعد ما الإدارة تراجعه وترد عليه.</span>'
          . '</form></div>';
    return $html;
}


// مواد الصف (من جدول المناهج اللي الإدارة بتديره)
function curriculum_subjects(?string $grade): array
{
    $canon = canonical_grade($grade);
    if ($canon === null) {
        return [];
    }
    $st = db()->prepare('SELECT subject FROM curriculum WHERE grade = ? ORDER BY subject');
    $st->execute([$canon]);
    return $st->fetchAll(PDO::FETCH_COLUMN);
}
