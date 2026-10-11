/* MN visual effects and navigation. No libraries or external requests. */
(function () {
  "use strict";
  const N = window.NOVA;

  // Use section positions and the real document end, including short final sections.
  N.mountSectionNavigation = function (root) {
    const links = Array.from(
      root.querySelectorAll('#primary-navigation a[href^="#"]'),
    );
    const entries = links
      .map((link) => ({
        id: link.getAttribute("href").slice(1),
        element: root.querySelector(link.getAttribute("href")),
      }))
      .filter((entry) => entry.element);
    if (!entries.length) return () => {};
    const header = root.querySelector(".site-header");
    let frame = 0,
      timer = 0,
      pending = "",
      disposed = false;

    function highlight(id) {
      links.forEach((link) => {
        if (link.getAttribute("href") === "#" + id)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    function currentSection() {
      const end = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      if (end > 0 && window.scrollY >= end - 3)
        return entries[entries.length - 1].id;
      const marker =
        (header?.getBoundingClientRect().bottom || 80) +
        Math.min(130, window.innerHeight * 0.16);
      let selected = entries[0].id;
      for (const entry of entries) {
        if (entry.element.getBoundingClientRect().top <= marker)
          selected = entry.id;
      }
      return selected;
    }

    function sync() {
      frame = 0;
      if (!disposed) highlight(pending || currentSection());
    }
    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(sync);
    }
    function release() {
      pending = "";
      clearTimeout(timer);
      schedule();
    }
    function clicked(event) {
      const anchor = event.target.closest('a[href^="#"]');
      const id = anchor?.getAttribute("href").slice(1);
      if (!entries.some((entry) => entry.id === id)) return;
      pending = id;
      highlight(id);
      clearTimeout(timer);
      // Keep the selected destination stable during native smooth scrolling.
      timer = setTimeout(release, 1300);
    }
    function keyInterrupted(event) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        release();
    }
    const passive = { passive: true };
    root.addEventListener("click", clicked);
    window.addEventListener("scroll", schedule, passive);
    window.addEventListener("scrollend", release, passive);
    window.addEventListener("resize", schedule, passive);
    window.addEventListener("hashchange", release);
    window.addEventListener("pageshow", schedule);
    window.addEventListener("wheel", release, passive);
    window.addEventListener("touchstart", release, passive);
    document.addEventListener("keydown", keyInterrupted);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    resizeObserver?.observe(root);
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      resizeObserver?.disconnect();
      root.removeEventListener("click", clicked);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", release);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", release);
      window.removeEventListener("pageshow", schedule);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      document.removeEventListener("keydown", keyInterrupted);
    };
  };

  // One viewport-sized canvas, capped at 30 fps, with a lower particle count on phones.
  N.mountParticles = function (canvas, root, animate = true) {
    let ctx;
    try {
      ctx = canvas?.getContext("2d", { alpha: true });
    } catch {}
    if (!ctx) return () => {};
    let width = 0,
      height = 0,
      points = [],
      frame = 0,
      last = 0,
      elapsed = 0;
    let resizeTimer = 0,
      disposed = false,
      suspended = false;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(
        18,
        Math.min(74, Math.floor((width * height) / 21000)),
      );
      points = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2,
          speed = 5 + Math.random() * 9;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0.6 + Math.random() * 1.15,
          phase: Math.random() * Math.PI * 2,
        };
      });
      draw(0);
    }

    function draw(delta) {
      elapsed += delta;
      ctx.clearRect(0, 0, width, height);
      const rgb =
        document.documentElement.dataset.theme === "light"
          ? "36,98,185"
          : "113,171,255";
      for (const point of points) {
        point.x += point.vx * delta;
        point.y += point.vy * delta;
        if (point.x < -15) point.x = width + 15;
        if (point.x > width + 15) point.x = -15;
        if (point.y < -15) point.y = height + 15;
        if (point.y > height + 15) point.y = -15;
      }
      const reach = width < 640 ? 100 : 140;
      let connectionCount = 0;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        let neighbors = 0;
        for (
          let j = i + 1;
          j < points.length && neighbors < 2 && connectionCount < 65;
          j++
        ) {
          const b = points[j],
            distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance >= reach) continue;
          ctx.strokeStyle = `rgba(${rgb},${(1 - distance / reach) * 0.2})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          neighbors++;
          connectionCount++;
        }
        const edge = a.x < width * 0.13 || a.x > width * 0.87 ? 1 : 0.65;
        const alpha = (0.48 + Math.sin(elapsed * 0.4 + a.phase) * 0.12) * edge;
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick(time) {
      frame = 0;
      if (disposed || suspended || document.hidden || !animate) return;
      if (!last || time - last >= 1000 / 30) {
        draw(last ? Math.min((time - last) / 1000, 0.08) : 0);
        last = time;
      }
      frame = requestAnimationFrame(tick);
    }
    function visibility() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      root.dataset.visibility =
        document.hidden || suspended ? "hidden" : "visible";
      if (!disposed && !suspended && !document.hidden && animate)
        frame = requestAnimationFrame(tick);
    }
    function pageHide() {
      suspended = true;
      visibility();
    }
    function pageShow() {
      suspended = false;
      visibility();
    }
    function resized() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!disposed) resize();
      }, 120);
    }
    // A theme change needs a repaint even when system settings disable animation.
    const themeObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => draw(0))
        : null;
    themeObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("pageshow", pageShow);
    window.addEventListener("resize", resized, { passive: true });
    resize();
    visibility();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      themeObserver?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pageHide);
      window.removeEventListener("pageshow", pageShow);
      window.removeEventListener("resize", resized);
    };
  };
})();
