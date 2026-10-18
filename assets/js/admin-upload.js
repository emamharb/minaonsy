import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { prepareImageForUpload, MAX_UPLOAD_IMAGE_BYTES } from "./image-optimization.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, increment, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

requireAdmin();
const db = getFirestore(app);
const storage = getStorage(app);
const params = new URLSearchParams(location.search);
const galleryId = params.get("id");
const filesInput = document.getElementById("galleryFiles");
const dropzone = document.getElementById("galleryDropzone");
const progress = document.getElementById("uploadProgress");
const grid = document.getElementById("filesGrid");
const title = document.getElementById("manageTitle");
const linkText = document.getElementById("galleryLink");
const copyLink = document.getElementById("copyLinkBtn");
const storageQuota = document.getElementById("storageQuotaAdmin");
const sectionSelect = document.getElementById("sectionSelect");
const newSectionName = document.getElementById("newSectionName");
const createSectionBtn = document.getElementById("createSectionBtn");
const uploadFolderBtn = document.getElementById("uploadFolderBtn");
const folderFiles = document.getElementById("folderFiles");
const sectionsManage = document.getElementById("sectionsManage");
let gallery = null;
let currentFiles = [];
let sections = [];
let accessCode = ''; // متغير لتخزين كلمة السر
let sectionUploadMap = new Map();
let sectionPendingQueue = [];
let uploadSummary = null;
const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;
const UPLOAD_IMAGE_LIMIT_LABEL = `${Math.round(MAX_UPLOAD_IMAGE_BYTES / 1024)} KB`;
filesInput.disabled = true;

function showPageMessage(message, type = "info") {
  linkText.className = `muted status-message ${type}`;
  linkText.textContent = message;
}

function friendlyError(error) {
  if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
  if (error?.message === "image-format-limit") return uploadText("صيغة الصورة المتحركة أو المتجهة لا يمكن ضغطها دون تغييرها. احفظها كصورة ثابتة لا تتجاوز 300 KB.", "Animated or vector images cannot be compressed without changing them. Save a still image under 300 KB.");
  if (error?.message === "image-compression-unavailable") return uploadText("تعذر تجهيز الصورة. جرّب حفظها بصيغة JPG أو WebP ثم أعد المحاولة.", "The image could not be prepared. Save it as JPG or WebP and try again.");
  if (error?.message === "image-too-large-after-compression") return uploadText("تعذر ضغط الصورة إلى أقل من 300 KB مع الحفاظ على وضوح مناسب.", "The image could not be reduced below 300 KB while retaining usable clarity.");
  if (error?.code === "permission-denied" || error?.code === "storage/unauthorized") return "ليست لديك صلاحية لتنفيذ هذه العملية.";
  if (error?.code === "storage/unknown") return "فشل الرفع. تأكد من قواعد Storage وأن حساب الأدمن مسجل دخول.";
  if (error?.code === "storage/canceled") return "تم إلغاء الرفع.";
  if (error?.code === "storage/retry-limit-exceeded") return "الاتصال ضعيف. حاول رفع الملف مرة أخرى.";
  if (error?.message === "storage-limit") return "المساحة التخزينية وصلت للحد الأقصى 100 جيجا.";
  return "حدث خطأ. حاول مرة أخرى.";
}

function setDropzoneBusy(isBusy) {
  dropzone.classList.toggle("is-busy", isBusy);
  filesInput.disabled = isBusy;
}

function uploadText(ar, en) {
  return window.SITE_LANGUAGE === "ar" ? ar : en;
}

function ensureUploadSummary(totalFiles) {
  if (uploadSummary) return uploadSummary;
  progress.innerHTML = `
    <div class="upload-summary">
      <div class="upload-summary-head">
        <strong>${uploadText("تجهيز ورفع الملفات", "Preparing and uploading files")}</strong>
        <span id="uploadSummaryMeta">0 / ${totalFiles}</span>
      </div>
      <div class="upload-summary-bar" role="progressbar" aria-label="${uploadText("تقدم الرفع", "Upload progress")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span id="uploadSummaryFill"></span>
      </div>
      <div class="upload-summary-foot">
        <small id="uploadSummaryStatus">${uploadText("بدء التجهيز...", "Getting ready...")}</small>
        <small id="uploadSummaryEta">${uploadText("الوقت المتبقي: --", "Time remaining: --")}</small>
      </div>
    </div>`;
  uploadSummary = {
    meta: document.getElementById("uploadSummaryMeta"),
    fill: document.getElementById("uploadSummaryFill"),
    bar: progress.querySelector(".upload-summary-bar"),
    status: document.getElementById("uploadSummaryStatus"),
    eta: document.getElementById("uploadSummaryEta")
  };
  return uploadSummary;
}

function formatSeconds(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "--";
  const rounded = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  if (!minutes) return `${seconds} ث`;
  return `${minutes} د ${String(seconds).padStart(2, "0")} ث`;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function getStorageUsageDoc() {
  const refDoc = doc(db, "stats", "storage");
  const snap = await getDoc(refDoc);
  if (!snap.exists()) {
    await setDoc(refDoc, { usedBytes: 0, updatedAt: serverTimestamp() }, { merge: true });
    return { usedBytes: 0 };
  }
  return snap.data();
}

async function updateStorageUsage(deltaBytes) {
  const refDoc = doc(db, "stats", "storage");
  if (deltaBytes >= 0) {
    await setDoc(refDoc, { usedBytes: increment(deltaBytes), updatedAt: serverTimestamp() }, { merge: true });
    return;
  }
  const snap = await getDoc(refDoc);
  const current = snap.exists() ? Number(snap.data().usedBytes || 0) : 0;
  const next = Math.max(0, current + deltaBytes);
  await setDoc(refDoc, { usedBytes: next, updatedAt: serverTimestamp() }, { merge: true });
  return next;
}

function renderStorageQuota(usedBytes = 0) {
  if (!storageQuota) return;
  const percent = Math.min(100, (usedBytes / STORAGE_LIMIT_BYTES) * 100);
  const usedText = formatBytes(usedBytes);
  const remainingText = formatBytes(Math.max(0, STORAGE_LIMIT_BYTES - usedBytes));
  storageQuota.innerHTML = `
    <div class="upload-summary-head">
      <strong>المساحة التخزينية</strong>
      <span>${percent.toFixed(2)}%</span>
    </div>
    <div class="upload-summary-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
    <div class="upload-summary-foot">
      <small>المستخدم: ${usedText}</small>
      <small>المتاح: ${remainingText}</small>
    </div>`;
}

function fileType(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

function defaultSection() {
  return { id: "default", name: "القسم الرئيسي", order: 0, isDefault: true };
}

function createSectionOption(section) {
  const option = document.createElement("option");
  option.value = section.id;
  option.textContent = section.name;
  return option;
}

async function loadSections() {
  const snap = await getDocs(query(collection(db, "galleries", galleryId, "sections"), orderBy("order", "asc")));
  sections = [defaultSection(), ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))];
  renderSectionSelect();
  renderSectionsManage();
  return sections;
}

function renderSectionSelect(selectedId = sectionSelect?.value || "default") {
  if (!sectionSelect) return;
  sectionSelect.innerHTML = "";
  sections.forEach((section) => sectionSelect.append(createSectionOption(section)));
  sectionSelect.value = [...sectionSelect.options].some((opt) => opt.value === selectedId) ? selectedId : "default";
}

function sectionMetaById(sectionId) {
  return sections.find((section) => section.id === sectionId) || defaultSection();
}

async function ensureSectionExists(sectionId) {
  if (!sectionId || sectionId === "default") return defaultSection();
  const section = sections.find((item) => item.id === sectionId);
  if (section) return section;
  const snap = await getDoc(doc(db, "galleries", galleryId, "sections", sectionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : defaultSection();
}

async function ensureSectionByName(name) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return defaultSection();
  const existing = sections.find((section) => section.name === normalizedName);
  if (existing) return existing;
  const sectionId = sectionIdFromName(normalizedName);
  const existingSnap = await getDoc(doc(db, "galleries", galleryId, "sections", sectionId));
  if (existingSnap.exists()) return { id: existingSnap.id, ...existingSnap.data() };
  await setDoc(doc(db, "galleries", galleryId, "sections", sectionId), {
    name: normalizedName,
    order: sections.filter((section) => !section.isDefault).length + 1,
    createdAt: serverTimestamp()
  });
  await loadSections();
  return { id: sectionId, name: normalizedName };
}

function sectionIdFromName(name) {
  return `section-${String(name || "").trim().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]+/g, "") || Date.now()}`;
}

function normalizeSectionId(value) {
  return value || "default";
}

function groupFilesBySection(items) {
  return items.reduce((acc, item) => {
    const key = normalizeSectionId(item.sectionId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function renderSectionsManage(groupedFiles = null) {
  if (!sectionsManage) return;
  const editable = sections.filter((section) => !section.isDefault);
  if (!editable.length) {
    sectionsManage.innerHTML = `<p class="muted">لا توجد أقسام مخصصة بعد.</p>`;
    return;
  }
  sectionsManage.innerHTML = "";
  editable.forEach((section) => {
    const fileCount = groupedFiles
      ? (groupedFiles[section.id] || []).length
      : currentFiles.filter((file) => normalizeSectionId(file.sectionId) === section.id).length;
    const row = document.createElement("div");
    row.className = "trash-row";
    const details = document.createElement("div");
    details.className = "section-details";
    const heading = document.createElement("h3");
    heading.textContent = section.name;
    const count = document.createElement("small");
    count.textContent = `${window.SITE_LANGUAGE === "ar" ? "عدد الملفات" : "Files"}: ${fileCount}`;
    details.append(heading, count);
    const actions = document.createElement("div");
    actions.className = "trash-actions";
    const rename = document.createElement("button");
    rename.className = "button secondary";
    rename.type = "button";
    rename.dataset.sectionEdit = "";
    rename.dataset.sectionId = section.id;
    rename.textContent = window.SITE_LANGUAGE === "ar" ? "تعديل الاسم" : "Rename";
    const remove = document.createElement("button");
    remove.className = "button danger";
    remove.type = "button";
    remove.dataset.sectionDelete = "";
    remove.dataset.sectionId = section.id;
    remove.textContent = window.SITE_LANGUAGE === "ar" ? "حذف القسم" : "Delete section";
    actions.append(rename, remove);
    row.append(details, actions);
    sectionsManage.append(row);
  });
}

function publicLink() {
  return `${location.origin}/gallery.html?id=${encodeURIComponent(gallery.id)}`;
}

async function loadGallery() {
  if (!galleryId) {
    title.textContent = "معرض غير صحيح";
    showPageMessage("رابط الإدارة غير صحيح.", "error");
    return;
  }
  showPageMessage("جاري تحميل بيانات المعرض...");
  try {
    const snap = await getDoc(doc(db, "galleries", galleryId));
    if (!snap.exists()) {
      const trashSnap = await getDoc(doc(db, "trashGalleries", galleryId));
      if (trashSnap.exists()) {
        const trashed = trashSnap.data();
        title.textContent = trashed.clientName || "معرض محذوف";
        showPageMessage("هذا المعرض موجود في سلة المهملات. استرجعه أولًا للمتابعة.", "error");
      } else {
        title.textContent = "المعرض غير موجود";
        showPageMessage("لم يتم العثور على هذا المعرض.", "error");
      }
      return;
    }
    gallery = { id: snap.id, ...snap.data() };
    title.textContent = gallery.clientName;
    showPageMessage(publicLink(), "success");
    filesInput.disabled = false;

    // عرض كلمة السر
    accessCode = gallery.accessCode || '';
    const accessCodeDisplay = document.getElementById('accessCodeDisplay');
    if (accessCodeDisplay) {
      accessCodeDisplay.textContent = accessCode || 'غير متاحة';
    }

    const usage = await getStorageUsageDoc();
    renderStorageQuota(usage.usedBytes || 0);
    await loadSections();
    await loadFiles();
  } catch (error) {
    title.textContent = "تعذر تحميل المعرض";
    showPageMessage(friendlyError(error), "error");
  }
}

async function loadFiles() {
  grid.innerHTML = `<p class="muted">جاري تحميل الملفات...</p>`;
  try {
    const snap = await getDocs(collection(db, "galleries", galleryId, "files"));
    grid.innerHTML = "";
    if (snap.empty) {
      currentFiles = [];
      grid.innerHTML = `<p class="muted">لا توجد ملفات في هذا المعرض بعد.</p>`;
      renderSectionsManage();
      return;
    }
    currentFiles = snap.docs.map((fileDoc) => ({ id: fileDoc.id, ...fileDoc.data() }));
    const grouped = currentFiles.reduce((acc, item) => {
      const key = item.sectionId || "default";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    renderSectionsManage(grouped);
    const sectionOrder = sections.length ? sections : [defaultSection()];
    sectionOrder.forEach((section) => {
      const items = grouped[section.id] || [];
      const block = document.createElement("div");
      block.className = "section-block";
      block.dataset.sectionId = section.id;
      const heading = document.createElement("div");
      heading.className = "section-heading";
      const headingTitle = document.createElement("h3");
      headingTitle.textContent = section.name;
      const sectionCount = document.createElement("span");
      sectionCount.className = "section-count";
      const fileCountLabel = window.SITE_LANGUAGE === "ar"
        ? (items.length === 1 ? "ملف" : "ملفات")
        : (items.length === 1 ? "file" : "files");
      sectionCount.textContent = `${items.length} ${fileCountLabel}`;
      heading.append(headingTitle, sectionCount);
      const gridWrap = document.createElement("div");
      gridWrap.className = "thumb-grid";
      if (!items.length) {
        gridWrap.innerHTML = `<p class="muted">لا توجد ملفات داخل هذا القسم بعد.</p>`;
      }
      items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "thumb-card";
      const media = document.createElement(item.type === "video" ? "video" : "img");
      media.src = item.type === "video" ? item.url : (item.previewUrl || item.url);
      if (item.type === "video") media.controls = true;
      else media.alt = item.name || "صورة داخل المعرض";
      media.className = "thumb-media";
      const fileName = document.createElement("span");
      fileName.className = "thumb-file-name";
      fileName.title = item.name || "";
      fileName.textContent = item.name || (item.type === "video" ? "فيديو" : "صورة");
      const actions = document.createElement("div");
      actions.className = "thumb-actions";
      const download = document.createElement("a");
      download.className = "button secondary";
      download.href = item.url;
      download.download = "";
      download.textContent = "تحميل";
      const remove = document.createElement("button");
      remove.className = "button danger";
      remove.type = "button";
      remove.textContent = "حذف";
      actions.append(download, remove);
      const cardStatusNode = document.createElement("p");
      cardStatusNode.className = "card-status muted";
      card.append(media, fileName, actions, cardStatusNode);
      const deleteButton = remove;
      const cardStatus = cardStatusNode;
      deleteButton.addEventListener("click", async () => {
        if (!confirm("هل تريد حذف هذا الملف؟")) return;
        deleteButton.disabled = true;
        cardStatus.textContent = "جاري الحذف...";
      try {
          await deleteObject(ref(storage, item.storagePath));
          if (item.previewStoragePath) {
            await deleteObject(ref(storage, item.previewStoragePath));
          }
          await deleteDoc(doc(db, "galleries", galleryId, "files", item.id));
          await updateDoc(doc(db, "galleries", galleryId), { fileCount: increment(-1) });
          await updateStorageUsage(-(Number(item.sizeBytes || 0) + Number(item.previewSizeBytes || 0)));
          cardStatus.textContent = "تم الحذف";
          renderStorageQuota((await getStorageUsageDoc()).usedBytes || 0);
          await loadFiles();
        } catch (error) {
          deleteButton.disabled = false;
          cardStatus.textContent = friendlyError(error);
        }
      });
        gridWrap.append(card);
      });
      block.append(heading, gridWrap);
      grid.append(block);
    });
  } catch (error) {
    grid.innerHTML = `<p class="muted">${friendlyError(error)}</p>`;
  }
}

function updateGalleryLanguage() {
  renderSectionSelect();
  renderSectionsManage();
  grid.querySelectorAll(".section-block").forEach((block) => {
    const section = sectionMetaById(block.dataset.sectionId);
    const count = currentFiles.filter((file) => normalizeSectionId(file.sectionId) === section.id).length;
    const countLabel = window.SITE_LANGUAGE === "ar"
      ? (count === 1 ? "ملف" : "ملفات")
      : (count === 1 ? "file" : "files");
    const countNode = block.querySelector(".section-count");
    if (countNode) countNode.textContent = `${count} ${countLabel}`;
    const emptyState = block.querySelector(".thumb-grid > .muted");
    if (emptyState) emptyState.textContent = window.SITE_LANGUAGE === "ar"
      ? "لا توجد ملفات داخل هذا القسم بعد."
      : "There are no files in this section yet.";
  });
  if (uploadSummary) {
    const heading = progress.querySelector(".upload-summary-head strong");
    if (heading) heading.textContent = uploadText("تجهيز ورفع الملفات", "Preparing and uploading files");
    uploadSummary.bar?.setAttribute("aria-label", uploadText("تقدم الرفع", "Upload progress"));
  }
}

function isAllowedFile(file) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

async function uploadFile(file, chosenSection, onStatus) {
  const isImage = file.type.startsWith("image/");
  onStatus?.(isImage
    ? `${uploadText("جارٍ تجهيز الصورة بحد أقصى", "Preparing image up to")} ${UPLOAD_IMAGE_LIMIT_LABEL}`
    : uploadText("جارٍ تجهيز الملف", "Preparing file"), 0);
  const preparedFile = await prepareImageForUpload(file);
  onStatus?.(isImage
    ? `${uploadText("تم تجهيز الصورة", "Image prepared")}: ${formatBytes(preparedFile.size)} / ${UPLOAD_IMAGE_LIMIT_LABEL} · ${uploadText("جارٍ التحقق من المساحة", "checking storage")}`
    : uploadText("الملف جاهز، جارٍ التحقق من المساحة", "File ready, checking storage"), 0);
  const usage = await getStorageUsageDoc();
  if ((usage.usedBytes || 0) + preparedFile.size > STORAGE_LIMIT_BYTES) {
    throw new Error("storage-limit");
  }
  chosenSection ||= await ensureSectionExists(sectionSelect?.value || "default");
  const storagePath = `galleries/${galleryId}/${crypto.randomUUID()}-${preparedFile.name}`;
  const metadata = {
    contentType: preparedFile.type || "application/octet-stream",
    contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(preparedFile.name)}`
  };
  const task = uploadBytesResumable(ref(storage, storagePath), preparedFile, metadata);
  return new Promise((resolve, reject) => {
    task.on("state_changed", (snapshot) => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      onStatus?.(isImage
        ? uploadText("جارٍ رفع الصورة", "Uploading image")
        : uploadText("جارٍ رفع الملف", "Uploading file"), percent);
    }, (error) => {
      reject(error);
    }, async () => {
      try {
        const url = await getDownloadURL(task.snapshot.ref);
        onStatus?.(isImage
          ? uploadText("جارٍ حفظ بيانات الصورة", "Saving image details")
          : uploadText("جارٍ حفظ بيانات الملف", "Saving file details"), 100);
        await addDoc(collection(db, "galleries", galleryId, "files"), {
          name: file.name,
          type: fileType(file),
          url,
          previewUrl: url,
          storagePath,
          previewStoragePath: null,
          sectionId: chosenSection.id,
          sectionName: chosenSection.name,
          sizeBytes: preparedFile.size,
          previewSizeBytes: 0,
          originalSizeBytes: file.size,
          uploadedAt: serverTimestamp()
        });
        await updateDoc(doc(db, "galleries", galleryId), { fileCount: increment(1) });
        await updateStorageUsage(preparedFile.size);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleFiles(fileList, options = {}) {
  if (dropzone.classList.contains("is-busy")) return;
  if (!gallery) {
    showPageMessage("انتظر تحميل بيانات المعرض أولًا.", "error");
    return;
  }
  const files = [...fileList].filter(isAllowedFile);
  if (!files.length) {
    showPageMessage("اختر صورًا أو فيديوهات فقط.", "error");
    return;
  }
  setDropzoneBusy(true);
  uploadSummary = null;
  const summary = ensureUploadSummary(files.length);
  const startedAt = performance.now();
  let completed = 0;
  let failed = 0;
  let lastFailure = "";
  const plan = options.plan || new Map();

  const updateSummary = (status = null, activePercent = 0) => {
    const total = files.length;
    const percent = Math.round(((completed + failed + activePercent / 100) / total) * 100);
    const elapsedSeconds = Math.max(0.001, (performance.now() - startedAt) / 1000);
    const avgSecondsPerFile = elapsedSeconds / Math.max(1, completed + failed);
    const remainingFiles = Math.max(0, total - (completed + failed));
    const etaSeconds = remainingFiles * avgSecondsPerFile;
    summary.fill.style.width = `${percent}%`;
    summary.bar?.setAttribute("aria-valuenow", String(percent));
    summary.meta.textContent = `${completed + failed} / ${total}`;
    summary.status.textContent = status || (window.SITE_LANGUAGE === "ar"
      ? `تم رفع ${completed} من ${total} ملف${failed ? `، فشل ${failed}` : ""}`
      : `${completed} of ${total} files uploaded${failed ? `, ${failed} failed` : ""}`);
    summary.eta.textContent = window.SITE_LANGUAGE === "ar"
      ? `الوقت المتبقي: ${formatSeconds(etaSeconds)}`
      : `Time remaining: ${formatSeconds(etaSeconds)}`;
  };

  updateSummary();
  for (const [index, file] of files.entries()) {
    const onStatus = (stage, percent = 0) => {
      updateSummary(`${stage} (${index + 1}/${files.length}) · ${file.name}`, percent);
    };
    try {
      await uploadFile(file, plan.get(file) || null, onStatus);
      completed += 1;
      updateSummary();
    } catch (error) {
      failed += 1;
      lastFailure = `${file.name}: ${friendlyError(error)}`;
      updateSummary(`${uploadText("تعذر رفع", "Could not upload")} ${lastFailure}`);
    }
  }

  setDropzoneBusy(false);
  filesInput.value = "";
  const failedCount = failed;
  const finalMessage = failedCount
    ? `${window.SITE_LANGUAGE === "ar" ? `تم الرفع مع فشل ${failedCount} ملف.` : `Upload finished with ${failedCount} failed file${failedCount === 1 ? "" : "s"}.`} ${lastFailure}`
    : uploadText("تم رفع الملفات بنجاح.", "Files uploaded successfully.");
  summary.status.textContent = finalMessage;
  summary.eta.textContent = uploadText("الوقت المتبقي: 0 ث", "Time remaining: 0 sec");
  showPageMessage(finalMessage, failedCount ? "error" : "success");
  renderStorageQuota((await getStorageUsageDoc()).usedBytes || 0);
  await loadFiles();
}

async function handleFolderFiles(fileList) {
  if (dropzone.classList.contains("is-busy")) return;
  if (!gallery) {
    showPageMessage("انتظر تحميل بيانات المعرض أولًا.", "error");
    return;
  }
  const files = [...fileList].filter(isAllowedFile);
  if (!files.length) {
    showPageMessage("اختر صورًا أو فيديوهات فقط.", "error");
    return;
  }
  const folderGroups = new Map();
  for (const file of files) {
    const path = String(file.webkitRelativePath || file.name || "");
    const parts = path.split("/").filter(Boolean);
    const folderName = parts.length > 1 ? parts[0] : "مجلد";
    if (!folderGroups.has(folderName)) folderGroups.set(folderName, []);
    folderGroups.get(folderName).push(file);
  }

  const plan = new Map();
  let preparedGroups = 0;
  for (const [folderName, folderFilesList] of folderGroups.entries()) {
    showPageMessage(`${uploadText("جارٍ تجهيز أقسام المجلد", "Preparing folder sections")} (${preparedGroups + 1}/${folderGroups.size})`);
    const section = await ensureSectionByName(folderName);
    folderFilesList.forEach((file) => plan.set(file, section));
    preparedGroups += 1;
  }
  await handleFiles(files, { plan });
}

async function createSection() {
  if (!newSectionName) return;
  const name = newSectionName.value.trim();
  if (!name) return;
  const sectionId = `section-${Date.now()}`;
  await setDoc(doc(db, "galleries", galleryId, "sections", sectionId), {
    name,
    order: sections.length,
    createdAt: serverTimestamp()
  });
  newSectionName.value = "";
  await loadSections();
  sectionSelect.value = sectionId;
}

async function renameSection(sectionId) {
  const section = sections.find((item) => item.id === sectionId);
  if (!section || section.isDefault) return;
  const nextName = prompt("اكتب اسم القسم الجديد:", section.name);
  if (!nextName || !nextName.trim() || nextName.trim() === section.name) return;
  await updateDoc(doc(db, "galleries", galleryId, "sections", sectionId), {
    name: nextName.trim(),
    updatedAt: serverTimestamp()
  });
  await loadSections();
  await loadFiles();
}

async function deleteSection(sectionId) {
  const section = sections.find((item) => item.id === sectionId);
  if (!section || section.isDefault) return;
  if (!confirm(`هل تريد حذف قسم ${section.name}؟ سيتم نقل ملفاته إلى القسم الرئيسي.`)) return;
  const affected = currentFiles.filter((file) => normalizeSectionId(file.sectionId) === section.id);
  for (const file of affected) {
    await updateDoc(doc(db, "galleries", galleryId, "files", file.id), {
      sectionId: "default",
      sectionName: defaultSection().name
    });
  }
  await deleteDoc(doc(db, "galleries", galleryId, "sections", section.id));
  await loadSections();
  await loadFiles();
}

dropzone.addEventListener("click", () => {
  if (!filesInput.disabled) filesInput.click();
});
dropzone.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !filesInput.disabled) {
    event.preventDefault();
    filesInput.click();
  }
});
filesInput.addEventListener("change", () => handleFiles(filesInput.files));
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  handleFiles(event.dataTransfer.files);
});
document.addEventListener("paste", (event) => {
  const files = event.clipboardData?.files;
  if (files?.length) handleFiles(files);
});
copyLink.addEventListener("click", async () => {
  if (!gallery) return;
  try {
    await navigator.clipboard.writeText(publicLink());
    showPageMessage("تم نسخ رابط المعرض.", "success");
  } catch {
    showPageMessage("تعذر نسخ الرابط تلقائيًا.", "error");
  }
});

// زر نسخ كلمة السر
document.getElementById('copyAccessCodeBtn')?.addEventListener('click', async function() {
  if (!accessCode) {
    alert('لا توجد كلمة سر لعرضها.');
    return;
  }
  try {
    await navigator.clipboard.writeText(accessCode);
    this.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    setTimeout(() => {
      this.innerHTML = '<i class="fas fa-copy"></i> نسخ كلمة السر';
    }, 1500);
  } catch (err) {
    alert('تعذر نسخ كلمة السر تلقائيًا.');
  }
});

createSectionBtn?.addEventListener("click", async () => {
  try {
    createSectionBtn.disabled = true;
    await createSection();
    showPageMessage("تم إنشاء القسم.", "success");
  } catch (error) {
    showPageMessage(friendlyError(error), "error");
  } finally {
    createSectionBtn.disabled = false;
  }
});
uploadFolderBtn?.addEventListener("click", () => folderFiles?.click());
folderFiles?.addEventListener("change", () => handleFolderFiles(folderFiles.files));
sectionsManage?.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-section-edit], [data-section-delete]");
  if (!target) return;
  const sectionId = target.getAttribute("data-section-id");
  if (target.hasAttribute("data-section-edit")) {
    await renameSection(sectionId);
  }
  if (target.hasAttribute("data-section-delete")) {
    await deleteSection(sectionId);
  }
});
window.addEventListener("site-language-change", updateGalleryLanguage);
loadGallery();
