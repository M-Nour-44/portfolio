/* MN shared utilities. Existing NOVA storage keys preserve older local workspaces. */
(function () {
  "use strict";
  const N = (window.NOVA = {});
  const clone = (value) => structuredClone(value);
  const locales = ["en", "tr", "ar"];
  N.clone = clone;
  N.locale = locales.includes(new URLSearchParams(location.search).get("lang"))
    ? new URLSearchParams(location.search).get("lang")
    : "en";
  try {
    if (!new URLSearchParams(location.search).has("lang"))
      N.locale = locales.includes(localStorage.getItem("nova-static-language"))
        ? localStorage.getItem("nova-static-language")
        : "en";
  } catch {}
  N.base = new URL(document.currentScript.src).pathname.replace(
    /assets\/js\/common\.js$/,
    "",
  );
  N.esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  N.icon = (name) => window.NOVA_ICONS[name] || window.NOVA_ICONS.Code2;
  N.t = (key, ...args) => {
    const text =
      N.locale === "ar" ? key : window.NOVA_MESSAGES[key]?.[N.locale] || key;
    return text.replace(/\{(\d+)\}/g, (_, i) => String(args[+i] ?? ""));
  };
  N.h = (key, ...args) => N.esc(N.t(key, ...args));
  N.id = () =>
    crypto.randomUUID?.() ||
    "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  N.setLanguage = (locale) => {
    if (!locales.includes(locale)) return;
    N.locale = locale;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("nova-static-language", locale);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    try {
      history.replaceState(null, "", url);
    } catch {}
    window.NOVA_THEME.sync();
  };
  N.themeControl = () => window.NOVA_THEME.button(N.locale);
  N.languageSwitch = () =>
    `<div class="language-switch" role="group" aria-label="${N.h("اختر اللغة")}" dir="ltr">${N.icon("Globe")}${locales.map((l) => `<button type="button" data-lang="${l}" lang="${l}" aria-label="${{ en: "English", ar: "العربية", tr: "Türkçe" }[l]}" aria-pressed="${N.locale === l}">${l === "ar" ? "عربي" : l.toUpperCase()}</button>`).join("")}</div>`;
  N.brand = () =>
    '<span class="brand brand-personal" dir="ltr"><svg class="brand-symbol" viewBox="0 0 70 44" aria-label="MN" role="img"><path d="M5 36V8l14 19L33 8v28"/><path d="M43 36V8l22 28V8"/></svg></span>';
  const textFields = {
    profile: [
      "name",
      "role",
      "headlineOne",
      "headlineTwo",
      "intro",
      "about",
      "location",
      "availabilityText",
      "contactTitle",
      "contactText",
    ],
    projects: ["title", "subtitle", "description"],
    certificates: ["title", "issuer", "description"],
    categories: ["name", "description"],
    skills: ["label", "group"],
  };
  N.textFields = textFields;
  N.localized = (input, locale = N.locale) => {
    const data = clone(input);
    if (locale === "en") return data;
    const tr = data.translations?.[locale] || {};
    const merge = (obj, fields) => {
      for (const [k, v] of Object.entries(fields || {}))
        if (typeof v === "string" && v.trim() && Object.hasOwn(obj, k))
          obj[k] = v;
      return obj;
    };
    merge(data.profile, tr.profile);
    for (const section of ["projects", "certificates", "categories"])
      data[section].forEach((item) => merge(item, tr[section]?.[item.id]));
    data.profile.skills.forEach((item) => merge(item, tr.skills?.[item.id]));
    return data;
  };
  N.publicData = (input) => {
    const data = clone(input);
    data.projects = data.projects.filter((v) => v.published && !v.demo);
    data.certificates = data.certificates.filter((v) => v.published && !v.demo);
    for (const locale of ["ar", "tr"])
      for (const section of ["projects", "certificates"]) {
        const ids = new Set(data[section].map((v) => v.id));
        data.translations[locale][section] = Object.fromEntries(
          Object.entries(data.translations[locale][section] || {}).filter(
            ([id]) => ids.has(id),
          ),
        );
      }
    return data;
  };
  N.safeUrl = (value, kind = "link") => {
    if (!value) return true;
    if (typeof value !== "string") return false;
    if (
      /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(
        value,
      )
    )
      return kind === "asset" && value.length <= 12 * 1024 * 1024;
    if (/^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes(".."))
      return true;
    try {
      const u = new URL(value);
      return (
        ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  };
  N.url = (value) => {
    if (!N.safeUrl(value, "asset")) return "";
    return value?.startsWith("assets/") ? N.base + value : value || "";
  };
  N.link = (value, label, className = "text-link") =>
    value && N.safeUrl(value)
      ? `<a class="${className}" href="${N.esc(N.url(value))}" target="_blank" rel="noopener noreferrer">${label}${N.icon("ArrowUpRight")}</a>`
      : "";
  N.validate = (input) => {
    if (
      !input ||
      input.schemaVersion !== 1 ||
      input.sourceLanguage !== "en" ||
      !input.profile
    )
      throw new Error(N.t("ملف بيانات غير متوافق."));
    const data = clone(input);
    data.profile.avatarPosition ??= 35;
    const bad = () => {
      throw new Error(N.t("تحقق من البيانات."));
    };
    const str = (v, max = 300, required = false) => {
      if (typeof v !== "string" || v.length > max || (required && !v.trim()))
        bad();
      return v;
    };
    for (const key of textFields.profile)
      str(
        data.profile[key],
        key === "about" ? 2200 : key === "intro" ? 700 : 500,
        ["name", "role", "headlineOne", "headlineTwo"].includes(key),
      );
    for (const key of ["email", "github", "linkedin", "resumeUrl", "avatarUrl"])
      str(data.profile[key], key.endsWith("Url") ? 12 * 1024 * 1024 : 2000);
    if (
      data.profile.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)
    )
      bad();
    for (const key of ["github", "linkedin"])
      if (!N.safeUrl(data.profile[key])) bad();
    for (const key of ["resumeUrl", "avatarUrl"])
      if (!N.safeUrl(data.profile[key], "asset")) bad();
    if (
      !Number.isFinite(data.profile.avatarPosition) ||
      data.profile.avatarPosition < 0 ||
      data.profile.avatarPosition > 100
    )
      bad();
    if (
      typeof data.profile.available !== "boolean" ||
      typeof data.profile.demoMode !== "boolean"
    )
      bad();
    const limits = {
      categories: 50,
      certificates: 300,
      projects: 100,
      skills: 60,
    };
    for (const section of Object.keys(limits)) {
      const arr = section === "skills" ? data.profile.skills : data[section];
      if (
        !Array.isArray(arr) ||
        arr.length > limits[section] ||
        (section === "categories" && !arr.length)
      )
        bad();
      const ids = new Set();
      for (const item of arr) {
        if (
          !item ||
          typeof item.id !== "string" ||
          !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ||
          ["__proto__", "constructor", "prototype"].includes(item.id) ||
          ids.has(item.id)
        )
          bad();
        ids.add(item.id);
        for (const k of textFields[section])
          str(
            item[k],
            k === "description" ? 3000 : 160,
            ["name", "label", "title", "issuer", "group"].includes(k),
          );
        if (
          section === "categories" &&
          !["violet", "blue", "green", "pink", "amber"].includes(item.color)
        )
          bad();
        if (section === "projects" || section === "certificates") {
          for (const k of ["published", "featured", "demo"])
            if (typeof item[k] !== "boolean") bad();
        }
        if (section === "projects") {
          if (!Array.isArray(item.tags) || item.tags.length > 15) bad();
          item.tags.forEach((v) => str(v, 40, true));
          if (!["orbit", "frame", "flow"].includes(item.theme)) bad();
          for (const k of ["imageUrl", "liveUrl", "githubUrl"])
            if (!N.safeUrl(item[k], k === "imageUrl" ? "asset" : "link")) bad();
        }
        if (section === "certificates") {
          str(item.issuedAt, 10);
          if (
            item.issuedAt &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(item.issuedAt) ||
              Number.isNaN(Date.parse(item.issuedAt + "T12:00:00Z")))
          )
            bad();
          str(item.credentialId, 160);
          if (
            !N.safeUrl(item.credentialUrl) ||
            !N.safeUrl(item.fileUrl, "asset")
          )
            bad();
        }
      }
    }
    if (
      data.certificates.some(
        (c) => !data.categories.some((v) => v.id === c.categoryId),
      )
    )
      bad();
    data.translations = data.translations || {};
    for (const locale of ["ar", "tr"]) {
      const tr = data.translations[locale] || {};
      for (const section of Object.keys(textFields)) {
        if (!tr[section]) tr[section] = {};
        if (typeof tr[section] !== "object" || Array.isArray(tr[section]))
          bad();
        const records =
          section === "profile" ? [tr.profile] : Object.values(tr[section]);
        if (records.length > 500) bad();
        for (const record of records) {
          if (!record || typeof record !== "object" || Array.isArray(record))
            bad();
          for (const [k, v] of Object.entries(record)) {
            if (!textFields[section].includes(k)) bad();
            str(v, 3000);
          }
        }
      }
      data.translations[locale] = tr;
    }
    return data;
  };
  N.serialize = (data) =>
    "/* MN public content — exported from the local editor. */\nwindow.NOVA_DATA = " +
    JSON.stringify(N.publicData(N.validate(data)), null, 2).replaceAll(
      "<",
      "\\u003c",
    ) +
    ";\n";
  N.download = (filename, content, type = "text/plain;charset=utf-8") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  N.fileData = async (file) => {
    if (file.size > 8 * 1024 * 1024)
      throw new Error(N.t("اختر ملفًا لا يتجاوز 8 ميغابايت."));
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const ascii = String.fromCharCode(...bytes);
    const valid =
      (file.type === "image/png" &&
        bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255) ||
      (file.type === "image/webp" &&
        ascii.startsWith("RIFF") &&
        ascii.slice(8) === "WEBP") ||
      (file.type === "application/pdf" && ascii.startsWith("%PDF-"));
    if (!valid) throw new Error(N.t("الصيغ المسموحة: PNG، JPG، WebP، PDF."));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error(N.t("تعذّر رفع الملف. حاول مرة أخرى.")));
      reader.readAsDataURL(file);
    });
  };
  let dbPromise;
  const database = () =>
    dbPromise ||
    (dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("nova-static-workspace", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("records");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    }));
  N.readLocal = async (key) => {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readonly"),
        req = tx.objectStore("records").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };
  N.writeLocal = async (key, value) => {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readwrite");
      tx.objectStore("records").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Storage failed"));
    });
  };
  N.hashPassword = async (password, salt, iterations = 210000) => {
    if (!crypto.subtle)
      throw new Error(N.t("افتح الموقع عبر HTTPS أو localhost."));
    const enc = new TextEncoder(),
      key = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );
    const result = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations, hash: "SHA-256" },
      key,
      256,
    );
    return Array.from(new Uint8Array(result), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
  };
  N.authConfig = () => {
    try {
      const local = JSON.parse(localStorage.getItem("nova-static-credentials"));
      return local && local.baseRevision === window.NOVA_AUTH.revision
        ? local
        : window.NOVA_AUTH;
    } catch {
      return window.NOVA_AUTH;
    }
  };
  N.isLoggedIn = () => {
    try {
      return (
        sessionStorage.getItem("nova-static-session") ===
        N.authConfig()?.passwordHash
      );
    } catch {
      return false;
    }
  };
  N.login = async (username, password) => {
    const cfg = N.authConfig();
    if (
      username !== cfg.username ||
      (await N.hashPassword(password, cfg.salt, cfg.iterations)) !==
        cfg.passwordHash
    )
      return false;
    sessionStorage.setItem("nova-static-session", cfg.passwordHash);
    return true;
  };
  N.openAsset = (value) => {
    if (!N.safeUrl(value, "asset") || !value) return;
    if (value.startsWith("data:")) {
      const [header, base64] = value.split(","),
        bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
        url = URL.createObjectURL(
          new Blob([bytes], { type: header.slice(5).split(";")[0] }),
        );
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else window.open(N.url(value), "_blank", "noopener,noreferrer");
  };
  N.date = (value) =>
    value
      ? new Intl.DateTimeFormat(
          { en: "en-US", ar: "ar", tr: "tr-TR" }[N.locale],
          { year: "numeric", month: "short", day: "numeric" },
        ).format(new Date(value + "T12:00:00"))
      : "—";
  N.toast = (message, error = false) => {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "static-toast";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.classList.toggle("error", error);
    el.textContent = message;
    el.hidden = false;
    try {
      el.setAttribute("popover", "manual");
      el.showPopover();
    } catch {}
    clearTimeout(N.toastTimer);
    N.toastTimer = setTimeout(
      () => {
        el.hidden = true;
        try {
          el.hidePopover();
        } catch {}
      },
      error ? 8000 : 4000,
    );
  };
  N.closeModal = () => {
    const d = document.getElementById("nova-dialog");
    if (d) {
      d.close?.();
      d.remove();
    }
  };
  N.modal = (title, body, wide = false) => {
    N.closeModal();
    const d = document.createElement("dialog");
    d.id = "nova-dialog";
    d.className = "modal " + (wide ? "wide" : "");
    d.innerHTML = `<div class="modal-heading"><h2>${N.esc(title)}</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="${N.h("إغلاق")}">${N.icon("X")}</button></div><div class="modal-content">${body}</div>`;
    document.body.append(d);
    d.lang = N.locale;
    d.dir = N.locale === "ar" ? "rtl" : "ltr";
    d.addEventListener("click", (e) => {
      if (e.target === d) N.closeModal();
    });
    d.addEventListener("close", () => d.remove());
    d.showModal();
    d.querySelector("input,textarea,select")?.focus();
    return d;
  };
  N.setLanguage(N.locale);
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="close-modal"]')) N.closeModal();
    if (e.target.closest('[data-action="theme-toggle"]'))
      window.NOVA_THEME.toggle();
  });
})();
