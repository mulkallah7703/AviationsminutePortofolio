(() => {
  function isDesktop() {
    return window.matchMedia("(min-width: 1024px)").matches;
  }

  function nav() {
    return document.querySelector(".site-nav");
  }

  function panel() {
    return document.querySelector(".nav-panel");
  }

  function backdrop() {
    return document.querySelector(".nav-backdrop");
  }

  function placeDrawer() {
    const p = panel();
    const b = backdrop();
    const n = nav();
    if (!p || !n) return;

    if (isDesktop()) {
      // Keep drawer nodes inside the nav so desktop display:contents works
      if (b && b.parentElement !== n) n.insertBefore(b, p.parentElement === n ? p : null);
      if (p.parentElement !== n) n.appendChild(p);
      return;
    }

    // On mobile, mount to body so overflow/transform ancestors can't trap it
    if (b && b.parentElement !== document.body) document.body.appendChild(b);
    if (p.parentElement !== document.body) document.body.appendChild(p);
  }

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    document.documentElement.classList.toggle("nav-open", open);

    const btn = document.querySelector(".nav-toggle");
    const p = panel();
    const b = backdrop();

    if (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    }
    if (p) p.setAttribute("aria-hidden", open ? "false" : "true");
    if (b) {
      b.hidden = !open;
      b.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function close() {
    setOpen(false);
  }

  function open() {
    if (isDesktop()) return;
    placeDrawer();
    setOpen(true);
  }

  function boot() {
    placeDrawer();
    setOpen(false);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-toggle");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      if (document.body.classList.contains("nav-open")) close();
      else open();
      return;
    }

    if (e.target.closest(".nav-backdrop")) {
      close();
      return;
    }

    if (e.target.closest(".nav-panel a")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    placeDrawer();
    if (isDesktop()) close();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  setTimeout(boot, 300);
  setTimeout(boot, 1200);
})();
