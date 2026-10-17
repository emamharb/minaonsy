import app from "./firebase-config.js";
import { createLightbox } from "./lightbox.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const db = getFirestore(app);
const params = new URLSearchParams(location.search);
const galleryId = params.get("id");
const title = document.getElementById("galleryTitle");
const grid = document.getElementById("clientGalleryGrid");
const status = document.getElementById("galleryStatus");
const downloadAll = document.getElementById("downloadAll");
const weddingDateEl = document.getElementById("galleryWeddingDate");
const galleryGate = document.getElementById("galleryGate");
const galleryGateForm = document.getElementById("galleryGateForm");
const galleryGateInput = document.getElementById("galleryGateInput");
const galleryGateStatus = document.getElementById("galleryGateStatus");
const lightboxItems = [];
const lightbox = createLightbox(lightboxItems, { onDownload: (item, index) => directDownload({ url: item.downloadUrl || item.url, name: item.downloadName || item.name }, index) }); // download-interaction-v1
let files = [];
let sections = [];
let currentGallery = null;

function friendlyError(error) {
  const english = window.SITE_LANGUAGE !== "ar";
  if (!navigator.onLine) return english ? "You appear to be offline." : "لا يوجد اتصال بالإنترنت.";
  if (error?.message === "cors") return english ? "Download could not start. Firebase Storage download settings need to be enabled." : "تعذر بدء التحميل. يلزم تفعيل إعدادات التحميل في Firebase Storage.";
  return english ? "The request could not be completed. Please try again." : "تعذر إتمام العملية. حاول مرة أخرى.";
}

const galleryMessages = {
  invalidLink: ["رابط المعرض غير صحيح.", "Invalid gallery link."],
  loading: ["جاري تحميل المعرض...", "Loading gallery..."],
  deleted: ["هذا المعرض تم نقله إلى سلة المهملات ولم يعد متاحًا للعرض.", "This gallery was moved to the trash and is no longer available."],
  notFound: ["لم يتم العثور على هذا المعرض.", "Gallery not found."],
  protected: ["هذا المعرض محمي بكلمة سر.", "This gallery is password protected."],
  noSectionFiles: ["لا توجد ملفات داخل هذا السكشن بعد.", "No files in this section yet."],
  noFiles: ["لا توجد ملفات في هذا المعرض بعد.", "There are no files in this gallery yet."],
  enterPassword: ["أدخل كلمة السر أولًا.", "Enter the password first."],
  verifying: ["جاري التحقق...", "Verifying..."],
  wrongPassword: ["كلمة السر غير صحيحة.", "The password is incorrect."],
  verifyFailed: ["تعذر التحقق من كلمة السر. حاول مرة أخرى.", "Unable to verify the password. Please try again."],
  separateDownloads: ["سيبدأ تنزيل الملفات بشكل منفصل. قد يطلب المتصفح السماح بتنزيل عدة ملفات.", "Files will download separately. Your browser may ask permission to download multiple files."],
  preparingZip: ["تجهيز ملف ZIP", "Preparing ZIP file"]
};
function galleryMessage(key) { return galleryMessages[key]?.[window.SITE_LANGUAGE === "ar" ? 0 : 1] || key; }
function setStatus(key) { status.dataset.messageKey = key; status.textContent = galleryMessage(key); }

function safeFileName(file, index) {
  return file.name || `mina-onsy-${index + 1}`;
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date ? date.toLocaleDateString(window.SITE_LANGUAGE === "ar" ? "ar-EG" : "en-US") : "";
}

function updateWeddingDate() {
  if (!weddingDateEl) return;
  const dateLabel = window.SITE_LANGUAGE === "ar" ? "موعد الزفاف:" : "Wedding date:";
  weddingDateEl.textContent = currentGallery?.weddingDate ? `${dateLabel} ${formatDate(currentGallery.weddingDate)}` : "";
}
window.addEventListener("site-language-change", () => {
  updateWeddingDate();
  if (status?.dataset.messageKey) setStatus(status.dataset.messageKey);
  if (galleryGateStatus?.dataset.messageKey) galleryGateStatus.textContent = galleryMessage(galleryGateStatus.dataset.messageKey);
  const label = window.SITE_LANGUAGE === "ar" ? "تحميل" : "Download";
  grid?.querySelectorAll(".download-label").forEach((node) => { node.textContent = label; });
  grid?.querySelectorAll(".download-action").forEach((button) => { button.title = label; button.setAttribute("aria-label", label); });
  grid?.querySelectorAll(".empty-section-message").forEach((node) => { node.textContent = galleryMessage("noSectionFiles"); });
  grid?.querySelectorAll("[data-default-section='true']").forEach((node) => { node.textContent = window.SITE_LANGUAGE === "ar" ? "السكشن الرئيسي" : "Main section"; });
  if (downloadAll && !downloadAll.dataset.progress) downloadAll.textContent = window.SITE_LANGUAGE === "ar" ? "تحميل الكل" : "Download all";
  const gateButton = galleryGateForm?.querySelector("button[type='submit']");
  if (gateButton) gateButton.textContent = window.SITE_LANGUAGE === "ar" ? "فتح المعرض" : "Open gallery";
  const gateHint = document.querySelector(".gallery-gate-card > p:not(.eyebrow)");
  if (gateHint) gateHint.textContent = window.SITE_LANGUAGE === "ar" ? "أدخل كلمة السر الخاصة بالمعرض لعرض الصور." : "Enter the gallery password to view your photos.";
});

function defaultSection() {
  return { id: "default", name: "السكشن الرئيسي", order: 0, isDefault: true };
}

function gateKey() {
  return galleryId ? `gallery-access:${galleryId}` : "";
}

async function sha256(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function showGate(message = "") {
  if (!galleryGate) return;
  galleryGate.classList.add("is-open");
  galleryGate.setAttribute("aria-hidden", "false");
  if (galleryGateStatus) {
    const messageKey = Object.keys(galleryMessages).find((key) => galleryMessage(key) === message);
    if (messageKey) galleryGateStatus.dataset.messageKey = messageKey;
    else delete galleryGateStatus.dataset.messageKey;
    galleryGateStatus.textContent = message;
  }
  if (galleryGateInput) {
    galleryGateInput.value = "";
    window.setTimeout(() => galleryGateInput.focus(), 50);
  }
}

function hideGate() {
  if (!galleryGate) return;
  galleryGate.classList.remove("is-open");
  galleryGate.setAttribute("aria-hidden", "true");
  if (galleryGateStatus) { galleryGateStatus.textContent = ""; delete galleryGateStatus.dataset.messageKey; }
}

function directDownload(file, index) {
  const link = document.createElement("a");
  link.href = file.url;
  link.download = safeFileName(file, index);
  link.target = "_blank";
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

async function downloadFilesSeparately() {
  status.dataset.messageKey = "separateDownloads"; status.textContent = galleryMessage("separateDownloads");
  for (const [index, file] of files.entries()) {
    downloadAll.dataset.progress = "true"; downloadAll.textContent = window.SITE_LANGUAGE === "ar" ? `تنزيل ${index + 1} من ${files.length}` : `Downloading ${index + 1} of ${files.length}`;
    directDownload(file, index);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
  }
}

async function downloadFile(file, index, button) {
  const originalMarkup = button.innerHTML;
  button.disabled = true;
  const loadingText = window.SITE_LANGUAGE === "ar" ? "جاري التحميل" : "Downloading";
  button.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span class="download-label">${loadingText}</span>`;
  status.textContent = "";
  try {
    directDownload(file, index);
  } catch {
    status.textContent = friendlyError();
  } finally {
    button.disabled = false;
    button.innerHTML = originalMarkup;
  }
}

async function loadGallery() {
  if (!galleryId) {
    setStatus("invalidLink");
    return;
  }
  setStatus("loading");
  try {
    const galleryDoc = await getDoc(doc(db, "galleries", galleryId));
    if (!galleryDoc.exists()) {
      const trashDoc = await getDoc(doc(db, "trashGalleries", galleryId));
      if (trashDoc.exists()) {
        const trashed = trashDoc.data();
        title.textContent = trashed.clientName || (window.SITE_LANGUAGE === "ar" ? "معرض محذوف" : "Deleted gallery");
        setStatus("deleted");
      } else {
        setStatus("notFound");
      }
      return;
    }
    const gallery = galleryDoc.data();
    currentGallery = gallery;
    title.textContent = gallery.clientName || (window.SITE_LANGUAGE === "ar" ? "معرض العميل" : "Client gallery");
    updateWeddingDate();
    if (gallery.accessCodeHash) {
      const granted = sessionStorage.getItem(gateKey()) === "1";
      if (!granted) {
        showGate(galleryMessage("protected"));
        status.textContent = "";
        return;
      }
      hideGate();
    } else {
      hideGate();
    }
    const [sectionsSnap, filesSnap] = await Promise.all([
      getDocs(collection(db, "galleries", galleryDoc.id, "sections")),
      getDocs(collection(db, "galleries", galleryDoc.id, "files"))
    ]);
    sections = [defaultSection(), ...sectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))];
    files = filesSnap.docs.map((d) => d.data());
    renderFiles();
  } catch (error) {
    status.textContent = friendlyError(error);
  }
}

function renderFiles() {
  grid.innerHTML = "";
  lightboxItems.splice(0, lightboxItems.length);
  const grouped = files.reduce((acc, item) => {
    const key = item.sectionId || "default";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  sections.forEach((section) => {
    const sectionFiles = grouped[section.id] || [];
    const sectionBlock = document.createElement("section");
    sectionBlock.className = "client-section-block";
    sectionBlock.innerHTML = "";
    const sectionHeading = document.createElement("h2");
    const isDefaultSection = section.id === "default" && section.isDefault;
    sectionHeading.dataset.defaultSection = String(isDefaultSection);
    sectionHeading.textContent = isDefaultSection && window.SITE_LANGUAGE !== "ar" ? "Main section" : section.name;
    sectionBlock.append(sectionHeading);
    const sectionGrid = document.createElement("div");
    sectionGrid.className = "client-grid";
    sectionFiles.forEach((item) => {
      const card = document.createElement("div");
      card.className = "client-card";
      if (item.type === "video") {
        card.innerHTML = `<video src="${item.url}" controls></video><div class="client-actions"><button class="download-action" type="button" aria-label="تحميل" title="تحميل"><i class="fas fa-download" aria-hidden="true"></i><span class="download-label">تحميل</span></button></div>`;
      } else {
        const previewUrl = item.previewUrl || item.url;
        const index = lightboxItems.push({ url: previewUrl, downloadUrl: item.url, downloadName: safeFileName(item, files.indexOf(item)), alt: item.name || "" }) - 1;
        card.innerHTML = `<img src="${previewUrl}" alt="" loading="lazy"><div class="client-actions"><button class="download-action" type="button" aria-label="تحميل" title="تحميل"><i class="fas fa-download" aria-hidden="true"></i><span class="download-label">تحميل</span></button></div>`;
        card.querySelector("img").addEventListener("click", () => lightbox.show(index));
      }
      const downloadButton = card.querySelector(".download-action");
      const fileIndex = files.indexOf(item);
      downloadButton.addEventListener("click", () => downloadFile(item, fileIndex, downloadButton));
      sectionGrid.append(card);
    });
    if (!sectionFiles.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "muted empty-section-message";
      emptyMessage.textContent = galleryMessage("noSectionFiles");
      sectionGrid.append(emptyMessage);
    }
    sectionBlock.append(sectionGrid);
    grid.append(sectionBlock);
  });
  if (files.length) { status.textContent = ""; delete status.dataset.messageKey; } else setStatus("noFiles");
}

downloadAll.addEventListener("click", async () => {
  if (!files.length || !window.JSZip) return;
  downloadAll.disabled = true;
  const originalText = downloadAll.textContent;
  try {
    const zip = new JSZip();
    for (const [index, file] of files.entries()) {
      downloadAll.dataset.progress = "true"; downloadAll.textContent = window.SITE_LANGUAGE === "ar" ? `تجهيز ${index + 1} من ${files.length}` : `Preparing ${index + 1} of ${files.length}`;
      const response = await fetch(file.url, { mode: "cors", credentials: "omit" });
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      zip.file(file.name || `file-${index + 1}`, blob);
    }
    downloadAll.textContent = galleryMessage("preparingZip");
    const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
      downloadAll.textContent = window.SITE_LANGUAGE === "ar" ? `ضغط الملفات ${Math.round(metadata.percent)}%` : `Compressing files ${Math.round(metadata.percent)}%`;
    });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(content);
    link.href = objectUrl;
    link.download = `${galleryId}.zip`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    status.textContent = "";
  } catch (error) {
    const isCorsLike = error instanceof TypeError;
    if (isCorsLike) {
      await downloadFilesSeparately();
    } else {
      status.textContent = friendlyError(error);
    }
  } finally {
    downloadAll.disabled = false;
    delete downloadAll.dataset.progress;
    downloadAll.textContent = window.SITE_LANGUAGE === "ar" ? "تحميل الكل" : "Download all";
  }
});

galleryGateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentGallery?.accessCodeHash) {
    hideGate();
    return;
  }
  const enteredCode = String(galleryGateInput?.value || "").trim();
  if (!enteredCode) {
    if (galleryGateStatus) { galleryGateStatus.dataset.messageKey = "enterPassword"; galleryGateStatus.textContent = galleryMessage("enterPassword"); }
    return;
  }
  if (galleryGateStatus) { galleryGateStatus.dataset.messageKey = "verifying"; galleryGateStatus.textContent = galleryMessage("verifying"); }
  try {
    const enteredHash = await sha256(enteredCode);
    if (enteredHash !== currentGallery.accessCodeHash) {
      if (galleryGateStatus) { galleryGateStatus.dataset.messageKey = "wrongPassword"; galleryGateStatus.textContent = galleryMessage("wrongPassword"); }
      return;
    }
    if (galleryId) sessionStorage.setItem(gateKey(), "1");
    hideGate();
    await loadGallery();
  } catch {
    if (galleryGateStatus) { galleryGateStatus.dataset.messageKey = "verifyFailed"; galleryGateStatus.textContent = galleryMessage("verifyFailed"); }
  }
});

loadGallery();

