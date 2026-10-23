<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$me = function_exists('current_user') ? current_user() : ($_SESSION['user'] ?? null);
if (!$me || ($me['role'] ?? '') !== 'student') {
    flash('سجّل الدخول أولاً', 'مستر يونس متاح للطلاب فقط.', false);
    header('Location: index.php');
    exit;
}
$CSRF  = csrf_token();
$stage = function_exists('stage_of_grade') ? stage_of_grade($me['grade'] ?? '') : '';
$subjects = function_exists('curriculum_subjects') ? curriculum_subjects($me['grade'] ?? '') : ['اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية'];
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مستر يونس - <?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; }
        @keyframes tFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes tBlink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
        @keyframes tWave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg); } }
        @keyframes tTalk { 0%,100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }
        @keyframes tBubble { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .t-float { animation: tFloat 3.5s ease-in-out infinite; transform-box: fill-box; }
        .t-eye { transform-box: fill-box; transform-origin: center; animation: tBlink 4.5s infinite; }
        .t-hand { transform-box: fill-box; transform-origin: top center; animation: tWave 2.4s ease-in-out infinite; }
        .t-mouth { transform-box: fill-box; transform-origin: center; transform: scaleY(.25); }
        .talking .t-mouth { animation: tTalk .32s ease-in-out infinite; }
        .talking .t-hand { animation-duration: 1.2s; }
        .bubble { animation: tBubble .35s ease both; }
        .t-ring { transform-box: fill-box; transform-origin: center; opacity: 0; }
        .talking .t-ring { animation: tPulse 1.3s ease-out infinite; }
        @keyframes tPulse { 0% { transform: scale(.96); opacity: .7; } 100% { transform: scale(1.12); opacity: 0; } }
        .talking .t-smile { opacity: 0; }
        .t-smile { transition: opacity .2s; }
        .board-glow { box-shadow: 0 10px 30px -5px rgba(16, 185, 129, 0.2); }
    </style>
    <?= function_exists('pwa_head') ? pwa_head() : '' ?>
</head>
<body class="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 min-h-screen text-slate-100">

<header class="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <a href="student.php" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition">← بوابة الطالب</a>
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-extrabold text-lg bg-gradient-to-l from-emerald-400 to-teal-200 bg-clip-text text-transparent">منصة مستر يونس الذكية</span>
        </div>
    </div>
</header>

<main class="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6 items-start">

    <!-- الشخصية ولوحة التحكم -->
    <aside class="lg:col-span-4 bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-6 flex flex-col items-center text-center shadow-2xl">
        <div id="teacher" class="relative w-48 h-48 mb-2">
            <svg viewBox="0 0 200 200" class="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#0284c7"/>
                    </linearGradient>
                    <linearGradient id="skinG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#f7d3b1"/><stop offset="1" stop-color="#eeb996"/>
                    </linearGradient>
                    <linearGradient id="blazerG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/>
                    </linearGradient>
                    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".35"/>
                    </filter>
                </defs>

                <circle class="t-ring" cx="100" cy="100" r="96" fill="none" stroke="#10b981" stroke-width="4"/>
                <circle cx="100" cy="100" r="92" fill="url(#bgG)"/>
                <circle cx="100" cy="100" r="92" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="2"/>

                <g class="t-float" filter="url(#soft)">
                    <path d="M34 196 C34 150 62 132 100 132 C138 132 166 150 166 196 Z" fill="url(#blazerG)"/>
                    <path d="M86 132 L100 160 L114 132 Z" fill="#ffffff"/>
                    <rect x="89" y="112" width="22" height="26" rx="10" fill="url(#skinG)"/>
                    <ellipse cx="100" cy="84" rx="44" ry="48" fill="url(#skinG)"/>
                    <ellipse cx="56" cy="88" rx="6" ry="9" fill="#eeb996"/>
                    <ellipse cx="144" cy="88" rx="6" ry="9" fill="#eeb996"/>
                    <path d="M56 80 C54 44 76 32 102 32 C132 32 150 48 144 82 C138 64 122 56 98 58 C84 60 70 66 56 80 Z" fill="#0f172a"/>
                    <rect x="62" y="74" width="30" height="22" rx="9" fill="#ffffff" fill-opacity=".15" stroke="#334155" stroke-width="2.6"/>
                    <rect x="108" y="74" width="30" height="22" rx="9" fill="#ffffff" fill-opacity=".15" stroke="#334155" stroke-width="2.6"/>
                    <line x1="92" y1="82" x2="108" y2="82" stroke="#334155" stroke-width="2.6"/>
                    <line x1="62" y1="82" x2="54" y2="80" stroke="#334155" stroke-width="2.6" stroke-linecap="round"/>
                    <line x1="138" y1="82" x2="146" y2="80" stroke="#334155" stroke-width="2.6" stroke-linecap="round"/>
                    <g class="t-eye"><ellipse cx="77" cy="85" rx="4.2" ry="5" fill="#0f172a"/><circle cx="78.6" cy="83.4" r="1.4" fill="#fff"/></g>
                    <g class="t-eye"><ellipse cx="123" cy="85" rx="4.2" ry="5" fill="#0f172a"/><circle cx="124.6" cy="83.4" r="1.4" fill="#fff"/></g>
                    <ellipse cx="68" cy="106" rx="7" ry="4.5" fill="#fb7185" opacity=".35"/>
                    <ellipse cx="132" cy="106" rx="7" ry="4.5" fill="#fb7185" opacity=".35"/>
                    <path d="M68 68 Q77 64 86 68" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
                    <path d="M114 68 Q123 64 132 68" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
                    <ellipse class="t-mouth" cx="100" cy="116" rx="10" ry="6" fill="#9f1239"/>
                    <path d="M90 113 Q100 122 110 113" fill="none" stroke="#7f1d1d" stroke-width="2.4" stroke-linecap="round" class="t-smile"/>
                </g>
                <path d="M164 36 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#fbbf24"/>
            </svg>
        </div>
        <h2 class="text-xl font-extrabold text-white mt-1">مستر يونس</h2>
        <p class="text-xs text-slate-400 mt-1">معلمك الذكي للمناهج المصرية</p>
        <div class="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold" id="status">جاهز للشرح</div>

        <div class="w-full mt-6 space-y-3 text-right">
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">اختر المادة الدراسية:</label>
                <select id="subject" class="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white font-semibold focus:outline-none focus:border-emerald-500 transition">
                    <option value="">اختر المادة العامة</option>
                    <?php foreach ($subjects as $sub): ?><option value="<?= e($sub) ?>"><?= e($sub) ?></option><?php endforeach; ?>
                </select>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-between">
                <span class="text-xs text-slate-400">الصف الدراسي:</span>
                <span class="text-xs font-extrabold text-emerald-400"><?= e($me['grade'] ?? 'غير محدد') ?></span>
            </div>
        </div>
    </aside>

    <!-- منطقة الشات والسبورة التفاعلية وشاشة العرض الجانبية -->
    <section class="lg:col-span-8 space-y-5">
        <?php if ($flash): ?>
            <div class="rounded-2xl px-4 py-3 font-bold <?= $flash['ok'] ? 'bg-emerald-900/50 border border-emerald-500 text-emerald-200' : 'bg-red-900/50 border border-red-500 text-red-200' ?>"><?= e($flash['title']) ?>: <?= e($flash['text']) ?></div>
        <?php endif; ?>

        <!-- تبديل الأوضاع -->
        <div class="grid grid-cols-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shadow-lg">
            <button id="tabChat" onclick="setMode('chat')" class="py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">💬 المحادثة الذكية والشرح التفاعلي</button>
            <button id="tabLesson" onclick="setMode('lesson')" class="py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">🪄 السبورة التفاعلية (كروت)</button>
        </div>

        <!-- وضع المحادثة مع شاشة العرض التفاعلية الجانبية -->
        <div id="chatMode" class="grid md:grid-cols-12 gap-4">
            <!-- صندوق المحادثة -->
            <div class="md:col-span-6 bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-4 shadow-2xl flex flex-col justify-between space-y-3">
                <div id="chatBox" class="h-[340px] overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 custom-scroll">
                    <div class="flex gap-3 items-start bubble">
                        <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">ي</div>
                        <div class="bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl shadow-sm max-w-[85%] leading-relaxed text-xs">
                            أهلاً يا بطل! اسألني في أي سؤال، وهعرضلك الشرح والتفصيل هنا على الشاشة الجانبية فوراً.
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 relative">
                    <input id="chatInput" maxlength="500" placeholder="اكتب سؤالك هنا..." onkeydown="if(event.key==='Enter') sendChat()" class="flex-1 px-3.5 py-3 rounded-2xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium transition text-xs shadow-inner">
                    <button onclick="sendChat()" class="px-5 py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-900/30 transition text-xs flex items-center justify-center">إرسال 🚀</button>
                </div>
            </div>

            <!-- الشاشة الجانبية التفاعلية لعرض الشرح -->
            <div class="md:col-span-6 bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-5 shadow-2xl flex flex-col justify-between min-h-[415px] relative overflow-hidden">
                <div class="absolute top-3 left-4 text-xs font-mono text-emerald-400 tracking-wider">LIVE EXPLANATION PANEL</div>
                <div id="liveDisplayContent" class="my-auto text-center space-y-3 py-6">
                    <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">💡</div>
                    <h3 class="text-lg font-bold text-white">شاشة الشرح التفاعلي</h3>
                    <p class="text-xs text-slate-400 max-w-xs mx-auto">عندما تسأل مستر يونس في الشات، سيظهر هنا الشرح المفصل، القوانين، والملخصات بشكل منظم ومباشر.</p>
                </div>
            </div>
        </div>

        <!-- وضع السبورة التفاعلية الحية -->
        <div id="lessonMode" class="hidden space-y-4">
            <div class="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/60 p-5 shadow-2xl space-y-4">
                <div class="flex gap-2">
                    <input id="topic" maxlength="200" placeholder="اكتب عنوان أو موضوع الدرس (مثال: جدول الضرب، الأكسدة Reduction)..." class="flex-1 px-4 py-3.5 rounded-2xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium transition shadow-inner">
                    <button onclick="startLesson()" class="px-6 py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/30 transition">شرح على السبورة 🪄</button>
                </div>

                <!-- السبورة الذكية الحية -->
                <div id="whiteboard" class="board-glow bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 min-h-[340px] flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute top-3 left-4 text-xs font-mono text-emerald-500/60 tracking-wider">BLACKBOARD LIVE v2.0</div>
                    <div id="boardContent" class="my-auto text-center space-y-4 py-8">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">🧑‍🏫</div>
                        <h3 class="text-xl font-bold text-white">السبورة التفاعلية جاهزة</h3>
                        <p class="text-sm text-slate-400 max-w-md mx-auto">اختر المادة واكتب الدرس، وسيقوم مستر يونس بتقسيم الدرس لبطاقات شرح ذكية وأسئلة تفاعلية حية.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<script>
const CSRF = <?= json_encode($CSRF) ?>;
let mode = 'chat';
let cards = [], cardIdx = 0, score = 0;

const teacher = document.getElementById('teacher');
const statusEl = document.getElementById('status');

function setMode(m) {
    mode = m;
    document.getElementById('chatMode').classList.toggle('hidden', m !== 'chat');
    document.getElementById('lessonMode').classList.toggle('hidden', m !== 'lesson');
    const active = 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40', inactive = 'text-slate-400 hover:text-white';
    document.getElementById('tabChat').className = 'py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs md:text-sm ' + (m === 'chat' ? active : inactive);
    document.getElementById('tabLesson').className = 'py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs md:text-sm ' + (m === 'lesson' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : inactive);
}
setMode('chat');

let arVoice = null;
function pickArabicVoice() {
    if (!('speechSynthesis' in window)) return null;
    arVoice = window.speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang)) || null;
    return arVoice;
}
if ('speechSynthesis' in window) {
    pickArabicVoice();
    window.speechSynthesis.onvoiceschanged = pickArabicVoice;
}

async function speak(text) {
    const clean = cleanForSpeech(text).slice(0, 800);
    if (!clean) return;
    try {
        const fd = new FormData();
        fd.append('csrf', CSRF);
        fd.append('text', clean);
        const res = await fetch('teacher_tts.php', { method: 'POST', body: fd, credentials: 'same-origin' });
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.includes('audio')) throw new Error('tts');
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audio.onplay = () => { teacher.classList.add('talking'); statusEl.textContent = 'مستر يونس بيتكلم...'; };
        audio.onended = audio.onerror = () => {
            teacher.classList.remove('talking');
            statusEl.textContent = 'جاهز للشرح';
            URL.revokeObjectURL(url);
        };
        await audio.play();
    } catch (e) {
        speakBrowser(text);
    }
}

function cleanForSpeech(t) {
    return String(t)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`/g, '')
        .replace(/^\s*#{1,6}\s*/gm, '')
        .replace(/\*\*|__/g, '')
        .replace(/^\s*[-•·▪►]\s*/gm, '')
        .replace(/^\s*(\d+)[.)]\s+/gm, '$1 - ')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\u200d\ufe0f]/g, '')
        .replace(/[^\u0600-\u06FF0-9A-Za-z\s.,غة؛:!؟?()%]/g, ' ')
        .replace(/\s*\n+\s*/g, '. ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function speechChunks(text) {
    const parts = cleanForSpeech(text).match(/[^.!؟?]+[.!؟?]?/g) || [];
    return parts.map(p => p.trim()).filter(p => p.length > 1);
}

function speakBrowser(text) {
    if (!('speechSynthesis' in window) || !text) return;
    if (!pickArabicVoice()) {
        statusEl.textContent = 'اقرأ الشرح التفاعلي';
        return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    const sayAt = (i) => {
        if (i >= chunks.length) {
            teacher.classList.remove('talking');
            statusEl.textContent = 'جاهز للشرح';
            return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = arVoice.lang;
        u.voice = arVoice;
        u.rate = 0.93;
        u.pitch = 1;
        u.onstart = () => {
            teacher.classList.add('talking');
            statusEl.textContent = 'مستر يونس بيتكلم...';
        };
        u.onend = () => sayAt(i + 1);
        u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') sayAt(i + 1); };
        synth.speak(u);
    };
    sayAt(0);
}

function bubble(text, who) {
    const box = document.getElementById('chatBox');
    const div = document.createElement('div');
    div.className = 'flex gap-3 items-start bubble ' + (who === 'user' ? 'flex-row-reverse' : '');
    
    const avatar = document.createElement('div');
    avatar.className = 'w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow ' + (who === 'user' ? 'bg-blue-600' : 'bg-emerald-600');
    avatar.textContent = who === 'user' ? 'ط' : 'ي';

    const content = document.createElement('div');
    content.className = 'p-3 rounded-2xl shadow-sm max-w-[85%] leading-relaxed text-xs whitespace-pre-line ' +
        (who === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-none');
    content.textContent = String(text).replace(/\*\*|__|`/g, '').replace(/^\s*#{1,6}\s*/gm, '');

    div.append(avatar, content);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function updateLiveDisplay(text, question) {
    const display = document.getElementById('liveDisplayContent');
    display.innerHTML = '';

    const badge = document.createElement('div');
    badge.className = 'inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2';
    badge.textContent = '📖 شرح تفاعلي مفصل';

    const qTitle = document.createElement('h4');
    qTitle.className = 'text-sm font-bold text-emerald-300 mb-3';
    qTitle.textContent = 'السؤال: ' + question;

    const bodyBox = document.createElement('div');
    bodyBox.className = 'bg-slate-900/80 border border-slate-700 p-4 rounded-2xl text-right text-xs md:text-sm text-slate-200 leading-relaxed max-h-[280px] overflow-y-auto custom-scroll whitespace-pre-line';
    bodyBox.textContent = text;

    display.append(badge, qTitle, bodyBox);
}

async function call(fields) {
    const fd = new FormData();
    fd.append('csrf', CSRF);
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    const res = await fetch('teacher_api.php', { method: 'POST', body: fd, credentials: 'same-origin' });
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch (e) {
        throw new Error(raw.trim().startsWith('<') ? 'خطأ في استجابة الخادم.' : 'رد غير متوقع من الخادم.');
    }
    if (data.error) throw new Error(data.error);
    return data;
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    bubble(q, 'user');
    statusEl.textContent = 'مستر يونس بيفكر ويعرض الشرح...';
    try {
        const data = await call({ mode: 'chat', subject: document.getElementById('subject').value, question: q });
        bubble('تم إرسال الشرح التفصيلي إلى الشاشة الجانبية 💡', 'bot');
        updateLiveDisplay(data.reply, q);
        speak(data.reply);
    } catch (err) {
        bubble(err.message, 'bot');
        statusEl.textContent = 'جاهز للشرح';
    }
}

async function startLesson() {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value.trim();
    const board = document.getElementById('boardContent');
    board.innerHTML = '<div class="animate-pulse text-emerald-400 font-bold py-12">🪄 جاري تحضير الشرح التفاعلي على السبورة...</div>';
    statusEl.textContent = 'مستر يونس يكتب على السبورة...';
    try {
        const data = await call({ mode: 'lesson', subject, question: topic });
        cards = data.cards; cardIdx = 0; score = 0;
        showCard();
    } catch (err) {
        board.innerHTML = '<div class="text-red-400 font-bold py-10">⚠️ ' + err.message + '</div>';
        statusEl.textContent = 'جاهز للشرح';
    }
}

function showCard() {
    const board = document.getElementById('boardContent');
    const c = cards[cardIdx];
    if (!c) return;
    board.innerHTML = '';
    
    const progress = document.createElement('div');
    progress.className = 'text-xs font-bold text-emerald-400 mb-1';
    progress.textContent = 'بطاقة الشرح ' + (cardIdx + 1) + ' من ' + cards.length;

    const title = document.createElement('h3');
    title.className = 'text-xl md:text-2xl font-extrabold text-white mb-2';
    title.textContent = c.title;

    const text = document.createElement('p');
    text.className = 'text-slate-300 leading-relaxed text-sm md:text-base max-w-2xl mx-auto mb-4';
    text.textContent = c.text;

    const qBox = document.createElement('div');
    qBox.className = 'bg-slate-900/80 border border-slate-700 p-4 rounded-2xl max-w-xl mx-auto text-right space-y-3';
    
    const qTitle = document.createElement('div');
    qTitle.className = 'font-bold text-emerald-300 text-sm';
    qTitle.textContent = '❓ ' + c.question;
    qBox.appendChild(qTitle);

    const opts = document.createElement('div');
    opts.className = 'grid gap-2';
    
    const feedback = document.createElement('div');
    feedback.className = 'text-sm font-bold min-h-[1.5rem]';

    (c.options || []).forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-right font-medium transition text-sm text-white';
        b.textContent = opt;
        b.onclick = () => {
            [...opts.children].forEach(x => x.disabled = true);
            if (i === c.answer) {
                b.className = 'w-full px-4 py-2.5 rounded-xl border border-emerald-500 bg-emerald-950 text-emerald-200 font-medium text-right text-sm';
                feedback.textContent = '✅ برافو عليك، إجابة صحيحة!';
                feedback.className = 'text-sm font-bold text-emerald-400';
                score++;
            } else {
                b.className = 'w-full px-4 py-2.5 rounded-xl border border-red-500 bg-red-950 text-red-200 font-medium text-right text-sm';
                opts.children[c.answer]?.classList.replace('bg-slate-800/90', 'bg-emerald-950');
                opts.children[c.answer]?.classList.replace('border-slate-700', 'border-emerald-500');
                feedback.textContent = '❌ إجابة غير صحيحة، الإجابة الصحيحة مظللة بالخضراء.';
                feedback.className = 'text-sm font-bold text-red-400';
            }
            const nextBtn = document.createElement('button');
            nextBtn.className = 'mt-3 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs block mx-auto shadow';
            nextBtn.textContent = cardIdx + 1 < cards.length ? 'البطاقة التالية ←' : 'عرض النتيجة النهائية 🏁';
            nextBtn.onclick = () => { cardIdx++; cardIdx < cards.length ? showCard() : showResult(); };
            feedback.appendChild(nextBtn);
        };
        opts.appendChild(b);
    });

    qBox.appendChild(opts);
    qBox.appendChild(feedback);

    board.append(progress, title, text, qBox);
    speak(c.title + '. ' + c.text);
}

function showResult() {
    const board = document.getElementById('boardContent');
    board.innerHTML = '';
    const big = document.createElement('div');
    big.className = 'text-5xl font-black text-emerald-400 mb-2';
    big.textContent = score + ' / ' + cards.length;
    const msg = document.createElement('p');
    msg.className = 'text-base font-bold text-slate-200';
    msg.textContent = score === cards.length ? 'ممتاز جداً! لقد استوعبت الدرس كاملاً بنجاح 🌟' : 'أداء رائع! راجع النقاط التي لم تضبطها جيداً لتصبح ممتازاً.';
    const again = document.createElement('button');
    again.className = 'mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow';
    again.textContent = 'شرح سبورة جديدة 🔄';
    again.onclick = startLesson;
    board.append(big, msg, again);
    speak(msg.textContent);
}
</script>
</body>
</html>