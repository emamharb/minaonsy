import app from "./firebase-config.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const auth = getAuth(app);
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

function authMessage(error) {
  if (!navigator.onLine) return "لا يوجد اتصال بالإنترنت.";
  if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password" || error?.code === "auth/user-not-found") {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (error?.code === "auth/too-many-requests") return "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  if (error?.code === "auth/unauthorized-domain") return "هذا الدومين غير مضاف في Firebase Authorized Domains.";
  return "تعذر تسجيل الدخول الآن. حاول مرة أخرى.";
}

export function requireAdmin() {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
  });
}

if (loginForm) {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "dashboard.html";
  });
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    const submitButton = loginForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "جاري الدخول...";
    const data = new FormData(loginForm);
    try {
      await signInWithEmailAndPassword(auth, data.get("email"), data.get("password"));
      window.location.href = "dashboard.html";
    } catch (error) {
      loginError.textContent = authMessage(error);
      submitButton.disabled = false;
      submitButton.textContent = "دخول";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch {
      logoutBtn.disabled = false;
    }
  });
}
