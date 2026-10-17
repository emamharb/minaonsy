import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, collection, setDoc, serverTimestamp, Timestamp, getDocs, getDoc, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

requireAdmin();
const db = getFirestore(app);
const storage = getStorage(app);
const form = document.getElementById("createGalleryForm");
const status = document.getElementById("createStatus");
const list = document.getElementById("galleriesList");
const search = document.getElementById("gallerySearch");
const slugInput = document.getElementById("slugInput");
const editSlugBtn = document.getElementById("editSlugBtn");
const accessCodeInput = document.getElementById("accessCodeInput");
const regenAccessCodeBtn = document.getElementById("regenAccessCodeBtn");
let galleries = [];
let slugManual = false;
let slugPreviewToken = 0;

function generateAccessCode() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function syncAccessCode() {
  if (!accessCodeInput) return;
  if (!accessCodeInput.value) {
    accessCodeInput.value = generateAccessCode();
  }
  accessCodeInput.readOnly = true;
}

function setStatus(message, type = "info") {
  status.className = `muted status-message ${type}`;
  status.textContent = message;
}

function firestoreMessage(error) {
  if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
  if (error?.code === "permission-denied") return "ليست لديك صلاحية لتنفيذ هذه العملية. راجع تسجيل الدخول وقواعد الأمان.";
  if (error?.code === "unavailable") return "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى.";
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "gallery";
}

function getSlugSeed(preferred, fallback) {
  return slugify(preferred || fallback || "gallery");
}

async function ensureUniqueSlug(baseSlug) {
  let candidate = baseSlug || "gallery";
  let suffix = 2;
  while (true) {
    const [activeSnap, trashSnap] = await Promise.all([
      getDoc(doc(db, "galleries", candidate)),
      getDoc(doc(db, "trashGalleries", candidate))
    ]);
    if (!activeSnap.exists() && !trashSnap.exists()) return candidate;
    candidate = `${baseSlug}-${suffix++}`;
  }
}

async function syncSlugPreview() {
  if (!slugInput || slugManual) return;
  const token = ++slugPreviewToken;
  const formData = new FormData(form);
  const clientName = String(formData.get("clientName") || "").trim();
  const base = getSlugSeed(clientName, "gallery");
  if (!clientName) {
    slugInput.value = "";
    return;
  }
  const unique = await ensureUniqueSlug(base);
  if (token === slugPreviewToken) slugInput.value = unique;
}

function dateValue(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function isExpired(item) {
  const base = dateValue(item.eventDate) || dateValue(item.createdAt);
  if (!base) return false;
  return Date.now() - base.getTime() >= 90 * 24 * 60 * 60 * 1000;
}

function formatDate(ts) {
  const date = dateValue(ts);
  return date ? date.toLocaleDateString("ar-EG") : "بدون تاريخ";
}

function publicLink(slug) {
  return `${location.origin}/gallery.html?id=${encodeURIComponent(slug)}`;
}

async function sha256(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

async function moveGalleryToTrash(item) {
  if (!confirm(`هل تريد نقل معرض ${item.clientName} إلى سلة المهملات؟ يمكن استرجاعه لاحقًا بنفس الرابط.`)) return;
  setStatus(`جاري نقل معرض ${item.clientName} إلى سلة المهملات...`);
  try {
    await setDoc(doc(db, "trashGalleries", item.id), {
      ...item,
      deletedAt: serverTimestamp(),
      deletedBy: "admin"
    });
    await deleteDoc(doc(db, "galleries", item.id));
    setStatus("تم نقل المعرض إلى سلة المهملات.", "success");
    await loadGalleries();
  } catch (error) {
    setStatus(firestoreMessage(error), "error");
  }
}

function render() {
  const term = search.value.trim().toLowerCase();
  const rows = galleries.filter((item) => `${item.clientName} ${formatDate(item.eventDate)}`.toLowerCase().includes(term));
  list.innerHTML = "";
  rows.forEach((item) => {
    const row = document.createElement("div");
    row.className = `gallery-row${isExpired(item) ? " expired" : ""}`;
    row.innerHTML = `
      <div><strong>${item.clientName}</strong><div class="muted">${isExpired(item) ? "منذ أكثر من 3 أشهر" : item.eventType || ""}</div></div>
      <div>${formatDate(item.eventDate)}</div>
      <div>${item.fileCount || 0} ملف</div>
      <div class="thumb-actions">
        <a class="button secondary" href="gallery-manage.html?id=${item.id}">إدارة</a>
        <button class="button secondary" type="button" data-copy="${item.slug}">نسخ</button>
        <button class="button danger" type="button" data-delete="${item.id}">سلة المهملات</button>
      </div>
      ${item.notes ? `<div class="gallery-notes-row">${item.notes}</div>` : ""}`;
    row.querySelector("[data-copy]")?.addEventListener("click", async () => {
      try {
        const message = `link : ${publicLink(item.id)}\npassword : ${item.accessCode || ""}`;
        await navigator.clipboard.writeText(message);
        setStatus("تم نسخ الرابط وكلمة السر.", "success");
      } catch {
        setStatus("تعذر النسخ تلقائيًا. افتح المعرض وانسخ البيانات يدويًا.", "error");
      }
    });
    row.querySelector("[data-delete]")?.addEventListener("click", () => moveGalleryToTrash(item));
    list.append(row);
  });
}

async function loadGalleries() {
  list.innerHTML = `<div class="loading-state"><span class="spinner"></span><p class="muted">جاري تحميل المعارض...</p></div>`;
  try {
    const snap = await getDocs(query(collection(db, "galleries"), orderBy("createdAt", "desc")));
    galleries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
    if (!galleries.length) list.innerHTML = `<p class="muted">لا توجد معارض بعد.</p>`;
  } catch (error) {
    list.innerHTML = `<p class="muted">تعذر تحميل المعارض.</p>`;
    setStatus(firestoreMessage(error), "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setStatus("جاري إنشاء المعرض...");
  const data = new FormData(form);
  const clientName = data.get("clientName").trim();
  const eventDate = data.get("eventDate");
  const accessCode = String(data.get("accessCode") || "").trim() || generateAccessCode();
  const requestedSlug = String(data.get("slug") || "").trim();
  const slugBase = getSlugSeed(requestedSlug || clientName, "gallery");
  const slug = await ensureUniqueSlug(slugBase);
  if (slugInput) slugInput.value = slug;
  try {
    const accessCodeHash = await sha256(accessCode);
    await setDoc(doc(db, "galleries", slug), {
      clientName,
      eventType: data.get("eventType").trim(),
      eventDate: eventDate ? Timestamp.fromDate(new Date(eventDate)) : null,
      weddingDate: data.get("weddingDate") ? Timestamp.fromDate(new Date(data.get("weddingDate"))) : null,
      accessCodeHash,
      accessCode, // تخزين كلمة السر كنص عادي
      notes: data.get("notes").trim(),
      slug,
      fileCount: 0,
      createdAt: serverTimestamp()
    });
    status.className = "muted status-message success";
    status.innerHTML = `تم إنشاء المعرض: <a href="gallery-manage.html?id=${encodeURIComponent(slug)}">فتح الإدارة</a>`;
    form.reset();
    slugManual = false;
    if (accessCodeInput) {
      accessCodeInput.value = "";
    }
    if (slugInput) {
      slugInput.value = "";
      slugInput.readOnly = true;
      slugInput.placeholder = "سيتم إنشاؤه تلقائياً";
    }
    if (editSlugBtn) editSlugBtn.innerHTML = '<i class="fas fa-pen"></i> تعديل الرابط';
    await loadGalleries();
  } catch (error) {
    setStatus(firestoreMessage(error), "error");
  } finally {
    submitButton.disabled = false;
  }
});

search.addEventListener("input", render);
form.querySelector("[name='clientName']")?.addEventListener("input", syncSlugPreview);
regenAccessCodeBtn?.addEventListener("click", () => {
  if (accessCodeInput) accessCodeInput.value = generateAccessCode();
});
editSlugBtn?.addEventListener("click", () => {
  slugManual = !slugManual;
  if (!slugInput) return;
  slugInput.readOnly = !slugManual;
  slugInput.placeholder = slugManual ? "اكتب الرابط المخصص هنا" : "سيتم إنشاؤه تلقائياً";
  editSlugBtn.innerHTML = slugManual ? '<i class="fas fa-magic"></i> توليد تلقائي' : '<i class="fas fa-pen"></i> تعديل الرابط';
  if (slugManual && !slugInput.value) slugInput.value = getSlugSeed(form.querySelector("[name='clientName']")?.value, "gallery");
  if (!slugManual) syncSlugPreview();
  slugInput.focus();
});
syncAccessCode();
loadGalleries();