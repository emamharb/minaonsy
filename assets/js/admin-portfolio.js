import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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
const PREVIEW_MAX_BYTES = 500 * 1024;
const PREVIEW_MAX_SIDE = 1600;

function friendlyError(error) {
  if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
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
    img.onload = () => resolve(img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait");
    img.onerror = () => resolve("landscape");
    img.src = URL.createObjectURL(file);
  });
}

async function createImagePreviewBlob(file) {
  if (!file.type.startsWith("image/")) return null;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const targetTypes = ["image/webp", "image/jpeg", file.type];
  for (const type of targetTypes) {
    if (!type) continue;
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
      if (blob && blob.size <= PREVIEW_MAX_BYTES) {
        return { blob, type };
      }
    }
    const fallback = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.45));
    if (fallback) return { blob: fallback, type };
  }
  return null;
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
  const message = document.createElement("small");
  message.textContent = "جاري الرفع";
  row.append(label, bar, message);
  progress.append(row);
  return { row, bar, message };
}

async function uploadImage(file) {
  const usage = await getStorageUsageDoc();
  const preview = await createImagePreviewBlob(file);
  const previewBytes = preview?.blob?.size || 0;
  if ((usage.usedBytes || 0) + file.size + previewBytes > STORAGE_LIMIT_BYTES) {
    throw new Error("storage-limit");
  }
  const imageId = crypto.randomUUID();
  const storagePath = `portfolio/${imageId}-${file.name}`;
  const previewPath = preview ? `portfolio/previews/${imageId}-${file.name.replace(/\.[^.]+$/, "")}.${preview.type === "image/webp" ? "webp" : preview.type === "image/jpeg" ? "jpg" : file.name.split(".").pop()}` : null;
  const orientation = await imageOrientation(file);
  const task = uploadBytesResumable(ref(storage, storagePath), file);
  const ui = progressRow(file.name);
  return new Promise((resolve, reject) => {
    task.on("state_changed", (snap) => {
      const percent = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      ui.bar.style.width = `${percent}%`;
      ui.bar.textContent = `${percent}%`;
    }, (error) => {
      ui.row.classList.add("is-error");
      ui.message.textContent = friendlyError(error);
      reject(error);
    }, async () => {
      try {
        ui.message.textContent = "جاري حفظ البيانات";
        const imageUrl = await getDownloadURL(task.snapshot.ref);
        let previewUrl = imageUrl;
        let previewStoragePath = null;
        let previewSizeBytes = 0;
        if (preview && previewPath) {
          const previewTask = uploadBytesResumable(ref(storage, previewPath), preview.blob, { contentType: preview.type });
          await new Promise((resolvePreview, rejectPreview) => {
            previewTask.on("state_changed", null, rejectPreview, resolvePreview);
          });
          previewUrl = await getDownloadURL(previewTask.snapshot.ref);
          previewStoragePath = previewPath;
          previewSizeBytes = preview.blob.size;
        }
        await addDoc(collection(db, "portfolio"), {
          imageUrl,
          previewUrl,
          storagePath,
          previewStoragePath,
          orientation,
          order: Date.now(),
          uploadedAt: serverTimestamp(),
          isVisible: true,
          sizeBytes: file.size,
          previewSizeBytes
        });
        await updateStorageUsage(file.size + previewSizeBytes);
        ui.row.classList.add("is-done");
        ui.message.textContent = "تم الرفع";
        resolve();
      } catch (error) {
        ui.row.classList.add("is-error");
        ui.message.textContent = friendlyError(error);
        reject(error);
      }
    });
  });
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
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    progress.innerHTML = `<p class="muted status-message error">اختر صورًا فقط.</p>`;
    return;
  }
  setDropzoneBusy(true);
  const results = await Promise.allSettled(files.map(uploadImage));
  setDropzoneBusy(false);
  input.value = "";
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) progress.insertAdjacentHTML("beforeend", `<p class="muted status-message error">تم الرفع مع فشل ${failed} صورة.</p>`);
  else progress.insertAdjacentHTML("beforeend", `<p class="muted status-message success">تم رفع الصور بنجاح.</p>`);
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
