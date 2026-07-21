(() => {
  function isDesktop() {
    return window.matchMedia("(min-width: 1024px)").matches;
  }

  function panel() {
    return document.querySelector(".nav-panel");
  }

  function toggleBtn() {
    return document.querySelector(".nav-toggle");
  }

  function backdrop() {
    return document.querySelector(".nav-backdrop");
  }

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    const btn = toggleBtn();
    const bd = backdrop();
    if (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    }
    if (bd) bd.hidden = !open;
  }

  function close() {
    setOpen(false);
  }

  function open() {
    if (isDesktop()) return;
    setOpen(true);
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
    if (isDesktop()) close();
  });

  // Ensure backdrop starts hidden if present after canvas boot
  const boot = () => {
    const bd = backdrop();
    if (bd && !document.body.classList.contains("nav-open")) bd.hidden = true;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Re-sync shortly after design-canvas hydration
  setTimeout(boot, 300);
  setTimeout(boot, 1200);
})();
