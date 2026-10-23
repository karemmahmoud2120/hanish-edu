<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function ttsFail(int $code, string $message): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        ['error' => $message],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

$me = function_exists('current_user') ? current_user() : ($_SESSION['user'] ?? null);

if (!$me || ($me['role'] ?? null) !== 'student') {
    ttsFail(403, 'غير مصرح');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    ttsFail(405, 'طلب غير صالح');
}

if (!check_csrf()) {
    ttsFail(403, 'رمز الجلسة غير صالح');
}

$rawText = (string) ($_POST['text'] ?? '');
$normalizedText = preg_replace('/\s+/u', ' ', $rawText);

if ($normalizedText === null) {
    ttsFail(400, 'النص غير صالح');
}

$text = trim($normalizedText);

if (function_exists('mb_substr')) {
    $text = mb_substr($text, 0, 800, 'UTF-8');
} else {
    $text = substr($text, 0, 800);
}

if ($text === '') {
    ttsFail(400, 'نص فارغ');
}

$today = date('Y-m-d');

if (($_SESSION['tts_day'] ?? '') !== $today) {
    $_SESSION['tts_day'] = $today;
    $_SESSION['tts_count'] = 0;
}

$key = defined('AZURE_SPEECH_KEY') ? trim((string) AZURE_SPEECH_KEY) : '';
$region = defined('AZURE_SPEECH_REGION') ? trim((string) AZURE_SPEECH_REGION) : '';
$voice = defined('TTS_VOICE') ? trim((string) TTS_VOICE) : 'ar-EG-ShakirNeural';

if (
    $key === ''
    || $region === ''
    || $key === 'ضع المفتاح هنا'
    || !preg_match('/^[a-z0-9-]+$/i', $region)
    || !preg_match('/^[a-zA-Z0-9-]+$/', $voice)
) {
    ttsFail(503, 'الصوت الواقعي مش مفعّل');
}

$dir = __DIR__ . '/uploads/tts';

if (!is_dir($dir)) {
    if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
        ttsFail(500, 'تعذر تجهيز مجلد الصوت');
    }
}

$file = $dir . '/' . sha1('v2|' . $voice . '|' . $text) . '.mp3';

if (!is_file($file) || filesize($file) < 500) {
    if ((int) ($_SESSION['tts_count'] ?? 0) >= 60) {
        ttsFail(429, 'وصلت للحد اليومي للصوت');
    }

    $sentences = preg_split(
        '/(?<=[.!؟?])\s+/u',
        $text,
        -1,
        PREG_SPLIT_NO_EMPTY
    );

    if ($sentences === false || $sentences === []) {
        $sentences = [$text];
    }

    $body = '';

    foreach ($sentences as $sentence) {
        $body .= htmlspecialchars(
            trim($sentence),
            ENT_XML1 | ENT_QUOTES,
            'UTF-8'
        ) . '<break time="320ms"/>';
    }

    $escapedVoice = htmlspecialchars($voice, ENT_XML1 | ENT_QUOTES, 'UTF-8');

    $ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ar-EG">'
        . '<voice name="' . $escapedVoice . '">'
        . '<prosody rate="0.93" pitch="+0%">' . $body . '</prosody>'
        . '</voice></speak>';

    $url = 'https://' . $region . '.tts.speech.microsoft.com/cognitiveservices/v1';
    $ch = curl_init($url);

    if ($ch === false) {
        ttsFail(502, 'تعذر توليد الصوت');
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $ssml,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/ssml+xml; charset=utf-8',
            'Ocp-Apim-Subscription-Key: ' . $key,
            'X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3',
            'User-Agent: hanish-teacher',
        ],
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
    ]);

    $audio = curl_exec($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!is_string($audio) || $statusCode !== 200 || strlen($audio) < 500) {
        ttsFail(502, 'تعذر توليد الصوت');
    }

    $temporaryFile = tempnam($dir, 'tts_');

    if ($temporaryFile === false) {
        ttsFail(500, 'تعذر حفظ الصوت');
    }

    if (file_put_contents($temporaryFile, $audio, LOCK_EX) === false) {
        @unlink($temporaryFile);
        ttsFail(500, 'تعذر حفظ الصوت');
    }

    if (!rename($temporaryFile, $file)) {
        @unlink($temporaryFile);
        ttsFail(500, 'تعذر حفظ الصوت');
    }

    $_SESSION['tts_count'] = (int) ($_SESSION['tts_count'] ?? 0) + 1;
}

$filesize = filesize($file);

if ($filesize === false || $filesize < 500) {
    ttsFail(500, 'تعذر قراءة ملف الصوت');
}

header('Content-Type: audio/mpeg');
header('Content-Length: ' . $filesize);
header('Cache-Control: private, max-age=3600');

readfile($file);
exit;