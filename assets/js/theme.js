/* MN appearance settings. Runs before CSS is painted to prevent a flash of the wrong theme. */
(function () {
  "use strict";
  const storageKey = "nova-static-theme";
  const root = document.documentElement;
  const labels = {
    en: { light: "Switch to light mode", dark: "Switch to dark mode" },
    ar: { light: "التبديل إلى الوضع الفاتح", dark: "التبديل إلى الوضع الداكن" },
    tr: { light: "Açık temaya geç", dark: "Koyu temaya geç" },
  };
  const sun =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';
  const moon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z"/></svg>';
  function getSaved() {
    try {
      const choice = localStorage.getItem(storageKey);
      return choice === "light" || choice === "dark" ? choice : "dark";
    } catch {
      return "dark";
    }
  }
  function current() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }
  function opposite() {
    return current() === "light" ? "dark" : "light";
  }
  function title(locale) {
    return (labels[locale] || labels.en)[opposite()];
  }
  function sync() {
    const locale = document.documentElement.lang || "en";
    const text = title(locale);
    document
      .querySelectorAll?.('[data-action="theme-toggle"]')
      .forEach((button) => {
        button.setAttribute("aria-label", text);
        button.setAttribute("title", text);
        button.setAttribute("aria-pressed", String(current() === "light"));
        button.innerHTML = current() === "light" ? moon : sun;
      });
  }
  function apply(mode, persist) {
    root.dataset.theme = mode === "light" ? "light" : "dark";
    root.style.colorScheme = current();
    document
      .querySelector?.('meta[name="theme-color"]')
      ?.setAttribute("content", current() === "light" ? "#f4f7fd" : "#060e20");
    if (persist) {
      try {
        localStorage.setItem(storageKey, current());
      } catch {}
    }
    sync();
  }
  function button(locale) {
    const text = title(locale);
    return `<button class="icon-button theme-toggle" type="button" data-action="theme-toggle" aria-label="${text}" title="${text}" aria-pressed="${current() === "light"}">${current() === "light" ? moon : sun}</button>`;
  }
  apply(getSaved(), false);
  window.NOVA_THEME = {
    current,
    apply,
    button,
    sync,
    toggle: () => apply(opposite(), true),
  };
  window.addEventListener?.("storage", (event) => {
    if (event.key === storageKey) apply(getSaved(), false);
  });
})();
