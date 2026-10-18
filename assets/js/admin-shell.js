(() => {
  const sidebar = document.querySelector("body.admin-body .admin-sidebar");
  const nav = sidebar?.querySelector("#sidebarNav");
  const toggle = sidebar?.querySelector("#hamburgerBtn");
  if (!sidebar || !nav || !toggle) return;

  const syncMenuState = () => {
    const isOpen = nav.classList.contains("open");
    const language = window.getSiteLanguage?.() || document.documentElement.lang || "en";
    const arabic = language === "ar";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", arabic
      ? (isOpen ? "إغلاق القائمة" : "فتح القائمة")
      : (isOpen ? "Close menu" : "Open menu"));
    toggle.title = toggle.getAttribute("aria-label");
    const icon = toggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
    nav.setAttribute("aria-label", arabic ? "التنقل الإداري" : "Admin navigation");
    nav.querySelectorAll("a").forEach((link) => {
      if (link.classList.contains("active")) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  toggle.addEventListener("click", syncMenuState);
  nav.addEventListener("click", syncMenuState);
  document.addEventListener("click", (event) => {
    if (window.innerWidth <= 768 && !sidebar.contains(event.target)) syncMenuState();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !nav.classList.contains("open")) return;
    nav.classList.remove("open");
    syncMenuState();
    toggle.focus({ preventScroll: true });
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) nav.classList.remove("open");
    syncMenuState();
  });
  window.addEventListener("site-language-change", syncMenuState);
  syncMenuState();
})();
