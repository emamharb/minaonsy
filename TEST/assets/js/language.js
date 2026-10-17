(() => {
  "use strict";

  const STORAGE_KEY = "mina-site-language";
  const THEME_STORAGE_KEY = "mina-site-theme";
  let storedLanguage = "en";
  try {
    storedLanguage = localStorage.getItem(STORAGE_KEY) || "en";
  } catch (_) {
    storedLanguage = "en";
  }
  const initialLanguage = storedLanguage;
  const defaultTheme = /(?:^|\/)admin(?:\/|\.html$)/i.test(window.location.pathname) ? "dark" : "light";
  let storedTheme = defaultTheme;
  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
  } catch (_) {
    storedTheme = defaultTheme;
  }
  const initialTheme = storedTheme === "dark" ? "dark" : "light";
  const mapArEn = {
    "إدارة البورتفوليو | Mina Onsy Studio": "Portfolio Management | Mina Onsy Studio",
    "إدارة معرض | Mina Onsy Studio": "Gallery Management | Mina Onsy Studio",
    "أعمال الفريق | Mina Onsy Studio": "Team Work | Mina Onsy Studio",
    "الأسعار | Mina Onsy Studio": "Pricing | Mina Onsy Studio",
    "المساحة | Mina Onsy Studio": "Storage | Mina Onsy Studio",
    "حجز تصوير زفاف | Mina Onsy Studio": "Wedding Photography Booking | Mina Onsy Studio",
    "دخول الأدمن | Mina Onsy Studio": "Admin Login | Mina Onsy Studio",
    "سلة المهملات | Mina Onsy Studio": "Trash | Mina Onsy Studio",
    "لوحة التحكم | Mina Onsy Studio": "Dashboard | Mina Onsy Studio",
    "معرض العميل | Mina Onsy Studio": "Client Gallery | Mina Onsy Studio",
    "أعمال أعضاء فريق Mina Onsy Studio.": "Mina Onsy Studio team members' work.",
    "باقات تصوير مينا أنسي للأفراح والمناسبات.": "Mina Onsy wedding and event photography packages.",
    "فريق Mina Onsy Studio ومعارض أعمالهم.": "The Mina Onsy Studio team and their work galleries.",
    "تخطي إلى نموذج الحجز": "Skip to booking form",
    "تخطي إلى الأسعار": "Skip to pricing",
    "تخطي إلى الأعمال": "Skip to work",
    "تخطي إلى الفريق": "Skip to team",
    "التالي": "Next",
    "السابق": "Previous",
    "التنقل الرئيسي": "Main navigation",
    "باقات التصوير": "Photography packages",
    "الرئيسية": "Home",
    "الباقات": "Packages",
    "حجز": "Book",
    "احجز الآن": "Book now",
    "احجز جلستك": "Book your session",
    "تواصل معنا": "Contact us",
    "واتساب": "WhatsApp",
    "انستجرام": "Instagram",
    "فيسبوك": "Facebook",
    "البريد الإلكتروني": "Email",
    "كلمة المرور": "Password",
    "دخول": "Log in",
    "تسجيل الدخول": "Sign in",
    "تسجيل الخروج": "Log out",
    "لوحة التحكم": "Dashboard",
    "الأدمن": "Admin",
    "إدارة البورتفوليو": "Portfolio management",
    "إدارة المعارض": "Gallery management",
    "التخزين": "Storage",
    "سلة المهملات": "Trash",
    "العودة": "Back",
    "رجوع": "Back",
    "حفظ": "Save",
    "إلغاء": "Cancel",
    "حذف": "Delete",
    "استعادة": "Restore",
    "تعديل": "Edit",
    "رفع": "Upload",
    "اختيار الملفات": "Choose files",
    "تحميل": "Download",
    "تحميل الكل": "Download all",
    "معرض العميل": "Client gallery",
    "معرض العميل الخاص": "Private client gallery",
    "رابط المعرض غير صحيح.": "Invalid gallery link.",
    "هذا المعرض محمي بكلمة سر.": "This gallery is protected by a password.",
    "كلمة السر": "Password",
    "كلمة السر غير صحيحة.": "The password is incorrect.",
    "أدخل كلمة السر أولًا.": "Enter the password first.",
    "جاري التحقق...": "Verifying...",
    "جاري تحميل المعرض...": "Loading gallery...",
    "هذا المعرض تم نقله إلى سلة المهملات ولم يعد متاحًا للعرض.": "This gallery has been moved to the trash and is no longer available.",
    "لا توجد ملفات في هذا المعرض بعد.": "There are no files in this gallery yet.",
    "تجهيز ملف ZIP": "Preparing ZIP file",
    "تجهيز": "Preparing",
    "تنزيل": "Download",
    "الصورة السابقة": "Previous image",
    "الصورة التالية": "Next image",
    "إغلاق": "Close",
    "تخطي إلى المعرض": "Skip to portfolio",
    "تخطي إلى ملفات المعرض": "Skip to gallery files",
    "معرض الأعمال": "Portfolio",
    "الأعمال المختارة": "Selected Work",
    "عرض المزيد": "Load more",
    "الفريق": "Team",
    "أعضاء الفريق": "Our Team",
    "الباقات والأسعار": "Packages & Pricing",
    "الأسعار": "Pricing",
    "الباقة": "Package",
    "اختر الباقة": "Choose a package",
    "اختر الباقة المناسبة لك": "Choose the package that fits you",
    "تفاصيل الباقة": "Package details",
    "الخدمات الإضافية": "Add-ons",
    "يشمل": "Includes",
    "غير شامل": "Not included",
    "الأكثر طلبًا": "Most popular",
    "باقة التصوير": "Photography package",
    "الباقة الترويجية": "Promotional package",
    "الحجز": "Booking",
    "احجز موعدك": "Book your date",
    "بيانات الحجز": "Booking details",
    "تفاصيل العروسين": "Couple details",
    "تفاصيل الفرح": "Wedding details",
    "ملخص الحجز": "Booking summary",
    "ملخص الفاتورة": "Invoice summary",
    "التاريخ": "Date",
    "تاريخ الفرح": "Wedding date",
    "المدينة": "City",
    "اختر المدينة": "Choose a city",
    "قنا": "Qena",
    "الأقصر": "Luxor",
    "سوهاج": "Sohag",
    "أسوان": "Aswan",
    "اسم العريس": "Groom's name",
    "اسم العروسة": "Bride's name",
    "رقم الهاتف": "Phone number",
    "رقم إضافي": "Additional phone",
    "اسم القاعة": "Venue name",
    "المكان": "Location",
    "الميكب آرتست": "Makeup artist",
    "مصفف الشعر": "Hair stylist",
    "ملاحظات إضافية": "Additional notes",
    "العربون": "Down payment",
    "الخصم": "Discount",
    "المبلغ المتبقي": "Remaining balance",
    "الإجمالي": "Total",
    "إجمالي الباقات": "Packages total",
    "رسوم الانتقال": "Travel fees",
    "أوافق على شروط الحجز والتعاقد": "I agree to the booking and contract terms",
    "تأكيد الحجز عبر واتساب": "Confirm booking via WhatsApp",
    "إرسال الحجز": "Submit booking",
    "شروط الحجز والتعاقد": "Booking and contract terms",
    "اختر باقة واحدة على الأقل.": "Choose at least one package.",
    "اختر المدينة أولًا.": "Choose a city first.",
    "اختر التاريخ": "Choose a date",
    "مصور أفراح ومناسبات": "Wedding and event photographer",
    "تصوير يحكي قصتك": "Photography that tells your story",
    "لحظاتك تستحق أن تُحكى": "Your moments deserve to be told",
    "نلتقط اللحظة، ونحفظ الإحساس.": "We capture the moment and preserve the feeling.",
    "يركز على اللحظات الطبيعية، مع عين هادئة في التكوين والإضاءة.": "He focuses on natural moments with a calm eye for composition and light.",
    "تضبط المشهد العام وتتابع التفاصيل البصرية حتى آخر لقطة.": "She shapes the overall scene and follows the visual details through the final frame.",
    "يلاحق الإيقاع السريع لليوم ويحوّله لسرد متوازن وواضح.": "He follows the day's fast rhythm and turns it into a balanced, clear story.",
    "تهتم بالتفاصيل الصغيرة، من اللمسة البصرية إلى التنسيق النهائي.": "She cares for the small details, from the visual touch to the final styling.",
    "يختار الإطارات الأقوى ويوازن بين اللقطات الحية والهادئة.": "He selects the strongest frames and balances lively and quiet moments.",
    "نصنع صورًا تشبهك": "We create photographs that feel like you",
    "عن الاستوديو": "About the studio",
    "مينا أنسي، مصور فوتوغرافي للأفراح والمناسبات.": "Mina Onsy, a wedding and event photographer.",
    "نحكي قصتك من خلال صور صادقة، أنيقة، ومليئة بالمشاعر.": "We tell your story through honest, elegant, and emotional photographs.",
    "اكتشف أعمالنا": "Explore our work",
    "تعرف على الفريق": "Meet the team",
    "خصوصية": "Privacy",
    "الشروط والأحكام": "Terms & Conditions",
    "كل الحقوق محفوظة": "All rights reserved",
    "استوديو مينا أنسي": "Mina Onsy Studio",
    "اللغة العربية": "Arabic",
    "العربية": "Arabic",
    "الإنجليزية": "English",
    "إظهار القائمة": "Show menu",
    "فتح القائمة": "Open menu",
    "إخفاء القائمة": "Hide menu",
    "إتمام": "Complete",
    "الوقت المتبقي": "Time remaining",
    "إخفاء القائمة": "Hide menu",
    "السعر": "Price",
    "تعديل الرابط": "Edit link",
    "توليد تلقائي": "Generate automatically",
    "مجلد": "Folder",
    "اكتب اسم السكشن الجديد:": "Enter the new section name:",
    "اكتب الرابط المخصص هنا": "Enter the custom link here",
    "سيتم إنشاؤه تلقائياً": "It will be generated automatically",
    "بدون تاريخ": "No date",
    "غير معروف": "Unknown",
    "ج.م": "EGP",
    "جنيه": "EGP",
    "جاري التحميل...": "Loading...",
    "جاري التحميل": "Loading",
    "جاري تحميل الصور...": "Loading photos...",
    "جاري تحميل الملفات...": "Loading files...",
    "جاري تحميل المعارض...": "Loading galleries...",
    "جاري تحميل المعارض المحذوفة...": "Loading deleted galleries...",
    "جاري تحميل بيانات المعرض...": "Loading gallery data...",
    "جاري إنشاء المعرض...": "Creating gallery...",
    "جاري الرفع": "Uploading",
    "جاري نقل المعرض": "Moving gallery",
    "جاري التحقق...": "Verifying...",
    "تم رفع الصور بنجاح.": "Photos uploaded successfully.",
    "تم رفع الملفات بنجاح.": "Files uploaded successfully.",
    "تم رفع الصور بنجاح": "Photos uploaded successfully",
    "تم رفع الملفات بنجاح": "Files uploaded successfully",
    "تم إلغاء الرفع.": "Upload canceled.",
    "حدث خطأ غير متوقع.": "An unexpected error occurred.",
    "حدث خطأ غير متوقع. حاول مرة أخرى.": "An unexpected error occurred. Please try again.",
    "حدث خطأ. حاول مرة أخرى.": "An error occurred. Please try again.",
    "تعذر إتمام العملية. حاول مرة أخرى.": "The operation could not be completed. Please try again.",
    "تعذر تسجيل الدخول الآن. حاول مرة أخرى.": "Unable to log in right now. Please try again.",
    "تعذر نسخ كلمة السر تلقائيًا.": "The password could not be copied automatically.",
    "لا توجد كلمة سر لعرضها.": "There is no password to display.",
    "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.": "Too many attempts. Please wait a moment and try again.",
    "هذا الدومين غير مضاف في Firebase Authorized Domains.": "This domain is not listed in Firebase Authorized Domains.",
    "ليست لديك صلاحية لتنفيذ هذه العملية.": "You do not have permission to perform this action.",
    "ليست لديك صلاحية لتنفيذ هذه العملية. راجع تسجيل الدخول وقواعد الأمان.": "You do not have permission to perform this action. Check your login and security rules.",
    "الاتصال ضعيف. حاول رفع الصورة مرة أخرى.": "The connection is weak. Try uploading the photo again.",
    "الاتصال ضعيف. حاول رفع الملف مرة أخرى.": "The connection is weak. Try uploading the file again.",
    "فشل الرفع. تأكد من قواعد Storage وأن حساب الأدمن مسجل دخول.": "Upload failed. Check Storage rules and make sure the admin account is signed in.",
    "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى.": "The service is temporarily unavailable. Please try again.",
    "المساحة التخزينية وصلت للحد الأقصى 100 جيجا.": "Storage has reached the 100 GB limit.",
    "تعذر نسخ كلمة السر تلقائيًا.": "The password could not be copied automatically.",
    "تعذر تحميل البيانات.": "Unable to load data.",
    "تعذر بدء التحميل. يلزم تفعيل إعدادات التحميل في Firebase Storage.": "Unable to start the download. Firebase Storage download settings need to be enabled.",
    "لا يوجد اتصال بالإنترنت.": "No internet connection.",
    "تم الحذف بنجاح": "Deleted successfully",
    "تم الحفظ بنجاح": "Saved successfully",
    "تم الرفع بنجاح": "Uploaded successfully",
    "لا توجد نتائج": "No results",
    "لا توجد معارض بعد.": "No galleries yet.",
    "تم الرفع مع فشل": "Uploaded with failures",
    "تم رفع الملفات بنجاح.": "Files uploaded successfully.",
    "تم رفع الصور بنجاح.": "Photos uploaded successfully.",
    "تم نقل المعرض إلى سلة المهملات.": "Gallery moved to trash.",
    "تم استعادة المعرض بنجاح.": "Gallery restored successfully.",
    "هل تريد حذف سكشن": "Do you want to delete section",
    "هل تريد حذف معرض": "Do you want to permanently delete gallery",
    "هل تريد نقل معرض": "Do you want to move gallery",
    "سيتم نقل ملفاته إلى السكشن الرئيسي.": "Its files will be moved to the main section.",
    "لن يمكن استرجاعه.": "It cannot be restored.",
    "يمكن استرجاعه لاحقًا بنفس الرابط.": "It can later be restored using the same link.",
    "السكشن الرئيسي": "Main section",
    "قسم جديد": "New section",
    "اسم العميل": "Client name",
    "اسم المعرض": "Gallery name",
    "كود الدخول": "Access code",
    "تاريخ الزفاف": "Wedding date",
    "تاريخ الإنشاء": "Created date",
    "عدد الصور": "Photo count",
    "مشاركة": "Share",
    "نسخ الرابط": "Copy link",
    "تم نسخ الرابط": "Link copied",
    "فتح المعرض": "Open gallery",
    "إضافة معرض": "Add gallery",
    "إنشاء معرض": "Create gallery",
    "إضافة صور": "Add photos",
    "حذف نهائي": "Delete permanently",
    "تأكيد الحذف": "Confirm deletion",
    "هل أنت متأكد؟": "Are you sure?",
    "لا يمكن التراجع عن هذا الإجراء.": "This action cannot be undone.",
    "الملف": "File",
    "الحالة": "Status",
    "الإجراءات": "Actions",
    "متاح": "Available",
    "محذوف": "Deleted",
    "مغلق": "Closed"
  };

  Object.assign(mapArEn, {
    "فريق العمل": "The Team",
    "تعرف على أعضاء الفريق واستعرض الأعمال الخاصة بكل منهم.": "Meet the team and explore each member's work.",
    "الأعمال": "Work",
    "عرض الأعمال": "View work",
    "رجوع للفريق": "Back to team",
    "تصوير القاعة": "Venue photography",
    "تصوير التجهيزات": "Getting-ready photography",
    "تصوير سيشن الفرح": "Wedding-session photography",
    "تصوير سيشن كاجوال": "Casual session photography",
    "تصوير القاعة بـ 2 كاميرا": "Venue photography with 2 cameras",
    "تسليم عدد صور مفتوح على الرابط": "Unlimited photos delivered through your private link",
    "ألبوم (30×45)": "Album (30×45)",
    "ألبوم (30×80)": "Album (30×80)",
    "بورتريه (50×70)": "Portrait (50×70)",
    "الباقة الأولى": "Package One",
    "الباقة الثانية": "Package Two",
    "الباقة الثالثة": "Package Three",
    "باقة VIP": "VIP Package",
    "الأكثر طلبا": "Most popular",
    "اليوم كامل بـ 2 كاميرا": "Full day with 2 cameras",
    "فيديو ريل بالموبايل (اليوم كامل)": "Mobile reel video (full day)",
    "تسليم الصور ثاني يوم مباشرة": "Next-day photo delivery",
    "جلسة تصوير كاجوال": "Casual photo session",
    "كاميرا إضافية كامل اليوم": "Additional camera for the full day",
    "كاميرا إضافية نصف اليوم": "Additional camera for half a day",
    "ملاحظات هامة": "Important notes",
    "اليوم الكامل 12 ساعة، والساعة الإضافية 500 L.E": "A full day is 12 hours; each additional hour is EGP 500.",
    "الانتقالات خارج الإسكندرية تُحسب عند الخروج عن المدينة": "Travel outside Alexandria is calculated once the event is outside the city.",
    "رسوم دخول أماكن التصوير خارج الباكدج": "Photography-location entry fees are not included in the package.",
    "تأكيد الحجز يكون بعربون مسبق": "Booking is confirmed with an advance down payment.",
    "يتم تصفية الحساب المتبقي بعد الفرح مباشرة": "The remaining balance is settled immediately after the wedding.",
    "العربون غير مسترد في حالة إلغاء الحجز": "The down payment is non-refundable if the booking is cancelled.",
    "500 جنيه": "EGP 500",
    "1,000 جنيه": "EGP 1,000",
    "1,500 جنيه": "EGP 1,500",
    "2,000 جنيه": "EGP 2,000",
    "2,500 جنيه": "EGP 2,500",
    "5,500 جنيه": "EGP 5,500",
    "6,000 جنيه": "EGP 6,000",
    "7,500 جنيه": "EGP 7,500",
    "9,500 جنيه": "EGP 9,500",
    "11,500 جنيه": "EGP 11,500",
    "نموذج حجز تصوير زفاف": "Wedding photography booking form",
    "اختر يوم التصوير والمناسبة *": "Choose the shooting and event date *",
    "اليوم": "Day",
    "الشهر": "Month",
    "السنة": "Year",
    "التكلفة والوجهة": "Pricing and destination",
    "المحافظة / المدينة: *": "Governorate / city: *",
    "-- اختر وجهتك لتحديد السعر --": "-- Select your destination to set the price --",
    "نجع حمادي": "Nagaa Hammadi",
    "الغردقة": "Hurghada",
    "اختر الباقات المطلوبة": "Select the required packages",
    "أولاً: باقات التصوير الأساسية (Photo):": "First: basic photography packages",
    "الباقة الأولى (Photo)": "Package One (Photo)",
    "الباقة الثانية (Photo)": "Package Two (Photo)",
    "الباقة الثالثة (Photo)": "Package Three (Photo)",
    "باقة VIP (Photo)": "VIP Package (Photo)",
    "ثانياً: العروض الإضافية (Promo):": "Second: additional promo offers",
    "الباقة الأولى (Promo)": "Package One (Promo)",
    "الباقة الثانية (Promo)": "Package Two (Promo)",
    "بيانات العريس والعروسة": "Groom and bride information",
    "اسم العريس: *": "Groom's name: *",
    "اسم العروسة: *": "Bride's name: *",
    "الاسم الكامل": "Full name",
    "رقم الهاتف الرئيسي (واتساب): *": "Primary phone (WhatsApp): *",
    "رقم إضافي للضرورة:": "Emergency phone:",
    "اختياري": "Optional",
    "تفاصيل يوم الزفاف": "Wedding-day details",
    "مكان القاعة بالفرح:": "Wedding hall venue:",
    "اسم وتفاصيل القاعة": "Hall name and details",
    "مكان السيشن الخارجي:": "Outdoor session location:",
    "المكان المقترح للسيشن": "Suggested session location",
    "الميكب أرتيست:": "Makeup artist:",
    "اسم الميكب أرتيست": "Makeup artist name",
    "مصمم الشعر:": "Hair stylist:",
    "اسم هير ستايلست": "Hair stylist name",
    "العربون المدفوع لتثبيت الحجز (ج.م):": "Down payment to secure the booking (EGP):",
    "قيمة الخصم إن وجد (ج.م):": "Discount amount, if any (EGP):",
    "ملاحظات أو طقوس خاصة:": "Special notes or rituals:",
    "موعد الكنيسة / كتب الكتاب": "Church time / marriage-contract ceremony",
    "الفاتورة وملخص الحساب المالي": "Invoice and financial summary",
    "سعر باقة التصوير (Photo)": "Photography package price",
    "سعر باقة البرومو (Promo)": "Promo package price",
    "قيمة الخصم الممنوح:": "Discount applied:",
    "رسوم ومصاريف الانتقال للمحافظة:": "Transportation fees to the governorate:",
    "المقدم المدفوع (العربون)": "Down payment paid",
    "المبلغ المتبقي لتسويته يوم الفرح": "Remaining balance due on the wedding day",
    "ملاحظات وشروط التعاقد الهامة:": "Important booking terms and conditions:",
    "أوافق على تفاصيل الحجز والشروط المذكورة *": "I agree to the booking details and terms above *",
    "تأكيد الحجز وإرسال العقد عبر واتساب": "Confirm booking and send contract via WhatsApp",
    "تاريخ غير صحيح (تحقق من اليوم)": "Invalid date (check the day)",
    "يرجى اختيار اليوم والشهر والسنة": "Please select the day, month, and year",
    "يناير": "January",
    "فبراير": "February",
    "مارس": "March",
    "أبريل": "April",
    "مايو": "May",
    "يونيو": "June",
    "يوليو": "July",
    "أغسطس": "August",
    "سبتمبر": "September",
    "أكتوبر": "October",
    "نوفمبر": "November",
    "ديسمبر": "December",
    "معرض جديد": "New gallery",
    "معارض العملاء": "Client galleries",
    "المعارض": "Galleries",
    "البورتفوليو": "Portfolio",
    "المساحة": "Storage",
    "خروج": "Log out",
    "اسم العميل / المناسبة": "Client name / event",
    "مثال: أحمد ومريم": "Example: Ahmed and Mariam",
    "عنوان المعرض": "Gallery title",
    "رابط المعرض": "Gallery link",
    "أنشئ كلمة مرور": "Create an access code",
    "إجمالي الصور": "Total photos",
    "كل المعارض": "All galleries",
    "لا توجد معارض حتى الآن": "No galleries yet",
    "إضافة قسم": "Add section",
    "إضافة سكشن": "Add section",
    "إدارة أقسام المعرض": "Manage gallery sections",
    "تحديث": "Refresh",
    "بحث": "Search",
    "ابحث باسم العميل أو المعرض": "Search by client or gallery name",
    "نسخ": "Copy",
    "تم النسخ": "Copied",
    "حالة المعرض": "Gallery status",
    "نشط": "Active",
    "في سلة المهملات": "In trash",
    "المصور الرئيسي": "Lead Photographer",
    "المديرة الإبداعية": "Creative Director",
    "مصور أفراح": "Wedding Photographer",
    "منسقة بصرية": "Visual Stylist",
    "مصور مساعد": "Assistant Photographer",
    "معرض الأعمال": "Work portfolio",
    "عرض المزيد": "Load more",
    "إغلاق": "Close",
    "الصورة السابقة": "Previous image",
    "الصورة التالية": "Next image",
    "تخطي إلى الأسعار": "Skip to pricing",
    "تخطي إلى الفريق": "Skip to the team",
    "تخطي إلى الأعمال": "Skip to work",
    "تخطي إلى ملفات المعرض": "Skip to gallery files",
    "باقات التصوير": "Photography packages",
    "السكاشن": "Sections",
    "إدارة معرض": "Manage gallery",
    "المعرض": "Gallery",
    "رابط المعرض سيظهر هنا": "The gallery link will appear here",
    "نسخ الرابط": "Copy link",
    "كلمة السر": "Password",
    "نسخ كلمة السر": "Copy password",
    "رفع صور وفيديوهات": "Upload photos and videos",
    "السكشن المطلوب": "Target section",
    "الرئيسية": "Home",
    "اسم سكشن جديد...": "New section name...",
    "إنشاء": "Create",
    "اختر من القائمة أو اكتب اسماً جديداً واضغط \"إنشاء\"": "Choose from the list or enter a new name and press Create",
    "رفع مجلد": "Upload folder",
    "اضغط للاختيار، اسحب الملفات هنا، أو الصقها داخل الصفحة": "Click to choose, drag files here, or paste them into the page",
    "يدعم الصور والفيديوهات": "Supports photos and videos",
    "ملفات المعرض": "Gallery files",
    "جميع السكاشن": "All sections",
    "تسجيل الدخول": "Sign in",
    "البريد الإلكتروني": "Email address",
    "كلمة المرور": "Password",
    "دخول": "Sign in",
    "معرض الأعمال العام": "Public work portfolio",
    "رفع صور وفيديوهات جديدة": "Upload new photos and videos",
    "الملفات الحالية": "Current files",
    "فتح القائمة": "Open menu",
    "إغلاق القائمة": "Close menu",
    "سلة المهملات": "Trash",
    "تواصل واتساب": "Contact us on WhatsApp",
    "واتساب": "WhatsApp",
    "انستجرام": "Instagram",
    "احجز الآن": "Book now",
    "8 أرقام": "8 digits",
    "زفاف": "Wedding",
    "خطوبة": "Engagement",
    "حفل تخرج": "Graduation celebration",
    "جلسة تصوير": "Photo session",
    "سيشن": "Session",
    "أخرى": "Other",
    "بحث بالاسم أو التاريخ...": "Search by name or date...",
    "أي تفاصيل إضافية عن هذا المعرض...": "Any additional details about this gallery...",
    "بدون اسم": "Unnamed",
    "الرابط:": "Link:",
    "حُذف في": "Deleted on",
    "عدد الملفات": "File count",
    "عدد الملفات:": "File count:",
    "إدارة": "Manage",
    "منذ أكثر من 3 أشهر": "More than 3 months ago",
    "إظهار": "Show",
    "إخفاء": "Hide",
    "اختر صورًا فقط.": "Please select images only.",
    "اختر صورًا أو فيديوهات فقط.": "Please select images or videos only.",
    "جاري تحميل الصور...": "Loading photos...",
    "جاري رفع الملفات": "Uploading files",
    "بدء الرفع...": "Starting upload...",
    "حذف السكشن": "Delete section",
    "تعديل الاسم": "Rename",
    "لا توجد سكاشن مخصصة بعد.": "No custom sections yet.",
    "لا توجد صور مرفوعة بعد.": "No uploaded photos yet.",
    "لا توجد معارض في سلة المهملات.": "No galleries in trash.",
    "لا توجد ملفات داخل هذا السكشن بعد.": "There are no files in this section yet.",
    "لا توجد ملفات في هذا المعرض بعد.": "There are no files in this gallery yet.",
    "تم النسخ!": "Copied!",
    "تم الحذف": "Deleted",
    "تم الرفع": "Uploaded",
    "تم إنشاء السكشن.": "Section created.",
    "تم نسخ رابط المعرض.": "Gallery link copied.",
    "تم إنشاء المعرض:": "Gallery created:",
    "فتح الإدارة": "Open management",
    "جاري الاسترجاع...": "Restoring...",
    "جاري التحديث...": "Updating...",
    "جاري الحذف...": "Deleting...",
    "جاري الدخول...": "Signing in...",
    "جاري حفظ البيانات": "Saving data",
    "تعذر الاسترجاع.": "Unable to restore.",
    "تعذر الحذف النهائي.": "Unable to delete permanently.",
    "تعذر تحميل سلة المهملات.": "Unable to load trash.",
    "تعذر تحميل المعرض": "Unable to load gallery.",
    "تعذر نسخ الرابط تلقائيًا.": "The link could not be copied automatically.",
    "تعذر نسخ الرابط تلقائيًا. افتح المعرض وانسخ الرابط يدويًا.": "The link could not be copied automatically. Open the gallery and copy it manually.",
    "تعذر التحقق من كلمة السر. حاول مرة أخرى.": "Unable to verify the password. Please try again.",
    "رابط الإدارة غير صحيح.": "Invalid management link.",
    "المعرض غير موجود": "Gallery not found",
    "انتظر تحميل بيانات المعرض أولًا.": "Wait for the gallery data to load first.",
    "الرابط مستخدم بالفعل في المعارض الحالية.": "This link is already used by existing galleries.",
    "البريد الإلكتروني أو كلمة المرور غير صحيحة.": "The email address or password is incorrect.",
    "سيبدأ تنزيل الملفات بشكل منفصل. قد يطلب المتصفح السماح بتنزيل عدة ملفات.": "Files will download separately. Your browser may ask for permission to download multiple files.",
    "جاري رفع الملفات": "Uploading files",
    "الوقت المتبقي: --": "Time remaining: --",
    "مثال: أحمد ومريم": "Example: Ahmed and Mariam",
    "يوم/شهر/سنة": "Day/Month/Year",
    "موعد الزفاف:": "Wedding date:",
    "الفريق | Mina Onsy Studio": "Team | Mina Onsy Studio",
    "الباقات | Mina Onsy Studio": "Packages | Mina Onsy Studio",
    "التخطي إلى الباقات": "Skip to packages",
    "PHOTOGRAPHY": "التصوير",
    "WORKS": "الأعمال",
    "Mina Onsy Studio Photography": "تصوير استوديو مينا أنسي",
    "Clear packages to document your day, from the first details to the final image.": "باقات واضحة توثّق يومك، من أول التفاصيل حتى الصورة الأخيرة.",
    "WEDDING & EVENT PHOTOGRAPHY": "تصوير الأفراح والمناسبات",
    "Packages & Pricing": "الباقات والأسعار",
    "Package One": "الباقة الأولى",
    "Package Two": "الباقة الثانية",
    "Package Three": "الباقة الثالثة",
    "VIP Package": "باقة كبار الشخصيات",
    "Getting-ready coverage": "تصوير التجهيزات",
    "Wedding session photography": "تصوير جلسة الزفاف",
    "Venue coverage": "تصوير القاعة",
    "Unlimited photos delivered via link": "عدد غير محدود من الصور عبر رابط خاص",
    "Casual session photography": "تصوير جلسة كاجوال",
    "Venue coverage with 2 cameras": "تصوير القاعة بكاميرتين",
    "Full-day coverage with 2 cameras": "تغطية اليوم كاملًا بكاميرتين",
    "Additional Services": "خدمات إضافية",
    "Important Notes": "ملاحظات مهمة",
    "Next-day photo delivery": "تسليم الصور في اليوم التالي",
    "Casual photoshoot": "جلسة تصوير كاجوال",
    "Additional camera — full day": "كاميرا إضافية لليوم كاملًا",
    "Additional camera — half day": "كاميرا إضافية لنصف اليوم",
    "Full day is 12 hours; each additional hour is EGP 500": "مدة اليوم الكامل 12 ساعة، وتُحسب كل ساعة إضافية بـ500 جنيه",
    "Travel outside Alexandria is charged when leaving the city": "تُحسب تكاليف الانتقال خارج الإسكندرية عند مغادرة المدينة",
    "Location entry fees are not included in the package": "رسوم دخول مواقع التصوير غير مشمولة في الباقة",
    "Booking is confirmed with an advance deposit": "يُؤكّد الحجز بدفع عربون مقدمًا",
    "The remaining balance is settled immediately after the wedding": "يُسدّد المبلغ المتبقي مباشرة بعد الفرح",
    "The deposit is non-refundable if the booking is cancelled": "العربون غير مسترد عند إلغاء الحجز",
    "Photography packages": "باقات التصوير",
    "Lead Photographer": "المصور الرئيسي",
    "Creative Director": "المديرة الإبداعية",
    "Wedding Storyteller": "راوي قصص الأفراح",
    "Styling & Detail": "التنسيق والاهتمام بالتفاصيل",
    "Gallery Editor": "محرر المعرض",
    "The Team": "فريق العمل",
    "Meet the team and explore each member's work.": "تعرّف على أعضاء الفريق واستكشف أعمال كل منهم.",
    "Skip to packages": "تخطي إلى الباقات",
    "Skip to work": "تخطي إلى الأعمال",
    "Skip to the team": "تخطي إلى الفريق",
    "Skip to booking form": "تخطي إلى نموذج الحجز",
    "Mina Onsy Studio team members' work.": "أعمال أعضاء فريق استوديو مينا أنسي.",
    "The Mina Onsy Studio team and their work galleries.": "فريق استوديو مينا أنسي ومعارض أعمالهم.",
    "Mina Onsy, a wedding and event photographer.": "مينا أنسي، مصور أفراح ومناسبات.",
    "Photography packages from Mina Onsy Studio.": "باقات التصوير من استوديو مينا أنسي.",
    "Enter the gallery password to view photos.": "أدخل كلمة مرور المعرض لعرض الصور.",
    "Private album delivery": "تسليم ألبوم خاص",
    "PRIVATE ALBUM DELIVERY": "تسليم ألبوم خاص",
    "Client Album": "ألبوم العميل",
    "Enter the gallery password to view photos.": "أدخل كلمة مرور المعرض لعرض الصور.",
    "Open gallery": "فتح المعرض",
    "Download all": "تحميل الكل",
    "Download": "تحميل",
    "Close": "إغلاق",
    "Previous image": "الصورة السابقة",
    "Next image": "الصورة التالية",
    "Open menu": "فتح القائمة",
    "Skip to gallery files": "تخطي إلى ملفات المعرض",
    "Enter the gallery password to view your photos.": "أدخل كلمة مرور المعرض لعرض الصور.",
    "Team": "الفريق",
    "Pricing": "الأسعار",
    "Book": "احجز",
    "Packages": "الباقات",
    "Book this package": "احجز هذه الباقة"
  });

  Object.assign(mapArEn, {
    "الباقة 1": "Package 1",
    "الباقة 2": "Package 2",
    "الباقة 3": "Package 3",
    "الأكثر طلباً": "Most popular",
    "الباقة VIP": "VIP Package",
    "ثانياً: عروض البرومو الإضافية (Promo):": "Second: Additional Promo Offers (Promo):",
    "باكدج 1 (برومو)": "Promo Package 1",
    "باكدج 2 (برومو)": "Promo Package 2",
    "بيانات العروسين والتواصل": "Couple Information & Contact",
    "0 ج.م": "0 EGP",
    "نوع المناسبة": "Event type",
    "اختر المناسبة": "Select an event",
    "تاريخ المناسبة": "Event date",
    "موعد الزفاف (اختياري)": "Wedding date (optional)",
    "يظهر في صفحة العميل.": "Shown on the client page.",
    "رابط مخصص": "Custom link",
    "ملاحظات": "Notes",
    "إنشاء المعرض": "Create gallery",
    "إدارة المعرض | Mina Onsy Studio": "Gallery Management | Mina Onsy Studio",
    "دخول المشرف | Mina Onsy Studio": "Admin Login | Mina Onsy Studio",
    "المساحة التخزينية | Mina Onsy Studio": "Storage | Mina Onsy Studio",
    "إدارة التخزين": "Storage management",
    "المساحة التخزينية": "Storage",
    "جاري تحميل المساحة...": "Loading storage...",
    "المستخدم: --": "Used: --",
    "المتاح: --": "Available: --",
    "المعارض المحذوفة": "Deleted galleries",
    "تم نسخ الرابط وكلمة السر.": "Gallery link and password copied.",
    "تعذر النسخ تلقائيًا. افتح المعرض وانسخ البيانات يدويًا.": "Could not copy automatically. Open the gallery and copy the details manually.",
    "هل تريد حذف هذه الصورة نهائيًا؟": "Permanently delete this photo?",
    "معرض غير صحيح": "Invalid gallery",
    "معرض محذوف": "Deleted gallery",
    "هذا المعرض موجود في سلة المهملات. استرجعه أولًا للمتابعة.": "This gallery is in the trash. Restore it before continuing.",
    "لم يتم العثور على هذا المعرض.": "Gallery not found.",
    "غير متاحة": "Unavailable",
    "هل تريد حذف هذا الملف؟": "Delete this file?",
    "تم النسخ!": "Copied!",
    "نسخ كلمة السر": "Copy password",
    "WORKS": "الأعمال",
    "Wedding Booking": "حجز الزفاف",
    "Book Now": "احجز الآن",
    "Admin | Mina Onsy Studio": "الإدارة | Mina Onsy Studio",
    "Mina Onsy Studio Photography": "تصوير Mina Onsy Studio",
    "WEDDING & EVENT PHOTOGRAPHY": "تصوير الأفراح والمناسبات",
    "Wedding stories,": "حكايات زفاف،",
    "held forever.": "تبقى للأبد.",
    "Honest moments, artfully told — photographs that bring you back to how it felt.": "لحظات صادقة نحكيها بفن؛ صور تعيدك إلى إحساسها من جديد.",
    "Explore the work": "استكشف الأعمال",
    "Reserve your date": "احجز موعدك",
    "Selected wedding photographs": "صور مختارة من حفلات الزفاف",
    "Bride and groom together by the sea": "عروسان معًا بجوار البحر",
    "A quiet wedding portrait with a bouquet": "صورة زفاف هادئة مع باقة ورد",
    "Newlyweds among palm trees": "عروسان بين أشجار النخيل",
    "ALEXANDRIA · EGYPT": "الإسكندرية · مصر",
    "A DAY THAT FEELS LIKE YOU": "يوم يشبه حكايتكما",
    "Less posing.": "وضعيات أقل.",
    "More being there.": "وحضور أكبر.",
    "From the first details to the last dance, we make space for the moments that matter — and turn them into photographs you can return to.": "من أول التفاصيل حتى الرقصة الأخيرة، نترك مساحة للحظات الأهم ونحفظها في صور تعودان إليها دائمًا.",
    "Meet the people behind the camera": "تعرّف على فريق التصوير",
    "Studio approach": "نهج الاستوديو"
  });

  // Entries have accumulated in both Arabic→English and English→Arabic order.
  // Normalize them once so a key written in English can never be mistaken for
  // an Arabic source key and left untranslated when Arabic is selected.
  const hasArabic = (value) => /[\u0600-\u06ff]/.test(value);
  const mapArabicToEnglish = Object.create(null);
  const mapEnglishToArabic = Object.create(null);
  Object.entries(mapArEn).forEach(([key, value]) => {
    const keyIsArabic = hasArabic(key);
    const valueIsArabic = hasArabic(value);
    if (keyIsArabic && !valueIsArabic) {
      mapArabicToEnglish[key] = value;
      mapEnglishToArabic[value] = key;
    } else if (!keyIsArabic && valueIsArabic) {
      mapArabicToEnglish[value] = key;
      mapEnglishToArabic[key] = value;
    }
  });
  const nodeKeys = new WeakMap();
  const attrKeys = new WeakMap();
  let currentLanguage = initialLanguage === "ar" ? "ar" : "en";
  let currentTheme = initialTheme;
  let observer;
  document.documentElement.dataset.theme = currentTheme;
  let translating = false;

  function splitWhitespace(value) {
    const match = String(value).match(/^(\s*)([\s\S]*?)(\s*)$/);
    return { leading: match?.[1] || "", core: match?.[2] || "", trailing: match?.[3] || "" };
  }

  function canonicalKey(value) {
    const text = splitWhitespace(value).core;
    return Object.prototype.hasOwnProperty.call(mapArabicToEnglish, text) ? text : (mapEnglishToArabic[text] || text);
  }

  function translateDynamicArabic(value) {
    if (currentLanguage !== "en") return value;
    const rules = [
      [/^تنزيل\s+(\d+)\s+من\s+(\d+)$/, "Download $1 of $2"],
      [/^الوقت المتبقي:\s*(.+)$/, "Time remaining: $1"],
      [/^تم الرفع مع فشل\s+(\d+)\s+صورة\.?$/, "Uploaded with $1 failed photos."],
      [/^تم الرفع مع فشل\s+(\d+)\s+ملف\.?$/, "Uploaded with $1 failed files."],
      [/^جاري نقل معرض\s+(.+)\s+إلى سلة المهملات\.\.\.$/, "Moving gallery $1 to trash..."],
      [/^هل تريد حذف سكشن\s+(.+)\؟ سيتم نقل ملفاته إلى السكشن الرئيسي\.$/, "Delete section $1? Its files will be moved to the main section."],
      [/^هل تريد حذف معرض\s+(.+)\s+نهائيًا\؟ لن يمكن استرجاعه\.$/, "Permanently delete gallery $1? It cannot be restored."],
      [/^هل تريد نقل معرض\s+(.+)\s+إلى سلة المهملات\؟ يمكن استرجاعه لاحقًا بنفس الرابط\.$/, "Move gallery $1 to trash? It can later be restored using the same link."],
      [/^(\d+)\s+ث$/, "$1 sec"],
      [/^(\d+)\s+د\s+(\d+)\s+ث$/, "$1 min $2 sec"],
      [/^المستخدم:\s*(.+)$/, "Used: $1"],
      [/^المتاح:\s*(.+)$/, "Available: $1"],
      [/^تجهيز\s+(\d+)\s+من\s+(\d+)$/, "Preparing $1 of $2"],
      [/^ضغط الملفات\s+(\d+)%$/, "Compressing files $1%"],
      [/^تم رفع\s+(\d+)\s+من\s+(\d+)\s+ملف(?:\s+\((\d+)\s+فشل\))?\.?$/, (_, completed, total, failed) => `Uploaded ${completed} of ${total} files${failed ? ` (${failed} failed)` : ""}.`],
      [/^(\d+)\s+ملف$/, "$1 files"],
      [/^الوقت المتبقي:\s*(\d+)\s+ث$/, "Time remaining: $1 sec"]
    ];
    for (const [pattern, replacement] of rules) {
      if (pattern.test(value)) return value.replace(pattern, replacement);
    }
    return value;
  }

  function translateValue(value) {
    const parts = splitWhitespace(value);
    const key = canonicalKey(parts.core);
    const translated = currentLanguage === "en" ? (mapArabicToEnglish[key] || translateDynamicArabic(key)) : key;
    return `${parts.leading}${translated}${parts.trailing}`;
  }

  if (!window.__siteLanguageDialogsWrapped) {
    const nativeAlert = window.alert.bind(window);
    const nativeConfirm = window.confirm.bind(window);
    const nativePrompt = window.prompt.bind(window);
    window.alert = (message) => nativeAlert(translateValue(String(message)));
    window.confirm = (message) => nativeConfirm(translateValue(String(message)));
    window.prompt = (message, defaultValue = "") => nativePrompt(translateValue(String(message)), defaultValue);
    window.__siteLanguageDialogsWrapped = true;
  }

  function translateTextNode(node) {
    if (!node || !node.parentElement || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(node.parentElement.tagName)) return;
    if (node.parentElement.closest && node.parentElement.closest("#siteLanguageToggle, #mobileMenuDrawer, #mobileMenuToggle, #mobileMenuBackdrop")) return;
    const raw = nodeKeys.has(node) ? nodeKeys.get(node) : node.nodeValue;
    if (!raw || !splitWhitespace(raw).core) return;
    const key = canonicalKey(raw);
    nodeKeys.set(node, key);
    const parts = splitWhitespace(raw);
    const translated = currentLanguage === "en" ? (mapArabicToEnglish[key] || translateDynamicArabic(key)) : key;
    const next = `${parts.leading}${translated}${parts.trailing}`;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(root) {
    root.querySelectorAll("[placeholder],[aria-label],[title],[alt],meta[name='description']").forEach((element) => {
      if (element.closest && element.closest("#siteLanguageToggle, #mobileMenuDrawer, #mobileMenuToggle, #mobileMenuBackdrop")) return;
      const keys = attrKeys.get(element) || {};
      ["placeholder", "aria-label", "title", "alt", ...(element.matches("meta[name='description']") ? ["content"] : [])].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const raw = keys[attribute] ?? element.getAttribute(attribute);
        const key = canonicalKey(raw);
        keys[attribute] = key;
        element.setAttribute(attribute, currentLanguage === "en" ? (mapArabicToEnglish[key] || translateDynamicArabic(key)) : key);
      });
      attrKeys.set(element, keys);
    });
  }

  function translateSiteNavigation() {
    document.querySelectorAll(".site-header .main-nav a[data-label-ar][data-label-en]").forEach((link) => {
      const label = currentLanguage === "ar" ? link.dataset.labelAr : link.dataset.labelEn;
      if (label && link.textContent !== label) link.textContent = label;
    });
  }

  function isSmallViewport() {
    return typeof window.matchMedia === "function" && window.matchMedia("(max-width: 700px)").matches;
  }

  function setMobileMenuOpen(open) {
    const drawer = document.querySelector("#mobileMenuDrawer");
    const backdrop = document.querySelector("#mobileMenuBackdrop");
    const toggle = document.querySelector("#mobileMenuToggle");
    if (!drawer || !backdrop || !toggle) return;
    drawer.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    backdrop.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("mobile-menu-open", open);
    renderMobileMenu();
    if (!open) toggle.focus({ preventScroll: true });
  }

  function renderMobileMenu() {
    const drawer = document.querySelector("#mobileMenuDrawer");
    const toggle = document.querySelector("#mobileMenuToggle");
    if (!drawer || !toggle) return;
    const arabic = currentLanguage === "ar";
    const labels = arabic
      ? { menu: "القائمة", close: "إغلاق القائمة", home: "الرئيسية", work: "الأعمال", team: "الفريق", pricing: "الأسعار", book: "حجز" }
      : { menu: "Menu", close: "Close menu", home: "Home", work: "Work", team: "Team", pricing: "Pricing", book: "Book" };
    const setText = (selector, value) => {
      const element = drawer.querySelector(selector);
      if (element && element.textContent !== value) element.textContent = value;
    };
    setText("#mobileMenuTitle", labels.menu);
    drawer.querySelector("#mobileMenuClose").setAttribute("aria-label", labels.close);
    const backdrop = document.querySelector("#mobileMenuBackdrop");
    if (backdrop) backdrop.setAttribute("aria-label", labels.close);
    toggle.setAttribute("aria-label", drawer.classList.contains("is-open") ? labels.close : (arabic ? "فتح القائمة" : "Open menu"));
    setText('[data-menu-label="home"]', labels.home);
    setText('[data-menu-label="work"]', labels.work);
    setText('[data-menu-label="team"]', labels.team);
    setText('[data-menu-label="pricing"]', labels.pricing);
    setText('[data-menu-label="book"]', labels.book);
  }

  function ensureMobileMenu() {
    const header = document.querySelector(".site-header");
    if (!header || document.body.classList.contains("client-album-page")) return null;
    document.body.classList.add("has-mobile-language-menu");
    let toggle = document.querySelector("#mobileMenuToggle");
    let backdrop = document.querySelector("#mobileMenuBackdrop");
    let drawer = document.querySelector("#mobileMenuDrawer");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.id = "mobileMenuToggle";
      toggle.className = "mobile-menu-toggle";
      toggle.type = "button";
      toggle.textContent = "☰";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "mobileMenuDrawer");
      header.appendChild(toggle);
    }
    if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.id = "mobileMenuBackdrop";
      backdrop.className = "mobile-menu-backdrop";
      backdrop.type = "button";
      backdrop.setAttribute("aria-label", "Close menu");
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }
    if (!drawer) {
      drawer = document.createElement("aside");
      drawer.id = "mobileMenuDrawer";
      drawer.className = "mobile-menu-drawer";
      drawer.setAttribute("aria-hidden", "true");
      drawer.innerHTML = `
        <div class="mobile-menu-head">
          <span id="mobileMenuTitle">Menu</span>
          <button id="mobileMenuClose" class="mobile-menu-close" type="button" aria-label="Close menu">×</button>
        </div>
        <nav class="mobile-menu-links" aria-label="Main navigation">
          <a href="index.html" data-menu-label="home">Home</a>
          <a href="index.html#portfolio" data-menu-label="work">Work</a>
          <a href="team.html" data-menu-label="team">Team</a>
          <a href="pricing.html" data-menu-label="pricing">Pricing</a>
          <a href="booking.html" data-menu-label="book" class="mobile-menu-book">Book</a>
        </nav>
      `;
      document.body.appendChild(drawer);
    }
    if (!toggle.dataset.bound) {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        setMobileMenuOpen(!drawer.classList.contains("is-open"));
      }, { passive: false });
      toggle.dataset.bound = "1";
    }
    if (!backdrop.dataset.bound) {
      backdrop.addEventListener("click", () => setMobileMenuOpen(false));
      backdrop.dataset.bound = "1";
    }
    const closeButton = drawer.querySelector("#mobileMenuClose");
    if (closeButton && !closeButton.dataset.bound) {
      closeButton.addEventListener("click", () => setMobileMenuOpen(false));
      closeButton.dataset.bound = "1";
    }
    if (!drawer.dataset.bound) {
      drawer.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMobileMenuOpen(false);
      });
      drawer.dataset.bound = "1";
    }
    if (!document.body.dataset.mobileMenuEscapeBound) {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMobileMenuOpen(false);
      });
      document.body.dataset.mobileMenuEscapeBound = "1";
    }
    renderMobileMenu();
    return drawer;
  }

  function syncThemeLogos() {
    document.querySelectorAll("img[data-light-logo]").forEach((logo) => {
      const currentSrc = logo.getAttribute("src");
      if (!logo.dataset.darkLogo && currentSrc) logo.dataset.darkLogo = currentSrc;
      const nextSrc = currentTheme === "light" ? logo.dataset.lightLogo : logo.dataset.darkLogo;
      if (nextSrc && currentSrc !== nextSrc) logo.setAttribute("src", nextSrc);
    });
  }

  function setTheme(theme) {
    currentTheme = theme === "light" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (_) {
      // Theme switching still works for the current page when storage is unavailable.
    }
    window.SITE_THEME = currentTheme;
    document.documentElement.dataset.theme = currentTheme;
    document.body.classList.toggle("theme-light", currentTheme === "light");
    syncThemeLogos();
    renderThemeButton();
    window.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme: currentTheme } }));
    document.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme: currentTheme } }));
  }

  function ensureDesktopControlsBar() {
    const header = document.querySelector(".site-header");
    let bar = document.querySelector("#siteDesktopControls");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "siteDesktopControls";
      bar.className = "desktop-controls-bar";
      bar.setAttribute("aria-label", "Site controls");
      (header || document.body).appendChild(bar);
    } else if (header && !isSmallViewport() && bar.parentElement !== header) {
      header.appendChild(bar);
    }
    return bar;
  }

  function getAdminSidebarNav() {
    return document.querySelector("body.admin-body .admin-sidebar nav");
  }

  function isAdminThemeControlDisabled() {
    return Boolean(document.body?.classList.contains("admin-body") || document.body?.classList.contains("client-album-page") || document.querySelector("body .auth-shell"));
  }

  function removeAdminThemeControl() {
    const button = document.querySelector("#siteThemeToggle");
    if (button) button.remove();
    const controlsBar = document.querySelector("#siteDesktopControls");
    if (controlsBar && !controlsBar.children.length) controlsBar.remove();
  }

  function renderThemeButton() {
    if (isAdminThemeControlDisabled()) {
      removeAdminThemeControl();
      return;
    }
    const drawer = ensureMobileMenu();
    const desktopBar = ensureDesktopControlsBar();
    let button = document.querySelector("#siteThemeToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "siteThemeToggle";
      button.className = "theme-switcher";
      button.type = "button";
      document.body.appendChild(button);
    }
    const target = currentTheme === "dark" ? "light" : "dark";
    const labels = currentLanguage === "ar"
      ? { light: "الثيم الفاتح", dark: "الثيم الداكن", lightAria: "التبديل إلى الثيم الفاتح", darkAria: "التبديل إلى الثيم الداكن" }
      : { light: "Light theme", dark: "Dark theme", lightAria: "Switch to light theme", darkAria: "Switch to dark theme" };
    const label = target === "light" ? labels.light : labels.dark;
    const ariaLabel = target === "light" ? labels.lightAria : labels.darkAria;
    const icon = target === "light"
      ? '<svg class="theme-switcher-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>'
      : '<svg class="theme-switcher-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.6 8.6 0 1 0 20.5 14.8Z"></path></svg>';
    if (button.dataset.iconTheme !== target) {
      button.innerHTML = icon;
      button.dataset.iconTheme = target;
    }
    if (button.getAttribute("aria-label") !== ariaLabel) button.setAttribute("aria-label", ariaLabel);
    if (button.title !== ariaLabel) button.title = ariaLabel;
    if (button.dataset.targetTheme !== target) button.dataset.targetTheme = target;
    if (!button.dataset.bound) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setTheme(button.dataset.targetTheme || (currentTheme === "dark" ? "light" : "dark"));
      }, { passive: false });
      button.dataset.bound = "1";
    }
    if (button.parentElement !== desktopBar) desktopBar.appendChild(button);
  }

  function renderLanguageButton() {
    const adminNav = getAdminSidebarNav();
    const isAdminLogin = Boolean(document.querySelector("body .auth-shell"));
    if (adminNav || isAdminLogin) {
      const button = document.querySelector("#siteLanguageToggle");
      if (button) button.remove();
      const controlsBar = document.querySelector("#siteDesktopControls");
      if (controlsBar && !controlsBar.children.length) controlsBar.remove();
      return;
    }
    const drawer = ensureMobileMenu();
    const desktopBar = ensureDesktopControlsBar();
    let button = document.querySelector("#siteLanguageToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "siteLanguageToggle";
      button.className = "language-switcher";
      button.type = "button";
      document.body.appendChild(button);
    }
    const target = currentLanguage === "en" ? "ar" : "en";
    const label = target === "ar" ? "العربية" : "English";
    const ariaLabel = currentLanguage === "ar"
      ? (target === "ar" ? "التبديل إلى العربية" : "التبديل إلى الإنجليزية")
      : (target === "ar" ? "Switch language to Arabic" : "Switch language to English");
    if (button.textContent !== label) button.textContent = label;
    if (button.getAttribute("aria-label") !== ariaLabel) button.setAttribute("aria-label", ariaLabel);
    if (button.title !== ariaLabel) button.title = ariaLabel;
    if (button.dataset.targetLanguage !== target) button.dataset.targetLanguage = target;
    if (!button.dataset.bound) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setLanguage(button.dataset.targetLanguage || (currentLanguage === "en" ? "ar" : "en"));
      }, { passive: false });
      button.dataset.bound = "1";
    }
    if (drawer && isSmallViewport()) {
      if (button.parentElement !== drawer) drawer.appendChild(button);
    } else if (button.parentElement !== desktopBar) {
      desktopBar.appendChild(button);
    }
    renderMobileMenu();
  }

  function translatePage() {
    if (translating) return;
    translating = true;
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    if (document.title) document.title = translateValue(document.title);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    translateAttributes(document);
    translateSiteNavigation();
    syncThemeLogos();
    renderLanguageButton();
    renderThemeButton();
    translating = false;
  }

  function setLanguage(language) {
    currentLanguage = language === "ar" ? "ar" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, currentLanguage);
    } catch (_) {
      // Language switching still works for the current page when storage is unavailable.
    }
    window.SITE_LANGUAGE = currentLanguage;
    translatePage();
    window.dispatchEvent(new CustomEvent("site-language-change", { detail: { lang: currentLanguage } }));
    document.dispatchEvent(new CustomEvent("site-language-change", { detail: { lang: currentLanguage } }));
  }

  window.SITE_LANGUAGE = currentLanguage;
  window.SITE_THEME = currentTheme;
  window.setSiteLanguage = setLanguage;
  window.getSiteLanguage = () => currentLanguage;
  window.setSiteTheme = setTheme;
  window.getSiteTheme = () => currentTheme;

  document.addEventListener("DOMContentLoaded", () => {
    translatePage();
    observer = new MutationObserver((mutations) => {
      if (translating) return;
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            nodes.forEach(translateTextNode);
            translateAttributes(node);
          }
        });
      }
      renderLanguageButton();
      renderThemeButton();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", () => {
      const drawer = document.querySelector("#mobileMenuDrawer");
      const button = document.querySelector("#siteLanguageToggle");
      const themeButton = document.querySelector("#siteThemeToggle");
      if (!button && !themeButton) return;
      if (button) {
        const desktopBar = ensureDesktopControlsBar();
        if (drawer && isSmallViewport()) {
          if (button.parentElement !== drawer) drawer.appendChild(button);
        } else if (button.parentElement !== desktopBar) {
          desktopBar.appendChild(button);
        }
      }
      if (themeButton) {
        const desktopBar = ensureDesktopControlsBar();
        if (themeButton.parentElement !== desktopBar) desktopBar.appendChild(themeButton);
      }
      renderMobileMenu();
      renderThemeButton();
    }, { passive: true });
  });
})();
