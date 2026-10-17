import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

requireAdmin();
const db = getFirestore(app);
const storage = getStorage(app);
const trashList = document.getElementById("trashList");

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date ? date.toLocaleString("ar-EG") : "غير معروف";
}

function statusMessage(message, type = "info") {
  trashList.innerHTML = `<p class="muted ${type}">${message}</p>`;
}

async function deleteStorageFolder(path) {
  const folder = ref(storage, path);
  const result = await listAll(folder);
  await Promise.all(result.items.map((item) => deleteObject(item)));
  await Promise.all(result.prefixes.map((prefix) => deleteStorageFolder(prefix.fullPath)));
}

async function restoreGallery(item) {
  const activeSnap = await getDoc(doc(db, "galleries", item.id));
  if (activeSnap.exists()) {
    throw new Error("الرابط مستخدم بالفعل في المعارض الحالية.");
  }
  await setDoc(doc(db, "galleries", item.id), {
    clientName: item.clientName,
    eventType: item.eventType || "",
    eventDate: item.eventDate || null,
    notes: item.notes || "",
    slug: item.slug || item.id,
    fileCount: item.fileCount || 0,
    createdAt: item.createdAt || serverTimestamp(),
    restoredAt: serverTimestamp()
  });
  await deleteDoc(doc(db, "trashGalleries", item.id));
}

async function permanentlyDeleteGallery(item) {
  if (!confirm(`هل تريد حذف معرض ${item.clientName} نهائيًا؟ لن يمكن استرجاعه.`)) return;
  try {
    await deleteStorageFolder(`galleries/${item.id}`);
  } catch {
    // If the storage folder is already gone, continue with the Firestore delete.
  }
  await deleteDoc(doc(db, "trashGalleries", item.id));
}

function render(items) {
  if (!items.length) {
    trashList.innerHTML = `<p class="muted">لا توجد معارض في سلة المهملات.</p>`;
    return;
  }
  trashList.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "trash-row";
    row.innerHTML = `
      <div>
        <h3>${item.clientName || "بدون اسم"}</h3>
        <small>الرابط: ${item.slug || item.id}</small>
      </div>
      <div><small>حُذف في</small><br><strong>${formatDate(item.deletedAt)}</strong></div>
      <div><small>عدد الملفات</small><br><strong>${item.fileCount || 0}</strong></div>
      <div class="trash-actions">
        <a class="button secondary" href="gallery-manage.html?id=${encodeURIComponent(item.id)}">فتح</a>
        <button class="button secondary" type="button" data-restore>استرجاع</button>
        <button class="button danger" type="button" data-delete>حذف نهائي</button>
      </div>`;
    const restoreButton = row.querySelector("[data-restore]");
    const deleteButton = row.querySelector("[data-delete]");
    restoreButton.addEventListener("click", async () => {
      restoreButton.disabled = true;
      statusMessage("جاري الاسترجاع...");
      try {
        await restoreGallery(item);
        await loadTrash();
      } catch (error) {
        restoreButton.disabled = false;
        statusMessage(error?.message || "تعذر الاسترجاع.", "error");
      }
    });
    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;
      try {
        await permanentlyDeleteGallery(item);
        await loadTrash();
      } catch (error) {
        deleteButton.disabled = false;
        statusMessage(error?.message || "تعذر الحذف النهائي.", "error");
      }
    });
    trashList.append(row);
  });
}

async function loadTrash() {
  trashList.innerHTML = `<p class="muted">جاري تحميل المعارض المحذوفة...</p>`;
  try {
    const snap = await getDocs(query(collection(db, "trashGalleries"), orderBy("deletedAt", "desc")));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render(items);
  } catch (error) {
    statusMessage(error?.message || "تعذر تحميل سلة المهملات.", "error");
  }
}

loadTrash();