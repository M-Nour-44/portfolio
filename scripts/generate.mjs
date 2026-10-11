/* Optional maintenance command: node scripts/generate.mjs. No npm install needed. */
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const storage = {
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
};
const ctx = {
  console,
  URL,
  URLSearchParams,
  structuredClone,
  location: new URL("https://mn.example/"),
  history: { replaceState() {} },
  localStorage: storage,
  sessionStorage: storage,
  document: {
    currentScript: { src: "https://mn.example/assets/js/common.js" },
    documentElement: { dataset: {}, style: {} },
    addEventListener() {},
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
  },
  addEventListener() {},
  setTimeout,
  clearTimeout,
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
  "assets/js/portfolio.js",
  "assets/js/document.js",
  "assets/js/admin.js",
])
  vm.runInContext(readFileSync(resolve(root, file), "utf8"), ctx, {
    filename: file,
  });
const N = ctx.NOVA;
N.base = "./";
N.locale = "en";
writeFileSync(
  resolve(root, "index.html"),
  N.pageDocument({ content: N.renderPortfolio() }),
);
N.base = "../";
writeFileSync(
  resolve(root, "admin/index.html"),
  N.pageDocument({ admin: true, content: N.renderLogin() }),
);
console.log("Generated index.html and admin/index.html from current data.");
