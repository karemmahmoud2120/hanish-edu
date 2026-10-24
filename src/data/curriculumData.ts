export interface LessonItem {
  id: string;
  title: string;
  stageId: 'primary' | 'prep' | 'secondary';
  gradeName: string;
  subject: string;
  videoUrl: string;
  duration: string;
  description: string;
  summaryPoints: string[];
  views: number;
  likes: number;
  questions: {
    id: string;
    studentName: string;
    question: string;
    answer?: string;
    date: string;
  }[];
}

export interface BookletItem {
  id: string;
  title: string;
  stageId: 'primary' | 'prep' | 'secondary';
  gradeName: string;
  subject: string;
  fileType: 'pdf' | 'docx' | 'pptx';
  fileSize: string;
  pages: number;
  downloadUrl: string;
  description: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizItem {
  id: string;
  title: string;
  stageId: 'primary' | 'prep' | 'secondary';
  gradeName: string;
  subject: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  passingScore: number;
  passingScoreType?: 'percentage' | 'questions';
}

export const getQuizPassingPercentage = (quiz: QuizItem) =>
  quiz.passingScoreType === 'percentage'
    ? quiz.passingScore
    : Math.round((quiz.passingScore / quiz.questions.length) * 100);

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
}

export const INITIAL_USEFUL_LINKS: UsefulLink[] = [
  {
    id: 'link-ministry',
    title: 'وزارة التربية والتعليم والتعليم الفني',
    url: 'https://moe.gov.eg/',
    description: 'الموقع الرسمي للوزارة والأخبار والخدمات التعليمية.',
    category: 'مصادر رسمية',
  },
  {
    id: 'link-ekb',
    title: 'بنك المعرفة المصري',
    url: 'https://www.ekb.eg/',
    description: 'مصادر معرفة ومراجع تعليمية وبحثية للطلاب والمعلمين.',
    category: 'مصادر تعليمية',
  },
  {
    id: 'link-study-ekb',
    title: 'منصة إدارة التعلم ببنك المعرفة',
    url: 'https://study.ekb.eg/',
    description: 'بوابة المحتوى التعليمي الرقمية التابعة لبنك المعرفة المصري.',
    category: 'مصادر تعليمية',
  },
];

export interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  box: number; // 0 to 4 (Leitner system)
  gradeName: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  done: boolean;
  xpPoints: number;
}

export interface ExamResult {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  gradeName: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  gradeName: string;
  stageId: 'primary' | 'prep' | 'secondary';
  linkCode: string;
  xpPoints: number;
  streakDays: number;
  badges: string[];
}

export const STAGES = [
  {
    id: 'primary',
    name: 'المرحلة الابتدائية',
    years: [
      'الصف الأول الابتدائي',
      'الصف الثاني الابتدائي',
      'الصف الثالث الابتدائي',
      'الصف الرابع الابتدائي',
      'الصف الخامس الابتدائي',
      'الصف السادس الابتدائي',
    ],
    color: 'emerald',
    icon: '🎒',
    description: 'تأسيس ممتاز في القراءة واللغة والرياضيات والعلوم الأساسية.',
  },
  {
    id: 'prep',
    name: 'المرحلة الإعدادية',
    years: [
      'الصف الأول الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الثالث الإعدادي',
    ],
    color: 'blue',
    icon: '🔬',
    description: 'مناهج العلوم والرياضيات واللغات التأسيسية للمرحلة الثانوية.',
  },
  {
    id: 'secondary',
    name: 'المرحلة الثانوية',
    years: [
      'الصف الأول الثانوي',
      'الصف الثاني الثانوي',
      'الصف الثالث الثانوي',
    ],
    color: 'purple',
    icon: '🎓',
    description: 'تحضير تخصصي عالي (علمي وأدبي) لاجتياز امتحانات الثانوية العامة بثقة.',
  },
] as const;

export const SUBJECTS_BY_STAGE: Record<string, string[]> = {
  primary: ['اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الدراسات الاجتماعية', 'التربية الدينية', 'المهارات المهنية'],
  prep: ['اللغة العربية', 'الرياضيات (الجبر والهندسة)', 'العلوم', 'اللغة الإنجليزية', 'الدراسات الاجتماعية', 'التربية الدينية'],
  secondary: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات البحتة والتطبيقية', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'الفلسفة والمنطق'],
};

export const INITIAL_LESSONS: LessonItem[] = [
  {
    id: 'les-1',
    title: 'شرح شامل لقواعد النحو والصرف: أنواع الخبر وكان وأخواتها',
    stageId: 'prep',
    gradeName: 'الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    videoUrl: 'https://www.youtube.com/watch?v=example1',
    duration: '24 دقيقة',
    description: 'درس مبسط يشرح أنواع الخبر (المفرد والجملة وشبه الجملة) مع تطبيقات إعرابية وتدريبات تدريجية.',
    summaryPoints: [
      'الخبر المفرد ما ليس جملة ولا شبه جملة ويطابق المبتدأ في الإفراد والتذكير.',
      'خبر الجملة الاسمية والفعلية يشترط وجود ضمير يربطه بالمبتدأ.',
      'شبه الجملة إما ظرف أو جار ومجرور ويكون في محل رفع خبر.',
    ],
    views: 1420,
    likes: 285,
    questions: [
      {
        id: 'q-101',
        studentName: 'أحمد محمود',
        question: 'هل يمكن أن يتقدم خبر شبه الجملة على المبتدأ وجوباً؟',
        answer: 'نعم يا بطل! إذا كان المبتدأ نكرة والخبر شبه جملة، مثل: (في التأني السلامة / في بيتنا ضيف).',
        date: 'منذ يومين',
      },
    ],
  },
  {
    id: 'les-2',
    title: 'أساسيات الجبر والمعادلات الخطية وحل المتباينات',
    stageId: 'prep',
    gradeName: 'الصف الثاني الإعدادي',
    subject: 'الرياضيات (الجبر والهندسة)',
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    duration: '32 دقيقة',
    description: 'شرح استراتيجيات حل المعادلات من الدرجة الأولى في متغيرين وتمثيلها بيانياً.',
    summaryPoints: [
      'التعويض والحذف طريقتان لحل نظام من معادلتين خطيتين جبرياً.',
      'نقطة تقاطع المستقيمين بيانياً هي مجموعة الحل للنظام.',
      'تغيير إشارة المتباينة عند القسمة على عدد سالب قاعدة لا تنساها أبداً.',
    ],
    views: 1980,
    likes: 410,
    questions: [
      {
        id: 'q-102',
        studentName: 'مريم كريم',
        question: 'متى تكون مجموعة الحل فاي (مستحيل الحل)؟',
        answer: 'عندما يكون المستقيمان متوازيين وغير منطبقين (أي الميل متساوٍ والحد المطلق مختلف).',
        date: 'منذ أسبوع',
      },
    ],
  },
  {
    id: 'les-3',
    title: 'تفاعلات الأكسدة والاختزال ومفهوم الإلكترونات الحديث',
    stageId: 'prep',
    gradeName: 'الصف الثالث الإعدادي',
    subject: 'العلوم',
    videoUrl: 'https://www.youtube.com/watch?v=example3',
    duration: '28 دقيقة',
    description: 'توضيح تجارب التفاعلات الكيميائية ومفهوم الأكسدة والاختزال بالمفهوم التقليدي والمفهوم الإلكتروني.',
    summaryPoints: [
      'الأكسدة التقليدية: زيادة نسبة الأكسجين أو نقص الهيدروجين.',
      'الأكسدة الإلكترونية: عملية فقد إلكترونات ينتج عنها زيادة الشحنة الموجبة.',
      'العامل المؤكسد هو المادة التي تكتسب إلكترونات وتحدث لها عملية اختزال.',
    ],
    views: 2650,
    likes: 580,
    questions: [],
  },
  {
    id: 'les-4',
    title: 'قوانين نيوتن للحركة والجاذبية الكونية وتطبيقات الأقمار الصناعية',
    stageId: 'secondary',
    gradeName: 'الصف الأول الثانوي',
    subject: 'الفيزياء',
    videoUrl: 'https://www.youtube.com/watch?v=example4',
    duration: '35 دقيقة',
    description: 'دراسة الحركة الدائرية المنتظمة، السرعة المدارية للقمر الصناعي، واستنتاج قوة الجذب المركزية.',
    summaryPoints: [
      'القوة الجاذبة المركزية عمودية على اتجاه الحركة وتغير الاتجاه دون المقدار.',
      'السرعة المدارية للقمر الصناعي تتناسب عكسياً مع الجذر التربيعي لنصف قطر مداره.',
      'حالة انعدام الوزن الظاهري داخل المركبات الفضائية ناتجة عن السقوط الحر المستمر.',
    ],
    views: 3410,
    likes: 720,
    questions: [],
  },
  {
    id: 'les-5',
    title: 'الروابط الكيميائية والتهجين ونظرية تنافر أزواج الإلكترونات',
    stageId: 'secondary',
    gradeName: 'الصف الثاني الثانوي',
    subject: 'الكيمياء',
    videoUrl: 'https://www.youtube.com/watch?v=example5',
    duration: '30 دقيقة',
    description: 'فهم أشكال الجزيئات الفراغية وزوايا الروابط لنماذج الميثان والنشادر والماء وتحديد نوع التهجين.',
    summaryPoints: [
      'التهجين sp3 يعطي شكلاً رباعي الأوجه بزاوية 109.5 درجات في الميثان.',
      'وجود أزواج الإلكترونات الحرة يقلل زوايا الروابط بسبب زيادة قوى التنافر.',
      'الرابطة سيجما أقوى من الرابطة باي لأن التداخل يحدث بالرأس.',
    ],
    views: 2890,
    likes: 615,
    questions: [],
  },
  {
    id: 'les-6',
    title: 'رحلة استكشاف الجهاز الهضمي وحقائق مذهلة عن التغذية السليمة',
    stageId: 'primary',
    gradeName: 'الصف الرابع الابتدائي',
    subject: 'العلوم',
    videoUrl: 'https://www.youtube.com/watch?v=example6',
    duration: '18 دقيقة',
    description: 'فيديو تفاعلي مشوق للأبطال الصغار يشرح كيف يستفيد الجسم من الطعام خطوة بخطوة من الفم للأمعاء.',
    summaryPoints: [
      'الهضم يبدأ في الفم بتكسير الطعام بالأسنان وإفراز اللعاب لهضم النشويات.',
      'المعدة تفرز العصارة المعدية الهاضمة للبروتينات.',
      'امتصاص الغذاء المهضوم يتم عبر خملات الأمعاء الدقيقة لنقله إلى الدم.',
    ],
    views: 1890,
    likes: 430,
    questions: [],
  },
];

export const INITIAL_BOOKLETS: BookletItem[] = [
  {
    id: 'bk-1',
    title: 'مذكرة ليلة الامتحان في قواعد النحو والإملاء - مراجعة شاملة',
    stageId: 'prep',
    gradeName: 'الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    fileType: 'pdf',
    fileSize: '4.2 MB',
    pages: 28,
    downloadUrl: '#',
    description: 'تحتوي على جداول إعرابية ملخصة و 100 قطعة نحوية مجاب عنها بالتفصيل وفق أحدث المواصفات.',
  },
  {
    id: 'bk-2',
    title: 'ملزمة كبسولة الجبر والإحصاء: القوانين والأفكار الأساسية',
    stageId: 'prep',
    gradeName: 'الصف الثاني الإعدادي',
    subject: 'الرياضيات (الجبر والهندسة)',
    fileType: 'pdf',
    fileSize: '6.8 MB',
    pages: 36,
    downloadUrl: '#',
    description: 'شرح بالخطوات لقوانين التحليل والجذور التكعيبية والعمليات على الفترات الحقيقية.',
  },
  {
    id: 'bk-3',
    title: 'بنك أسئلة العلوم الشامل للمتفوقين - اختبارات الفهم العالي',
    stageId: 'prep',
    gradeName: 'الصف الثالث الإعدادي',
    subject: 'العلوم',
    fileType: 'pdf',
    fileSize: '5.1 MB',
    pages: 42,
    downloadUrl: '#',
    description: 'أقوى مراجعة للوراثة ومندل والمرايا والعدسات والكون والنظام الشمسي.',
  },
  {
    id: 'bk-4',
    title: 'خرائط ومخططات مفاهيم الفيزياء: الحركة الدائرية وقوانين الجاذبية',
    stageId: 'secondary',
    gradeName: 'الصف الأول الثانوي',
    subject: 'الفيزياء',
    fileType: 'pdf',
    fileSize: '8.4 MB',
    pages: 45,
    downloadUrl: '#',
    description: 'ملزمة رسومات بيانية ملونة تشرح استنتاج القوانين وحل مسائل الأقمار الصناعية وكمية التحرك.',
  },
  {
    id: 'bk-5',
    title: 'كتيب تأسيس الرياضيات السريعة وجدول الضرب بالألعاب',
    stageId: 'primary',
    gradeName: 'الصف الثالث الابتدائي',
    subject: 'الرياضيات',
    fileType: 'pdf',
    fileSize: '3.6 MB',
    pages: 22,
    downloadUrl: '#',
    description: 'تدريبات ممتعة ورسوم ملونة لتقوية الحساب الذهني وسرعة البديهة لأطفالنا.',
  },
];

export const INITIAL_QUIZZES: QuizItem[] = [
  {
    id: 'qz-1',
    title: 'امتحان قياس الفهم: أنواع الخبر والروابط الإعرابية',
    stageId: 'prep',
    gradeName: 'الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    durationMinutes: 10,
    passingScore: 3,
    questions: [
      {
        id: 'q1',
        question: 'في جملة (العلم نوره ساطع)، ما نوع الخبر؟',
        options: ['خبر مفرد', 'خبر جملة اسمية', 'خبر جملة فعلية', 'خبر شبه جملة'],
        correctIndex: 1,
        explanation: 'الخبر يتكون من مبتدأ ثانٍ (نوره) مضاف لضمير وخبر له (ساطع)، والجملة الاسمية في محل رفع خبر للمبتدأ الأول.',
      },
      {
        id: 'q2',
        question: 'أي من الجمل التالية تشتمل على خبر شبه جملة؟',
        options: ['الشمس تشرق صباحاً', 'النجاح فوق القمة', 'المؤمن قلبه نقي', 'الربيع جوه بديع'],
        correctIndex: 1,
        explanation: 'الظرف (فوق القمة) هو شبه الجملة الذي تمم معنى المبتدأ (النجاح).',
      },
      {
        id: 'q3',
        question: 'ما إعراب كلمة (مجتهدون) في: (الطلاب مجتهدون في دراستهم)؟',
        options: ['مبتدأ ثانٍ مرفوع بالواو', 'خبر مرفوع وعلامة رفعه الواو لأنه جمع مذكر سالم', 'نعت مرفوع بالواو', 'حال منصوب بالياء'],
        correctIndex: 1,
        explanation: 'كلمة (مجتهدون) هي كلمة مفردة تممت معنى المبتدأ وعلامة رفعها الواو.',
      },
      {
        id: 'q4',
        question: 'ما الرابط في جملة الخبر: (المعلم يشرح الدرس بإخلاص)؟',
        options: ['الواو في بإخلاص', 'ضمير مستتر تقديره هو', 'كلمة الدرس', 'لا يوجد رابط'],
        correctIndex: 1,
        explanation: 'الفعل (يشرح) فاعله ضمير مستتر تقديره (هو) يعود على المبتدأ (المعلم) وهو الرابط.',
      },
    ],
  },
  {
    id: 'qz-2',
    title: 'تحدي الكيمياء الذكي: الروابط والتهجين الفراغي',
    stageId: 'secondary',
    gradeName: 'الصف الثاني الثانوي',
    subject: 'الكيمياء',
    durationMinutes: 12,
    passingScore: 3,
    questions: [
      {
        id: 'q21',
        question: 'ما نوع التهجين في ذرة الكربون داخل جزيء الميثان CH4؟',
        options: ['sp', 'sp2', 'sp3', 'sp3d'],
        correctIndex: 2,
        explanation: 'تتداخل أوربيتال s مع ثلاثة أوربيتالات p لتكوين 4 أوربيتالات مهجنة متماثلة من النوع sp3.',
      },
      {
        id: 'q22',
        question: 'لماذا تكون الزاوية بين الروابط في جزيء الماء (104.5°) أصغر من الميثان (109.5°)؟',
        options: ['لكبر حجم ذرة الأكسجين', 'بسبب قوى التنافر الكبيرة الناتجة عن وجود زوجين حرين من الإلكترونات', 'لأن الرابطة أيونية', 'بسبب وجود روابط هيدروجينية داخلية'],
        correctIndex: 1,
        explanation: 'الأزواج الحرة تشغل حيزاً فراغياً أكبر وتضغط على الأزواج الرابطة فتقل الزاوية بينها.',
      },
      {
        id: 'q23',
        question: 'كم عدد الروابط سيجما وباي في جزيء الإيثاين (الأسيتيلين C2H2)؟',
        options: ['3 سيجما و 2 باي', '2 سيجما و 3 باي', '4 سيجما و 1 باي', '5 سيجما فقط'],
        correctIndex: 0,
        explanation: 'يحتوي على رابطة ثلاثية بين ذرتي الكربون (واحدة سيجما واثنتان باي)، بالإضافة لرابطتين أحاديتين سيجما مع الهيدروجين.',
      },
    ],
  },
  {
    id: 'qz-3',
    title: 'اختبار العلوم السريع: التفاعلات الكيميائية والمفاهيم',
    stageId: 'prep',
    gradeName: 'الصف الثالث الإعدادي',
    subject: 'العلوم',
    durationMinutes: 8,
    passingScore: 2,
    questions: [
      {
        id: 'q31',
        question: 'في المفهوم الإلكتروني، ما هي عملية الاختزال؟',
        options: ['فقد إلكترونات', 'اكتساب إلكترونات', 'فقد ذرات هيدروجين', 'اتحاد مع الأكسجين فقط'],
        correctIndex: 1,
        explanation: 'الاختزال هو عملية كيميائية تكتسب فيها الذرة إلكتروناً أو أكثر.',
      },
      {
        id: 'q32',
        question: 'المادة التي تعطي الأكسجين أو تنتزع الهيدروجين أثناء التفاعل تسمى:',
        options: ['العامل المختزل', 'العامل المؤكسد', 'العامل الحفاز', 'المركب الناتج'],
        correctIndex: 1,
        explanation: 'العامل المؤكسد هو الذي يؤكسد غيره باكتساب إلكترونات أو منح أكسجين.',
      },
    ],
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    deck: 'نحو وصرف - ثوابت إعرابية',
    front: 'ما إعراب الكلمة المعرفة بأل بعد اسم الإشارة؟ (مثال: هذا الطالبُ مجتهد)',
    back: 'تُعرب (بدل مطابق) مرفوع أو منصوب أو مجرور حسب إعراب اسم الإشارة، بشرط أن يكون هو المشار إليه.',
    box: 1,
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'fc-2',
    deck: 'نحو وصرف - ثوابت إعرابية',
    front: 'ما الفرق بين واو المعية وواو العطف؟',
    back: 'واو المعية تفيد المصاحبة ولا تدل على المشاركة في الفعل ويأتي بعدها (مفعول معه منصوب)، بينما واو العطف تقتضي المشاركة ويتبع المعطوف المعطوف عليه.',
    box: 0,
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'fc-3',
    deck: 'فيزياء - قوانين الحركة',
    front: 'ما نص القانون الأول لنيوتن؟',
    back: 'يظل الجسم على حالته من السكون أو الحركة بسرعة منتظمة في خط مستقيم ما لم تؤثر عليه قوة محصلة تغير من حالته.',
    box: 2,
    gradeName: 'الصف الأول الثانوي',
  },
  {
    id: 'fc-4',
    deck: 'كيمياء - أرقام وتصنيفات',
    front: 'ما هي الزوايا الفراغية في تهجين sp و sp2 و sp3؟',
    back: 'sp: خطي 180°\nsp2: مثلث مستو 120°\nsp3: رباعي الأوجه 109.5°',
    box: 3,
    gradeName: 'الصف الثاني الثانوي',
  },
  {
    id: 'fc-5',
    deck: 'علوم - أجهزة الجسم',
    front: 'أين يتم امتصاص معظم الماء والأملاح في الجهاز الهضمي؟',
    back: 'في الأمعاء الغليظة (القولون) قبل طرد الفضلات خارج الجسم.',
    box: 1,
    gradeName: 'الصف الرابع الابتدائي',
  },
];

export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'tsk-1',
    title: 'مشاهدة فيديو أنواع الخبر وحل 15 مسألة إعراب',
    subject: 'اللغة العربية',
    dueDate: new Date().toISOString().split('T')[0],
    done: false,
    xpPoints: 30,
  },
  {
    id: 'tsk-2',
    title: 'مراجعة بطاقات الروابط الكيميائية بالصندوق 2',
    subject: 'الكيمياء',
    dueDate: new Date().toISOString().split('T')[0],
    done: true,
    xpPoints: 20,
  },
  {
    id: 'tsk-3',
    title: 'حل امتحان تجريبي على الحركة الدائرية وقوانين نيوتن',
    subject: 'الفيزياء',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    done: false,
    xpPoints: 50,
  },
];

export const INITIAL_STUDENT: StudentProfile = {
  id: 'stu-demo',
  name: 'كريم محمود حنيش',
  email: 'karem.mahmoud2120@gmail.com',
  role: 'student',
  gradeName: 'الصف الأول الإعدادي',
  stageId: 'prep',
  linkCode: 'HN8293',
  xpPoints: 340,
  streakDays: 5,
  badges: ['🌱 البداية الواثقة', '🔥 مجتهد الأسبوع', '⭐ بطل الامتحانات', '💎 متفوق الرياضيات'],
};

export const INITIAL_EXAM_RESULTS: ExamResult[] = [
  {
    id: 'res-0',
    quizId: 'qz-0',
    quizTitle: 'اختبار تشخيصي تمهيدي',
    subject: 'الرياضيات',
    score: 15,
    maxScore: 20,
    date: '2026-09-28',
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'res-1',
    quizId: 'qz-1',
    quizTitle: 'امتحان قياس الفهم: أنواع الخبر',
    subject: 'اللغة العربية',
    score: 3.5,
    maxScore: 4,
    date: '2026-10-05',
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'res-2',
    quizId: 'qz-3',
    quizTitle: 'اختبار العلوم: التفاعلات الكيميائية',
    subject: 'العلوم',
    score: 1.8,
    maxScore: 2,
    date: '2026-10-12',
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'res-3',
    quizId: 'qz-2',
    quizTitle: 'اختبار الجبر والمعادلات الخطية',
    subject: 'الرياضيات',
    score: 9.5,
    maxScore: 10,
    date: '2026-10-18',
    gradeName: 'الصف الأول الإعدادي',
  },
  {
    id: 'res-4',
    quizId: 'qz-4',
    quizTitle: 'مراجعة منتصف الفصل: النحو والقراءة',
    subject: 'اللغة العربية',
    score: 20,
    maxScore: 20,
    date: '2026-10-22',
    gradeName: 'الصف الأول الإعدادي',
  },
];

export const HONOR_STUDENTS = [
  { name: 'مريم كريم حنيش', grade: 'الصف الأول الثانوي', average: 98.5, badge: '🥇 الأولى' },
  { name: 'كريم محمود حنيش', grade: 'الصف الأول الإعدادي', average: 97.2, badge: '🥈 الثاني' },
  { name: 'عمر ياسر حنيش', grade: 'الصف الخامس الابتدائي', average: 96.0, badge: '🥉 الثالث' },
  { name: 'سلمى أحمد حنيش', grade: 'الصف الثاني الإعدادي', average: 95.4, badge: '⭐ متفوقة' },
  { name: 'يوسف طارق حنيش', grade: 'الصف الثالث الثانوي', average: 94.8, badge: '⭐ متفوق' },
];

export const MINISTRY_LINKS = [
  { title: 'بوابة المناهج والكتب المدرسية - وزارة التربية والتعليم', url: 'https://moe.gov.eg', icon: '🏛️' },
  { title: 'بنك المعرفة المصري (EKB)', url: 'https://www.ekb.eg', icon: '📚' },
  { title: 'منصة البث المباشر للحصص الافتراضية', url: 'https://stream.moe.gov.eg', icon: '📡' },
  { title: 'بوابة مركز معلومات وزارة التربية والتعليم للخدمات الإلكترونية', url: 'https://emis.gov.eg', icon: '💻' },
];
