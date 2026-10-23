<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 5,
            ]
        );
    } catch (PDOException $ex) {
        http_response_code(503);
        $msg = DEBUG
            ? 'خطأ الاتصال: ' . $ex->getMessage()
            : 'تعذر الاتصال بقاعدة البيانات. تأكد من بيانات DB_HOST و DB_NAME و DB_USER و DB_PASS في config.php.';
        die('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"></head>'
            . '<body style="font-family:sans-serif;padding:2rem;direction:rtl">' . e($msg) . '</body></html>');
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        video VARCHAR(500) NOT NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM('student','parent') NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        grade VARCHAR(50) NULL,
        link_code VARCHAR(10) NULL UNIQUE,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS parent_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        student_id INT NOT NULL,
        created_at VARCHAR(30) NOT NULL,
        UNIQUE KEY uniq_link (parent_id, student_id),
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        pinned TINYINT(1) NOT NULL DEFAULT 0,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS ministry_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        icon VARCHAR(20) NOT NULL DEFAULT '🔗',
        sort_order INT NOT NULL DEFAULT 0,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $now = date('Y-m-d H:i:s');

    if ((int)$pdo->query('SELECT COUNT(*) FROM lessons')->fetchColumn() === 0) {
        $ins = $pdo->prepare('INSERT INTO lessons (title, stage, subject, description, video, created_at)
                              VALUES (?, ?, ?, ?, ?, ?)');
        $seed = [
            ['شرح قواعد النحو والصرف للصف الأول الإعدادي', STAGES[1], 'اللغة العربية',
             'مراجعة شاملة ومبسطة لأهم قواعد النحو والصرف مع أمثلة وتدريبات تفاعلية.',
             'https://www.youtube.com/watch?v=example1', '2026-06-01'],
            ['أساسيات الجبر والهندسة التحليلية', STAGES[2], 'الرياضيات',
             'درس احترافي يغطي قوانين الجبر والهندسة بطريقة سهلة ومبسطة لأبناء العائلة.',
             'https://www.youtube.com/watch?v=example2', '2026-06-03'],
            ['تجربة العلوم والتفاعلات الكيميائية المبسطة', STAGES[0], 'العلوم',
             'فيديو تعليمي ممتع يوضح عجائب التفاعلات الكيميائية للأطفال والنشء.',
             'https://www.youtube.com/watch?v=example3', '2026-06-05'],
        ];
        foreach ($seed as $row) {
            $ins->execute($row);
        }
    }

    if ((int)$pdo->query('SELECT COUNT(*) FROM news')->fetchColumn() === 0) {
        $ins = $pdo->prepare('INSERT INTO news (type, title, body, pinned, created_at) VALUES (?, ?, ?, ?, ?)');
        $ins->execute(['news', 'مرحباً بكم في منصة عائلة حنيش التعليمية',
            'منصة تعليمية لأبناء العائلة: دروس مشروحة، ومتابعة لأولياء الأمور، ومساعد ذكي للأسئلة.', 1, $now]);
        $ins->execute(['announcement', 'التسجيل متاح للطلاب وأولياء الأمور',
            'أنشئ حسابك من زر الدخول، وسيحصل الطالب على كود ربط يعطيه لولي أمره.', 0, $now]);
        $ins->execute(['news', 'دروس جديدة تُضاف بشكل دوري',
            'تتابع الإدارة إضافة الشروح الجديدة في كل المراحل الدراسية.', 0, $now]);
    }

    if ((int)$pdo->query('SELECT COUNT(*) FROM ministry_links')->fetchColumn() === 0) {
        $ins = $pdo->prepare('INSERT INTO ministry_links (title, url, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)');
        $ins->execute(['الموقع الرسمي لوزارة التربية والتعليم', 'https://moe.gov.eg', '🏛️', 1, $now]);
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        permissions VARCHAR(255) NOT NULL DEFAULT '',
        is_owner TINYINT(1) NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    if ((int)$pdo->query('SELECT COUNT(*) FROM staff')->fetchColumn() === 0) {
        $ins = $pdo->prepare('INSERT INTO staff (name, email, password_hash, permissions, is_owner, active, created_at)
                              VALUES (?, ?, ?, ?, 1, 1, ?)');
        $ins->execute(['المالك', strtolower(ADMIN_EMAIL), password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT),
                       'lessons,news,links,users', $now]);
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS exam_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        score DECIMAL(7,2) NOT NULL,
        max_score DECIMAL(7,2) NOT NULL,
        exam_date VARCHAR(20) NOT NULL,
        created_at VARCHAR(30) NOT NULL,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        question TEXT NOT NULL,
        opt1 VARCHAR(255) NOT NULL,
        opt2 VARCHAR(255) NOT NULL,
        opt3 VARCHAR(255) NOT NULL,
        opt4 VARCHAR(255) NOT NULL,
        correct TINYINT NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        student_id INT NOT NULL,
        score INT NOT NULL,
        total INT NOT NULL,
        created_at VARCHAR(30) NOT NULL,
        UNIQUE KEY uniq_attempt (quiz_id, student_id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        channel_id VARCHAR(40) NOT NULL UNIQUE,
        stage VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        last_checked VARCHAR(30) NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pending_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_row INT NOT NULL,
        video_id VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(300) NOT NULL,
        description TEXT NULL,
        thumb VARCHAR(255) NULL,
        url VARCHAR(255) NOT NULL,
        published VARCHAR(30) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at VARCHAR(30) NOT NULL,
        FOREIGN KEY (channel_row) REFERENCES channels(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS exam_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(10) NOT NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(10) NOT NULL,
        grades TEXT NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    foreach (['lessons', 'quizzes', 'exam_files'] as $t) {
        try {
            $pdo->exec("ALTER TABLE $t ADD COLUMN grades TEXT NULL");
        } catch (PDOException $ex) {
            // العمود موجود بالفعل
        }
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL,
        message TEXT NOT NULL,
        created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS study_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        due_date VARCHAR(10) NOT NULL,
        done TINYINT(1) NOT NULL DEFAULT 0,
        created_at VARCHAR(30) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS favorites (
        user_id INT NOT NULL,
        item_type VARCHAR(10) NOT NULL,
        item_id INT NOT NULL,
        created_at VARCHAR(30) NOT NULL,
        PRIMARY KEY (user_id, item_type, item_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS flashcards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        deck VARCHAR(100) NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        box TINYINT NOT NULL DEFAULT 0,
        created_at VARCHAR(30) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS page_views (
        day VARCHAR(10) PRIMARY KEY,
        views INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS lesson_views (
        lesson_id INT PRIMARY KEY,
        views INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS lesson_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT NOT NULL,
        user_id INT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at VARCHAR(30) NOT NULL,
        answered_at VARCHAR(30) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    try {
        $pdo->exec("ALTER TABLE news ADD COLUMN publish_at VARCHAR(30) NULL");
    } catch (PDOException $ex) {
        // العمود موجود بالفعل
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS curriculum (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        UNIQUE KEY uniq_subject (grade, subject)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    if ((int)$pdo->query('SELECT COUNT(*) FROM curriculum')->fetchColumn() === 0) {
        // مواد أساسية حسب إعلانات الوزارة لـ 2026/2027، والثانوي عام وتراجعه الإدارة حسب الشعبة
        $ins = $pdo->prepare('INSERT IGNORE INTO curriculum (grade, subject) VALUES (?, ?)');
        $primary1to3 = ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'التربية الدينية', 'الدراسات الاجتماعية'];
        $primary4to6 = ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'];
        $prep        = ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'];
        $secondary   = ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'الدراسات الاجتماعية', 'التربية الدينية', 'الفيزياء', 'الكيمياء', 'الأحياء'];
        foreach (GRADE_YEARS as $si => $years) {
            foreach ($years as $idx => $grade) {
                $list = $si === 2 ? $secondary : ($si === 1 ? $prep : ($idx < 3 ? $primary1to3 : $primary4to6));
                foreach ($list as $subj) {
                    $ins->execute([$grade, $subj]);
                }
            }
        }
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
        k VARCHAR(50) PRIMARY KEY,
        v TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    return $pdo;
}
