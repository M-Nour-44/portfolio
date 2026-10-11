/* Node-only regression checks; no packages or network needed. */
import vm from "node:vm";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");
function boot({
  path = "/portfolio/",
  page = "portfolio",
  fixture,
  theme,
} = {}) {
  const storage = () => {
    const map = new Map();
    return {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    };
  };
  const events = {},
    documentEvents = {},
    elements = new Map([["app", { innerHTML: "" }]]),
    localStorage = storage();
  if (theme) localStorage.setItem("nova-static-theme", theme);
  const ctx = {
    console,
    URL,
    URLSearchParams,
    structuredClone,
    TextEncoder,
    Uint8Array,
    Blob,
    crypto: webcrypto,
    atob,
    btoa,
    setTimeout,
    clearTimeout,
    location: new URL("https://mn.test" + path),
    history: { replaceState() {} },
    localStorage,
    sessionStorage: storage(),
    confirm: () => true,
    document: {
      currentScript: {
        src:
          "https://mn.test" +
          path.replace(/admin\/$/, "") +
          "assets/js/common.js",
      },
      documentElement: { dataset: { page }, style: {} },
      addEventListener(name, fn) {
        (documentEvents[name] ??= []).push(fn);
      },
      querySelectorAll() {
        return [];
      },
      querySelector() {
        return null;
      },
      getElementById: (id) => elements.get(id) || null,
    },
    addEventListener(name, fn) {
      (events[name] ??= []).push(fn);
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of [
    "data.js",
    "assets/js/dictionary.js",
    "assets/js/icons.js",
    "assets/js/theme.js",
    "admin/auth-config.js",
    "assets/js/common.js",
  ])
    vm.runInContext(read(file), ctx, { filename: file });
  if (fixture) ctx.NOVA_DATA = fixture;
  for (const file of [
    "assets/js/portfolio.js",
    "assets/js/document.js",
    "assets/js/admin.js",
  ])
    vm.runInContext(read(file), ctx, { filename: file });
  ctx.events = events;
  ctx.documentEvents = documentEvents;
  ctx.elements = elements;
  return ctx;
}
const context = boot(),
  N = context.NOVA,
  actual = context.NOVA_DATA;
function fixture() {
  const d = structuredClone(actual);
  d.projects = [
    {
      id: "real-project",
      title: "API service",
      subtitle: "REST API",
      description: "A project description.",
      tags: ["Node.js"],
      imageUrl: "",
      liveUrl: "https://example.test/",
      githubUrl: "",
      featured: true,
      published: true,
      demo: false,
      theme: "orbit",
    },
  ];
  d.certificates = [
    {
      id: "real-certificate",
      title: "Training",
      issuer: "Institute",
      description: "A certificate description.",
      issuedAt: "2026-10-01",
      categoryId: d.categories[0].id,
      credentialId: "",
      credentialUrl: "",
      fileUrl: "",
      featured: false,
      published: true,
      demo: false,
    },
  ];
  return d;
}
let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log("PASS " + name);
}
await check(
  "actual identity and original assets are retained without sample records",
  () => {
    assert.equal(actual.profile.name, "Mohamad Nour Almasri");
    assert.equal(actual.translations.ar.profile.name, "محمد نور المصري");
    assert.equal(actual.profile.email, "mhmdnormasre99@gmail.com");
    assert.equal(actual.profile.demoMode, false);
    assert(!actual.projects.some((x) => x.demo));
    assert(!actual.certificates.some((x) => x.demo));
    for (const key of ["avatarUrl", "resumeUrl"])
      assert(existsSync(join(root, actual.profile[key])));
  },
);
await check(
  "three languages render real names, one H1 and only valid navigation destinations",
  () => {
    for (const lang of ["en", "ar", "tr"]) {
      N.locale = lang;
      const html = N.renderPortfolio();
      assert(
        html.includes(
          N.esc(
            N.localized(actual, lang)
              .profile.name.split(" ")
              .slice(0, -1)
              .join(" "),
          ),
        ),
      );
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
      assert(
        !/Your name|demo-project|demo-cert|brand-dot|section-dock|THE CREATIVE CORE/.test(
          html,
        ),
      );
      assert(!html.includes('id="projects"'));
      assert(!html.includes('id="certificates"'));
      assert(!html.includes('data-action="motion"'));
      assert(!html.includes("MN / PORTFOLIO"));
      assert(html.indexOf('data-lang="en"') < html.indexOf('data-lang="tr"'));
      assert(html.indexOf('data-lang="tr"') < html.indexOf('data-lang="ar"'));
      const ids = new Set(
        [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]),
      );
      for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
        assert(ids.has(id), lang + " missing " + id);
      if (lang !== "ar")
        assert(
          !/[\u0600-\u06ff]/.test(
            html.replaceAll("العربية", "").replaceAll("عربي", ""),
          ),
        );
    }
  },
);
await check(
  "published real entries reveal their sections; drafts and demo entries never leak",
  () => {
    const d = fixture();
    d.projects.push({
      ...d.projects[0],
      id: "draft",
      title: "UNPUBLISHED SECRET",
      published: false,
    });
    d.projects.push({
      ...d.projects[0],
      id: "sample",
      title: "EXAMPLE CONTENT",
      demo: true,
    });
    d.certificates.push({
      ...d.certificates[0],
      id: "sample-cert",
      title: "EXAMPLE CERT",
      demo: true,
    });
    const html = N.renderPortfolio(d);
    assert(html.includes('id="projects"'));
    assert(html.includes('id="certificates"'));
    assert(html.includes("API service"));
    assert(!/UNPUBLISHED SECRET|EXAMPLE CONTENT|EXAMPLE CERT/.test(html));
    const text = N.serialize(d);
    assert(!/UNPUBLISHED SECRET|EXAMPLE CONTENT|EXAMPLE CERT/.test(text));
    assert.equal(d.projects.length, 3);
  },
);
await check(
  "empty profile fields do not generate dead contact or work calls to action",
  () => {
    const d = structuredClone(actual);
    d.profile.email =
      d.profile.github =
      d.profile.linkedin =
      d.profile.resumeUrl =
      d.profile.about =
        "";
    d.profile.skills = [];
    N.locale = "en";
    const html = N.renderPortfolio(d);
    assert(!html.includes('href="#contact"'));
    assert(!html.includes('href="#about"'));
    assert(!html.includes('id="contact"'));
    assert(!html.includes('id="about"'));
    assert(!html.includes('href="#projects"'));
  },
);
await check(
  "missing portrait uses the MN monogram and old backups receive a valid crop default",
  () => {
    const d = structuredClone(actual);
    d.profile.avatarUrl = "";
    delete d.profile.avatarPosition;
    assert.equal(N.validate(d).profile.avatarPosition, 35);
    assert(N.renderPortfolio(d).includes("portrait-monogram"));
    d.profile.avatarPosition = 101;
    assert.throws(() => N.validate(d));
    d.profile.avatarPosition = "50; background:red";
    assert.throws(() => N.validate(d));
  },
);
await check(
  "translations fall back to the source and preserve custom content",
  () => {
    const d = structuredClone(actual);
    d.translations.tr.profile.name = "Özel İsim";
    d.translations.ar.profile.role = "";
    assert.equal(N.localized(d, "tr").profile.name, "Özel İsim");
    assert.equal(N.localized(d, "ar").profile.role, d.profile.role);
  },
);
await check(
  "dashboard tabs are localized and include photo position, publishing and visibility controls",
  () => {
    const c = boot({ page: "admin", fixture: fixture() });
    const n = c.NOVA,
      missing = new Set(),
      original = n.t;
    n.t = (key, ...args) => {
      if (n.locale !== "ar" && !c.NOVA_MESSAGES[key]?.[n.locale])
        missing.add(key);
      return original(key, ...args);
    };
    for (const lang of ["en", "ar", "tr"]) {
      n.locale = lang;
      for (const tab of [
        "overview",
        "profile",
        "projects",
        "certificates",
        "categories",
        "skills",
        "publish",
        "settings",
      ]) {
        n.adminSetTab(tab);
        const html = n.renderAdmin();
        assert(html.includes("brand-symbol"));
        if (lang !== "ar")
          assert(
            !/[\u0600-\u06ff]/.test(
              html.replaceAll("العربية", "").replaceAll("عربي", ""),
            ),
            lang + ": " + tab,
          );
      }
    }
    assert.deepEqual([...missing], []);
    n.adminSetTab("profile");
    assert(n.renderAdmin().includes('data-profile-key="avatarPosition"'));
    n.adminSetTab("projects");
    assert(n.renderAdmin().includes('data-publish-toggle="real-project"'));
    n.adminSetTab("publish");
    assert(n.renderAdmin().includes('data-action="export-homepage"'));
  },
);
await check(
  "unsafe URLs, duplicate identities and invalid categories are rejected",
  () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "//evil.test",
      "https://user:pass@example.test",
      "assets/../secret",
    ])
      assert.equal(N.safeUrl(value, "asset"), false);
    let d = fixture();
    d.projects[0].liveUrl = "javascript:alert(1)";
    assert.throws(() => N.validate(d));
    d = fixture();
    d.certificates[0].categoryId = "missing";
    assert.throws(() => N.validate(d));
    d = fixture();
    d.projects.push({ ...d.projects[0] });
    assert.throws(() => N.validate(d));
  },
);
await check(
  "text is escaped in rendered HTML, social URLs and exported JavaScript",
  () => {
    const d = structuredClone(actual);
    d.profile.name = "</script><img src=x onerror=alert(1)>";
    assert(!N.renderPortfolio(d).includes("<img src=x"));
    assert(!N.serialize(d).includes("</script>"));
    assert(N.renderPortfolio(d).includes("&lt;/script&gt;"));
    assert.equal(
      N.esc('<img onerror="x">'),
      "&lt;img onerror=&quot;x&quot;&gt;",
    );
  },
);
await check("uploaded PDF data survives an export and re-import", () => {
  const d = fixture();
  d.certificates[0].fileUrl = "data:application/pdf;base64,JVBERi0xLjcK";
  const result = { window: {} };
  vm.runInNewContext(N.serialize(d), result);
  assert.equal(
    N.validate(result.window.NOVA_DATA).certificates[0].fileUrl,
    d.certificates[0].fileUrl,
  );
});
await check(
  "existing editor credentials and changed credentials behave correctly",
  async () => {
    assert.equal(await N.login("admin", "wrong"), false);
    assert.equal(await N.login("admin", "1234"), true);
    assert(N.isLoggedIn());
    const config = {
      username: "editor",
      salt: "test-salt",
      iterations: 210000,
      passwordHash: await N.hashPassword("new-password", "test-salt"),
      revision: "updated",
      baseRevision: context.NOVA_AUTH.revision,
    };
    context.localStorage.setItem(
      "nova-static-credentials",
      JSON.stringify(config),
    );
    assert.equal(await N.login("admin", "1234"), false);
    assert.equal(await N.login("editor", "new-password"), true);
    context.NOVA_AUTH = { ...context.NOVA_AUTH, revision: "new-published" };
    assert.equal(N.isLoggedIn(), false);
  },
);
await check("light/dark selection persists and uses blue theme colors", () => {
  const c = boot({ theme: "light" });
  assert.equal(c.NOVA_THEME.current(), "light");
  c.NOVA_THEME.toggle();
  assert.equal(c.localStorage.getItem("nova-static-theme"), "dark");
  assert.equal(c.document.documentElement.dataset.theme, "dark");
  assert(read("assets/base.css").includes('html[data-theme="light"]'));
  assert(read("assets/base.css").includes("#060e20"));
  assert(read("assets/portfolio.css").includes("prefers-reduced-motion"));
});
await check(
  "local editor routes work at domain roots and repository subpaths",
  () => {
    for (const path of ["/", "/my-portfolio/"]) {
      const c = boot({ path });
      assert.equal(c.NOVA.base, path);
      const html = c.NOVA.renderPortfolio();
      assert(html.includes(`src="${path}assets/profile/avatar.jpg"`));
      assert(!html.includes("dashboard-link"));
    }
  },
);
await check(
  "downloaded homepage uses current data, correct assets, and no editor entry",
  () => {
    const d = structuredClone(actual);
    d.profile.name = "New Display Name";
    N.base = "./";
    N.locale = "en";
    const html = N.pageDocument({ data: d, content: N.renderPortfolio(d) });
    assert(
      html.includes("<title>New Display Name | Computer engineer</title>"),
    );
    assert(html.includes("New Display"));
    assert(!html.includes("Mohamad Nour"));
    assert(!html.includes("assets/styles.css"));
    assert(!html.includes("assets/js/core.js"));
    assert(html.includes('data-page="portfolio"'));
  },
);
await check("admin does not register the public page boot handler", () => {
  const c = boot({ page: "admin" });
  assert.equal(c.events.DOMContentLoaded.length, 1);
});
async function editorHarness(d = fixture()) {
  const c = boot({ page: "admin", path: "/portfolio/admin/", fixture: d });
  const n = c.NOVA;
  const writes = [];
  n.isLoggedIn = () => true;
  n.readLocal = async () => undefined;
  n.writeLocal = async (key, value) => writes.push(structuredClone(value));
  n.toast = () => {};
  n.closeModal = () => {};
  n.modal = (title, html) => {
    c.modalHTML = html;
  };
  for (const fn of c.events.DOMContentLoaded) await fn();
  c.dispatch = async (name, target) => {
    for (const fn of c.documentEvents[name] || [])
      await fn({
        target,
        preventDefault() {},
        key: "",
        ctrlKey: false,
        metaKey: false,
      });
  };
  c.click = async (dataset) =>
    c.dispatch("click", {
      dataset,
      closest(selector) {
        return selector === "button,a" ? this : null;
      },
    });
  c.writes = writes;
  return c;
}
await check(
  "quick visibility toggle persists and changes public visibility",
  async () => {
    const c = await editorHarness();
    await c.click({ tab: "projects" });
    await c.click({ publishToggle: "real-project" });
    assert.equal(c.writes.at(-1).projects[0].published, false);
    assert(!c.NOVA.renderPortfolio(c.writes.at(-1)).includes('id="projects"'));
    await c.click({ publishToggle: "real-project" });
    assert.equal(c.writes.at(-1).projects[0].published, true);
  },
);
await check(
  "profile crop edits save as numbers and project creation starts as a draft",
  async () => {
    const c = await editorHarness();
    await c.dispatch("input", {
      dataset: { profileKey: "avatarPosition" },
      type: "range",
      value: "62",
    });
    await c.click({ action: "save" });
    assert.equal(c.writes.at(-1).profile.avatarPosition, 62);
    await c.click({ add: "projects" });
    assert(!/data-editor-key="published" checked/.test(c.modalHTML));
    assert(!c.modalHTML.includes('data-editor-key="demo"'));
  },
);
await check(
  "homepage export includes unsaved profile changes after successful save",
  async () => {
    const c = await editorHarness();
    const downloads = [];
    c.NOVA.download = (...args) => downloads.push(args);
    await c.dispatch("input", {
      dataset: { profileKey: "name" },
      type: "text",
      value: "Updated Engineer",
    });
    await c.click({ action: "export-homepage" });
    assert.equal(downloads[0][0], "index.html");
    assert(downloads[0][1].includes("<title>Updated Engineer"));
    assert.equal(c.NOVA.base, "/portfolio/");
    assert.equal(c.writes.at(-1).profile.name, "Updated Engineer");
  },
);
await check(
  "all shipped page, media and font references resolve locally",
  () => {
    for (const file of ["index.html", "admin/index.html"]) {
      const html = read(file);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
      assert.equal(ids.length, new Set(ids).size);
      for (const [, value] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
        const url = value.split("?")[0];
        if (/^(https?:|data:|mailto:)/.test(url)) continue;
        const target = resolve(root, dirname(file), url);
        assert(existsSync(target), file + ": missing " + url);
      }
      assert(!/undefined|NaN/.test(html));
    }
    for (const [, font] of read("assets/fonts.css").matchAll(
      /url\('([^']+)'\)/g,
    ))
      assert(existsSync(resolve(root, "assets", font)));
  },
);
console.log(
  `\n${passed} checks passed. These are Node/markup checks, not browser visual tests.`,
);
