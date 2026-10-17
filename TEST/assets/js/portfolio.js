import { createLightbox } from "./lightbox.js";

const grid = document.getElementById("portfolioGrid");
const loadMoreButton = document.getElementById("loadMorePortfolio");
const imageItems = [];
const lightbox = createLightbox(imageItems);
const pageSize = 30;
let allPortfolioItems = [];
let renderedCount = 0;

function photosFromEmbeddedManifest() {
  return (window.STATIC_PORTFOLIO_PHOTOS || []).map((item, index) => ({
    url: item.path,
    alt: "Mina Onsy Studio",
    width: item.width,
    height: item.height,
    order: index,
    source: "static"
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
      alt: "Mina Onsy Studio",
      width: item.width,
      height: item.height,
      order: index,
      source: "static"
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
        alt: "Mina Onsy Studio",
        order: data.order ?? 0,
        uploadedAt: data.uploadedAt?.toMillis?.() || 0,
        source: "firebase"
      };
    }).sort((a, b) => (a.order || a.uploadedAt || 0) - (b.order || b.uploadedAt || 0));
  } catch {
    return [];
  }
}

function render(items) {
  grid.innerHTML = "";
  imageItems.splice(0, imageItems.length, ...items);
  allPortfolioItems = items;
  renderedCount = 0;
  renderNextPage(true);
}

function renderNextPage(eager = false) {
  const nextItems = allPortfolioItems.slice(renderedCount, renderedCount + pageSize);
  renderBatch(nextItems, renderedCount, eager);
  renderedCount += nextItems.length;
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  if (!loadMoreButton) return;
  loadMoreButton.hidden = renderedCount >= allPortfolioItems.length;
}

function renderBatch(items, offset, eager) {
  const fragment = document.createDocumentFragment();
  items.forEach((item, batchIndex) => {
    const index = offset + batchIndex;
    const figure = document.createElement("figure");
    figure.className = "masonry-item";
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.alt;
    if (item.width) img.width = item.width;
    if (item.height) img.height = item.height;
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    if (eager) img.fetchPriority = "high";
    figure.append(img);
    figure.addEventListener("click", () => lightbox.show(index));
    fragment.append(figure);
  });
  grid.append(fragment);
}

loadMoreButton?.addEventListener("click", () => renderNextPage(false));

const embeddedStaticPhotos = photosFromEmbeddedManifest();
if (embeddedStaticPhotos.length) render(embeddedStaticPhotos);

const staticPhotos = embeddedStaticPhotos.length ? embeddedStaticPhotos : await loadStaticPhotos();
if (!embeddedStaticPhotos.length) render(staticPhotos);

const firebasePhotos = await loadFirebasePhotos();
if (firebasePhotos.length) render([...firebasePhotos, ...staticPhotos]);
