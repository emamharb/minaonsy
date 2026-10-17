import { createLightbox } from "./lightbox.js?v=a11y1";

const grid = document.getElementById("portfolioGrid");
const loadMoreButton = document.getElementById("loadMorePortfolio");
const imageItems = [];
const lightbox = createLightbox(imageItems);
const pageSize = 30;
let allPortfolioItems = [];
let renderedCount = 0;
let activeFilter = "all";
let filteredPortfolioItems = [];
const filterLabels = {
  all: { en: "All work", ar: "كل الأعمال" },
  portrait: { en: "Portrait", ar: "طولي" },
  landscape: { en: "Landscape", ar: "عرضي" }
};

function syncFilterLanguage() {
  const language = window.SITE_LANGUAGE === "ar" ? "ar" : "en";
  document.querySelectorAll("[data-portfolio-filter]").forEach((button) => {
    button.textContent = filterLabels[button.dataset.portfolioFilter]?.[language] || button.textContent;
  });
}
window.addEventListener("site-language-change", syncFilterLanguage);
syncFilterLanguage();

function filterItems(items) {
  return activeFilter === "all"
    ? items
    : items.filter((item) => item.orientation === activeFilter);
}

function photosFromEmbeddedManifest() {
  return (window.STATIC_PORTFOLIO_PHOTOS || []).map((item, index) => ({
    url: item.path,
    alt: "Wedding photography by Mina Onsy Studio",
    width: item.width,
    height: item.height,
    order: index,
    source: "static",
    orientation: item.orientation || (item.width && item.height ? (item.height >= item.width ? "portrait" : "landscape") : "")
  }));
}

async function loadStaticPhotos() {
  const embedded = photosFromEmbeddedManifest();
  if (embedded.length) return embedded;

  try {
    const response = await fetch("assets/photos/manifest.json", { cache: "no-store" });
    if (!response.ok) return [];
    const manifest = await response.json();
    return (manifest.photos || []).map((item, index) => ({
      url: item.path,
      alt: "Wedding photography by Mina Onsy Studio",
      width: item.width,
      height: item.height,
      order: index,
      source: "static",
      orientation: item.orientation || (item.width && item.height ? (item.height >= item.width ? "portrait" : "landscape") : "")
    }));
  } catch {
    return [];
  }
}

async function loadFirebasePhotos() {
  try {
    const [{ default: app }, firestore] = await Promise.all([
      import("./firebase-config.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]);
    const { getFirestore, collection, getDocs, query, where } = firestore;
    const db = getFirestore(app);
    const snap = await getDocs(query(collection(db, "portfolio"), where("isVisible", "==", true)));
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: data.imageUrl,
        alt: data.alt || "Wedding photography by Mina Onsy Studio",
        order: data.order ?? 0,
        uploadedAt: data.uploadedAt?.toMillis?.() || 0,
        source: "firebase",
        orientation: data.orientation || (data.width && data.height ? (data.height >= data.width ? "portrait" : "landscape") : "")
      };
    }).sort((a, b) => (a.order || a.uploadedAt || 0) - (b.order || b.uploadedAt || 0));
  } catch {
    return [];
  }
}

function render(items) {
  grid.innerHTML = "";
  allPortfolioItems = items;
  filteredPortfolioItems = filterItems(items);
  imageItems.splice(0, imageItems.length, ...filteredPortfolioItems);
  renderedCount = 0;
  renderNextPage(true);
}

function renderNextPage(eager = false) {
  const nextItems = filteredPortfolioItems.slice(renderedCount, renderedCount + pageSize);
  renderBatch(nextItems, renderedCount, eager);
  renderedCount += nextItems.length;
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  if (!loadMoreButton) return;
  loadMoreButton.hidden = renderedCount >= filteredPortfolioItems.length;
}

function renderBatch(items, offset, eager) {
  const fragment = document.createDocumentFragment();
  items.forEach((item, batchIndex) => {
    const index = offset + batchIndex;
    const figure = document.createElement("button");
    figure.type = "button";
    figure.className = "masonry-item";
    figure.setAttribute("aria-label", `${item.alt || "Wedding photograph"} (${index + 1})`);
    figure.dataset.orientation = item.orientation || "unknown";
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.alt;
    if (item.width) img.width = item.width;
    if (item.height) img.height = item.height;
    img.loading = eager && index < 6 ? "eager" : "lazy";
    img.decoding = "async";
    if (eager && index < 2) img.fetchPriority = "high";
    figure.append(img);
    figure.addEventListener("click", () => lightbox.show(index));
    fragment.append(figure);
  });
  grid.append(fragment);
}

document.querySelectorAll("[data-portfolio-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.portfolioFilter;
    document.querySelectorAll("[data-portfolio-filter]").forEach((filterButton) => {
      const selected = filterButton === button;
      filterButton.classList.toggle("is-active", selected);
      filterButton.setAttribute("aria-pressed", String(selected));
    });
    render(allPortfolioItems);
  });
});

loadMoreButton?.addEventListener("click", () => renderNextPage(false));

const embeddedStaticPhotos = photosFromEmbeddedManifest();
if (embeddedStaticPhotos.length) render(embeddedStaticPhotos);

const staticPhotos = embeddedStaticPhotos.length ? embeddedStaticPhotos : await loadStaticPhotos();
if (!embeddedStaticPhotos.length) render(staticPhotos);

const firebasePhotos = await loadFirebasePhotos();
if (firebasePhotos.length) render([...firebasePhotos, ...staticPhotos]);
