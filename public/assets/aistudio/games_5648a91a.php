<?php
require_once __DIR__ . '/auth.php';
$CSRF = csrf_token();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الألعاب الذكية - <?= e(APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; }
        .card-flip { transition: transform .3s; }
        .card-flip:hover { transform: translateY(-2px); }
        .game-card { transition: transform .2s, box-shadow .2s; }
        .game-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -15px rgba(15,23,42,.35); }
        @keyframes pop { 0% { transform: scale(.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop { animation: pop .35s ease both; }
    </style>
    <?= theme_assets() ?>
    <?= pwa_head() ?>
</head>
<body class="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 min-h-screen text-slate-800">

<header class="bg-gradient-to-l from-indigo-700 via-blue-700 to-emerald-600 text-white">
    <div class="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <a href="index.php" class="font-extrabold">← الرئيسية</a>
        <div class="font-extrabold text-lg">🎮 الألعاب الذكية</div>
        <?= theme_button() ?>
    </div>
</header>

<main class="max-w-6xl mx-auto px-4 py-8">

    <!-- قايمة الألعاب -->
    <section id="menu" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <button onclick="openGame('sudoku')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🧩</div><div class="font-extrabold text-xl">سودوكو 4×4</div>
            <p class="text-sm text-slate-500 mt-1">كمّل الشبكة بالأرقام من 1 لـ 4 من غير تكرار.</p>
        </button>
        <button onclick="openGame('hangman')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🔤</div><div class="font-extrabold text-xl">الكلمة المخفية</div>
            <p class="text-sm text-slate-500 mt-1">خمّن الكلمة حرف حرف قبل ما تخلص المحاولات.</p>
        </button>
        <button onclick="openGame('slide')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🔀</div><div class="font-extrabold text-xl">رتّب الأرقام</div>
            <p class="text-sm text-slate-500 mt-1">حرّك القطع وخليها من 1 لـ 8 بالترتيب.</p>
        </button>
        <button onclick="openGame('color')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🌈</div><div class="font-extrabold text-xl">تحدي الألوان</div>
            <p class="text-sm text-slate-500 mt-1">اختار لون الكلمة مش معناها، بسرعة.</p>
        </button>
        <button onclick="openGame('react')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">⚡</div><div class="font-extrabold text-xl">اضغط بسرعة</div>
            <p class="text-sm text-slate-500 mt-1">استنى الأخضر واضغط في أقل من ثانية.</p>
        </button>
        <button onclick="openGame('vocab')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🔗</div><div class="font-extrabold text-xl">طابق الكلمات</div>
            <p class="text-sm text-slate-500 mt-1">وصّل الكلمة الإنجليزي بمعناها العربي.</p>
        </button>
        <button onclick="openGame('memory')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🧠</div><div class="font-extrabold text-xl">لعبة الذاكرة</div>
            <p class="text-sm text-slate-500 mt-1">افتح الكروت وطابق الأزواج بأقل عدد حركات.</p>
        </button>
        <button onclick="openGame('math')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">⚡</div><div class="font-extrabold text-xl">حساب سريع</div>
            <p class="text-sm text-slate-500 mt-1">60 ثانية، جاوب أكبر عدد من الحسابات الذهنية.</p>
        </button>
        <button onclick="openGame('pattern')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🔢</div><div class="font-extrabold text-xl">أكمل النمط</div>
            <p class="text-sm text-slate-500 mt-1">اكتشف القاعدة وكمّل الرقم اللي بعده.</p>
        </button>
        <button onclick="openGame('ttt')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">❌</div><div class="font-extrabold text-xl">إكس أو ضد الذكاء</div>
            <p class="text-sm text-slate-500 mt-1">العب ضد الكمبيوتر بمستوى سهل أو صعب.</p>
        </button>
        <button onclick="openGame('guess')" class="game-card text-right p-6 rounded-3xl bg-white border border-slate-200">
            <div class="text-4xl mb-3">🎯</div><div class="font-extrabold text-xl">خمّن الرقم</div>
            <p class="text-sm text-slate-500 mt-1">خمّن الرقم السري من 1 لـ 100 بأقل محاولات.</p>
        </button>
    </section>

    <!-- الذاكرة -->
    <section id="g-memory" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🧠 لعبة الذاكرة</h2>
            <div class="flex gap-2"><span id="memStat" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm">الحركات: 0</span><button onclick="startMemory()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">لعبة جديدة</button></div>
        </div>
        <div id="memGrid" class="grid grid-cols-4 gap-3 max-w-md mx-auto"></div>
        <div id="memMsg" class="text-center font-bold mt-4 min-h-[1.5rem]"></div>
    </section>

    <!-- الحساب السريع -->
    <section id="g-math" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">⚡ حساب سريع</h2>
            <div class="flex gap-2"><span class="px-3 py-1.5 rounded-xl bg-amber-100 font-bold text-sm">⏱️ <span id="mathTime">60</span> ث</span><span class="px-3 py-1.5 rounded-xl bg-emerald-100 font-bold text-sm">النقاط: <span id="mathScore">0</span></span></div>
        </div>
        <div id="mathQ" class="text-5xl font-extrabold my-8 min-h-[4rem]">اضغط ابدأ</div>
        <div id="mathChoices" class="grid grid-cols-2 gap-3 max-w-md mx-auto"></div>
        <button id="mathStart" onclick="startMath()" class="mt-6 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold">ابدأ</button>
        <div id="mathBest" class="text-sm text-slate-500 mt-4"></div>
    </section>

    <!-- أكمل النمط -->
    <section id="g-pattern" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🔢 أكمل النمط</h2>
            <span id="patScore" class="px-3 py-1.5 rounded-xl bg-emerald-100 font-bold text-sm">الجولة 1 من 8</span>
        </div>
        <div id="patSeq" class="flex flex-wrap justify-center gap-3 my-8 min-h-[4rem]"></div>
        <div id="patChoices" class="grid grid-cols-3 gap-3 max-w-md mx-auto"></div>
        <div id="patMsg" class="font-bold mt-4 min-h-[1.5rem]"></div>
        <button onclick="startPattern()" class="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">ابدأ من جديد</button>
    </section>

    <!-- إكس أو -->
    <section id="g-ttt" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">❌ إكس أو ضد الذكاء</h2>
            <div class="flex gap-2">
                <select id="tttLevel" class="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-sm"><option value="easy">سهل</option><option value="hard">صعب</option></select>
                <button onclick="resetTTT()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">جولة جديدة</button>
            </div>
        </div>
        <div id="tttBoard" class="grid grid-cols-3 gap-3 max-w-xs mx-auto"></div>
        <div id="tttMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
    </section>

    <!-- خمّن الرقم -->
    <section id="g-guess" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🎯 خمّن الرقم</h2>
            <span id="guessCount" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm">المحاولات: 0</span>
        </div>
        <p class="text-slate-600 mb-4">فكّر في رقم من 1 لـ 100، والكمبيوتر هيقولك أكبر أو أصغر.</p>
        <div class="flex justify-center gap-2 max-w-sm mx-auto">
            <input id="guessInput" type="number" min="1" max="100" placeholder="اكتب رقمك" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-lg text-center" onkeydown="if(event.key==='Enter') guess()">
            <button onclick="guess()" class="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">خمّن</button>
        </div>
        <div id="guessMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
        <button onclick="startGuess()" class="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">لعبة جديدة</button>
    </section>

    <!-- سودوكو -->
    <section id="g-sudoku" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🧩 سودوكو 4×4</h2>
            <button onclick="startSudoku()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">لعبة جديدة</button>
        </div>
        <div id="sudGrid" class="grid grid-cols-4 gap-2 max-w-xs mx-auto"></div>
        <div id="sudPad" class="grid grid-cols-4 gap-2 max-w-xs mx-auto mt-5">
            <button onclick="sudoNum(1)" class="py-3 rounded-xl bg-slate-100 font-extrabold text-xl">1</button>
            <button onclick="sudoNum(2)" class="py-3 rounded-xl bg-slate-100 font-extrabold text-xl">2</button>
            <button onclick="sudoNum(3)" class="py-3 rounded-xl bg-slate-100 font-extrabold text-xl">3</button>
            <button onclick="sudoNum(4)" class="py-3 rounded-xl bg-slate-100 font-extrabold text-xl">4</button>
        </div>
        <p class="text-sm text-slate-500 mt-4">اختار خانة فاضية، وبعدين الرقم اللي تحطه.</p>
        <div id="sudMsg" class="font-bold text-lg mt-3 min-h-[1.8rem]"></div>
    </section>

    <!-- الكلمة المخفية -->
    <section id="g-hangman" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🔤 الكلمة المخفية</h2>
            <div class="flex gap-2"><span id="hmLives" class="px-3 py-1.5 rounded-xl bg-red-100 font-bold text-sm"></span><button onclick="startHangman()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">كلمة جديدة</button></div>
        </div>
        <div id="hmWord" class="text-4xl font-extrabold tracking-[0.4em] my-6 min-h-[3rem]"></div>
        <div id="hmKeys" class="grid grid-cols-7 sm:grid-cols-9 gap-2 max-w-lg mx-auto"></div>
        <div id="hmMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
    </section>

    <!-- ترتيب الأرقام -->
    <section id="g-slide" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🔀 رتّب الأرقام</h2>
            <div class="flex gap-2"><span id="slMoves" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm">الحركات: 0</span><button onclick="startSlide()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">خلطة جديدة</button></div>
        </div>
        <div id="slGrid" class="grid grid-cols-3 gap-2 max-w-xs mx-auto"></div>
        <div id="slMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
    </section>

    <!-- تحدي الألوان -->
    <section id="g-color" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🌈 تحدي الألوان</h2>
            <div class="flex gap-2"><span class="px-3 py-1.5 rounded-xl bg-amber-100 font-bold text-sm">⏱️ <span id="colTime">30</span> ث</span><span class="px-3 py-1.5 rounded-xl bg-emerald-100 font-bold text-sm">النقاط: <span id="colScore">0</span></span></div>
        </div>
        <p class="text-slate-500 text-sm mb-4">اختار <b>لون الكلمة</b> مش معناها.</p>
        <div id="colWord" class="text-6xl font-extrabold my-8 min-h-[4rem]">اضغط ابدأ</div>
        <div id="colChoices" class="grid grid-cols-2 gap-3 max-w-md mx-auto"></div>
        <button id="colStart" onclick="startColor()" class="mt-6 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold">ابدأ</button>
    </section>

    <!-- اضغط بسرعة -->
    <section id="g-react" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">⚡ اضغط بسرعة</h2>
            <span id="reBest" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm"></span>
        </div>
        <button id="reBox" onclick="reactClick()" class="w-full max-w-md mx-auto h-56 rounded-3xl bg-red-500 text-white text-2xl font-extrabold shadow-lg transition">اضغط "ابدأ" وانتظر اللون الأخضر</button>
        <div id="reMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
        <button onclick="startReact()" class="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">ابدأ</button>
    </section>

    <!-- طابق الكلمات -->
    <section id="g-vocab" class="hidden pop bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-2xl font-extrabold">🔗 طابق الكلمات</h2>
            <div class="flex gap-2"><span id="voMoves" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm">أخطاء: 0</span><button onclick="startVocab()" class="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">جولة جديدة</button></div>
        </div>
        <div class="grid grid-cols-2 gap-6 max-w-xl mx-auto">
            <div id="voLeft" class="grid gap-3"></div>
            <div id="voRight" class="grid gap-3"></div>
        </div>
        <div id="voMsg" class="font-bold text-lg mt-5 min-h-[1.8rem]"></div>
    </section>

    <div class="text-center mt-8"><button onclick="backToMenu()" class="hidden px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold" id="backBtn">← رجوع للألعاب</button></div>
</main>

<script>
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const best = (k) => Number(localStorage.getItem('game_' + k) || 0);
const saveBest = (k, v) => { if (v > best(k)) localStorage.setItem('game_' + k, v); };

function openGame(name) {
    ['memory', 'math', 'pattern', 'ttt', 'guess', 'sudoku', 'hangman', 'slide', 'color', 'react', 'vocab'].forEach(g => $('g-' + g).classList.add('hidden'));
    $('menu').classList.add('hidden');
    $('g-' + name).classList.remove('hidden');
    $('backBtn').classList.remove('hidden');
    if (name === 'memory') startMemory();
    if (name === 'math') { $('mathBest').textContent = 'أفضل نتيجة: ' + best('math'); }
    if (name === 'pattern') startPattern();
    if (name === 'ttt') resetTTT();
    if (name === 'guess') startGuess();
    if (name === 'sudoku') startSudoku();
    if (name === 'hangman') startHangman();
    if (name === 'slide') startSlide();
    if (name === 'color') { $('colWord').textContent = 'اضغط ابدأ'; $('colChoices').innerHTML = ''; }
    if (name === 'react') startReact();
    if (name === 'vocab') startVocab();
}
function backToMenu() {
    ['memory', 'math', 'pattern', 'ttt', 'guess', 'sudoku', 'hangman', 'slide', 'color', 'react', 'vocab'].forEach(g => $('g-' + g).classList.add('hidden'));
    $('menu').classList.remove('hidden');
    $('backBtn').classList.add('hidden');
    clearInterval(mathTimer);
    clearInterval(colorTimer);
    clearTimeout(reactTimer);
}

/* ========== 1) لعبة الذاكرة ========== */
const EMOJIS = ['🐘', '📚', '✏️', '🧠', '⭐', '🎓', '🔬', '🌍'];
let memFirst = null, memLock = false, memMoves = 0, memFound = 0;
function startMemory() {
    memFirst = null; memLock = false; memMoves = 0; memFound = 0;
    $('memStat').textContent = 'الحركات: 0';
    $('memMsg').textContent = '';
    const deck = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    const grid = $('memGrid');
    grid.innerHTML = '';
    deck.forEach(val => {
        const b = document.createElement('button');
        b.className = 'card-flip h-20 sm:h-24 rounded-2xl text-3xl font-bold bg-gradient-to-br from-indigo-500 to-blue-600 text-transparent shadow';
        b.dataset.v = val;
        b.onclick = () => flipMem(b);
        grid.appendChild(b);
    });
}
function flipMem(b) {
    if (memLock || b.dataset.open || b.disabled) return;
    b.dataset.open = '1';
    b.textContent = b.dataset.v;
    b.classList.remove('from-indigo-500', 'to-blue-600', 'text-transparent');
    b.classList.add('bg-white', 'text-slate-900');
    if (!memFirst) { memFirst = b; return; }
    memMoves++;
    $('memStat').textContent = 'الحركات: ' + memMoves;
    if (memFirst.dataset.v === b.dataset.v) {
        memFirst.disabled = true; b.disabled = true;
        memFound++;
        memFirst = null;
        if (memFound === EMOJIS.length) {
            $('memMsg').textContent = '🎉 برافو! خلصتها في ' + memMoves + ' حركة';
            const prev = best('memory');
            if (!prev || memMoves < prev) localStorage.setItem('game_memory', memMoves);
        }
        return;
    }
    memLock = true;
    setTimeout(() => {
        [memFirst, b].forEach(x => {
            x.textContent = ''; delete x.dataset.open;
            x.classList.add('from-indigo-500', 'to-blue-600', 'text-transparent');
            x.classList.remove('bg-white', 'text-slate-900');
        });
        memFirst = null; memLock = false;
    }, 700);
}

/* ========== 2) الحساب السريع ========== */
let mathTimer = null, mathLeft = 60, mathScore = 0, mathAns = 0;
function startMath() {
    mathScore = 0; mathLeft = 60;
    $('mathScore').textContent = 0;
    $('mathTime').textContent = 60;
    $('mathStart').classList.add('hidden');
    nextMath();
    clearInterval(mathTimer);
    mathTimer = setInterval(() => {
        mathLeft--;
        $('mathTime').textContent = mathLeft;
        if (mathLeft <= 0) {
            clearInterval(mathTimer);
            $('mathQ').textContent = 'خلص الوقت! نتيجتك ' + mathScore;
            $('mathChoices').innerHTML = '';
            $('mathStart').textContent = 'العب تاني';
            $('mathStart').classList.remove('hidden');
            saveBest('math', mathScore);
            $('mathBest').textContent = 'أفضل نتيجة: ' + best('math');
        }
    }, 1000);
}
function nextMath() {
    const a = rand(2, 12), b = rand(2, 12), op = rand(0, 2);
    let q, ans;
    if (op === 0) { ans = a + b; q = a + ' + ' + b; }
    else if (op === 1) { const x = Math.max(a, b) * 2, y = Math.min(a, b); ans = x - y; q = x + ' − ' + y; }
    else { ans = a * b; q = a + ' × ' + b; }
    mathAns = ans;
    $('mathQ').textContent = q;
    const set = new Set([ans]);
    while (set.size < 4) { const c = ans + rand(-10, 10); if (c >= 0 && c !== ans) set.add(c); }
    const box = $('mathChoices');
    box.innerHTML = '';
    [...set].sort(() => Math.random() - 0.5).forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-4 rounded-2xl bg-slate-100 hover:bg-indigo-100 text-2xl font-extrabold transition';
        btn.textContent = v;
        btn.onclick = () => {
            if (v === mathAns) { mathScore++; $('mathScore').textContent = mathScore; }
            nextMath();
        };
        box.appendChild(btn);
    });
}

/* ========== 3) أكمل النمط ========== */
let patRound = 0, patScore = 0, patAnswer = 0;
function startPattern() {
    patRound = 0; patScore = 0;
    nextPattern();
}
function nextPattern() {
    if (patRound >= 8) {
        $('patSeq').innerHTML = '';
        $('patChoices').innerHTML = '';
        $('patMsg').textContent = 'نتيجتك ' + patScore + ' من 8 🏁';
        $('patScore').textContent = 'انتهت اللعبة';
        return;
    }
    patRound++;
    $('patScore').textContent = 'الجولة ' + patRound + ' من 8 · نقاط ' + patScore;
    const start = rand(1, 20), step = rand(2, 9), mult = rand(0, 3) === 0;
    const seq = [];
    let v = start;
    for (let i = 0; i < 5; i++) { seq.push(v); v = mult ? v * 2 : v + step; }
    patAnswer = seq[4];
    const shown = seq.slice(0, 4);
    $('patSeq').innerHTML = shown.map(n => '<span class="pop px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-2xl font-extrabold">' + n + '</span>').join('')
        + '<span class="px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 text-2xl font-extrabold">؟</span>';
    const set = new Set([patAnswer]);
    while (set.size < 3) { const c = patAnswer + rand(-6, 6); if (c > 0 && c !== patAnswer) set.add(c); }
    $('patMsg').textContent = '';
    const box = $('patChoices');
    box.innerHTML = '';
    [...set].sort(() => Math.random() - 0.5).forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-4 rounded-2xl bg-slate-100 hover:bg-emerald-100 text-xl font-extrabold transition';
        btn.textContent = c;
        btn.onclick = () => {
            [...box.children].forEach(x => x.disabled = true);
            if (c === patAnswer) { patScore++; $('patMsg').textContent = '✅ صح!'; btn.classList.add('bg-emerald-300'); }
            else { $('patMsg').textContent = '❌ الإجابة: ' + patAnswer; btn.classList.add('bg-red-200'); }
            setTimeout(nextPattern, 1100);
        };
        box.appendChild(btn);
    });
}

/* ========== 4) إكس أو ضد الذكاء ========== */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let tBoard = Array(9).fill(''), tOver = false;
function tWinner(b) {
    for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
    return b.every(c => c) ? 'draw' : null;
}
function minimax(b, isAI) {
    const w = tWinner(b);
    if (w === 'O') return 10; if (w === 'X') return -10; if (w === 'draw') return 0;
    let best = isAI ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) if (!b[i]) {
        b[i] = isAI ? 'O' : 'X';
        const s = minimax(b, !isAI);
        b[i] = '';
        best = isAI ? Math.max(best, s) : Math.min(best, s);
    }
    return best;
}
function aiMove() {
    const empty = tBoard.map((c, i) => c ? -1 : i).filter(i => i >= 0);
    if ($('tttLevel').value === 'easy' && Math.random() < 0.6) return empty[rand(0, empty.length - 1)];
    let bestScore = -Infinity, move = empty[0];
    for (const i of empty) {
        tBoard[i] = 'O';
        const s = minimax(tBoard, false);
        tBoard[i] = '';
        if (s > bestScore) { bestScore = s; move = i; }
    }
    return move;
}
function resetTTT() {
    tBoard = Array(9).fill(''); tOver = false;
    $('tttMsg').textContent = 'دورك! أنت ❌';
    const board = $('tttBoard');
    board.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const b = document.createElement('button');
        b.className = 'h-24 rounded-2xl bg-slate-100 hover:bg-indigo-50 text-5xl font-extrabold transition';
        b.onclick = () => tttPlay(i);
        board.appendChild(b);
    }
}
function drawTTT() {
    [...$('tttBoard').children].forEach((b, i) => {
        b.textContent = tBoard[i];
        b.className = 'h-24 rounded-2xl text-5xl font-extrabold transition ' + (tBoard[i] === 'X' ? 'bg-indigo-100 text-indigo-700' : tBoard[i] === 'O' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 hover:bg-indigo-50');
    });
}
function tttPlay(i) {
    if (tOver || tBoard[i]) return;
    tBoard[i] = 'X';
    drawTTT();
    if (endTTT()) return;
    $('tttMsg').textContent = 'الكمبيوتر بيفكر...';
    setTimeout(() => {
        tBoard[aiMove()] = 'O';
        drawTTT();
        if (!endTTT()) $('tttMsg').textContent = 'دورك! أنت ❌';
    }, 350);
}
function endTTT() {
    const w = tWinner(tBoard);
    if (!w) return false;
    tOver = true;
    $('tttMsg').textContent = w === 'X' ? '🎉 فزت! عبقري' : w === 'O' ? '🤖 الكمبيوتر فاز هذه المرة' : '🤝 تعادل';
    return true;
}

/* ========== 5) خمّن الرقم ========== */
let secret = 0, tries = 0, lo = 1, hi = 100;
function startGuess() {
    secret = rand(1, 100); tries = 0; lo = 1; hi = 100;
    $('guessCount').textContent = 'المحاولات: 0';
    $('guessMsg').textContent = 'ابدأ بالتخمين!';
    $('guessInput').value = '';
    $('guessInput').focus();
}
function guess() {
    const v = Number($('guessInput').value);
    if (!v || v < 1 || v > 100) { $('guessMsg').textContent = 'اكتب رقم من 1 لـ 100'; return; }
    tries++;
    $('guessCount').textContent = 'المحاولات: ' + tries;
    $('guessInput').value = '';
    if (v === secret) {
        $('guessMsg').textContent = '🎉 صح! الرقم ' + secret + ' في ' + tries + ' محاولة';
        saveBest('guess', 100 - tries);
        return;
    }
    if (v < secret) { lo = Math.max(lo, v + 1); $('guessMsg').textContent = '⬆️ أكبر من ' + v; }
    else { hi = Math.min(hi, v - 1); $('guessMsg').textContent = '⬇️ أصغر من ' + v; }
    $('guessMsg').textContent += '  (الرقم بين ' + lo + ' و ' + hi + ')';
}

/* ========== 6) سودوكو 4x4 ========== */
let sudSolution = [], sudBoard = [], sudSel = -1;
function startSudoku() {
    const base = (r, c) => ((r % 2) * 2 + Math.floor(r / 2) + c) % 4;
    const perm = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    sudSolution = [];
    for (let r = 0; r < 4; r++) { sudSolution[r] = []; for (let c = 0; c < 4; c++) sudSolution[r][c] = perm[base(r, c)]; }
    sudBoard = sudSolution.map(row => row.map(() => 0));
    const cells = [...Array(16).keys()].sort(() => Math.random() - 0.5).slice(0, 8);
    cells.forEach(i => { sudBoard[Math.floor(i / 4)][i % 4] = sudSolution[Math.floor(i / 4)][i % 4]; });
    sudSel = -1;
    $('sudMsg').textContent = '';
    drawSudoku();
}
function drawSudoku() {
    const g = $('sudGrid');
    g.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const r = Math.floor(i / 4), c = i % 4, v = sudBoard[r][c], fixed = v && sudSolution[r][c] === v && sudFixed(i);
        const b = document.createElement('button');
        b.className = 'h-16 rounded-xl text-2xl font-extrabold transition ' +
            (i === sudSel ? 'ring-4 ring-indigo-400 ' : '') +
            (v ? (sudFixed(i) ? 'bg-slate-200 text-slate-800' : 'bg-indigo-100 text-indigo-700') : 'bg-white border-2 border-dashed border-slate-300');
        b.textContent = v || '';
        b.onclick = () => { if (!sudFixed(i)) { sudSel = i; drawSudoku(); } };
        g.appendChild(b);
    }
}
let sudFixedSet = new Set();
function sudFixed(i) { return sudFixedSet.has(i); }
function sudoNum(n) {
    if (sudSel < 0) { $('sudMsg').textContent = 'اختار خانة الأول'; return; }
    const r = Math.floor(sudSel / 4), c = sudSel % 4;
    sudBoard[r][c] = n;
    if (n !== sudSolution[r][c]) { $('sudMsg').textContent = '❌ الرقم ده مش مناسب هنا'; }
    else { $('sudMsg').textContent = ''; }
    drawSudoku();
    if (sudBoard.every((row, rr) => row.every((v, cc) => v === sudSolution[rr][cc]))) {
        $('sudMsg').textContent = '🎉 برافو! حليت السودوكو';
    }
}
// الخانات اللي اتملت من البداية بتتقفل
const _startSudoku = startSudoku;
startSudoku = function () {
    _startSudoku();
    sudFixedSet = new Set();
    for (let i = 0; i < 16; i++) if (sudBoard[Math.floor(i / 4)][i % 4]) sudFixedSet.add(i);
    drawSudoku();
};

/* ========== 7) الكلمة المخفية ========== */
const HM_WORDS = ['مدرسة', 'كتاب', 'قلم', 'علم', 'جبر', 'هندسة', 'فيزياء', 'كيمياء', 'تاريخ', 'جغرافيا', 'مكتبة', 'حساب', 'تفاحة', 'سماء'];
const AR_LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
let hmWord = '', hmGuessed = new Set(), hmLives = 6;
function startHangman() {
    hmWord = HM_WORDS[rand(0, HM_WORDS.length - 1)];
    hmGuessed = new Set(); hmLives = 6;
    $('hmMsg').textContent = '';
    const keys = $('hmKeys');
    keys.innerHTML = '';
    AR_LETTERS.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'py-2 rounded-lg bg-slate-100 hover:bg-indigo-100 font-bold transition';
        b.textContent = ch;
        b.dataset.ch = ch;
        b.onclick = () => hmPick(ch, b);
        keys.appendChild(b);
    });
    drawHangman();
}
function hmPick(ch, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    if (hmWord.includes(ch)) { hmGuessed.add(ch); btn.classList.add('bg-emerald-200'); }
    else { hmLives--; btn.classList.add('bg-red-200'); }
    drawHangman();
}
function drawHangman() {
    $('hmLives').textContent = '❤️'.repeat(hmLives) + '🖤'.repeat(6 - hmLives);
    const shown = [...hmWord].map(ch => hmGuessed.has(ch) ? ch : '_').join(' ');
    $('hmWord').textContent = shown;
    const won = [...hmWord].every(ch => hmGuessed.has(ch));
    if (won) {
        $('hmMsg').textContent = '🎉 صح! الكلمة: ' + hmWord;
        [...$('hmKeys').children].forEach(b => b.disabled = true);
    } else if (hmLives <= 0) {
        $('hmMsg').textContent = '😅 خسرت! الكلمة كانت: ' + hmWord;
        $('hmWord').textContent = [...hmWord].join(' ');
        [...$('hmKeys').children].forEach(b => b.disabled = true);
    }
}

/* ========== 8) ترتيب الأرقام (3x3) ========== */
let slTiles = [], slMoves = 0;
function startSlide() {
    slTiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let blank = 8;
    for (let k = 0; k < 120; k++) {                       // خلطة بحركات صحيحة فقط
        const nb = [];
        const r = Math.floor(blank / 3), c = blank % 3;
        if (r > 0) nb.push(blank - 3); if (r < 2) nb.push(blank + 3);
        if (c > 0) nb.push(blank - 1); if (c < 2) nb.push(blank + 1);
        const pick = nb[rand(0, nb.length - 1)];
        [slTiles[blank], slTiles[pick]] = [slTiles[pick], slTiles[blank]];
        blank = pick;
    }
    slMoves = 0;
    $('slMoves').textContent = 'الحركات: 0';
    $('slMsg').textContent = '';
    drawSlide();
}
function drawSlide() {
    const g = $('slGrid');
    g.innerHTML = '';
    slTiles.forEach((v, i) => {
        const b = document.createElement('button');
        b.className = 'h-20 rounded-2xl text-3xl font-extrabold transition ' + (v === 0 ? 'bg-slate-50' : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow hover:scale-105');
        b.textContent = v === 0 ? '' : v;
        b.onclick = () => slMove(i);
        g.appendChild(b);
    });
}
function slMove(i) {
    const blank = slTiles.indexOf(0);
    const adjacent = Math.abs(Math.floor(i / 3) - Math.floor(blank / 3)) + Math.abs((i % 3) - (blank % 3)) === 1;
    if (!adjacent) return;
    [slTiles[i], slTiles[blank]] = [slTiles[blank], slTiles[i]];
    slMoves++;
    $('slMoves').textContent = 'الحركات: ' + slMoves;
    drawSlide();
    if (slTiles.slice(0, 8).every((v, k) => v === k + 1)) $('slMsg').textContent = '🎉 برافو! رتبتها في ' + slMoves + ' حركة';
}

/* ========== 9) تحدي الألوان (Stroop) ========== */
const COLORS = [
    { name: 'أحمر', hex: '#ef4444' }, { name: 'أزرق', hex: '#3b82f6' },
    { name: 'أخضر', hex: '#22c55e' }, { name: 'أصفر', hex: '#eab308' },
];
let colorTimer = null, colLeft = 30, colScore = 0, colTarget = null;
function startColor() {
    colScore = 0; colLeft = 30;
    $('colScore').textContent = 0; $('colTime').textContent = 30;
    $('colStart').classList.add('hidden');
    nextColor();
    clearInterval(colorTimer);
    colorTimer = setInterval(() => {
        colLeft--; $('colTime').textContent = colLeft;
        if (colLeft <= 0) {
            clearInterval(colorTimer);
            $('colWord').textContent = 'خلص الوقت! نتيجتك ' + colScore;
            $('colChoices').innerHTML = '';
            $('colStart').textContent = 'العب تاني';
            $('colStart').classList.remove('hidden');
            saveBest('color', colScore);
        }
    }, 1000);
}
function nextColor() {
    const word = COLORS[rand(0, 3)];
    let ink = COLORS[rand(0, 3)];
    while (ink.name === word.name) ink = COLORS[rand(0, 3)];
    colTarget = ink.name;
    const w = $('colWord');
    w.textContent = word.name;
    w.style.color = ink.hex;
    const box = $('colChoices');
    box.innerHTML = '';
    COLORS.slice().sort(() => Math.random() - 0.5).forEach(c => {
        const b = document.createElement('button');
        b.className = 'px-4 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 font-extrabold text-xl transition';
        b.textContent = c.name;
        b.onclick = () => { if (c.name === colTarget) colScore++; $('colScore').textContent = colScore; nextColor(); };
        box.appendChild(b);
    });
}

/* ========== 10) اضغط بسرعة (رد الفعل) ========== */
let reactTimer = null, reactStart = 0, reactReady = false;
function startReact() {
    clearTimeout(reactTimer);
    $('reBest').textContent = 'أفضل وقت: ' + (best('react') ? best('react') + ' ms' : '—');
    const box = $('reBox');
    box.className = 'w-full max-w-md mx-auto h-56 rounded-3xl bg-red-500 text-white text-2xl font-extrabold shadow-lg transition';
    box.textContent = 'استنى اللون الأخضر...';
    $('reMsg').textContent = '';
    reactReady = false;
    reactTimer = setTimeout(() => {
        reactReady = true; reactStart = performance.now();
        box.className = 'w-full max-w-md mx-auto h-56 rounded-3xl bg-emerald-500 text-white text-2xl font-extrabold shadow-lg transition';
        box.textContent = 'اضغط دلوقتي!';
    }, rand(1500, 4000));
}
function reactClick() {
    const box = $('reBox');
    if (box.textContent.startsWith('استنى')) {
        clearTimeout(reactTimer);
        $('reMsg').textContent = '⚠️ استنى اللون الأخضر!';
        box.textContent = 'اضغط "ابدأ" تاني';
        return;
    }
    if (!reactReady) return;
    const ms = Math.round(performance.now() - reactStart);
    reactReady = false;
    box.textContent = ms + ' ms';
    const prev = best('react');
    if (!prev || ms < prev) localStorage.setItem('game_react', ms);
    $('reMsg').textContent = ms < 300 ? '⚡ سريع جداً!' : ms < 500 ? '👍 كويس' : '🐢 جرّب تاني';
    $('reBest').textContent = 'أفضل وقت: ' + best('react') + ' ms';
}

/* ========== 11) طابق الكلمات (إنجليزي ↔ عربي) ========== */
const VOCAB = [['book', 'كتاب'], ['school', 'مدرسة'], ['pen', 'قلم'], ['teacher', 'معلم'], ['student', 'طالب'], ['sun', 'شمس'], ['water', 'ماء'], ['house', 'بيت']];
let voSel = null, voMistakes = 0, voLeftCount = 0;
function startVocab() {
    const set = VOCAB.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    voSel = null; voMistakes = 0; voLeftCount = set.length;
    $('voMoves').textContent = 'أخطاء: 0';
    $('voMsg').textContent = '';
    const left = $('voLeft'), right = $('voRight');
    left.innerHTML = ''; right.innerHTML = '';
    set.map(p => p[0]).forEach(en => left.appendChild(voBtn(en, en)));
    set.map(p => p[1]).sort(() => Math.random() - 0.5).forEach(ar => right.appendChild(voBtn(ar, set.find(p => p[1] === ar)[0])));
}
function voBtn(label, key) {
    const b = document.createElement('button');
    b.className = 'px-4 py-3 rounded-xl bg-slate-100 hover:bg-indigo-100 font-bold transition';
    b.textContent = label;
    b.dataset.key = key;
    b.onclick = () => voClick(b);
    return b;
}
function voClick(b) {
    if (b.disabled) return;
    const side = b.parentElement.id;
    if (!voSel) { voSel = b; b.classList.add('ring-4', 'ring-indigo-400'); return; }
    if (voSel === b) { voSel.classList.remove('ring-4', 'ring-indigo-400'); voSel = null; return; }
    if (voSel.parentElement.id === side) {
        voSel.classList.remove('ring-4', 'ring-indigo-400');
        voSel = b; b.classList.add('ring-4', 'ring-indigo-400');
        return;
    }
    const first = voSel;
    first.classList.remove('ring-4', 'ring-indigo-400');
    voSel = null;
    const right = b.dataset.key === first.dataset.key ? b : first;
    const other = right === b ? first : b;
    if (b.dataset.key === first.dataset.key) {
        [first, b].forEach(x => { x.disabled = true; x.classList.add('bg-emerald-200'); });
        voLeftCount--;
        if (voLeftCount === 0) $('voMsg').textContent = '🎉 ممتاز! وصّلت كل الكلمات بأخطاء ' + voMistakes;
    } else {
        voMistakes++;
        $('voMoves').textContent = 'أخطاء: ' + voMistakes;
        [first, b].forEach(x => x.classList.add('bg-red-200'));
        setTimeout(() => [first, b].forEach(x => x.classList.remove('bg-red-200')), 500);
    }
}
</script>
</body>
</html>