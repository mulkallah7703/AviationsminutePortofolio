(() => {
  function cb() {
    return document.querySelector(".nav-open-cb");
  }

  function setOpen(open) {
    const el = cb();
    if (el) el.checked = !!open;
    document.documentElement.classList.toggle("nav-open", !!open);
  }

  function close() {
    setOpen(false);
  }

  // Capture-phase so React / canvas handlers can't swallow the click
  document.addEventListener(
    "click",
    (e) => {
      const toggle = e.target.closest(".nav-toggle");
      if (toggle) {
        // Native <label for> already toggles the checkbox; sync html class
        requestAnimationFrame(() => {
          const el = cb();
          document.documentElement.classList.toggle("nav-open", !!(el && el.checked));
        });
        return;
      }

      if (e.target.closest(".nav-backdrop")) {
        close();
        return;
      }

      if (e.target.closest(".nav-panel a")) {
        close();
      }
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 1024px)").matches) close();
  });

  const el = cb();
  if (el) {
    el.addEventListener("change", () => {
      document.documentElement.classList.toggle("nav-open", el.checked);
    });
  }
})();
