import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { prepareImageForUpload, MAX_UPLOAD_IMAGE_BYTES } from "./image-optimization.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

requireAdmin();
const db = getFirestore(app);
const storage = getStorage(app);
const input = document.getElementById("portfolioFiles");
const dropzone = document.getElementById("portfolioDropzone");
const progress = document.getElementById("portfolioProgress");
const grid = document.getElementById("portfolioGridAdmin");
const storageQuota = document.getElementById("storageQuotaPortfolio");
const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;
const UPLOAD_IMAGE_LIMIT_LABEL = `${Math.round(MAX_UPLOAD_IMAGE_BYTES / 1024)} KB`;

function uploadText(ar, en) {
  return window.SITE_LANGUAGE === "ar" ? ar : en;
}

function friendlyError(error) {
  if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
  if (error?.message === "image-format-limit") return uploadText("صيغة الصورة المتحركة أو المتجهة لا يمكن ضغطها دون تغييرها. احفظها كصورة ثابتة لا تتجاوز 300 KB.", "Animated or vector images cannot be compressed without changing them. Save a still image under 300 KB.");
  if (error?.message === "image-compression-unavailable") return uploadText("تعذر تجهيز الصورة. جرّب حفظها بصيغة JPG أو WebP ثم أعد المحاولة.", "The image could not be prepared. Save it as JPG or WebP and try again.");
  if (error?.message === "image-too-large-after-compression") return uploadText("تعذر ضغط الصورة إلى أقل من 300 KB مع الحفاظ على وضوح مناسب.", "The image could not be reduced below 300 KB while retaining usable clarity.");
  if (error?.code === "permission-denied" || error?.code === "storage/unauthorized") return "ليست لديك صلاحية لتنفيذ هذه العملية.";
  if (error?.code === "storage/unknown") return "فشل الرفع. تأكد من قواعد Storage وأن حساب الأدمن مسجل دخول.";
  if (error?.code === "storage/retry-limit-exceeded") return "الاتصال ضعيف. حاول رفع الصورة مرة أخرى.";
  if (error?.message === "storage-limit") return "المساحة التخزينية وصلت للحد الأقصى 100 جيجا.";
  return "حدث خطأ. حاول مرة أخرى.";
}

function setDropzoneBusy(isBusy) {
  dropzone.classList.toggle("is-busy", isBusy);
  input.disabled = isBusy;
}

function imageOrientation(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("landscape");
    };
    img.src = url;
  });
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
  const remaining = Math.max(0, STORAGE_LIMIT_BYTES - usedBytes);
  storageQuota.innerHTML = `
    <div class="upload-summary-head">
      <strong>المساحة التخزينية</strong>
      <span>${percent.toFixed(2)}%</span>
    </div>
    <div class="upload-summary-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
    <div class="upload-summary-foot">
      <small>المستخدم: ${formatBytes(usedBytes)}</small>
      <small>المتاح: ${formatBytes(remaining)}</small>
    </div>`;
}

function progressRow(name) {
  const row = document.createElement("div");
  row.className = "progress-item";
  const label = document.createElement("strong");
  label.textContent = name;
  const bar = document.createElement("span");
  bar.textContent = "0%";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", `${name} ${uploadText("تقدم الرفع", "upload progress")}`);
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", "0");
  bar.style.setProperty("--progress", "0%");
  const message = document.createElement("small");
  message.textContent = uploadText("في قائمة الرفع", "In upload queue");
  row.append(label, bar, message);
  progress.append(row);
  return { row, bar, message };
}

async function uploadImage(file, index, total) {
  const ui = progressRow(file.name);
  const isImage = file.type.startsWith("image/");
  const itemPosition = `(${index + 1}/${total})`;
  ui.message.textContent = isImage
    ? `${uploadText("جارٍ تجهيز الصورة بحد أقصى", "Preparing image up to")} ${UPLOAD_IMAGE_LIMIT_LABEL} ${itemPosition}`
    : `${uploadText("جارٍ تجهيز الملف", "Preparing file")} ${itemPosition}`;
  let preparedFile;
  try {
    preparedFile = await prepareImageForUpload(file);
    ui.message.textContent = `${uploadText("تم تجهيز الصورة", "Image prepared")}: ${formatBytes(preparedFile.size)} / ${UPLOAD_IMAGE_LIMIT_LABEL} · ${uploadText("جارٍ التحقق من المساحة", "checking storage")}`;
    const usage = await getStorageUsageDoc();
    if ((usage.usedBytes || 0) + preparedFile.size > STORAGE_LIMIT_BYTES) {
      throw new Error("storage-limit");
    }
  } catch (error) {
    ui.row.classList.add("is-error");
    ui.message.textContent = friendlyError(error);
    throw error;
  }
  const imageId = crypto.randomUUID();
  const storagePath = `portfolio/${imageId}-${preparedFile.name}`;
  const orientation = await imageOrientation(preparedFile);
  ui.message.textContent = uploadText("جارٍ رفع الصورة", "Uploading image");
  const task = uploadBytesResumable(ref(storage, storagePath), preparedFile, {
    contentType: preparedFile.type,
    contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(preparedFile.name)}`
  });
  try {
    const imageUrl = await new Promise((resolve, reject) => {
      task.on("state_changed", (snap) => {
        const percent = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        ui.bar.style.setProperty("--progress", `${percent}%`);
        ui.bar.textContent = `${percent}%`;
        ui.bar.setAttribute("aria-valuenow", String(percent));
      }, reject, async () => {
        try { resolve(await getDownloadURL(task.snapshot.ref)); }
        catch (error) { reject(error); }
      });
    });
    ui.message.textContent = uploadText("جارٍ حفظ البيانات", "Saving image details");
    await addDoc(collection(db, "portfolio"), {
      imageUrl,
      previewUrl: imageUrl,
      storagePath,
      previewStoragePath: null,
      orientation,
      order: Date.now(),
      uploadedAt: serverTimestamp(),
      isVisible: true,
      sizeBytes: preparedFile.size,
      originalSizeBytes: file.size,
      previewSizeBytes: 0
    });
    await updateStorageUsage(preparedFile.size);
    ui.row.classList.add("is-done");
    ui.bar.style.setProperty("--progress", "100%");
    ui.bar.textContent = "100%";
    ui.bar.setAttribute("aria-valuenow", "100");
    ui.message.textContent = uploadText("تم الرفع", "Uploaded");
  } catch (error) {
    ui.row.classList.add("is-error");
    ui.message.textContent = friendlyError(error);
    throw error;
  }
}

async function loadPortfolio() {
  grid.innerHTML = `<p class="muted">جاري تحميل الصور...</p>`;
  try {
    const snap = await getDocs(query(collection(db, "portfolio"), orderBy("order", "asc")));
    grid.innerHTML = "";
    if (snap.empty) {
      grid.innerHTML = `<p class="muted">لا توجد صور مرفوعة بعد.</p>`;
      return;
    }
    snap.docs.forEach((photoDoc) => {
    const item = photoDoc.data();
    const card = document.createElement("div");
    card.className = "thumb-card";
    card.innerHTML = `<img src="${item.previewUrl || item.imageUrl}" alt=""><div class="thumb-actions">
      <button class="button secondary" data-visible type="button">${item.isVisible ? "إخفاء" : "إظهار"}</button>
      <button class="button danger" data-delete type="button">حذف</button>
    </div>`;
    const visibleButton = card.querySelector("[data-visible]");
    const deleteButton = card.querySelector("[data-delete]");
    card.insertAdjacentHTML("beforeend", `<p class="card-status muted"></p>`);
    const cardStatus = card.querySelector(".card-status");
    visibleButton.addEventListener("click", async () => {
      visibleButton.disabled = true;
      cardStatus.textContent = "جاري التحديث...";
      try {
        await updateDoc(doc(db, "portfolio", photoDoc.id), { isVisible: !item.isVisible });
        await loadPortfolio();
      } catch (error) {
        visibleButton.disabled = false;
        cardStatus.textContent = friendlyError(error);
      }
    });
    deleteButton.addEventListener("click", async () => {
      if (!confirm("هل تريد حذف هذه الصورة نهائيًا؟")) return;
      deleteButton.disabled = true;
      cardStatus.textContent = "جاري الحذف...";
      try {
        await deleteObject(ref(storage, item.storagePath));
        if (item.previewStoragePath) {
          await deleteObject(ref(storage, item.previewStoragePath));
        }
        await deleteDoc(doc(db, "portfolio", photoDoc.id));
        await updateStorageUsage(-(Number(item.sizeBytes || 0) + Number(item.previewSizeBytes || 0)));
        await loadPortfolio();
      } catch (error) {
        deleteButton.disabled = false;
        cardStatus.textContent = friendlyError(error);
      }
    });
    grid.append(card);
    });
  } catch (error) {
    grid.innerHTML = `<p class="muted">${friendlyError(error)}</p>`;
  }
}

async function handleImages(fileList) {
  if (input.disabled) return;
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    progress.innerHTML = `<p class="muted status-message error">اختر صورًا فقط.</p>`;
    return;
  }
  setDropzoneBusy(true);
  const results = [];
  for (const [index, file] of files.entries()) {
    try {
      await uploadImage(file, index, files.length);
      results.push({ status: "fulfilled" });
    } catch (_) {
      results.push({ status: "rejected" });
    }
  }
  setDropzoneBusy(false);
  input.value = "";
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) progress.insertAdjacentHTML("beforeend", `<p class="muted status-message error">${uploadText(`تم الرفع مع فشل ${failed} صورة.`, `Upload finished with ${failed} failed image${failed === 1 ? "" : "s"}.`)}</p>`);
  else progress.insertAdjacentHTML("beforeend", `<p class="muted status-message success">${uploadText("تم رفع الصور بنجاح.", "Photos uploaded successfully.")}</p>`);
  await loadPortfolio();
}

dropzone.addEventListener("click", () => {
  if (!input.disabled) input.click();
});
dropzone.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !input.disabled) {
    event.preventDefault();
    input.click();
  }
});
input.addEventListener("change", () => handleImages(input.files));
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  handleImages(event.dataTransfer.files);
});
document.addEventListener("paste", (event) => {
  const files = event.clipboardData?.files;
  if (files?.length) handleImages(files);
});
loadPortfolio();
(async () => {
  const usage = await getStorageUsageDoc();
  renderStorageQuota(usage.usedBytes || 0);
})();
