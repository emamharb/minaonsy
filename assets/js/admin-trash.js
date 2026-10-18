import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

requireAdmin();
const db = getFirestore(app);
const storage = getStorage(app);
const trashList = document.getElementById("trashList");
let trashItems = [];
let trashLoaded = false;
let trashLoadFailed = false;

const labels = {
  ar: {
    unknown: "غير معروف", loading: "جاري تحميل المعارض المحذوفة...", empty: "لا توجد معارض في سلة المهملات.",
    loadError: "تعذر تحميل سلة المهملات. حدّث الصفحة وحاول مرة أخرى.", restoreError: "تعذر استرجاع المعرض. حاول مرة أخرى.",
    deleteError: "تعذر حذف المعرض نهائيًا. حاول مرة أخرى.", activeSlug: "الرابط مستخدم بالفعل في المعارض الحالية.",
    unnamed: "بدون اسم", link: "الرابط", deletedAt: "حُذف في", fileCount: "عدد الملفات",
    open: "فتح", restore: "استرجاع", delete: "حذف نهائي", confirmDelete: "هل تريد حذف معرض {name} نهائيًا؟ لن يمكن استرجاعه.",
    restoring: "جاري الاسترجاع..."
  },
  en: {
    unknown: "Unknown", loading: "Loading deleted galleries…", empty: "There are no galleries in the trash.",
    loadError: "Could not load the trash. Refresh the page and try again.", restoreError: "Could not restore the gallery. Please try again.",
    deleteError: "Could not permanently delete the gallery. Please try again.", activeSlug: "This link is already used by an active gallery.",
    unnamed: "Untitled", link: "Link", deletedAt: "Deleted", fileCount: "Files",
    open: "Open", restore: "Restore", delete: "Delete permanently", confirmDelete: "Permanently delete {name}? This cannot be undone.",
    restoring: "Restoring gallery…"
  }
};

function t(key, values = {}) {
  const locale = window.SITE_LANGUAGE === "en" ? "en" : "ar";
  return (labels[locale][key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  const locale = window.SITE_LANGUAGE === "en" ? "en-US" : "ar-EG";
  return date ? date.toLocaleString(locale, { dateStyle: "medium" }) : t("unknown");
}

function statusMessage(message, type = "info") {
  const status = document.createElement("p");
  status.className = `muted ${type}`;
  status.setAttribute("role", "status");
  status.textContent = message;
  trashList.replaceChildren(status);
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
    throw new Error("activeSlug");
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
  if (!confirm(t("confirmDelete", { name: item.clientName || t("unnamed") }))) return;
  try {
    await deleteStorageFolder(`galleries/${item.id}`);
  } catch {
    // If the storage folder is already gone, continue with the Firestore delete.
  }
  await deleteDoc(doc(db, "trashGalleries", item.id));
}

function render(items) {
  if (!items.length) {
    statusMessage(t("empty"));
    return;
  }
  trashList.replaceChildren();
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "trash-row";
    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("h3");
    name.textContent = item.clientName || t("unnamed");
    const slug = document.createElement("small");
    slug.textContent = `${t("link")}: ${item.slug || item.id}`;
    info.append(name, slug);

    const deleted = document.createElement("div");
    deleted.className = "deleted-at";
    const deletedLabel = document.createElement("small");
    deletedLabel.textContent = t("deletedAt");
    const deletedValue = document.createElement("strong");
    deletedValue.textContent = formatDate(item.deletedAt);
    deleted.append(deletedLabel, document.createElement("br"), deletedValue);

    const count = document.createElement("div");
    const countLabel = document.createElement("small");
    countLabel.textContent = t("fileCount");
    const countValue = document.createElement("strong");
    countValue.textContent = String(item.fileCount || 0);
    count.append(countLabel, document.createElement("br"), countValue);

    const actions = document.createElement("div");
    actions.className = "trash-actions";
    const openLink = document.createElement("a");
    openLink.className = "button secondary";
    openLink.href = `gallery-manage.html?id=${encodeURIComponent(item.id)}`;
    openLink.textContent = t("open");
    const restoreButton = document.createElement("button");
    restoreButton.className = "button secondary";
    restoreButton.type = "button";
    restoreButton.dataset.restore = "";
    restoreButton.textContent = t("restore");
    const deleteButton = document.createElement("button");
    deleteButton.className = "button danger";
    deleteButton.type = "button";
    deleteButton.dataset.delete = "";
    deleteButton.textContent = t("delete");
    actions.append(openLink, restoreButton, deleteButton);
    row.append(info, deleted, count, actions);
    restoreButton.addEventListener("click", async () => {
      restoreButton.disabled = true;
      statusMessage(t("restoring"));
      try {
        await restoreGallery(item);
        await loadTrash();
      } catch (error) {
        restoreButton.disabled = false;
        console.error("Gallery restore failed:", error);
        statusMessage(error?.message === "activeSlug" ? t("activeSlug") : t("restoreError"), "error");
      }
    });
    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;
      try {
        await permanentlyDeleteGallery(item);
        await loadTrash();
      } catch (error) {
        deleteButton.disabled = false;
        console.error("Gallery deletion failed:", error);
        statusMessage(t("deleteError"), "error");
      }
    });
    trashList.append(row);
  });
}

async function loadTrash() {
  statusMessage(t("loading"));
  try {
    const snap = await getDocs(query(collection(db, "trashGalleries"), orderBy("deletedAt", "desc")));
    trashItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    trashLoaded = true;
    trashLoadFailed = false;
    render(trashItems);
  } catch (error) {
    trashLoaded = true;
    trashLoadFailed = true;
    console.error("Trash loading failed:", error);
    statusMessage(t("loadError"), "error");
  }
}

window.addEventListener("site-language-change", () => {
  if (!trashLoaded) statusMessage(t("loading"));
  else if (trashLoadFailed) statusMessage(t("loadError"), "error");
  else render(trashItems);
});
loadTrash();
