import { createLightbox } from "./lightbox.js";

const teamMembers = [
  {
    id: "ahmed",
    name: "Ahmed Saad",
    role: "Lead Photographer",
    bio: "يركز على اللحظات الطبيعية، مع عين هادئة في التكوين والإضاءة.",
    folder: "assets/photos/Team/Ahmed",
    cover: "assets/photos/Team/Ahmed/1.jpg",
    gallery: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
  },
  {
    id: "salma",
    name: "Salma Nabil",
    role: "Creative Director",
    bio: "تضبط المشهد العام وتتابع التفاصيل البصرية حتى آخر لقطة.",
    folder: "assets/photos/Team/Salma",
    cover: "assets/photos/Team/Salma/1.jpg",
    gallery: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
  },
  {
    id: "kareem",
    name: "Kareem Adel",
    role: "Wedding Storyteller",
    bio: "يلاحق الإيقاع السريع لليوم ويحوّله لسرد متوازن وواضح.",
    folder: "assets/photos/Team/Kareem",
    cover: "assets/photos/Team/Kareem/1.jpg",
    gallery: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
  },
  {
    id: "laila",
    name: "Laila Fathy",
    role: "Styling & Detail",
    bio: "تهتم بالتفاصيل الصغيرة، من اللمسة البصرية إلى التنسيق النهائي.",
    folder: "assets/photos/Team/Laila",
    cover: "assets/photos/Team/Laila/1.jpg",
    gallery: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
  },
  {
    id: "youssef",
    name: "Youssef Samir",
    role: "Gallery Editor",
    bio: "يختار الإطارات الأقوى ويوازن بين اللقطات الحية والهادئة.",
    folder: "assets/photos/Team/Youssef",
    cover: "assets/photos/Team/Youssef/1.jpg",
    gallery: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
  }
];

const grid = document.getElementById("teamGrid");
const overview = document.getElementById("teamOverview");
const galleryView = document.getElementById("teamGalleryView");
const galleryTitle = document.getElementById("teamGalleryTitle");
const galleryBio = document.getElementById("teamGalleryBio");
const galleryBack = document.getElementById("teamBack");
const galleryGrid = document.getElementById("teamGalleryGrid");
const memberTitle = document.getElementById("teamMemberTitle");
const memberBio = document.getElementById("teamMemberBio");
const teamIntro = document.getElementById("teamIntro");
const lightboxItems = [];
const lightbox = createLightbox(lightboxItems);

function imagePath(member, file) {
  return `${member.folder}/${file}`;
}

function renderOverview() {
  if (!grid) return;
  grid.innerHTML = teamMembers.map((member) => `
    <article class="team-card">
      <img src="${member.cover}" alt="${member.name}">
      <div class="team-card-body">
        <p class="team-role">${member.role}</p>
        <h2>${member.name}</h2>
        <p>${member.bio}</p>
        <a class="button ghost team-work-btn" href="team-member.html?member=${member.id}">عرض الأعمال</a>
      </div>
    </article>
  `).join("");
}

function renderGallery(member) {
  if (!galleryView || !galleryGrid || !galleryTitle || !galleryBio) return;
  if (memberTitle) memberTitle.textContent = member.name;
  if (memberBio) memberBio.textContent = member.bio;
  if (teamIntro) teamIntro.hidden = true;
  overview && (overview.hidden = true);
  galleryView.hidden = false;
  galleryTitle.textContent = member.name;
  galleryBio.textContent = member.bio;
  const images = member.gallery.map((file) => imagePath(member, file));
  lightboxItems.splice(0, lightboxItems.length, ...images.map((url) => ({ url, alt: member.name })));
  galleryGrid.innerHTML = images.map((url, index) => `
    <figure class="team-shot" data-index="${index}">
      <img src="${url}" alt="${member.name}">
    </figure>
  `).join("");
  galleryGrid.querySelectorAll(".team-shot").forEach((node) => {
    node.addEventListener("click", () => lightbox.show(Number(node.dataset.index)));
  });
}

const params = new URLSearchParams(window.location.search);
const memberId = params.get("member");

const selectedMember = teamMembers.find((item) => item.id === memberId);

function updateMemberSeo(member) {
  if (!member) return;
  const englishTitle = `${member.name} | Wedding Photography Portfolio | Mina Onsy Studio`;
  const arabicTitle = `أعمال ${member.name} | تصوير أفراح | استوديو مينا أنسي`;
  const englishDescription = `Explore wedding photography by ${member.name}, part of the Mina Onsy Studio team in Alexandria, Egypt.`;
  const arabicDescription = `شاهد أعمال تصوير الأفراح لـ${member.name}، أحد أعضاء فريق استوديو مينا أنسي في الإسكندرية، مصر.`;
  const lang = window.SITE_LANGUAGE === "ar" ? "ar" : "en";
  const title = document.head.querySelector("title");
  if (title) {
    title.dataset.seoEn = englishTitle;
    title.dataset.seoAr = arabicTitle;
    document.title = lang === "ar" ? arabicTitle : englishTitle;
  }
  document.head.querySelectorAll("meta[name='description'],meta[property='og:title'],meta[property='og:description'],meta[name='twitter:title'],meta[name='twitter:description']").forEach((meta) => {
    const isTitle = meta.name === "twitter:title" || meta.getAttribute("property") === "og:title";
    meta.dataset.seoEn = isTitle ? englishTitle : englishDescription;
    meta.dataset.seoAr = isTitle ? arabicTitle : arabicDescription;
    meta.content = lang === "ar" ? meta.dataset.seoAr : meta.dataset.seoEn;
  });
  const canonical = document.head.querySelector("link[rel='canonical']");
  const memberUrl = `${location.origin}/team-member.html?member=${encodeURIComponent(member.id)}`;
  if (canonical) canonical.href = memberUrl;
  const ogUrl = document.head.querySelector("meta[property='og:url']");
  if (ogUrl) ogUrl.content = memberUrl;
  const imageUrl = new URL(member.cover, location.href).href;
  ["meta[property='og:image']", "meta[name='twitter:image']"].forEach((selector) => {
    const image = document.head.querySelector(selector);
    if (image) image.content = imageUrl;
  });
}

if (selectedMember) {
  updateMemberSeo(selectedMember);
  window.addEventListener("site-language-change", () => updateMemberSeo(selectedMember));
  renderGallery(selectedMember);
  galleryBack?.addEventListener("click", () => {
    window.location.href = "team.html";
  });
} else {
  if (window.location.pathname.toLowerCase().endsWith("team-member.html")) {
    window.location.replace("team.html");
  }
  renderOverview();
  galleryView && (galleryView.hidden = true);
  overview && (overview.hidden = false);
}
