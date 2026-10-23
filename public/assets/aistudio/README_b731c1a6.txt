تشغيل منصة عائلة حنيش على InfinityFree
=====================================

1) افتح config.php وعدّل بيانات قاعدة البيانات من لوحة InfinityFree (MySQL Databases):
   DB_HOST  : الـ Host (مثل sqlXXX.infinityfree.com)
   DB_NAME  : if0_43023184_hanish_db
   DB_USER  : if0_43023184
   DB_PASS  : كلمة مرور MySQL

2) ارفع محتويات هذا المجلد (وليس المجلد نفسه) داخل htdocs.
   يجب أن يكون index.php مباشرة داخل htdocs.

3) افتح الموقع. الجداول تُنشأ تلقائياً عند أول زيارة.

4) قبل النشر النهائي:
   - غيّر ADMIN_PASSWORD في config.php.
   - تأكد أن DEBUG = false.

الدخول للأدمن: admin@hanish.edu وكلمة المرور الموجودة في ADMIN_PASSWORD.
