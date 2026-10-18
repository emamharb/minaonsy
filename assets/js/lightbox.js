export function createLightbox(items, options = {}) {
  const box = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  const close = box?.querySelector(".lightbox-close");
  const prev = box?.querySelector(".prev");
  const next = box?.querySelector(".next");
  const downloadButton = box?.querySelector(".lightbox-download");
  let index = 0;
  let triggerElement = null;

  function syncDownloadButton() {
    if (!downloadButton) return;
    const item = items[index];
    downloadButton.disabled = !item;
    downloadButton.setAttribute("aria-hidden", item ? "false" : "true");
  }

  function downloadCurrent() {
    const item = items[index];
    if (!item || typeof options.onDownload !== "function") return;
    options.onDownload(item, index);
  }

  function show(nextIndex) {
    if (!items.length || !box || !image) return;
    index = (nextIndex + items.length) % items.length;
    if (!box.classList.contains("is-open")) triggerElement = document.activeElement;
    image.src = items[index].url;
    image.alt = items[index].alt || "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    syncDownloadButton();
    (close || box.querySelector("button"))?.focus();
  }

  function hide() {
    box?.classList.remove("is-open");
    box?.setAttribute("aria-hidden", "true");
    triggerElement?.focus?.();
    triggerElement = null;
  }

  close?.addEventListener("click", hide);
  prev?.addEventListener("click", () => show(index - 1));
  next?.addEventListener("click", () => show(index + 1));
  downloadButton?.addEventListener("click", downloadCurrent);
  box?.addEventListener("click", (event) => {
    if (event.target === box) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (!box?.classList.contains("is-open")) return;
    if (event.key === "Escape") hide();
    if (event.key === "ArrowRight") show(index - 1);
    if (event.key === "ArrowLeft") show(index + 1);
    if (event.key === "Tab" && box) {
      const controls = [...box.querySelectorAll("button:not([disabled])")];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  return { show };
}

