let currentLang = window.SITE_LANGUAGE || "en";

const studioNumber = "201061814314";
const REGULAR_PRICING = {
  qena: { standard: 6000, premium: 7500, luxury: 9500, vip: 11500 },
  luxor: { standard: 6000, premium: 7500, luxury: 9500, vip: 11500 },
  nagaa_hammadi: { standard: 6000, premium: 7500, luxury: 9500, vip: 11500 },
  hurghada: { standard: 6000, premium: 7500, luxury: 9500, vip: 11500 }
};
const PROMO_PRICING = { promo_standard: 5500, promo_premium: 7500 };
const TRANS_FEES = { qena: 0, nagaa_hammadi: 500, luxor: 1000, hurghada: 1500 };

const i18n = {
  ar: {
    langBtn: "English",
    mainTitle: "نموذج حجز تصوير زفاف",
    dateLabel: "اختر يوم التصوير والمناسبة *",
    secDestination: "التكلفة والوجهة",
    lblCity: "المحافظة / المدينة: *",
    optDefault: "-- اختر وجهتك لتحديد السعر --",
    optQena: "قنا", optLuxor: "الأقصر", optNagaa: "نجع حمادي", optHurghada: "الغردقة",
    secPackages: "اختر الباقات المطلوبة",
    titlePhotoSec: "أولاً: باقات التصوير الأساسية (Photo):",
    lblP1: "الباقة 1", lblP2: "الباقة 2", lblP3: "الباقة 3", lblPvip: "الباقة VIP", lblHot: "الأكثر طلباً",
    titlePromoSec: "ثانياً: عروض البرومو الإضافية (Promo):",
    lblPr1: "باكدج 1 (برومو)", lblPr2: "باكدج 2 (برومو)",
    secCouple: "بيانات العروسين والتواصل",
    lblGroom: "اسم العريس: *", phGroom: "الاسم الكامل",
    lblBride: "اسم العروسة: *", phBride: "الاسم الكامل",
    lblPhone: "رقم الهاتف الرئيسي (واتساب): *",
    lblExtraPhone: "رقم إضافي للضرورة:", phOptional: "اختياري",
    secDetails: "تفاصيل يوم الزفاف",
    lblHall: "مكان القاعة بالفرح:", phHall: "اسم وتفاصيل القاعة",
    lblLocation: "مكان السيشن الخارجي:", phLocation: "المكان المقترح للسيشن",
    lblMakeup: "الميكب أرتيست:", phMakeup: "اسم الميكب أرتيست",
    lblHair: "مصمم الشعر:", phHair: "اسم هير ستايلست",
    lblDown: "العربون المدفوع لتثبيت الحجز (ج.م):",
    lblDiscount: "قيمة الخصم إن وجد (ج.م):",
    lblNotes: "ملاحظات أو طقوس خاصة:", phNotes: "موعد الكنيسة / كتب الكتاب",
    sumTitle: "الفاتورة وملخص الحساب المالي",
    sumPhoto: "سعر باقة التصوير (Photo)",
    sumPromo: "سعر باقة البرومو (Promo)",
    sumDiscount: "قيمة الخصم الممنوح:",
    sumTrans: "رسوم ومصاريف الانتقال للمحافظة:",
    sumDown: "المقدم المدفوع (العربون)",
    sumRemain: "المبلغ المتبقي لتسويته يوم الفرح",
    termsTitle: "ملاحظات وشروط التعاقد الهامة:",
    terms: [
      "مدة التصوير الأساسية في اليوم هي (12 ساعة)، والساعة الإضافية 500 جنيه.",
      "العربون يثبت تاريخ الحجز وغير مسترد نهائيًا في حالة الإلغاء.",
      "يتم تصفية الحساب المتبقي بالكامل بعد انتهاء الفرح مباشرة.",
      "أي رسوم أو تذاكر دخول أماكن التصوير يتحملها العميل بالكامل."
    ],
    lblAgree: "أوافق على تفاصيل الحجز والشروط المذكورة *",
    lblBtnSubmit: "تأكيد الحجز وإرسال العقد عبر واتساب",
    alertCity: "من فضلك اختر المحافظة / المدينة أولًا لتحديث أسعار الباقات.",
    alertRequired: "من فضلك أكمل كل البيانات المطلوبة واختر باقة واحدة على الأقل.",
    currency: "ج.م",
    transQena: "0 ج.م (داخل قنا)",
    photoNone: "لم يتم اختيار باقة تصوير",
    cityRequired: "اختر المدينة لحساب السعر",
    promoNone: "لم يتم اختيار باقة برومو",
    wsTitle: "*حجز تصوير زفاف جديد 📸*",
    wsNone: "لم يحدد"
  },
  en: {
    langBtn: "العربية",
    mainTitle: "Wedding Booking Form",
    dateLabel: "Select Event Date & Occasion *",
    secDestination: "Cost & Destination",
    lblCity: "Governorate / City: *",
    optDefault: "-- Select your destination to set price --",
    optQena: "Qena", optLuxor: "Luxor", optNagaa: "Nagaa Hammadi", optHurghada: "Hurghada",
    secPackages: "Select Required Packages",
    titlePhotoSec: "First: Basic Photography Packages (Photo):",
    lblP1: "Package 1", lblP2: "Package 2", lblP3: "Package 3", lblPvip: "VIP Package", lblHot: "Most Popular",
    titlePromoSec: "Second: Additional Promo Offers (Promo):",
    lblPr1: "Package 1 (Promo)", lblPr2: "Package 2 (Promo)",
    secCouple: "Groom & Bride Information",
    lblGroom: "Groom's Name: *", phGroom: "Full Name",
    lblBride: "Bride's Name: *", phBride: "Full Name",
    lblPhone: "Primary Phone (WhatsApp): *",
    lblExtraPhone: "Emergency Phone:", phOptional: "Optional",
    secDetails: "Wedding Day Details",
    lblHall: "Wedding Hall Venue:", phHall: "Hall name & details",
    lblLocation: "Outdoor Session Location:", phLocation: "Suggested location",
    lblMakeup: "Makeup Artist:", phMakeup: "MUA Name",
    lblHair: "Hair Stylist:", phHair: "Hair Stylist Name",
    lblDown: "Down Payment (EGP):",
    lblDiscount: "Discount Amount (EGP):",
    lblNotes: "Special Notes / Rituals:", phNotes: "Church time / Katb Ktab",
    sumTitle: "Invoice & Financial Summary",
    sumPhoto: "Photography Package Price (Photo)",
    sumPromo: "Promo Package Price (Promo)",
    sumDiscount: "Discount Applied:",
    sumTrans: "Transportation Fees to Governorate:",
    sumDown: "Down Payment Paid",
    sumRemain: "Remaining Amount to Balance on Wedding Day",
    termsTitle: "Important Terms & Conditions:",
    terms: [
      "Basic daily shooting duration is (12 hours). Extra hours cost 500 EGP/hour.",
      "Down payment secures the date and is strictly non-refundable upon cancellation.",
      "The remaining balance must be fully cleared immediately after the wedding ends.",
      "All photoshoot venue entry tickets/fees are fully covered by the client."
    ],
    lblAgree: "I acknowledge and agree to all booking details and terms mentioned above *",
    lblBtnSubmit: "Confirm Booking & Send Contract via WhatsApp",
    alertCity: "Please select the Governorate/City first to update package pricing correctly.",
    alertRequired: "Please complete all required fields (*) and select at least one package before checking out.",
    currency: "EGP",
    transQena: "0 EGP (Inside Qena)",
    photoNone: "No photo package selected",
    cityRequired: "Choose a city to calculate the price",
    promoNone: "No promo package selected",
    wsTitle: "*New Wedding Photography Booking 📸*",
    wsNone: "Not Specified"
  }
};

const $ = (id) => document.getElementById(id);

function money(value) {
  return `${Number(value).toLocaleString("en-US")} ${i18n[currentLang].currency}`;
}

function setText(id, value) {
  $(id).textContent = value;
}

function updateCardPricesOnUI() {
  const city = $("city").value;
  const ids = ["standard", "premium", "luxury", "vip"];
  if (!city) {
    ids.forEach((id) => setText(`price-${id}`, "-"));
    setText("price-promo-standard", "-");
    setText("price-promo-premium", "-");
    return;
  }
  ids.forEach((id) => setText(`price-${id}`, money(REGULAR_PRICING[city][id])));
  setText("price-promo-standard", money(PROMO_PRICING.promo_standard));
  setText("price-promo-premium", money(PROMO_PRICING.promo_premium));
}

function selectPackage(kind, value) {
  const city = $("city").value;
  if (!city) {
    alert(i18n[currentLang].alertCity);
    return;
  }
  const hidden = kind === "photo" ? $("selected-photo-package") : $("selected-promo-package");
  const selector = kind === "photo" ? ".photo-card" : ".promo-card";
  document.querySelectorAll(selector).forEach((card) => card.classList.remove("selected"));
  if (hidden.value === value) hidden.value = "";
  else {
    hidden.value = value;
    document.querySelector(`[data-${kind}="${value}"]`).classList.add("selected");
  }
  updateBookingSummary();
}

function updateBookingSummary() {
  updateCardPricesOnUI();
  const city = $("city").value;
  const photoPkg = $("selected-photo-package").value;
  const promoPkg = $("selected-promo-package").value;
  const downPayment = parseFloat($("down-payment").value) || 0;
  const discountAmount = parseFloat($("discount-amount").value) || 0;
  let photoCost = 0;
  let promoCost = 0;
  let transCost = 0;
  if (city) {
    if (photoPkg) photoCost = REGULAR_PRICING[city][photoPkg];
    if (promoPkg) promoCost = PROMO_PRICING[promoPkg];
    transCost = TRANS_FEES[city];
  }
  setText("photo-price-customer", photoPkg ? (city ? money(photoCost) : i18n[currentLang].cityRequired) : i18n[currentLang].photoNone);
  setText("promo-price-customer", promoPkg ? money(promoCost) : i18n[currentLang].promoNone);
  setText("discount-amount-customer", `-${money(discountAmount)}`);
  setText("trans-price-customer", city === "qena" ? i18n[currentLang].transQena : money(transCost));
  setText("down-payment-customer", money(downPayment));
  setText("remaining-amount-customer", money(photoCost + promoCost + transCost - discountAmount - downPayment));
}

function renderTerms() {
  $("terms-list").innerHTML = "";
  i18n[currentLang].terms.forEach((term) => {
    const li = document.createElement("li");
    li.textContent = term;
    $("terms-list").append(li);
  });
}

function sendBookingToWhatsApp() {
  const form = $("booking-form");
  if (!form.checkValidity() || (!$("selected-photo-package").value && !$("selected-promo-package").value)) {
    alert(i18n[currentLang].alertRequired);
    form.reportValidity();
    return;
  }
  const city = $("city").value;
  const photoPkg = $("selected-photo-package").value;
  const promoPkg = $("selected-promo-package").value;
  const photoCost = photoPkg ? REGULAR_PRICING[city][photoPkg] : 0;
  const promoCost = promoPkg ? PROMO_PRICING[promoPkg] : 0;
  const transCost = TRANS_FEES[city];
  const downPayment = parseFloat($("down-payment").value) || 0;
  const discountAmount = parseFloat($("discount-amount").value) || 0;
  const remain = photoCost + promoCost + transCost - discountAmount - downPayment;
  const messageLabels = currentLang === "ar"
    ? {
        date: "التاريخ", groom: "العريس", bride: "العروسة", phone: "الهاتف", extraPhone: "هاتف إضافي", city: "المدينة",
        photo: "باقة التصوير", promo: "باقة العروض", hall: "قاعة الفرح", session: "مكان السيشن", makeup: "الميكب أرتيست",
        hair: "مصفف الشعر", notes: "ملاحظات", packagesTotal: "إجمالي الباقات", transit: "رسوم الانتقال",
        discount: "الخصم", downPayment: "العربون", remaining: "المبلغ المتبقي",
        confirmation: "✅ تم الإقرار بالموافقة على شروط الحجز والتعاقد."
      }
    : {
        date: "Date", groom: "Groom", bride: "Bride", phone: "Phone", extraPhone: "Extra Phone", city: "City",
        photo: "Photo Package", promo: "Promo Package", hall: "Hall", session: "Session", makeup: "Makeup Artist",
        hair: "Hair Stylist", notes: "Notes", packagesTotal: "Packages Total", transit: "Transit Fees",
        discount: "Discount", downPayment: "Down Payment", remaining: "Remaining Balance",
        confirmation: "✅ I acknowledge and agree to the booking terms and contract."
      };
  const optionalLine = (label, value) => (value && value.trim() ? `${label}: ${value.trim()}` : null);
  const lines = [
    i18n[currentLang].wsTitle,
    "",
    `${messageLabels.date}: ${$("event-date").value}`,
    `${messageLabels.groom}: ${$("groom-name").value}`,
    `${messageLabels.bride}: ${$("bride-name").value}`,
    `${messageLabels.phone}: ${$("main-phone").value}`,
    optionalLine(messageLabels.extraPhone, $("extra-phone").value),
    `${messageLabels.city}: ${$("city").selectedOptions[0].textContent}`,
    "",
    `${messageLabels.photo}: ${photoPkg ? `${photoPkg.toUpperCase()} (${money(photoCost)})` : i18n[currentLang].photoNone}`,
    `${messageLabels.promo}: ${promoPkg ? `${promoPkg.toUpperCase()} (${money(promoCost)})` : i18n[currentLang].promoNone}`,
    "",
    optionalLine(messageLabels.hall, $("hall-name").value),
    optionalLine(messageLabels.session, $("location").value),
    optionalLine(messageLabels.makeup, $("makeup-artist").value),
    optionalLine(messageLabels.hair, $("hair-designer").value),
    optionalLine(messageLabels.notes, $("extra-notes").value),
    "",
    `${messageLabels.packagesTotal}: ${money(photoCost + promoCost)}`,
    `${messageLabels.transit}: ${money(transCost)}`,
    `${messageLabels.discount}: -${money(discountAmount)}`,
    `${messageLabels.downPayment}: ${money(downPayment)}`,
    `${messageLabels.remaining}: ${money(remain)}`,
    "",
    messageLabels.confirmation
  ].filter((line) => line !== null);
  // إزالة أي سطر فاضي مكرر ناتج عن حذف الحقول الاختيارية (يبقى سطر فاضي واحد بحد أقصى بين الأقسام)
  const msg = lines
    .filter((line, index) => !(line === "" && lines[index + 1] === ""))
    .join("\n");
  window.open(`https://api.whatsapp.com/send?phone=${studioNumber}&text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

$("city").addEventListener("change", updateBookingSummary);
$("down-payment").addEventListener("input", updateBookingSummary);
$("discount-amount").addEventListener("input", updateBookingSummary);
$("agree-terms").addEventListener("change", () => {
  $("final-submit-btn").disabled = !$("agree-terms").checked;
});
$("final-submit-btn").addEventListener("click", sendBookingToWhatsApp);
document.querySelectorAll("[data-photo]").forEach((card) => card.addEventListener("click", () => selectPackage("photo", card.dataset.photo)));
document.querySelectorAll("[data-promo]").forEach((card) => card.addEventListener("click", () => selectPackage("promo", card.dataset.promo)));

const requestedPackage = new URLSearchParams(window.location.search).get("package");
if (["standard", "premium", "luxury", "vip"].includes(requestedPackage)) {
  $("selected-photo-package").value = requestedPackage;
  $(`card-${requestedPackage}`).classList.add("selected");
}

window.addEventListener("site-language-change", (event) => {
  currentLang = event.detail?.lang || window.SITE_LANGUAGE || "en";
  renderTerms();
  updateBookingSummary();
});
renderTerms();
updateBookingSummary();
