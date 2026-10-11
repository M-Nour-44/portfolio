/* MN portfolio. Public content is filtered before any markup is created. */
(function () {
  "use strict";
  const N = window.NOVA,
    e = N.esc,
    h = N.h,
    icon = N.icon;
  let data = N.publicData(N.validate(window.NOVA_DATA));
  let shown = N.localized(data),
    category = "all",
    query = "",
    sort = "featured";
  let motion = true,
    preview = false,
    observers = [],
    cleanupEffects,
    cleanupNavigation;

  function sections() {
    const p = shown.profile;
    return [
      ["home", "الرئيسية", true],
      ["about", "عني", Boolean(p.about.trim() || p.skills.length)],
      ["projects", "المشاريع", shown.projects.length > 0],
      ["certificates", "الشهادات", shown.certificates.length > 0],
      ["contact", "تواصل معي", Boolean(p.email || p.github || p.linkedin)],
    ].filter(([, , visible]) => visible);
  }

  function portrait(p) {
    return `<div class="portrait-stage${p.avatarUrl ? "" : " no-photo"}">
      <div class="portrait-grid" aria-hidden="true"></div>
      <div class="portrait-orbit orbit-outer" aria-hidden="true"><i></i></div>
      <div class="portrait-orbit orbit-inner" aria-hidden="true"><i></i></div>
      <svg class="portrait-traces" viewBox="0 0 500 500" fill="none" aria-hidden="true">
        <path d="M0 150h55l45 45h26M0 355h62l32-32h26M500 120h-60l-47 47h-22M500 366h-72l-37-37h-27"/>
        <circle cx="55" cy="150" r="4"/><circle cx="440" cy="120" r="4"/><circle cx="62" cy="355" r="4"/><circle cx="428" cy="366" r="4"/>
        <path class="trace-ticks" d="M238 22h24M250 10v24M238 478h24M250 466v24"/>
      </svg>
      <div class="portrait-frame">
        ${p.avatarUrl ? `<img src="${e(N.url(p.avatarUrl))}" alt="${e(p.name)}" width="516" height="718" fetchpriority="high" decoding="async" style="object-position:50% ${p.avatarPosition}%">` : '<span class="portrait-monogram" aria-label="MN">MN</span>'}
      </div>
      <span class="portrait-mark" aria-hidden="true">${icon("Code2")}</span>
    </div>`;
  }

  function contactBackdrop() {
    const paths = [
      "M-40 365H120L185 300H385L455 230H705L765 290H1040",
      "M-40 400H165L240 325H430L500 255H665L735 325H1040",
      "M430 -20V80L500 150H735L805 220H1040",
      "M555 520V420L615 360H795L860 425H1040",
      "M820 -20V65L765 120H630L575 175H420",
    ];
    return `<div class="contact-visual" aria-hidden="true"><div class="contact-halo"></div><div class="contact-orbit"><i></i></div>
      <svg class="contact-circuits" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" fill="none">
        <g class="circuit-tracks">${paths.map((d) => `<path d="${d}"/>`).join("")}</g>
        <g class="circuit-signals">${paths.map((d, i) => `<path d="${d}" pathLength="100" style="animation-delay:-${i * 2.8}s"/>`).join("")}</g>
        <g class="circuit-nodes"><circle cx="185" cy="300" r="3"/><circle cx="455" cy="230" r="3"/><circle cx="735" cy="150" r="3"/><circle cx="615" cy="360" r="3"/><circle cx="765" cy="120" r="3"/></g>
      </svg></div>`;
  }

  function projectArt(p) {
    return p.imageUrl
      ? `<img class="project-image" src="${e(N.url(p.imageUrl))}" alt="${e(p.title)}" loading="lazy" width="640" height="400">`
      : `<div class="project-cover" aria-hidden="true">${icon("Code2")}<span>${e(p.title)}</span></div>`;
  }

  function projectsHTML() {
    return shown.projects
      .map(
        (p, index) => `<article class="project-card">
      <button class="project-art-button" data-project="${e(p.id)}" aria-label="${h("تفاصيل مشروع {0}", p.title)}">${projectArt(p)}<span class="project-open">${icon("ArrowUpRight")}</span></button>
      <div class="project-info"><span class="project-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <h3><button data-project="${e(p.id)}">${e(p.title)}</button></h3>
        ${p.subtitle ? `<p>${e(p.subtitle)}</p>` : ""}
        ${
          p.tags.length
            ? `<div class="project-tags" dir="ltr">${p.tags
                .slice(0, 5)
                .map((t) => `<span>${e(t)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div></article>`,
      )
      .join("");
  }

  function certificatesHTML() {
    const list = shown.certificates
      .filter(
        (c) =>
          (category === "all" || c.categoryId === category) &&
          `${c.title} ${c.issuer}`
            .toLocaleLowerCase(N.locale)
            .includes(query.toLocaleLowerCase(N.locale)),
      )
      .sort((a, b) =>
        sort === "newest"
          ? b.issuedAt.localeCompare(a.issuedAt)
          : sort === "title"
            ? a.title.localeCompare(b.title, N.locale)
            : Number(b.featured) - Number(a.featured),
      );
    return list.length
      ? list
          .map(
            (
              c,
            ) => `<button class="certificate-card" data-certificate="${e(c.id)}">
      <span class="certificate-icon">${icon("Award")}</span><span class="certificate-copy"><strong>${e(c.title)}</strong><span>${e(c.issuer)}${c.issuedAt ? ` · ${e(N.date(c.issuedAt))}` : ""}</span></span>${icon("ArrowUpRight")}
    </button>`,
          )
          .join("")
      : `<p class="empty-state" role="status">${h("لا توجد نتائج مطابقة")}</p>`;
  }

  function certificateControls() {
    const used = shown.categories.filter((c) =>
      shown.certificates.some((v) => v.categoryId === c.id),
    );
    if (shown.certificates.length < 6) return "";
    return `<div class="certificate-toolbar">
      ${used.length > 1 ? `<div class="category-tabs"><button data-category="all" aria-pressed="${category === "all"}">${h("الكل")}</button>${used.map((c) => `<button data-category="${e(c.id)}" aria-pressed="${category === c.id}">${e(c.name)}</button>`).join("")}</div>` : ""}
      <div class="certificate-tools"><label class="search-field">${icon("Search")}<input id="certificate-search" placeholder="${h("ابحث عن شهادة…")}" value="${e(query)}" aria-label="${h("ابحث عن شهادة")}"></label><select id="certificate-sort" aria-label="${h("ترتيب الشهادات")}">${[
        ["featured", "المميزة أولًا"],
        ["newest", "الأحدث أولًا"],
        ["title", "الاسم: أ — ي"],
      ]
        .map(
          ([value, label]) =>
            `<option value="${value}" ${sort === value ? "selected" : ""}>${h(label)}</option>`,
        )
        .join("")}</select></div>
    </div>`;
  }

  function page() {
    shown = N.localized(data);
    const p = shown.profile,
      nav = sections(),
      contact = nav.some(([id]) => id === "contact");
    const words = p.name.trim().split(/\s+/),
      last = words.length > 1 ? words.pop() : "";
    const skills = [...new Set(p.skills.map((s) => s.group))];
    return `<div class="language-root" data-locale="${N.locale}" dir="${N.locale === "ar" ? "rtl" : "ltr"}"><div class="portfolio" data-motion="${motion ? "on" : "off"}">
      <canvas class="site-particles" aria-hidden="true"></canvas>
      <a href="#main-content" class="skip-link">${h("انتقل إلى المحتوى")}</a>
      ${preview ? `<div class="preview-notice">${h("هذه معاينة لتعديلاتك المحلية وليست النسخة المنشورة.")} <a href="${N.base}index.html">${h("العودة للنسخة المنشورة")}</a></div>` : ""}
      <header class="site-header"><div class="nav-wrap section-shell">
        <a href="#home" class="logo-link" aria-label="MN — ${e(p.name)}">${N.brand()}</a>
        <nav id="primary-navigation" aria-label="${h("التنقل الرئيسي")}">${nav.map(([id, label]) => `<a href="#${id}" ${id === "home" ? 'aria-current="location"' : ""}>${h(label)}</a>`).join("")}</nav>
        <div class="nav-actions">${N.languageSwitch()}${N.themeControl()}<button class="icon-button mobile-toggle" data-action="menu" aria-expanded="false" aria-controls="primary-navigation" aria-label="${h("القائمة")}">${icon("Menu")}</button></div>
      </div></header>
      <main id="main-content">
        <section id="home" class="hero section-shell"><div class="hero-grid">
          <div class="hero-copy"><p class="hero-role">${icon("Terminal")}<span>${e(p.role)}</span></p>
            <h1 class="hero-name">${e(words.join(" "))}${last ? ` <span>${e(last)}</span>` : ""}</h1>
            ${p.intro ? `<p class="hero-description">${e(p.intro)}</p>` : ""}
            <div class="hero-buttons">${shown.projects.length ? `<a href="#projects" class="button primary">${h("اكتشف أعمالي")}${icon("ArrowUpRight")}</a>` : contact ? `<a href="#contact" class="button primary">${h("لنتحدث")}${icon("ArrowUpRight")}</a>` : ""}
              ${p.resumeUrl ? `<a class="button secondary" href="${e(N.url(p.resumeUrl))}" data-action="resume" target="_blank" rel="noopener noreferrer">${h("السيرة الذاتية")}${icon("Download")}</a>` : shown.projects.length && contact ? `<a class="button secondary" href="#contact">${h("لنتحدث")}${icon("Mail")}</a>` : ""}
            </div>
            <div class="hero-meta">${p.location ? `<span>${icon("MapPin")}${e(p.location)}</span>` : ""}${p.available && p.availabilityText ? `<span class="availability"><i></i>${e(p.availabilityText)}</span>` : ""}</div>
          </div>${portrait(p)}
        </div><div class="hero-baseline">${nav.some(([id]) => id === "about") ? `<a href="#about">${h("عني")}${icon("ArrowDown")}</a>` : ""}</div></section>
        ${
          nav.some(([id]) => id === "about")
            ? `<section id="about" class="about-section section-shell section-space" data-reveal>
          <div class="section-heading"><span class="section-kicker">${h("عني")}</span><h2>${e(p.headlineOne)} <span>${e(p.headlineTwo)}</span></h2></div>
          <div class="about-grid">${p.about ? `<p class="about-description preserve-lines">${e(p.about)}</p>` : ""}${
            p.skills.length
              ? `<div class="skills-list">${skills
                  .map(
                    (group) =>
                      `<div class="skill-group"><h3>${e(group)}</h3><div class="skill-pills">${p.skills
                        .filter((s) => s.group === group)
                        .map((s) => `<span dir="auto">${e(s.label)}</span>`)
                        .join("")}</div></div>`,
                  )
                  .join("")}</div>`
              : ""
          }</div>
        </section>`
            : ""
        }
        ${shown.projects.length ? `<section id="projects" class="projects-section section-shell section-space" data-reveal><div class="section-heading"><span class="section-kicker">${h("المشاريع")}</span><h2>${h("أعمال مختارة")}</h2></div><div class="projects-grid">${projectsHTML()}</div></section>` : ""}
        ${shown.certificates.length ? `<section id="certificates" class="certificates-section section-shell section-space" data-reveal><div class="section-heading"><span class="section-kicker">${h("الشهادات")}</span><h2>${h("التعلّم والتطوير")}</h2></div>${certificateControls()}<div id="certificates-grid" class="cert-grid">${certificatesHTML()}</div></section>` : ""}
        ${contact ? `<section id="contact" class="contact-section section-shell section-space" data-reveal><div class="contact-panel">${contactBackdrop()}<div class="contact-copy"><span class="section-kicker">${h("تواصل معي")}</span><h2>${e(p.contactTitle || N.t("لنتحدث"))}</h2>${p.contactText ? `<p>${e(p.contactText)}</p>` : ""}</div><div class="contact-links">${p.email ? `<a class="contact-email" href="mailto:${e(p.email)}"><span dir="ltr">${e(p.email)}</span>${icon("ArrowUpRight")}</a><button class="text-link email-copy" data-action="copy-email">${icon("Copy")}${h("نسخ البريد")}</button>` : ""}<div class="social-links">${N.link(p.github, "GitHub")}${N.link(p.linkedin, "LinkedIn")}</div></div></div></section>` : ""}
      </main>
      <footer class="site-footer section-shell"><div class="footer-identity"><a href="#home" aria-label="MN">${N.brand()}</a><small>© ${new Date().getFullYear()} ${e(p.name)}</small></div><div class="footer-actions"><a href="#home" class="icon-button back-top" aria-label="${h("إلى الأعلى")}">${icon("ArrowUp")}</a></div></footer>
    </div></div>`;
  }

  function enhance() {
    observers.forEach((observer) => observer.disconnect());
    observers = [];
    cleanupEffects?.();
    cleanupNavigation?.();
    const root = document.querySelector(".portfolio");
    cleanupEffects = N.mountParticles?.(
      root.querySelector(".site-particles"),
      root,
      motion,
    );
    cleanupNavigation = N.mountSectionNavigation?.(root);
    if (!("IntersectionObserver" in window)) return;
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            reveal.unobserve(entry.target);
          }
        }),
      { threshold: 0.06 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("will-reveal");
      reveal.observe(el);
    });
    observers.push(reveal);
  }

  function render() {
    document.getElementById("app").innerHTML = page();
    document.title = `${shown.profile.name} | ${shown.profile.role}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", shown.profile.intro);
    enhance();
  }

  function certificateDialog(id) {
    const c = shown.certificates.find((v) => v.id === id);
    if (!c) return;
    const isImage =
      /^data:image\//.test(c.fileUrl) ||
      /\.(png|jpe?g|webp)(\?|$)/i.test(c.fileUrl);
    N.modal(
      c.title,
      `<div class="certificate-detail">${isImage ? `<img class="certificate-preview" src="${e(N.url(c.fileUrl))}" alt="${e(c.title)}">` : ""}<p class="preserve-lines">${e(c.description)}</p><dl class="detail-grid"><div><dt>${h("الجهة المانحة")}</dt><dd>${e(c.issuer)}</dd></div>${c.issuedAt ? `<div><dt>${h("تاريخ الإصدار")}</dt><dd>${e(N.date(c.issuedAt))}</dd></div>` : ""}${c.credentialId ? `<div><dt>${h("رقم الاعتماد")}</dt><dd>${e(c.credentialId)}</dd></div>` : ""}</dl><div class="detail-actions">${c.fileUrl ? `<button class="button primary" data-open-certificate="${e(c.id)}">${h("فتح ملف الشهادة")}${icon("Download")}</button>` : ""}${N.link(c.credentialUrl, h("التحقق من الشهادة"), "button secondary")}</div></div>`,
      true,
    );
  }

  function projectDialog(id) {
    const p = shown.projects.find((v) => v.id === id);
    if (!p) return;
    N.modal(
      p.title,
      `<div class="project-detail">${p.imageUrl ? projectArt(p) : ""}${p.subtitle ? `<h3>${e(p.subtitle)}</h3>` : ""}<p class="preserve-lines">${e(p.description)}</p><div class="project-tags">${p.tags.map((t) => `<span>${e(t)}</span>`).join("")}</div><div class="detail-actions">${N.link(p.liveUrl, h("زيارة المشروع"), "button primary")}${N.link(p.githubUrl, h("الكود المصدري"), "button secondary")}</div></div>`,
      true,
    );
  }

  function closeMenu() {
    document.querySelector("#primary-navigation")?.classList.remove("open");
    document
      .querySelector('[data-action="menu"]')
      ?.setAttribute("aria-expanded", "false");
  }

  async function init() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    motion = !reduced.matches;
    if (
      new URLSearchParams(location.search).get("preview") === "1" &&
      N.isLoggedIn()
    ) {
      try {
        const draft = await N.readLocal("portfolio");
        if (draft) {
          data = N.publicData(N.validate(draft));
          preview = true;
        }
      } catch {
        N.toast(N.t("تعذّر تحميل المعاينة المحلية."), true);
      }
    }
    render();
    reduced.addEventListener?.("change", (event) => {
      motion = !event.matches;
      const root = document.querySelector(".portfolio");
      root.dataset.motion = motion ? "on" : "off";
      cleanupEffects?.();
      cleanupEffects = N.mountParticles?.(
        root.querySelector(".site-particles"),
        root,
        motion,
      );
    });
    document.addEventListener("click", async (event) => {
      const btn = event.target.closest("button,a");
      if (!btn) {
        if (!event.target.closest(".site-header")) closeMenu();
        return;
      }
      const d = btn.dataset;
      if (d.lang) {
        N.closeModal();
        N.setLanguage(d.lang);
        render();
      } else if (d.project) projectDialog(d.project);
      else if (d.certificate) certificateDialog(d.certificate);
      else if (d.openCertificate)
        N.openAsset(
          shown.certificates.find((c) => c.id === d.openCertificate)?.fileUrl,
        );
      else if (d.category) {
        category = d.category;
        document
          .querySelectorAll("[data-category]")
          .forEach((b) =>
            b.setAttribute(
              "aria-pressed",
              String(b.dataset.category === category),
            ),
          );
        document.getElementById("certificates-grid").innerHTML =
          certificatesHTML();
      } else if (d.action === "menu") {
        const nav = document.getElementById("primary-navigation");
        btn.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
      } else if (d.action === "resume") {
        event.preventDefault();
        N.openAsset(shown.profile.resumeUrl);
      } else if (d.action === "copy-email") {
        try {
          await navigator.clipboard.writeText(shown.profile.email);
          N.toast(N.t("تم نسخ البريد الإلكتروني"));
        } catch {
          N.toast(N.t("تعذّر النسخ. يمكنك تحديد البريد ونسخه."), true);
        }
      }
      if (btn.closest("#primary-navigation")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    document.addEventListener("input", (event) => {
      if (event.target.id === "certificate-search") {
        query = event.target.value;
        document.getElementById("certificates-grid").innerHTML =
          certificatesHTML();
      }
    });
    document.addEventListener("change", (event) => {
      if (event.target.id === "certificate-sort") {
        sort = event.target.value;
        document.getElementById("certificates-grid").innerHTML =
          certificatesHTML();
      }
    });
  }
  N.renderPortfolio = function (input) {
    if (!input) return page();
    const previousData = data,
      previousShown = shown;
    data = N.publicData(N.validate(input));
    try {
      return page();
    } finally {
      data = previousData;
      shown = previousShown;
    }
  };
  N.renderCertificates = certificatesHTML;
  if (document.documentElement.dataset.page !== "admin")
    window.addEventListener("DOMContentLoaded", init);
})();
