import app from "./firebase-config.js";
import { requireAdmin } from "./admin-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

requireAdmin();
const db = getFirestore(app);
const quota = document.getElementById("storageQuotaPage");
const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;

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

async function ensureStorageStats() {
  const refDoc = doc(db, "stats", "storage");
  const snap = await getDoc(refDoc);
  if (!snap.exists()) {
    await setDoc(refDoc, { usedBytes: 0 }, { merge: true });
    return 0;
  }
  return Number(snap.data().usedBytes || 0);
}

async function loadTotals() {
  const usedBytes = await ensureStorageStats();
  const percent = Math.min(100, (usedBytes / STORAGE_LIMIT_BYTES) * 100);
  const remaining = Math.max(0, STORAGE_LIMIT_BYTES - usedBytes);
  quota.innerHTML = `
    <div class="storage-metric-head">
      <strong>المساحة التخزينية</strong>
      <span>${percent.toFixed(2)}%</span>
    </div>
    <div class="storage-metric-bar"><span style="width:${percent}%"></span></div>
    <div class="storage-metric-foot">
      <small class="muted">المستخدم: ${formatBytes(usedBytes)}</small>
      <small class="muted">المتاح: ${formatBytes(remaining)}</small>
    </div>`;
}

loadTotals();
