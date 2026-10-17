import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, collection, setDoc, serverTimestamp, Timestamp, getDocs, getDoc, query, orderBy, deleteDoc, doc, where, limit } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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
let renderGeneration = 0;
const galleryCoverCache = new Map();
const galleryCoverRequests = new Map();

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
  return date ? date.toLocaleDateString(window.SITE_LANGUAGE === "ar" ? "ar-EG" : "en-US") : "بدون تاريخ";
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

function getGalleryCover(item) {
  if (galleryCoverCache.has(item.id)) return Promise.resolve(galleryCoverCache.get(item.id));
  if (galleryCoverRequests.has(item.id)) return galleryCoverRequests.get(item.id);
  const request = getDocs(query(
    collection(db, "galleries", item.id, "files"),
    where("type", "==", "image"),
    limit(1)
  )).then((snap) => {
    const file = snap.docs[0]?.data();
    const url = file?.previewUrl || file?.url || "";
    if (url) galleryCoverCache.set(item.id, url);
    return url;
  }).catch(() => "").finally(() => galleryCoverRequests.delete(item.id));
  galleryCoverRequests.set(item.id, request);
  return request;
}

async function loadGalleryCover(item, cover, generation) {
  const url = await getGalleryCover(item);
  if (!url || generation !== renderGeneration || !cover.isConnected) return;
  const image = document.createElement("img");
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.remove();
    cover.classList.add("is-empty");
  }, { once: true });
  image.src = url;
  cover.replaceChildren(image);
  cover.classList.remove("is-empty");
}

function render() {
  const term = search.value.trim().toLowerCase();
  const rows = galleries.filter((item) => `${item.clientName} ${formatDate(item.eventDate)}`.toLowerCase().includes(term));
  const generation = ++renderGeneration;
  list.innerHTML = "";
  rows.forEach((item) => {
    const row = document.createElement("div");
    row.className = `gallery-row${isExpired(item) ? " expired" : ""}`;
    const cover = document.createElement("div");
    cover.className = "gallery-cover is-empty";
    cover.setAttribute("role", "img");
    cover.setAttribute("aria-label", `${item.clientName || "بدون اسم"} — غلاف المعرض`);
    const coverIcon = document.createElement("i");
    coverIcon.className = `fas ${item.fileCount ? "fa-images" : "fa-camera"}`;
    cover.append(coverIcon);

    const identity = document.createElement("div");
    identity.className = "gallery-identity";
    const name = document.createElement("strong");
    name.textContent = item.clientName || "بدون اسم";
    const detail = document.createElement("div");
    detail.className = "muted";
    detail.textContent = isExpired(item) ? "منذ أكثر من 3 أشهر" : item.eventType || "";
    identity.append(name, detail);

    const meta = document.createElement("div");
    meta.className = "gallery-row-meta";
    const date = document.createElement("span");
    date.innerHTML = '<i class="far fa-calendar" aria-hidden="true"></i>';
    date.append(document.createTextNode(formatDate(item.eventDate)));
    const count = document.createElement("span");
    count.innerHTML = '<i class="far fa-images" aria-hidden="true"></i>';
    count.append(document.createTextNode(`${item.fileCount || 0} ملف`));
    meta.append(date, count);

    const actions = document.createElement("div");
    actions.className = "thumb-actions";
    const manage = document.createElement("a");
    manage.className = "button secondary";
    manage.href = `gallery-manage.html?id=${encodeURIComponent(item.id)}`;
    manage.textContent = "إدارة";
    const copy = document.createElement("button");
    copy.className = "button secondary";
    copy.type = "button";
    copy.dataset.copy = item.slug || item.id;
    copy.textContent = "نسخ";
    const trash = document.createElement("button");
    trash.className = "button danger";
    trash.type = "button";
    trash.dataset.delete = item.id;
    trash.textContent = "سلة المهملات";
    actions.append(manage, copy, trash);

    row.append(cover, identity, meta, actions);
    if (item.notes) {
      const notes = document.createElement("div");
      notes.className = "gallery-notes-row";
      notes.textContent = item.notes;
      row.append(notes);
    }
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
    loadGalleryCover(item, cover, generation);
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
window.addEventListener("site-language-change", render);
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
