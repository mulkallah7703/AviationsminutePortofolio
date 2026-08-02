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

  // Count-up stats when the numbers section enters the viewport
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatStat(el, value) {
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    el.textContent = prefix + Math.round(value) + suffix;
  }

  function animateCount(el) {
    const target = Number(el.getAttribute("data-count")) || 0;
    if (prefersReduced) {
      formatStat(el, target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      formatStat(el, target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else formatStat(el, target);
    }
    requestAnimationFrame(frame);
  }

  function initStatCounters() {
    const values = document.querySelectorAll(".stat-value[data-count]");
    if (!values.length) return false;

    const run = () => values.forEach(animateCount);

    if (!("IntersectionObserver" in window)) {
      run();
      return true;
    }

    const band = document.querySelector(".stats-band") || values[0].closest(".stats-grid") || values[0];
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (started) return;
        if (entries.some((e) => e.isIntersecting)) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(band);
    return true;
  }

  function bootStatCounters() {
    if (initStatCounters()) return;
    const mo = new MutationObserver(() => {
      if (initStatCounters()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 12000);
  }

  function initTeamCardTilt() {
    if (prefersReduced) return true;
    if (!window.matchMedia("(pointer: fine)").matches) return true;

    const cards = document.querySelectorAll(".team-grid .card");
    if (!cards.length) return false;
    if (document.documentElement.dataset.teamTiltReady === "1") return true;
    document.documentElement.dataset.teamTiltReady = "1";

    const maxTilt = 7.5;
    const maxShift = 7;
    const lift = 6;
    const ease = 0.14;

    cards.forEach((card) => {
      const avatar = card.querySelector("image-slot");
      const title = card.querySelector(".card-title");
      const meta = card.querySelector(".card-meta");

      if (!card.querySelector(".team-card-shine")) {
        const shine = document.createElement("span");
        shine.className = "team-card-shine";
        shine.setAttribute("aria-hidden", "true");
        card.insertBefore(shine, card.firstChild);
      }

      let shineTimer = 0;

      function playShine() {
        card.classList.remove("team-shine-active");
        // Force reflow so the sweep restarts on every hover
        void card.offsetWidth;
        card.classList.add("team-shine-active");
        window.clearTimeout(shineTimer);
        shineTimer = window.setTimeout(() => {
          card.classList.remove("team-shine-active");
        }, 1500);
      }

      function stopShine() {
        window.clearTimeout(shineTimer);
        card.classList.remove("team-shine-active");
      }

      let target = { rx: 0, ry: 0, px: 0, py: 0, lift: 0 };
      let current = { rx: 0, ry: 0, px: 0, py: 0, lift: 0 };
      let hovering = false;
      let raf = 0;

      function near(a, b) {
        return Math.abs(a - b) < 0.02;
      }

      function settled() {
        return (
          near(current.rx, target.rx) &&
          near(current.ry, target.ry) &&
          near(current.px, target.px) &&
          near(current.py, target.py) &&
          near(current.lift, target.lift)
        );
      }

      function render() {
        current.rx += (target.rx - current.rx) * ease;
        current.ry += (target.ry - current.ry) * ease;
        current.px += (target.px - current.px) * ease;
        current.py += (target.py - current.py) * ease;
        current.lift += (target.lift - current.lift) * ease;

        card.style.transform =
          "perspective(960px) rotateX(" +
          current.rx.toFixed(3) +
          "deg) rotateY(" +
          current.ry.toFixed(3) +
          "deg) translate3d(0," +
          (-current.lift).toFixed(3) +
          "px,0)";

        const shadowX = ((-current.ry / maxTilt) * 16).toFixed(2);
        const shadowY = ((current.rx / maxTilt) * 12 + 12 + current.lift * 0.7).toFixed(2);
        const glowBoost = hovering ? 0.38 : 0.22;
        card.style.boxShadow =
          "inset 0 1px 0 rgba(255,255,255,0.12)," +
          "inset 0 -1px 0 rgba(255,255,255,0.03)," +
          "0 0 18px rgba(241,108,48," +
          glowBoost +
          ")," +
          "0 0 40px rgba(232,184,74,0.14)," +
          shadowX +
          "px " +
          shadowY +
          "px 40px rgba(0,0,0,0.38)," +
          "0 4px 12px rgba(0,0,0,0.2)";

        if (avatar) {
          avatar.style.transform =
            "translate3d(" +
            (current.px * 1.2).toFixed(3) +
            "px," +
            (current.py * 1.2).toFixed(3) +
            "px,34px)";
        }
        if (title) {
          title.style.transform =
            "translate3d(" +
            (current.px * 0.48).toFixed(3) +
            "px," +
            (current.py * 0.48).toFixed(3) +
            "px,16px)";
        }
        if (meta) {
          meta.style.transform =
            "translate3d(" +
            (current.px * 0.28).toFixed(3) +
            "px," +
            (current.py * 0.28).toFixed(3) +
            "px,8px)";
        }

        if (!hovering && settled()) {
          card.style.transform = "";
          card.style.boxShadow = "";
          if (avatar) avatar.style.transform = "";
          if (title) title.style.transform = "";
          if (meta) meta.style.transform = "";
          raf = 0;
          return;
        }

        raf = requestAnimationFrame(render);
      }

      function kick() {
        if (!raf) raf = requestAnimationFrame(render);
      }

      card.addEventListener("pointerenter", () => {
        hovering = true;
        target.lift = lift;
        card.classList.add("team-tilting");
        playShine();
        kick();
      });

      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        target.ry = Math.max(-1, Math.min(1, nx)) * maxTilt;
        target.rx = Math.max(-1, Math.min(1, -ny)) * maxTilt;
        target.px = Math.max(-1, Math.min(1, nx)) * maxShift;
        target.py = Math.max(-1, Math.min(1, ny)) * maxShift;
        kick();
      });

      card.addEventListener("pointerleave", () => {
        hovering = false;
        target.rx = 0;
        target.ry = 0;
        target.px = 0;
        target.py = 0;
        target.lift = 0;
        card.classList.remove("team-tilting");
        stopShine();
        kick();
      });
    });

    return true;
  }

  function bootTeamCardTilt() {
    if (initTeamCardTilt()) return;
    const mo = new MutationObserver(() => {
      if (initTeamCardTilt()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 12000);
  }

  function initMagneticCta() {
    if (prefersReduced) return true;
    if (!window.matchMedia("(pointer: fine)").matches) return true;

    const buttons = document.querySelectorAll(".contact-panel .btn.btn-primary");
    if (!buttons.length) return false;
    if (document.documentElement.dataset.magneticCtaReady === "1") return true;
    document.documentElement.dataset.magneticCtaReady = "1";

    const strength = 0.32;
    const maxPull = 14;
    const ease = 0.18;
    const radius = 110;

    buttons.forEach((btn) => {
      btn.classList.add("magnetic-cta");

      let targetX = 0;
      let targetY = 0;
      let curX = 0;
      let curY = 0;
      let active = false;
      let raf = 0;

      function render() {
        curX += (targetX - curX) * ease;
        curY += (targetY - curY) * ease;

        if (Math.abs(curX) < 0.05 && Math.abs(curY) < 0.05 && !active) {
          curX = 0;
          curY = 0;
          btn.style.transform = "";
          raf = 0;
          return;
        }

        btn.style.transform =
          "translate3d(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px,0)";
        raf = requestAnimationFrame(render);
      }

      function kick() {
        if (!raf) raf = requestAnimationFrame(render);
      }

      function onMove(e) {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist > radius) {
          if (!active) return;
          active = false;
          targetX = 0;
          targetY = 0;
          btn.classList.remove("is-magnetic");
          kick();
          return;
        }

        active = true;
        btn.classList.add("is-magnetic");
        const pull = (1 - dist / radius) * strength;
        targetX = Math.max(-maxPull, Math.min(maxPull, dx * pull));
        targetY = Math.max(-maxPull, Math.min(maxPull, dy * pull));
        kick();
      }

      function onLeave() {
        active = false;
        targetX = 0;
        targetY = 0;
        btn.classList.remove("is-magnetic");
        kick();
      }

      window.addEventListener("pointermove", onMove, { passive: true });
      btn.addEventListener("pointerleave", onLeave);
      btn.addEventListener("blur", onLeave);
    });

    return true;
  }

  function bootMagneticCta() {
    if (initMagneticCta()) return;
    const mo = new MutationObserver(() => {
      if (initMagneticCta()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 12000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bootStatCounters();
      bootTeamCardTilt();
      bootMagneticCta();
    });
  } else {
    bootStatCounters();
    bootTeamCardTilt();
    bootMagneticCta();
  }
})();
