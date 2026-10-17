const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

async function init() {
  if (reduceMotion.matches) return;

  try {
    const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/gsap@3.14.2/+esm"),
      import("https://cdn.jsdelivr.net/npm/gsap@3.14.2/ScrollTrigger/+esm"),
      import("https://cdn.jsdelivr.net/npm/lenis@1.3.17/+esm")
    ]);
    if (reduceMotion.matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const hero = document.querySelector(".compact-hero");
    const heroLogo = hero?.querySelector(".hero-logo");
    const heroActions = hero?.querySelectorAll(".hero-actions .button");
    if (heroLogo) gsap.fromTo(heroLogo, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out", delay: 0.08 });
    if (heroActions?.length) gsap.fromTo(heroActions, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out", delay: 0.3 });

    const title = document.querySelector(".portfolio-title");
    if (title) gsap.fromTo(title, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: title, start: "top 88%", once: true } });

    const grid = document.querySelector("#portfolioGrid");
    if (grid) {
      const observer = new MutationObserver((records) => {
        const added = records.flatMap((record) => [...record.addedNodes]).filter((node) => node.nodeType === Node.ELEMENT_NODE && node.matches(".masonry-item"));
        if (!added.length) return;
        gsap.fromTo(added, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.045, ease: "power2.out", onComplete: ScrollTrigger.refresh });
      });
      observer.observe(grid, { childList: true });
      window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
    }

    const stop = () => {
      if (!reduceMotion.matches) return;
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.globalTimeline.clear();
    };
    reduceMotion.addEventListener("change", stop);
    window.addEventListener("pagehide", () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    }, { once: true });
  } catch (error) {
    // Optional motion libraries must never prevent the gallery from working offline.
    console.info("Optional motion effects are unavailable.", error);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
