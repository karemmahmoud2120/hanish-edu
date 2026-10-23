<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

function json_reply(string $reply, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['reply' => $reply], JSON_UNESCAPED_UNICODE);
    exit;
}

function ask_ai(string $question, string $apiKey): ?string
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $payload = json_encode([
        'model'      => 'claude-haiku-5-5',
        'max_tokens' => 600,
        'system'     => 'أنت مساعد تعليمي لمنصة عائلة حنيش التعليمية في مصر. أجب باللغة العربية بأسلوب مبسط ومشجع، '
                      . 'واشرح خطوة بخطوة عند الحاجة. إذا كان السؤال خارج نطاق الدراسة فأجب باختصار وبأدب.',
        'messages'   => [['role' => 'user', 'content' => $question]],
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code !== 200) {
        return null;
    }

    $data = json_decode((string)$body, true);
    $text = $data['content'][0]['text'] ?? null;
    return (is_string($text) && $text !== '') ? $text : null;
}

function ask_groq(string $question, string $apiKey, string $model): ?string
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $payload = json_encode([
        'model' => $model,
        'max_tokens' => 600,
        'messages' => [
            ['role' => 'system', 'content' => 'أنت مساعد تعليمي لمنصة عائلة حنيش التعليمية في مصر. أجب باللغة العربية بأسلوب مبسط ومشجع، واشرح خطوة بخطوة عند الحاجة. إذا كان السؤال خارج نطاق الدراسة فأجب باختصار وبأدب.'],
            ['role' => 'user', 'content' => $question],
        ],
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code !== 200) {
        return null;
    }

    $data = json_decode((string)$body, true);
    $text = $data['choices'][0]['message']['content'] ?? null;
    return (is_string($text) && $text !== '') ? $text : null;
}

function ask_gemini(string $question, string $apiKey, string $model): ?string
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $payload = json_encode([
        'systemInstruction' => [
            'parts' => [['text' => 'أنت مساعد تعليمي لمنصة عائلة حنيش التعليمية في مصر. أجب باللغة العربية بأسلوب مبسط ومشجع، واشرح خطوة بخطوة عند الحاجة. إذا كان السؤال خارج نطاق الدراسة فأجب باختصار وبأدب.']],
        ],
        'contents' => [
            ['role' => 'user', 'parts' => [['text' => $question]]],
        ],
    ], JSON_UNESCAPED_UNICODE);

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code !== 200) {
        return null;
    }

    $data = json_decode((string)$body, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    return (is_string($text) && $text !== '') ? $text : null;
}

function fallback_reply(string $text): string
{
    if (str_contains($text, 'مرحلة') || str_contains($text, 'ابتدائي') || str_contains($text, 'ثانوي') || str_contains($text, 'إعدادي')) {
        return 'تضم منصة عائلة حنيش جميع المراحل من الأول الابتدائي حتى الثالث الثانوي. اختر المرحلة من قسم المراحل الدراسية في الصفحة الرئيسية.';
    }
    if (str_contains($text, 'درس') || str_contains($text, 'شرح') || str_contains($text, 'فيديو')) {
        return 'تجد أحدث الدروس والفيديوهات في قسم الدروس بالصفحة الرئيسية، وكل درس له رابط للمشاهدة مباشرة.';
    }
    if (str_contains($text, 'أكتوبر') || str_contains($text, 'حرب')) {
        return 'نعتز بذكرى انتصارات أكتوبر المجيدة 1973، رمز العزة والكرامة لأبطال مصر الباسلة!';
    }
    if (str_contains($text, 'مساعد') || str_contains($text, 'من أنت')) {
        return 'أنا مساعد منصة عائلة حنيش، أجيب على أسئلتك الدراسية وأساعدك في تنظيم وقت المذاكرة.';
    }
    if (str_contains($text, 'وزارة') || str_contains($text, 'التربية')) {
        return 'روابط تهمك موجودة في قسم مخصص بالصفحة الرئيسية.';
    }
    return 'المساعد الذكي غير متصل حالياً. تحقق من مفتاح GROQ_API_KEY في config.php أو حاول مرة أخرى بعد قليل.';
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_reply('أرسل رسالتك من خانة المحادثة في الصفحة.', 405);
    }

    $text = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 500);
    if ($text === '') {
        json_reply('اكتب سؤالك أولاً.');
    }

    $groqKey = defined('GROQ_API_KEY') ? (string)GROQ_API_KEY : '';
    if ($groqKey !== '' && $groqKey !== 'ضع_المفتاح_هنا') {
        $model = defined('GROQ_MODEL') ? (string)GROQ_MODEL : 'llama-3.3-70b-versatile';
        $answer = ask_groq($text, $groqKey, $model);
        if ($answer !== null) {
            json_reply($answer);
        }
    }

    $geminiKey = defined('GEMINI_API_KEY') ? (string)GEMINI_API_KEY : '';
    if ($geminiKey !== '' && $geminiKey !== 'ضع_المفتاح_هنا') {
        $model = defined('GEMINI_MODEL') ? (string)GEMINI_MODEL : 'gemini-2.0-flash';
        $answer = ask_gemini($text, $geminiKey, $model);
        if ($answer !== null) {
            json_reply($answer);
        }
    }

    $apiKey = defined('AI_API_KEY') ? (string)AI_API_KEY : '';
    if ($apiKey !== '' && $apiKey !== 'ضع_المفتاح_هنا') {
        $answer = ask_ai($text, $apiKey);
        if ($answer !== null) {
            json_reply($answer);
        }
    }

    json_reply(fallback_reply($text));
} catch (Throwable $ex) {
    json_reply('حدث خطأ داخلي في المساعد. حاول مرة أخرى بعد قليل.', 500);
}
