import React, { useState } from 'react';
import { PLATFORM_IMAGES } from '../assets/images';
import { AcademicLogo } from './AcademicLogo';
import {
  MapPin,
  Search,
  Filter,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Compass,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Share2,
  ExternalLink,
  ChevronRight,
  Flame,
  Star,
  Globe2,
} from 'lucide-react';

interface KnowYourCountryProps {
  onAddXP?: (amount: number, reason: string) => void;
}

// ----------------------------------------------------
// 1. Data: The 27 Egyptian Governorates
// ----------------------------------------------------
export interface Governorate {
  id: string;
  name: string;
  capital: string;
  region: 'cairo' | 'canal_alex' | 'delta' | 'upper_egypt' | 'frontier';
  regionLabel: string;
  populationApprox: string;
  landmarks: string[];
  keyIndustries: string[];
  famousFigures: string[];
  funFact: string;
}

export const EGYPTIAN_GOVERNORATES: Governorate[] = [
  // القاهرة الكبرى
  {
    id: 'cairo',
    name: 'محافظة القاهرة',
    capital: 'القاهرة (العاصمة)',
    region: 'cairo',
    regionLabel: 'القاهرة الكبرى',
    populationApprox: '10.2 مليون نسمة',
    landmarks: ['الجامع الأزهر الشريف', 'قلعة صلاح الدين الأيوبي', 'خان الخليلي', 'برج القاهرة', 'المتحف المصري بالتحرير'],
    keyIndustries: ['الخدمات المالية', 'الصناعات التكنولوجية', 'السياحة التراثية', 'الحرف التقليدية'],
    famousFigures: ['نجيب محفوظ (نوبل للأدب)', 'د. مجدي يعقوب', 'أم كلثوم'],
    funFact: 'تُعرف بمدينة الألف مئذنة، وتضم أقدم جامعة مستمرة في العالم حتى اليوم (الأزهر الشريف تأسس 972م).',
  },
  {
    id: 'giza',
    name: 'محافظة الجيزة',
    capital: 'الجيزة',
    region: 'cairo',
    regionLabel: 'القاهرة الكبرى',
    populationApprox: '9.3 مليون نسمة',
    landmarks: ['أهرامات الجيزة وأبو الهول', 'المتحف المصري الكبير (GEM)', 'هرم سقارة المدرج', 'جامعة القاهرة'],
    keyIndustries: ['السياحة العالمية', 'الإنتاج الإعلامي (مدينة الإنتاج)', 'الزراعة والصناعات الغذائية'],
    famousFigures: ['أحمد شوقي (أمير الشعراء)', 'د. زاهي حواس'],
    funFact: 'هرم خوفو بالجيزة كان أطول بناء صنعه الإنسان على كوكب الأرض لأكثر من 3800 عام متواصلة.',
  },
  {
    id: 'qalyubia',
    name: 'محافظة القليوبية',
    capital: 'بنها (مدينة العسل)',
    region: 'cairo',
    regionLabel: 'القاهرة الكبرى',
    populationApprox: '6.1 مليون نسمة',
    landmarks: ['القناطر الخيرية', 'قصر محمد علي بشبرا', 'مسجد الظاهر بيبرس بقليوب'],
    keyIndustries: ['صناعة الغزل والنسيج بشبرا الخيمة', 'زراعة الموالح والفواكه', 'إنتاج عسل النحل والبيض'],
    famousFigures: ['د. يحيى المشد (عالم الذرة)', 'الشيخ عبد الباسط عبد الصمد (درس بمدارسها)'],
    funFact: 'تعتبر حديقة القناطر الخيرية بالقليوبية من أقدم المتنزهات النباتية في الشرق الأوسط وأنشأها محمد علي باشا لتنظيم ري الدلتا.',
  },

  // الإسكندرية ومدن القناة
  {
    id: 'alexandria',
    name: 'محافظة الإسكندرية',
    capital: 'عروس البحر الأبيض المتوسط',
    region: 'canal_alex',
    regionLabel: 'الإسكندرية ومدن القناة',
    populationApprox: '5.5 مليون نسمة',
    landmarks: ['مكتبة الإسكندرية الجديدة', 'قلعة قايتباي', 'المسرح الروماني', 'قصر المنتزه', 'كوبري ستانلي'],
    keyIndustries: ['الشحن والموانئ البحرية', 'البتروكيماويات', 'السياحة الساحلية', 'صناعة النسيج'],
    famousFigures: ['إقليدس (مؤسس علم الهندسة)', 'الشاعر كفافيس', 'يوسف شاهين'],
    funFact: 'كانت مكتبة الإسكندرية القديمة أعظم مجمع علمي في التاريخ القديم، وبها حسب إراتوستينس محيط الكرة الأرضية بدقة مذهلة.',
  },
  {
    id: 'port_said',
    name: 'محافظة بورسعيد',
    capital: 'المدينة الباسلة',
    region: 'canal_alex',
    regionLabel: 'الإسكندرية ومدن القناة',
    populationApprox: '800 ألف نسمة',
    landmarks: ['المدخل الشمالي لقناة السويس', 'متحف النصر للفن الحديث', 'مبنى هيئة قناة السويس التاريخي', 'بورفؤاد'],
    keyIndustries: ['التجارة الدولية والمناطق الحرة', 'الشحن واللوجستيات', 'الصيد البحري'],
    famousFigures: ['فدائيو بورسعيد أبطال المقاومة الشعبية 1956', 'محمود ياسين'],
    funFact: 'سُميت بورسعيد تيمناً بالخديوي سعيد باشا، وشهدت أول ضربة فأس لشق قناة السويس في 25 أبريل 1859.',
  },
  {
    id: 'suez',
    name: 'محافظة السويس',
    capital: 'مدينة الصمود والشهداء',
    region: 'canal_alex',
    regionLabel: 'الإسكندرية ومدن القناة',
    populationApprox: '790 ألف نسمة',
    landmarks: ['المدخل الجنوبي لقناة السويس', 'عيون موسى', 'نفق الشهيد أحمد حمدي', 'بور توفيق'],
    keyIndustries: ['تكرير البترول', 'صناعة الأسمنت والحديد', 'اللوجستيات وموانئ البحر الأحمر'],
    famousFigures: ['الشيخ حافظ سلامة (قائد المقاومة الشعبية بالسويس 1973)', 'إسماعيل ياسين'],
    funFact: 'سطر أهالي السويس ورجال الشرطة والجيش ملحمة تاريخية في 24 أكتوبر 1973 بمنع دبابات العدو من احتلال المدينة.',
  },
  {
    id: 'ismailia',
    name: 'محافظة الإسماعيلية',
    capital: 'مدينة السحر والجمال وباريس الصغرى',
    region: 'canal_alex',
    regionLabel: 'الإسكندرية ومدن القناة',
    populationApprox: '1.4 مليون نسمة',
    landmarks: ['مقر هيئة قناة السويس', 'بحيرة التمساح والبحيرات المرة', 'متحف ديليسبس', 'طريق نمرة 6'],
    keyIndustries: ['زراعة أجود أنواع المانجو المصرية', 'الخدمات الملاحية لقناة السويس', 'الصناعات الغذائية'],
    famousFigures: ['أبطال موقعة الإسماعيلية 25 يناير 1952 (عيد الشرطة المصرية)'],
    funFact: 'تتميز الإسماعيلية بأكبر مساحات خضراء للشخص الواحد في مصر، وتنتج سنوياً أشهر مهرجان للمانجو.',
  },

  // محافظات الدلتا
  {
    id: 'dakahlia',
    name: 'محافظة الدقهلية',
    capital: 'المنصورة (عاصمة الطب)',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '7.1 مليون نسمة',
    landmarks: ['دار ابن لقمان (أسر لويس التاسع 1250م)', 'مركز د. محمد غنيم للكلى', 'مسجد الموافي'],
    keyIndustries: ['الريادة الطبية والمستشفيات التخصصية', 'الزراعة (الأرز والقمح)', 'الصناعات الكيماوية بتلكا'],
    famousFigures: ['د. محمد غنيم (رائد زراعة الكلى)', 'د. فاروق الباز (عالم الفضاء)', 'الشيخ محمد متولي الشعراوي', 'سيدة الغناء أم كلثوم (طماي الزهايرة)'],
    funFact: 'سُميت المنصورة بهذا الاسم بعد انتصار الشعب المصري والجيش على الحملة الصليبية السابعة وأسر ملك فرنسا.',
  },
  {
    id: 'gharbia',
    name: 'محافظة الغربية',
    capital: 'طنطا (قلب الدلتا)',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '5.4 مليون نسمة',
    landmarks: ['مسجد السيد أحمد البدوي', 'مدينة المحلة الكبرى (قلعة النسيج)', 'متحف آثار طنطا'],
    keyIndustries: ['غزل ونسيج المحلة الكبرى', 'صناعة الحلويات والحمص', 'الزيوت والصابون'],
    famousFigures: ['د. مصطفى السيد (عالم النانو وعلاج السرطان بالذهب)', 'الفريق سعد الدين الشاذلي (رئيس أركان حرب أكتوبر)'],
    funFact: 'تضم المحلة الكبرى في الغربية أكبر مصنع للغزل والنسيج في العالم من حيث المساحة وعدد المغازل.',
  },
  {
    id: 'sharqia',
    name: 'محافظة الشرقية',
    capital: 'الزقازيق',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '7.8 مليون نسمة',
    landmarks: ['منطقة تل بسطة الأثرية', 'صان الحجر (تانيس عاصمة مصر القديمة)', 'مدينة العاشر من رمضان الصناعية'],
    keyIndustries: ['الصناعات الهندسية والإلكترونية بالعاشر', 'تربية الخيول العربية الأصيلة', 'الزراعة الكبرى'],
    famousFigures: ['الزعيم أحمد عرابي (قائد الثورة العرابية 1881)', 'العندليب الأسمر عبد الحليم حافظ', 'د. مجدي يعقوب (ولد ببلبيس)'],
    funFact: 'تتخذ الشرقية الحصان العربي شعاراً لها، حيث تستضيف سنوياً مهرجان الشرقية الدولي للخيول العربية الأصيلة.',
  },
  {
    id: 'menofia',
    name: 'محافظة المنوفية',
    capital: 'شبين الكوم',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '4.6 مليون نسمة',
    landmarks: ['معهد الكبد القومي', 'متحف دنشواي', 'مدينة السادات الصناعية'],
    keyIndustries: ['الصناعات الدوائية والغذائية', 'إنتاج الحرير الطبيعي بساقية أبو شعرة', 'الزراعة المكثفة'],
    famousFigures: ['الرئيس محمد أنور السادات (بطل الحرب والسلام)', 'د. كمال الجنزوري', 'الشيخ عبد الباسط عبد الصمد'],
    funFact: 'تتصدر المنوفية تاريخياً أعلى نسب التعليم ومحو الأمية بين محافظات جمهورية مصر العربية.',
  },
  {
    id: 'beheira',
    name: 'محافظة البحيرة',
    capital: 'دمنهور',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '6.7 مليون نسمة',
    landmarks: ['قلعة قايتباي برشيد', 'موقع اكتشاف حجر رشيد 1799', 'دار أوبرا دمنهور التاريخية', 'وادي النطرون'],
    keyIndustries: ['الاستصلاح الزراعي بالنوبارية', 'الغزل والنسيج بكفر الدوار', 'الصناعات الغذائية والتصدير'],
    famousFigures: ['د. أحمد زويل (نوبل الكيمياء 1999، نشأ بدمنهور)', 'الشيخ محمد عبده (مجدد الفكر الإسلامي)'],
    funFact: 'في مدينة رشيد بالبحيرة، عثر على الحجر البازلتي الذي فك به شامبليون أسرار الكتابة الهيروغليفية للعالم.',
  },
  {
    id: 'kafr_el_sheikh',
    name: 'محافظة كفر الشيخ',
    capital: 'كفر الشيخ',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '3.6 مليون نسمة',
    landmarks: ['بحيرة البرلس ومحميتها الطبيعية', 'مدينة بوتو القديمة (تل الفراعين)', 'مسجد العارف بالله إبراهيم الدسوقي'],
    keyIndustries: ['الاستزراع السمكي (أكبر منتج للأسماك في مصر)', 'زراعة بنجر السكر والأرز', 'محطة كهرباء البرلس العملاقة'],
    famousFigures: ['الزعيم سعد زغلول (قائد ثورة 1919)', 'الشاعر فاروق جويدة'],
    funFact: 'تنتج كفر الشيخ ما يزيد عن 40% من إجمالي الإنتاج السمكي لجمهورية مصر العربية بفضل بحيرة البرلس ومزارع غليون.',
  },
  {
    id: 'damietta',
    name: 'محافظة دمياط',
    capital: 'دمياط (قلعة صناع الأثاث)',
    region: 'delta',
    regionLabel: 'محافظات الدلتا',
    populationApprox: '1.6 مليون نسمة',
    landmarks: ['رأس البر ونقطة التقاء النيل بالبحر المتوسط (مرج البحرين)', 'مدينة دمياط للأثاث', 'ميناء دمياط'],
    keyIndustries: ['صناعة الأثاث الخشبي الفاخر وتصديره', 'صناعة الحلويات والجبن الدمياطي', 'صناعة وبناء السفن'],
    famousFigures: ['د. علي مصطفى مشرفة (عالم الفيزياء المقرب لأينشتاين)', 'د. عائشة عبد الرحمن (بنت الشاطئ)'],
    funFact: 'تسجل دمياط أدنى معدل بطالة في مصر وتشتهر بالمهارة الحرفية الفائقة في نجارة الأثاث التي تصدر للعالم.',
  },

  // صعيد مصر
  {
    id: 'fayoum',
    name: 'محافظة الفيوم',
    capital: 'الفيوم (مصر الصغرى)',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '4.0 مليون نسمة',
    landmarks: ['شلالات وادي الريان', 'محمية وادي الحيتان (تراث عالمي يونسكو)', 'سواقي الهدير', 'بحيرة قارون', 'قرية تونس للخزف'],
    keyIndustries: ['السياحة البيئية والجيولوجية', 'صناعة الفخار والخزف اليدوي', 'الزراعة والمصايد'],
    famousFigures: ['الشيخ حسنين محمد مخلوف', 'نجلاء فتحي'],
    funFact: 'وادي الحيتان بالفيوم يوثق بالهياكل المتحجرة مراحل تطور الحيتان من كائنات برية تمشي إلى كائنات بحرية قبل 40 مليون سنة.',
  },
  {
    id: 'beni_suef',
    name: 'محافظة بني سويف',
    capital: 'بني سويف',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '3.5 مليون نسمة',
    landmarks: ['هرم ميدوم العجيب', 'كهف سنور الفريد (محمية طبيعية)', 'دير العذراء ببياض العرب'],
    keyIndustries: ['صناعة الإلكترونيات والشاشات الحديثة (كوم أبوراضي)', 'الأسمنت والرخام', 'الزراعات التعاقدية'],
    famousFigures: ['الإمام البوصيري صاحب نهج البردة', 'د. مفيد فوزي'],
    funFact: 'كهف وادي سنور في بني سويف يرجع تكوينه الجيولوجي لأكثر من 60 مليون سنة ويضم صواعد وهوابط من الألباستر النادر.',
  },
  {
    id: 'minya',
    name: 'محافظة المنيا',
    capital: 'عروس الصعيد',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '6.2 مليون نسمة',
    landmarks: ['تل العمارنة (عاصمة إخناتون ونفرتيتي)', 'منطقة تونا الجبل', 'بني حسن والمقابر المنحوتة', 'دير جبل الطير'],
    keyIndustries: ['محاجر كربونات الكالسيوم والرخام', 'زراعة بنجر السكر وقصب السكر', 'صناعة الغزل'],
    famousFigures: ['عميد الأدب العربي طه حسين', 'الموسيقار عمار الشريعي', 'السيدة هدى شعراوي'],
    funFact: 'تضم المنيا ثلث آثار مصر القديمة وحدها، وكانت مقراً لأول دعوة للتوحيد في التاريخ البشري في تل العمارنة.',
  },
  {
    id: 'asyut',
    name: 'محافظة أسيوط',
    capital: 'أسيوط',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '4.9 مليون نسمة',
    landmarks: ['قناطر أسيوط الجديدة', 'دير المحرق ومسار العائلة المقدسة', 'جامعة أسيوط (أقدم جامعات الصعيد)', 'مسجد الفرغل'],
    keyIndustries: ['تكرير البترول والبتروكيماويات', 'الأسمنت والأسمدة', 'صناعة السجاد الحريري والمنسوجات'],
    famousFigures: ['الشاعر حافظ إبراهيم (شاعر النيل)', 'جلال الدين السيوطي (موسوعة العلماء)'],
    funFact: 'مكثت العائلة المقدسة في دير المحرق بأسيوط لأكثر من 6 أشهر، وتعتبر الكنيسة الأثرية هناك من أقدم الكنائس المدشنة في العالم.',
  },
  {
    id: 'sohag',
    name: 'محافظة سوهاج',
    capital: 'سوهاج',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '5.6 مليون نسمة',
    landmarks: ['معبد سيتي الأول بأبيدوس', 'تمثال الملكة ميريت آمون بأخميم', 'الدير الأبيض والدير الأحمر', 'متحف سوهاج القومي'],
    keyIndustries: ['النسيج اليدوي والكليم بأخميم', 'صناعة السكر بالبلينا', 'زراعة البصل والقمح'],
    famousFigures: ['الشيخ محمد صديق المنشاوي', 'الشيخ رفاعة الطهطاوي (رائد التنوير والترجمة الحديثة)'],
    funFact: 'تمثال الأميرة ميريت آمون المكتشف بأخميم بسوهاج يبلغ طوله 12 متراً، وهو أطول تمثال لملكة مصرية في التاريخ.',
  },
  {
    id: 'qena',
    name: 'محافظة قنا',
    capital: 'قنا',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '3.5 مليون نسمة',
    landmarks: ['معبد دندرة البديع (سقف الأبراج السماوية)', 'مسجد سيدي عبد الرحيم القنائي', 'دير مارجرجس بحاجر طوخ'],
    keyIndustries: ['صناعة الألومنيوم بنجع حمادي', 'صناعة السكر والتكرير', 'صناعة القلل والجرار الفخارية بقنا'],
    famousFigures: ['الشاعر أمل دنقل (أمير شعراء الرفض)', 'الشاعر عبد الرحمن الأبنودي (خال الأبنودي)', 'الشيخ عبد الباسط عبد الصمد (أرمنت قبل انفصالها)'],
    funFact: 'يضم معبد دندرة بقنا سقفاً فلكياً يصور الأبراج السماوية بدقة ملهمة جعلت علماء الفلك في العالم ينبهرون بمعرفة المصريين القدماء.',
  },
  {
    id: 'luxor',
    name: 'محافظة الأقصر',
    capital: 'طيبة (عاصمة مصر القديمة)',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '1.4 مليون نسمة',
    landmarks: ['معبد الكرنك', 'معبد الأقصر', 'طريق الكباش التاريخي', 'وادي الملوك ووادي الملكات', 'معبد حتشبسوت بالدير البحري'],
    keyIndustries: ['السياحة العالمية والآثار', 'ركوب منطاد الهواء الساخن (البالون الطائر)', 'الزراعة النيلية'],
    famousFigures: ['الشيخ عبد الباسط عبد الصمد', 'الملك توت عنخ آمون', 'الملك رمسيس الثاني'],
    funFact: 'تحتضن الأقصر وحدها ما يقارب ثلث آثار العالم القديم، وتمثل أكبر متحف مفتوح للآثار على وجه الأرض.',
  },
  {
    id: 'aswan',
    name: 'محافظة أسوان',
    capital: 'بوابة مصر الجنوبية والذهب الأسواني',
    region: 'upper_egypt',
    regionLabel: 'صعيد مصر',
    populationApprox: '1.6 مليون نسمة',
    landmarks: ['السد العالي العملاق', 'معبد أبو سمبل المنحوت بالصخر', 'معبد فيلة على جزيرة أجيليكا', 'مركز مجدي يعقوب لجراحة القلب', 'متحف النوبة'],
    keyIndustries: ['توليد الطاقة الكهرومائية', 'مشروع بنبان للطاقة الشمسية (الأكبر في العالم)', 'التعدين والسياحة البيئية والنوبية'],
    famousFigures: ['الأديب النوبي محمد خليل قاسم', 'الأديب عباس محمود العقاد'],
    funFact: 'تتعامد الشمس في معبد أبو سمبل مرتين فقط سنوياً بدقة فلكية خارقة: يوم ميلاد الملك رمسيس الثاني ويوم تتويجه على العرش.',
  },

  // المحافظات الحدودية
  {
    id: 'red_sea',
    name: 'محافظة البحر الأحمر',
    capital: 'الغردقة',
    region: 'frontier',
    regionLabel: 'المحافظات الحدودية',
    populationApprox: '400 ألف نسمة',
    landmarks: ['جزيرة الجفتون ومحمية وادي الجمال', 'دير الأنبا أنطونيوس والأنبا بولا (أقدم أديرة العالم)', 'مرسى علم وسفاجا'],
    keyIndustries: ['السياحة الشاطئية والغوص بالشعاب المرجانية', 'استخراج الذهب من منجم السكري', 'طاقة الرياح برأس غارب'],
    famousFigures: ['صيادو البحر الأحمر والخبراء الجيولوجيون'],
    funFact: 'تحتوي مياه البحر الأحمر المصرية على أندر الشعاب المرجانية في العالم القادرة على تحمل التغيرات المناخية والاحتباس الحراري.',
  },
  {
    id: 'new_valley',
    name: 'محافظة الوادي الجديد',
    capital: 'الخارجة',
    region: 'frontier',
    regionLabel: 'المحافظات الحدودية',
    populationApprox: '260 ألف نسمة',
    landmarks: ['الصحراء البيضاء ومحميتها الجيولوجية', 'معبد هيبس بالخارجة', 'مقابر البجوات التاريخية', 'واحات الفرافرة والداخلة'],
    keyIndustries: ['استخراج وتصنيع الفوسفات بأبو طرطور', 'زراعة أجود تمور الصعيد وزيت الزيتون', 'مشروع توشكى الخير'],
    famousFigures: ['رواد استصلاح الصحراء والواحات'],
    funFact: 'تعتبر الوادي الجديد أكبر محافظات مصر مساحة، حيث تشغل حوالي 44% من إجمالي مساحة الجمهورية.',
  },
  {
    id: 'matrouh',
    name: 'محافظة مطروح',
    capital: 'مرسى مطروح',
    region: 'frontier',
    regionLabel: 'المحافظات الحدودية',
    populationApprox: '540 ألف نسمة',
    landmarks: ['شاطئ عجيبة وهضبة أم الرخم', 'واحة سيوة وعين كليوباترا', 'مقابر العلمين ومتحف الحرب العالمية الثانية', 'مدينة العلمين الجديدة'],
    keyIndustries: ['السياحة الصيفية والاستشفائية في بحيرات الملح بسيوة', 'زراعة التين والزيتون والصنوبر', 'توليد الطاقة النووية السلمية بالضبعة'],
    famousFigures: ['فرسان ومشايخ قبائل مطروح حماة البوابة الغربية'],
    funFact: 'في واحة سيوة بمطروح، زار الإسكندر الأكبر معبد الإله آمون عام 331 ق.م ليتوج ابناً للآلهة وحاكماً لمصر.',
  },
  {
    id: 'north_sinai',
    name: 'محافظة شمال سيناء',
    capital: 'العريش (مدينة الملاحة والنخيل)',
    region: 'frontier',
    regionLabel: 'المحافظات الحدودية',
    populationApprox: '490 ألف نسمة',
    landmarks: ['شاطئ العريش وظلال النخيل', 'محمية الزرانيق للطيور المهاجرة', 'قلعة نخل التاريخية', 'ميناء العريش البحري'],
    keyIndustries: ['صناعة واستخراج الملح والرخام والجرانيت', 'الصيد البحري وزراعة الخوخ والزيتون والتين', 'التجارة واللوجستيات'],
    famousFigures: ['أبطال القوات المسلحة ومجاهدو سيناء الأبرار'],
    funFact: 'تعتبر سيناء المعبر التاريخي لجميع الأنبياء والقوافل، ومنها مر نبيا الله إبراهيم ويوسف والعائلة المقدسة إلى وادي النيل.',
  },
  {
    id: 'south_sinai',
    name: 'محافظة جنوب سيناء',
    capital: 'الطور',
    region: 'frontier',
    regionLabel: 'المحافظات الحدودية',
    populationApprox: '115 ألف نسمة',
    landmarks: ['جبل موسى (جبل التجلي)', 'دير سانت كاترين وشجرة العليقة الملتهبة', 'محمية رأس محمد الدولية', 'شرم الشيخ ودهب وطابا'],
    keyIndustries: ['سياحة المؤتمرات الدولية والغوص العالمي', 'السياحة الدينية والاستشفائية', 'التعدين والبترول بخليج السويس'],
    famousFigures: ['أدلاء وقبائل بدو سيناء أبطال حماية الحدود وتأمين المؤتمرات'],
    funFact: 'جبل سانت كاترين في جنوب سيناء هو أعلى قمة جبلية في مصر كلها بارتفاع 2629 متراً فوق مستوى سطح البحر وتغطيه الثلوج شتاءً.',
  },
];

// ----------------------------------------------------
// 2. Egyptian Civilization Timeline Data
// ----------------------------------------------------
export interface TimelineMilestone {
  era: string;
  period: string;
  title: string;
  description: string;
  badge: string;
  impactOnWorld: string;
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    era: 'الحضارة المصرية القديمة (الفرعونية)',
    period: '3200 ق.م - 332 ق.م',
    title: 'توحيد القطرين وعصر بناة الأهرامات والطب والهندسة',
    description: 'وحّد الملك نعرمر (مينا) مصر العليا والسفلى وأسس أول دولة مركزية منظمة في تاريخ البشرية. شُيدت الأهرامات العظيمة وتطورت الكتابة الهيروغليفية والطب والتحنيط والتقويم الشمسي لـ 365 يوماً.',
    badge: 'فجر الضمير الإنساني',
    impactOnWorld: 'منحت الإنسانية أول تقويم شمسي سنوي، وأول عمارة حجرية ضخمة، وأسس علم الطب والتشريح والرياضيات.',
  },
  {
    era: 'العصر الهلنستي ومكتبة الإسكندرية',
    period: '332 ق.م - 30 ق.م',
    title: 'الإسكندرية منارة العالم الفكرية وأكبر مكتبة في التاريخ القديم',
    description: 'أسس الإسكندر الأكبر مدينة الإسكندرية، لتتحول في عصر البطالمة إلى قبلة فلاسفة العالم وعلمائه كإقليدس في الرياضيات وإراتوستينس الذي قاس محيط الأرض، وأرشميدس.',
    badge: 'عاصمة المعرفة الكونية',
    impactOnWorld: 'ترجمة التوراة إلى اليونانية (السبعينية)، وحفظ الفلسفة والعلوم في مخطوطات مكتبة الإسكندرية.',
  },
  {
    era: 'العصر الإسلامي والقاهرة التاريخية',
    period: '641م - 1805م',
    title: 'تأسيس الأزهر الشريف وقلعة صلاح الدين وعمارة المآذن',
    description: 'دخل الإسلام مصر على يد عمرو بن العاص، وتوالت الدول: الطولونية والفاطمية والأيوبية والمملوكية. شُيد الجامع الأزهر الشريف عام 972م ليصبح حارس اللغة العربية والعلوم العقلية والنقلية لأكثر من ألف عام.',
    badge: 'جامعة الأمة وعين العلم',
    impactOnWorld: 'حمى الأزهر والجيش المصري العالم الإسلامي والإنساني من الغزو المغولي والصليبي، وبرز علماء كابن الهيثم في البصريات والسيوطي في الموسوعات.',
  },
  {
    era: 'بناء مصر الحديثة وقناة السويس',
    period: '1805م - 1952م',
    title: 'نهضة محمد علي باشا، البعثات العلمية، وشريان التجارة العالمية',
    description: 'أرسى محمد علي باشا ركائز الدولة الحديثة، وأرسل البعثات العلمية بقيادة رفاعة الطهطاوي إلى أوروبا. حفر المصريون قناة السويس لربط الشرق بالغرب كأهم ممر ملاحي بحري استراتيجي في العالم.',
    badge: 'فجر النهضة الصناعية',
    impactOnWorld: 'اختصار طرق التجارة البحرية العالمية إلى النصف، ونشوء حركة التنوير الأدبي والصحافي في العالم العربي.',
  },
  {
    era: 'ملحمة نصر 6 أكتوبر 1973',
    period: 'العاشر من رمضان 1393هـ / 6 أكتوبر 1973م',
    title: 'معجزة العبور، تحطيم خط بارليف، واسترداد أرض سيناء الطاهرة',
    description: 'في ملحمة عسكرية تدرس في أكبر كليات الحرب في العالم، تمكن الجيش المصري الباسل من اقتحام أصعب مانع مائي في التاريخ وإسقاط الساتر الترابي بخراطيم المياه وتحطيم أسطورة خط بارليف واسترداد العزة والسيادة الوطنية.',
    badge: 'معجزة العبور والكرامة',
    impactOnWorld: 'تغيير المفاهيم العسكرية في حرب الأسلحة المشتركة، وإعادة التوازن الجيوسياسي لمنطقة الشرق الأوسط.',
  },
  {
    era: 'مصر المعاصرة ونهضة الجمهورية الجديدة 2026',
    period: 'العصر الحاضر نحو المستقبل',
    title: 'العاصمة الإدارية، الطاقة النووية والشمسية، وعلوم الفضاء والرقمنة',
    description: 'تشهد مصر نهضة كبرى تتجلى في تشييد العاصمة الإدارية الجديدة والبرج الأيقوني (أطول برج في إفريقيا)، ومحطة الضبعة النووية السلمية، ومجمع بنبان للطاقة الشمسية، وإطلاق الأقمار الصناعية ووكالة الفضاء الإفريقية.',
    badge: 'نحو آفاق المعرفة والمستقبل',
    impactOnWorld: 'بناء بنية تحتية مستدامة، تحول رقمي متكامل، وتأكيد دور مصر القيادي كبوابة قارية وإقليمية للتنمية الخضراء والذكاء الاصطناعي.',
  },
];

// ----------------------------------------------------
// 3. Hall of Egyptian Pioneers & Scholars
// ----------------------------------------------------
export interface EgyptianPioneer {
  id: string;
  name: string;
  field: string;
  title: string;
  achievement: string;
  quote: string;
  iconBg: string;
}

export const EGYPTIAN_PIONEERS: EgyptianPioneer[] = [
  {
    id: 'zewail',
    name: 'د. أحمد زويل (1946 - 2016)',
    field: 'كيمياء الفيمتو ثانية والنانو',
    title: 'الحائز على جائزة نوبل في الكيمياء 1999',
    achievement: 'اخترع ميكروسكوب تصوير التفاعلات الكيميائية في زمن الفيمتو ثانية (واحد على مليون مليار من الثانية)، وأسس مدينة زويل للعلوم والتكنولوجيا في مصر لتكون قاطرة البحث العلمي الوطني.',
    quote: '«الأوروبيون ليسوا أذكى منا، ولكنهم يدعمون الفاشل حتى ينجح، ونحن نعرقل الناجح حتى يفشل... حب الوطن بالعمل والبحث العلمي هو السبيل الوحيد للخلود.»',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'yacoub',
    name: 'السير د. مجدي يعقوب (1935 - معاصر)',
    field: 'جراحة القلب وزراعة الأعضاء',
    title: 'أسطورة جراحة القلب ومؤسس مركز أسوان الدولي',
    achievement: 'أجرى آلاف العمليات الجراحية المجانية المعقدة للأطفال المصابين بتشوهات القلب في مصر والعالم، وطور تقنيات هندسة الأنسجة لتوليد صمامات قلب حية تنمو مع الطفل.',
    quote: '«الطب رسالة إنسانية قبل أن يكون مهنة. عندما تخفف ألماً عن طفل مصري وتراه يبتسم ويركض من جديد، فهذا هو أعظم تكريم يمكن أن يناله إنسان على الأرض.»',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    id: 'elbaz',
    name: 'د. فاروق الباز (1938 - معاصر)',
    field: 'علوم الفضاء والجيولوجيا والاستشعار عن بعد',
    title: 'عالم وكالة ناسا ورئيس أبحاث هبوط أبوللو على القمر',
    achievement: 'أشرف على اختيار مواقع هبوط رواد فضاء رحلات أبوللو على سطح القمر ودرب الرواد على الجيولوجيا القمرية، وساهم في اكتشاف المياه الجوفية في صحراء مصر والشرق الأوسط عبر صور الأقمار الصناعية.',
    quote: '«العلم لا يعرف المستحيل، والصحراء المصرية ليست فراغاً بل كنز واعد بالطاقة والزراعة والمياه لمن يجتهد في فك شفراتها العلمية.»',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'elsayed',
    name: 'د. مصطفى السيد (1935 - معاصر)',
    field: 'النانوتكنولوجي والفيزياء الكيميائية',
    title: 'عالم الكيمياء الحائز على أعلى وسام علمي أمريكي',
    achievement: 'وضع قانون السيد (El-Sayed Rule) في الميكانيكا الإحصائية، وقاد الفريق العلمي الرائد لعلاج الأورام السرطانية باستخدام نانو جزيئات الذهب المسخنة بأشعة الليزر.',
    quote: '«جزيئات الذهب الدقيقة يمكنها أن تنقذ ملايين الأرواح إذا وجهت بالعقل السليم. العلم المصري قادر دائماً على ابتكار حلول غير تقليدية لأعقد الأمراض.»',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'moussa',
    name: 'د. سميرة موسى (1917 - 1952)',
    field: 'الفيزياء النووية والذرة من أجل السلام',
    title: 'أول عالمة ذرة مصرية وملقبة بميس كوري الشرق',
    achievement: 'توصلت إلى معادلة لتفتيت المعادن الرخيصة كالحديد والنحاس لصنع القنبلة الذرية بتكلفة يسيرة، ونادت بشعار "الذرة من أجل السلام واستخدام الطاقة النووية في علاج السرطان".',
    quote: '«أمنيتي أن يكون علاج السرطان بالذرة متاحاً وفي متناول الجميع مثل الأسبرين... مصر تستحق أن تكون في مصاف الدول العلمية العظمى.»',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    id: 'taha_hussein',
    name: 'د. طه حسين (1889 - 1973)',
    field: 'الأدب والفكر وتاريخ النهضة',
    title: 'عميد الأدب العربي ووزير المعارف الأسبق',
    achievement: 'خاض معركة التعليم المجاني في مصر حتى جعل التعليم الابتدائي والثانوي مجانياً كالماء والهواء للجميع، وألف عشرات الكتب الفكرية المجددة كـ "الأيام" و"مستقبل الثقافة في مصر".',
    quote: '«إن التعليم حق أساسي من حقوق الإنسان كالماء الذي نشربه والهواء الذي نتنفسه... لا نهضة لأمة تجهل تاريخها أو تحرم أبناءها من العلم والمعرفة.»',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
];

// ----------------------------------------------------
// 4. Interactive Quiz Data: Know Egypt National Challenge
// ----------------------------------------------------
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  xpReward: number;
}

export const NATIONAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'كم عدد محافظات جمهورية مصر العربية؟',
    options: ['24 محافظة', '26 محافظة', '27 محافظة', '29 محافظة'],
    correctAnswerIndex: 2,
    explanation: 'تضم جمهورية مصر العربية 27 محافظة مقسمة بين أقاليم القاهرة الكبرى والدلتا والقناة والصعيد والمحافظات الحدودية.',
    xpReward: 15,
  },
  {
    id: 2,
    question: 'ما هي أكبر محافظة في مصر من حيث المساحة الجغرافية الإجمالية؟',
    options: ['محافظة البحر الأحمر', 'محافظة الوادي الجديد', 'محافظة مطروح', 'محافظة أسوان'],
    correctAnswerIndex: 1,
    explanation: 'محافظة الوادي الجديد هي الأكبر مساحة في مصر، حيث تشكل حوالي 44% من المساحة الكلية لجمهورية مصر العربية.',
    xpReward: 15,
  },
  {
    id: 3,
    question: 'ما هو زمن التفاعل الكيميائي الذي تمكن العالم المصري د. أحمد زويل من رصده بميكروسكوبه ونال عنه جائزة نوبل؟',
    options: ['الفيمتو ثانية (10^-15 ثانية)', 'النانو ثانية (10^-9 ثانية)', 'الميكرو ثانية (10^-6 ثانية)', 'البيكو ثانية (10^-12 ثانية)'],
    correctAnswerIndex: 0,
    explanation: 'الفيمتو ثانية هي جزء من مليون مليار جزء من الثانية الواحدة، وكان إنجاز زويل هو تصوير حركة الجزيئات أثناء التفاعل في هذا الزمن الميكروسكوبي الخاطف.',
    xpReward: 20,
  },
  {
    id: 4,
    question: 'أين يقع مشروع "بنبان" الذي يعد من أكبر مجمعات توليد الطاقة الشمسية في العالم؟',
    options: ['محافظة الجيزة', 'محافظة الوادي الجديد', 'محافظة أسوان', 'محافظة السويس'],
    correctAnswerIndex: 2,
    explanation: 'يقع مجمع بنبان في محافظة أسوان بصعيد مصر، ويضم أكثر من 32 محطة طاقة شمسية تنتج أكثر من 1465 ميجاوات من الكهرباء النظيفة.',
    xpReward: 15,
  },
  {
    id: 5,
    question: 'في أي مدينة مصرية تم اكتشاف الحجر الشهير الذي فك به شامبليون رموز اللغة الهيروغليفية؟',
    options: ['مدينة الأقصر', 'مدينة الإسكندرية', 'مدينة رشيد بمحافظة البحيرة', 'مدينة طنطا'],
    correctAnswerIndex: 2,
    explanation: 'اكتشف حجر رشيد في قلعة قايتباي بمدينة رشيد بالبحيرة عام 1799 وعليه نقش بثلاثة خطوط (هيروغليفي وديموطيقي ويوناني).',
    xpReward: 15,
  },
  {
    id: 6,
    question: 'ما هو التاريخ الهجري المجيد لنصر حرب 6 أكتوبر 1973؟',
    options: ['العاشر من رمضان 1393هـ', 'الأول من شوال 1393هـ', 'السابع عشر من رمضان 1393هـ', 'التاسع من ذي الحجة 1393هـ'],
    correctAnswerIndex: 0,
    explanation: 'بدأت حرب أكتوبر المجيدة في تمام الساعة 2:05 ظهراً يوم السبت 6 أكتوبر 1973 الموافق العاشر من شهر رمضان المبارك 1393هـ.',
    xpReward: 20,
  },
  {
    id: 7,
    question: 'أي من علماء مصر الكبار لقب بـ "أبو الجيولوجيا القمرية" لاختياره مواقع هبوط رحلات أبوللو على القمر؟',
    options: ['د. مصطفى السيد', 'د. فاروق الباز', 'د. يحيى المشد', 'د. علي مصطفى مشرفة'],
    correctAnswerIndex: 1,
    explanation: 'د. فاروق الباز عمل كمدير لمركز دراسات الأرض والكواكب في معهد سميثسونيان، وكان المسؤول الأول عن تدريب رواد فضاء أبوللو واختيار مواقع الهبوط.',
    xpReward: 15,
  },
  {
    id: 8,
    question: 'ما هي المدينة المصرية التي تشتهر بكونها أكبر قلعة لصناعة وتصدير الأثاث الخشبي الفاخر؟',
    options: ['بورسعيد', 'دمياط', 'المحلة الكبرى', 'بنها'],
    correctAnswerIndex: 1,
    explanation: 'محافظة دمياط هي عاصمة الأثاث في الشرق الأوسط، وتضم مدينة دمياط للأثاث وآلاف الورش التي تصدر أحدث الموديلات لكل دول العالم.',
    xpReward: 15,
  },
  {
    id: 9,
    question: 'ما هو أعلى جبل في جمهورية مصر العربية بأكملها؟',
    options: ['جبل موسى', 'جبل سانت كاترين', 'جبل الشايب بالبحر الأحمر', 'جبل عتاقة'],
    correctAnswerIndex: 1,
    explanation: 'جبل سانت كاترين بجنوب سيناء يبلغ ارتفاعه 2,629 متراً فوق سطح البحر، وهو أعلى قمة جبلية في مصر.',
    xpReward: 15,
  },
  {
    id: 10,
    question: 'من هو المفكر ووزير المعارف المصري الذي نادى وجعل التعليم مجانياً "كالماء والهواء" لجميع أبناء مصر؟',
    options: ['عباس محمود العقاد', 'د. طه حسين', 'أحمد شوقي', 'رفاعة الطهطاوي'],
    correctAnswerIndex: 1,
    explanation: 'عميد الأدب العربي د. طه حسين تولى وزارة المعارف عام 1950 وأقر مجانية التعليم الثانوي والابتدائي، مؤكداً أن العلم حق طبيعي لكل مصري كالماء والهواء.',
    xpReward: 20,
  },
];

export const KnowYourCountry: React.FC<KnowYourCountryProps> = ({ onAddXP }) => {
  // Navigation tabs within Know Your Country
  const [activeSubTab, setActiveSubTab] = useState<'governorates' | 'timeline' | 'pioneers' | 'quiz'>('governorates');

  // Governorates filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [govSearchQuery, setGovSearchQuery] = useState('');
  const [selectedGovernorateModal, setSelectedGovernorateModal] = useState<Governorate | null>(null);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);

  // Filtered governorates
  const filteredGovernorates = EGYPTIAN_GOVERNORATES.filter((gov) => {
    const matchesRegion = selectedRegion === 'all' || gov.region === selectedRegion;
    const matchesSearch =
      gov.name.toLowerCase().includes(govSearchQuery.toLowerCase()) ||
      gov.capital.toLowerCase().includes(govSearchQuery.toLowerCase()) ||
      gov.landmarks.some((lm) => lm.toLowerCase().includes(govSearchQuery.toLowerCase())) ||
      gov.famousFigures.some((fig) => fig.toLowerCase().includes(govSearchQuery.toLowerCase()));
    return matchesRegion && matchesSearch;
  });

  // Handle Quiz Option Selection
  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const question = NATIONAL_QUIZ_QUESTIONS[currentQuizIndex];
    if (selectedOption === question.correctAnswerIndex) {
      setQuizScore((prev) => prev + 1);
      setTotalXpEarned((prev) => prev + question.xpReward);
      if (onAddXP) {
        onAddXP(question.xpReward, `إجابة صحيحة في تحدي حب مصر: ${question.question.slice(0, 30)}...`);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < NATIONAL_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* 1. Magnificent Panoramic Hero Banner with high-contrast text card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 min-h-[400px] sm:min-h-[460px] flex items-center p-4 sm:p-8">
        <img
          src={PLATFORM_IMAGES.knowEgyptBanner}
          alt="مصر مهد الحضارات ومنارة المستقبل"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        {/* Deep dark gradient shield preventing any white/bright image parts from bleeding over text */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 max-w-3xl space-y-4 rounded-3xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>موسوعة الهوية والمعرفة الوطنية المصرية</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-amber-300 leading-tight">
            اعرف بلدك: <span className="text-emerald-400">مصر مهد الحضارات</span> ومنارة المستقبل
          </h1>

          <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-medium">
            رحلة تفاعلية حية تستعرض عبقرية الجغرافيا، محافظات مصر الـ 27، خط الزمن لسبعة آلاف عام من المجد، وسيرة علماء مصر الخالدين الذين ألهموا العالم.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-amber-300 font-bold border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>27 محافظة مصرية</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>7 آلاف سنة حضارة</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>رواد نوبل والعلوم</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation (Segmented Control - Zero Pill discipline) */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 custom-scroll">
        <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 inline-flex gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('governorates')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'governorates'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>محافظات مصر الـ 27</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>خط الزمن للحضارة المصرية</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pioneers')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'pioneers'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>رواد وعلماء مصر</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'quiz'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-purple-600" />
            <span>تحدي المعرفة الوطنية (+XP)</span>
          </button>
        </div>
      </div>

      {/* ====================================================
          SUB-TAB 1: 27 GOVERNORATES DIRECTORY
          ==================================================== */}
      {activeSubTab === 'governorates' && (
        <section className="space-y-6">
          {/* Controls: Region filter & Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={govSearchQuery}
                  onChange={(e) => setGovSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المحافظة أو المعلم الأثري أو العلم الشهير..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Counter */}
              <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                عرض <strong>{filteredGovernorates.length}</strong> من إجمالي 27 محافظة
              </div>
            </div>

            {/* Region buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll text-xs">
              {[
                { id: 'all', label: 'كل المحافظات (27)' },
                { id: 'cairo', label: 'القاهرة الكبرى' },
                { id: 'canal_alex', label: 'الإسكندرية ومدن القناة' },
                { id: 'delta', label: 'محافظات الدلتا' },
                { id: 'upper_egypt', label: 'صعيد مصر' },
                { id: 'frontier', label: 'المحافظات الحدودية' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors cursor-pointer ${
                    selectedRegion === reg.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGovernorates.map((gov) => (
              <div
                key={gov.id}
                onClick={() => setSelectedGovernorateModal(gov)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-all hover:shadow-lg flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        {gov.regionLabel}
                      </span>
                      <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {gov.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        العاصمة: <span className="font-semibold text-slate-700 dark:text-slate-300">{gov.capital}</span>
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-2 mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block mb-1">أبرز المعالم:</span>
                      <div className="flex flex-wrap gap-1">
                        {gov.landmarks.slice(0, 3).map((lm, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                          >
                            {lm}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed pt-1 text-[11px]">
                      💡 <strong>حقيقة مميزة:</strong> {gov.funFact}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>عرض التفاصيل الشاملة</span>
                  <ChevronRight className="w-4 h-4 transform rotate-180" />
                </div>
              </div>
            ))}
          </div>

          {filteredGovernorates.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لم نجد محافظة مطابقة لبحثك "{govSearchQuery}"
              </p>
              <button
                onClick={() => {
                  setGovSearchQuery('');
                  setSelectedRegion('all');
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                إعادة ضبط البحث
              </button>
            </div>
          )}
        </section>
      )}

      {/* ====================================================
          SUB-TAB 2: CIVILIZATION TIMELINE
          ==================================================== */}
      {activeSubTab === 'timeline' && (
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
              مسيرة الحضارة
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              خط الزمن للحضارة المصرية الخالدة
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              محطات مضيئة تشهد على دور مصر كمعلمة للأمم ومهد للعلوم والفنون والشرائع
            </p>
          </div>

          <div className="relative border-r-2 border-emerald-500/30 mr-4 sm:mr-8 space-y-10 pr-6 sm:pr-10">
            {TIMELINE_MILESTONES.map((item, index) => (
              <div key={index} className="relative group">
                {/* Node icon on timeline */}
                <div className="absolute -right-[31px] sm:-right-[47px] top-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-emerald-600/30">
                  {index + 1}
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {item.era}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {item.period}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold">الأثر الخالد على العالم: </strong>
                      <span>{item.impactOnWorld}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================
          SUB-TAB 3: EGYPTIAN PIONEERS & SCHOLARS
          ==================================================== */}
      {activeSubTab === 'pioneers' && (
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wider uppercase">
              لوحة الشرف الوطنية
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              رواد وعلماء مصر: قدوات ملهمة لأجيال المستقبل
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              أبناء مصر الذين سخروا علمهم وإبداعهم لخدمة الإنسانية ورفع راية الوطن في المحافل الدولية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EGYPTIAN_PIONEERS.map((pioneer) => (
              <div
                key={pioneer.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-black text-lg border ${pioneer.iconBg}`}
                    >
                      {pioneer.name.split(' ')[1]?.[0] || 'م'}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                        {pioneer.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {pioneer.field}
                      </span>
                    </div>
                  </div>

                  <div className="inline-block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md mb-3 border border-emerald-500/20">
                    {pioneer.title}
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                    {pioneer.achievement}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
                  {pioneer.quote}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================
          SUB-TAB 4: INTERACTIVE NATIONAL QUIZ CHALLENGE
          ==================================================== */}
      {activeSubTab === 'quiz' && (
        <section className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wider uppercase">
              مسابقة حب مصر التفاعلية
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              تحدي المعرفة الوطنية والريادة المصرية
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              أجب عن الأسئلة الوطنية العشرة، واكتسب نقاط خبرة (XP)، واحصل على وسام "سفير المعرفة المصرية"
            </p>
          </div>

          {!quizCompleted ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Progress and question counter */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">
                  السؤال {currentQuizIndex + 1} من {NATIONAL_QUIZ_QUESTIONS.length}
                </span>
                <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>+{NATIONAL_QUIZ_QUESTIONS[currentQuizIndex].xpReward} XP</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-600 transition-all duration-300"
                  style={{
                    width: `${((currentQuizIndex + 1) / NATIONAL_QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <h3 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-relaxed">
                {NATIONAL_QUIZ_QUESTIONS[currentQuizIndex].question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {NATIONAL_QUIZ_QUESTIONS[currentQuizIndex].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === NATIONAL_QUIZ_QUESTIONS[currentQuizIndex].correctAnswerIndex;

                  let optionStyle =
                    'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900';

                  if (isSelected && !isAnswerSubmitted) {
                    optionStyle =
                      'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20';
                  }

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer text-sm ${optionStyle}`}
                    >
                      <span className="font-medium">{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submitting */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in duration-200">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>التفسير والشرح الأكاديمي:</span>
                  </div>
                  <p className="leading-relaxed">
                    {NATIONAL_QUIZ_QUESTIONS[currentQuizIndex].explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-4">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentQuizIndex < NATIONAL_QUIZ_QUESTIONS.length - 1
                        ? 'السؤال التالي'
                        : 'عرض النتيجة والشهادة'}
                    </span>
                    <ChevronRight className="w-4 h-4 transform rotate-180" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <Trophy className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                  تهانينا يا بطل المعرفة!
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                  أتممت تحدي حب مصر بنجاح
                </h3>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 max-w-sm mx-auto grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">النتيجة النهائية</div>
                  <div className="font-heading font-black text-2xl text-purple-600 dark:text-purple-400">
                    {quizScore} / {NATIONAL_QUIZ_QUESTIONS.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">نقاط الخبرة المكتسبة</div>
                  <div className="font-heading font-black text-2xl text-emerald-600 dark:text-emerald-400">
                    +{totalXpEarned} XP
                  </div>
                </div>
              </div>

              {/* Digital Badge Card */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20 max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300 font-heading font-bold text-base">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>وسام: سفير المعرفة الوطنية المصرية</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  يُمنح هذا التكريم الرقمي تقديراً لإلمامك الشامل بتاريخ وجغرافيا وعلماء جمهورية مصر العربية على منصة عائلة حنيش.
                </p>
              </div>

              <button
                onClick={handleRestartQuiz}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة خوض التحدي</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ====================================================
          GOVERNORATE FULL DETAILS MODAL
          ==================================================== */}
      {selectedGovernorateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                    {selectedGovernorateModal.name}
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    العاصمة: {selectedGovernorateModal.capital} · {selectedGovernorateModal.regionLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGovernorateModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scroll text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1.5">أبرز المعالم التاريخية والسياحية:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGovernorateModal.landmarks.map((lm, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                    >
                      {lm}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1.5">أهم الأنشطة الاقتصادية والإنتاجية:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGovernorateModal.keyIndustries.map((ind, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-semibold"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1.5">أشهر الأعلام والرموز:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGovernorateModal.famousFigures.map((fig, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold"
                    >
                      {fig}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>حقيقة مميزة عن المحافظة:</span>
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedGovernorateModal.funFact}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedGovernorateModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
