<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

/**
 * إرسال استجابة خطأ بصيغة JSON وإنهاء التنفيذ.
 */
function apiFail(int $statusCode, string $message): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        ['error' => $message],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

/**
 * إرسال نجاح بصيغة JSON وإنهاء التنفيذ.
 */
function apiSuccess(array $payload): never
{
    http_response_code(200);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

// التحقق من صلاحيات الطالب
$me = function_exists('current_user') ? current_user() : ($_SESSION['user'] ?? null);

if (!$me || ($me['role'] ?? null) !== 'student') {
    apiFail(403, 'عذرًا، هذه الخدمة متاحة للطلاب فقط.');
}

// التحقق من طريقة الطلب
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    apiFail(405, 'طريقة الطلب غير صالحة.');
}

// التحقق من رمز CSRF لحماية الجلسة
if (!check_csrf()) {
    apiFail(403, 'رمز الجلسة غير صالح أو منتهي الصلاحية.');
}

// استخراج مدخلات الطلب
$mode = trim((string) ($_POST['mode'] ?? 'chat'));
$subject = trim((string) ($_POST['subject'] ?? ''));
$question = trim((string) ($_POST['question'] ?? ''));
$studentGrade = (string) ($me['grade'] ?? 'غير محدد');

if ($question === '' && $mode !== 'models') {
    apiFail(400, 'يرجى إدخال السؤال أو الموضوع المطلوب للشرح.');
}

// جلب مفتاح Groq API من الإعدادات
$apiKey = defined('GROQ_API_KEY') ? trim((string) GROQ_API_KEY) : '';

if ($apiKey === '' || $apiKey === 'ضع_مفتاح_GROQ_هنا' || $apiKey === 'ضع المفتاح هنا') {
    apiFail(500, 'تأكد من إدخال مفتاح GROQ_API_KEY الصحيح في ملف config.php.');
}

// قائمة النماذج المعتمدة والرسمية الحديثة على Groq
$activeModels = [
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'llama-3.1-8b-instant'
];

if (defined('GROQ_MODEL') && !empty(GROQ_MODEL)) {
    array_unshift($activeModels, GROQ_MODEL);
}
$activeModels = array_unique($activeModels);

/**
 * دالة استدعاء واجهة Groq REST API عبر cURL
 */
function callGroq(string $prompt, string $apiKey, array $modelList, bool $isJsonMode = false): string
{
    $errors = [];
    $url = 'https://api.groq.com/openai/v1/chat/completions';

    foreach ($modelList as $model) {
        $cleanModel = trim($model);
        if ($cleanModel === '') continue;

        $messages = [
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        $payload = [
            'model' => $cleanModel,
            'messages' => $messages,
            'temperature' => 0.7,
            'stream' => false
        ];

        if ($isJsonMode) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $ch = curl_init($url);
        if ($ch === false) {
            continue;
        }

        $headers = [
            'Content-Type: application/json; charset=utf-8',
            'Authorization: Bearer ' . $apiKey
        ];

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
        ]);

        $response = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!is_string($response) || $statusCode !== 200) {
            $errDetails = '';
            if (is_string($response) && $response !== '') {
                $errJson = json_decode($response, true);
                if (isset($errJson['error']['message'])) {
                    $errDetails = ' - ' . $errJson['error']['message'];
                }
            }
            $errors[] = "Model {$cleanModel} [HTTP {$statusCode}]{$errDetails}";
            continue;
        }

        $data = json_decode($response, true);
        if (!is_array($data) || empty($data['choices'][0]['message']['content'])) {
            $errors[] = "Model {$cleanModel} returned invalid JSON structure";
            continue;
        }

        $fullText = trim((string) $data['choices'][0]['message']['content']);
        if ($fullText !== '') {
            return $fullText;
        }
    }

    $lastErr = end($errors) ?: 'تعذر الاتصال بـ API';
    apiFail(502, 'خطأ في المعلم الذكي (Groq): ' . $lastErr);
}

// ---------------------------------------------------------
// 1. وضع المحادثة (Chat Mode)
// ---------------------------------------------------------
if ($mode === 'chat') {
    $prompt = "أنت 'مستر يونس'، معلم صبور، مشجع، ولطيف للمناهج المصرية.\n"
        . "الصف الدراسي للطالب: {$studentGrade}\n"
        . "المادة: " . ($subject !== '' ? $subject : "عامة") . "\n"
        . "سؤال الطالب: {$question}\n\n"
        . "تعليمات الشرح:\n"
        . "1. اشرح بأسلوب مبسط وسهل يناسب مرحلته الدراسية وبشكل مباشر مشجع.\n"
        . "2. تجنب استخدام التنسيقات المعقدة أو رموز Markdown الكثيرة لكي يسهل قراءتها وسماعها.\n"
        . "3. استخدم اللغة العربية الفصحى البسيطة والأسلوب المشجع.";

    $reply = callGroq($prompt, $apiKey, $activeModels, false);
    apiSuccess(['reply' => $reply]);
}

// ---------------------------------------------------------
// 2. وضع الشرح التفاعلي (Interactive Lesson Mode)
// ---------------------------------------------------------
if ($mode === 'lesson') {
    $prompt = "أنت 'مستر يونس' معلم مصري ذكي وتفاعلي.\n"
        . "قم بإعداد درس تفاعلي قصير عن: " . ($question !== '' ? $question : "درس مهم في المنهج") . "\n"
        . "المادة: " . ($subject !== '' ? $subject : "عامة") . "\n"
        . "الصف الدراسي: {$studentGrade}\n\n"
        . "تنبيه مهم جداً: اكتب الناتِج بصيغة JSON فقط بدون أي علامات markdown أو أسطر زوائد أو نصوص خارج الكود.\n"
        . "الهيكل المطلوب للـ JSON كالتالي بالضبط:\n"
        . "{\n"
        . "  \"cards\": [\n"
        . "    {\n"
        . "      \"title\": \"عنوان الكارت الأول\",\n"
        . "      \"text\": \"شرح مبسط ومختصر للفكرة الأولى\",\n"
        . "      \"question\": \"سؤال اختر من متعدد سريع للتأكد من الفهم\",\n"
        . "      \"options\": [\"اختيار 1\", \"اختيار 2\", \"اختيار 3\"],\n"
        . "      \"answer\": 0\n"
        . "    },\n"
        . "    {\n"
        . "      \"title\": \"عنوان الكارت الثاني\",\n"
        . "      \"text\": \"شرح الفكرة الثانية\",\n"
        . "      \"question\": \"سؤال الكارت الثاني\",\n"
        . "      \"options\": [\"اختيار 1\", \"اختيار 2\", \"اختيار 3\"],\n"
        . "      \"answer\": 1\n"
        . "    },\n"
        . "    {\n"
        . "      \"title\": \"عنوان الكارت الثالث\",\n"
        . "      \"text\": \"تطبيق أو ملخص الفكرة الثالثة\",\n"
        . "      \"question\": \"سؤال الكارت الثالث\",\n"
        . "      \"options\": [\"اختيار 1\", \"اختيار 2\", \"اختيار 3\"],\n"
        . "      \"answer\": 2\n"
        . "    }\n"
        . "  ]\n"
        . "}\n"
        . "ملاحظة: رقم 'answer' يمثل Index الإجابة الصحيحة في مصفوفة 'options' (من 0 إلى 2).";

    $jsonRaw = callGroq($prompt, $apiKey, $activeModels, true);

    $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($jsonRaw));
    $cleanJson = preg_replace('/\s*```$/', '', $cleanJson);

    $parsed = json_decode($cleanJson, true);

    if (!is_array($parsed) || empty($parsed['cards'])) {
        apiFail(500, 'تعذر تجهيز الكروت التفاعلية لهذا الموضوع. يرجى المحاولة مرة أخرى.');
    }

    apiSuccess(['cards' => $parsed['cards']]);
}

// ---------------------------------------------------------
// 3. وضع استعراض النماذج المتاحة (Models List Mode)
// ---------------------------------------------------------
if ($mode === 'models') {
    $url = 'https://api.groq.com/openai/v1/models';
    $ch = curl_init($url);

    if ($ch === false) {
        apiFail(500, 'تعذر تهيئة الاتصال بجلب النماذج.');
    }

    $headers = [
        'Content-Type: application/json; charset=utf-8',
        'Authorization: Bearer ' . $apiKey
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
    ]);

    $response = curl_exec($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!is_string($response) || $statusCode !== 200) {
        apiFail(502, 'فشل جلب النماذج من Groq [HTTP ' . $statusCode . '] - تحقق من صلاحية مفتاح الـ API.');
    }

    $data = json_decode($response, true);
    apiSuccess($data);
}

// في حال عدم مطابقة أي وضع طلب (Mode)
apiFail(400, 'وضع الطلب غير صالحة.');