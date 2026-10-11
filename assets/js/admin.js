(function () {
  "use strict";

  const N = window.NOVA,
    e = N.esc,
    h = N.h,
    icon = N.icon;

  let data = N.validate(N.clone(NOVA_DATA)),
    saved = JSON.stringify(data),
    tab = "overview",
    search = "",
    translationLocale = "ar",
    translationSection = "profile",
    translationId = "",
    editor = null,
    busy = false,
    saving = false;

  const tabs = [
    ["overview", "نظرة عامة", "LayoutDashboard"],
    ["profile", "معلوماتي الشخصية", "UserRound"],
    ["projects", "المشاريع", "Layers"],
    ["certificates", "الشهادات", "Award"],
    ["categories", "التصنيفات", "Tags"],
    ["skills", "المهارات", "Code2"],
    ["translations", "اللغات والترجمة", "Languages"],
    ["publish", "نشر المحتوى", "Upload"],
    ["settings", "إعدادات الدخول", "Settings"],
  ];

  const labels = {
    name: "اسم العرض",
    role: "المسمّى المهني",
    headlineOne: "العنوان — السطر الأول",
    headlineTwo: "العنوان — السطر الثاني",
    intro: "التعريف المختصر",
    about: "نبذة عني",
    location: "الموقع الجغرافي",
    availabilityText: "نص حالة التوفر",
    contactTitle: "عنوان التواصل",
    contactText: "رسالة التواصل",
    email: "البريد الإلكتروني",
    github: "رابط GitHub",
    linkedin: "رابط LinkedIn",
    title: "الاسم",
    subtitle: "وصف مختصر",
    description: "الوصف",
    issuer: "الجهة المانحة",
    issuedAt: "تاريخ الإصدار",
    credentialId: "رقم الاعتماد",
    credentialUrl: "رابط التحقق",
    liveUrl: "رابط المشروع",
    githubUrl: "رابط GitHub",
    label: "اسم المهارة",
    group: "المجموعة",
    tags: "التقنيات المستخدمة",
  };

  const max = {
    name: 80,
    role: 160,
    headlineOne: 80,
    headlineTwo: 80,
    intro: 700,
    about: 2200,
    location: 100,
    availabilityText: 100,
    contactTitle: 160,
    contactText: 500,
    email: 180,
    github: 2000,
    linkedin: 2000,
    title: 140,
    subtitle: 120,
    description: 3000,
    issuer: 140,
    credentialId: 160,
    group: 60,
    label: 60,
  };

  function input(
    label,
    key,
    value,
    attrs = "",
    long = false,
    required = false,
  ) {
    return `<label class="field ${long ? "full-width" : ""}"><span>${h(label)}</span>${long ? `<textarea ${attrs} rows="${key === "about" ? 6 : 3}" maxlength="${max[key] || 3000}" ${required ? "required" : ""} dir="auto">${e(value)}</textarea>` : `<input ${attrs} value="${e(value)}" maxlength="${max[key] || 2000}" ${required ? "required" : ""} dir="${/Url|github|linkedin|email|issuedAt/.test(key) ? "ltr" : "auto"}">`}</label>`;
  }

  const toggle = (label, key, value, where = "editor") =>
    `<label class="static-toggle"><input type="checkbox" data-${where}-key="${key}" ${value ? "checked" : ""}><span>${h(label)}</span></label>`;

  const items = (section) =>
    section === "skills" ? data.profile.skills : data[section];

  function changed() {
    const dirty = JSON.stringify(data) !== saved;

    document.querySelectorAll("[data-save-status]").forEach((el) => {
      el.textContent = N.t(dirty ? "تعديلات غير محفوظة" : "محفوظ محليًا");
      el.classList.toggle("unsaved", dirty);
    });

    document
      .querySelectorAll('[data-action="save"]')
      .forEach((el) => (el.disabled = busy || saving || !dirty));
  }

  async function save(next = data) {
    if (saving || busy) return false;
    saving = true;
    changed();
    const snapshot = JSON.stringify(next);
    try {
      const valid = N.validate(next);
      await N.writeLocal("portfolio", valid);
      if (next !== data || JSON.stringify(data) === snapshot) data = valid;
      saved = JSON.stringify(valid);
      changed();
      N.toast(N.t("تم الحفظ محليًا."));
      return true;
    } catch (error) {
      N.toast(
        error.message ||
          N.t("تعذّر الحفظ المحلي. صدّر نسخة احتياطية وتحقق من مساحة المتصفح."),
        true,
      );
      return false;
    } finally {
      saving = false;
      changed();
    }
  }

  function loginPage() {
    return `<div class="language-root" data-locale="${N.locale}"><div class="login-screen"><div class="login-top"><a href="${N.base}index.html?lang=${N.locale}">${N.brand()}</a><div class="login-top-actions">${N.languageSwitch()}${N.themeControl()}</div></div><main class="login-card"><div class="login-emblem">${icon("LockKeyhole")}</div><span class="eyebrow" dir="ltr">MN / LOCAL STUDIO</span><h1>${h("لوحة التحكم")}</h1><p>${h("محرر محتوى مستقل")}</p><form id="login-form">${input("اسم المستخدم", "username", "", 'name="username" autocomplete="username"', false, true)}${input("كلمة المرور", "password", "", 'name="password" type="password" autocomplete="current-password"', false, true)}<p id="login-error" class="form-error" role="alert"></p><button class="button primary" type="submit">${h("تسجيل الدخول")}${icon("ArrowUpRight")}</button></form><div class="local-explanation">${icon("Database")}<p>${h("هذه شاشة دخول لمحرر محلي وليست حماية خادم. لا ترفع أسرارًا إلى ملفات الموقع.")}</p></div><a class="text-link" href="${N.base}index.html?lang=${N.locale}">${h("العودة للموقع")}${icon("ArrowUpRight")}</a></main><span class="login-footer" dir="ltr">MN / CONTENT STUDIO</span></div></div>`;
  }

  function overview() {
    const visible = N.publicData(N.validate(data));
    const checks = [
      ['profile', 'الصورة الشخصية', Boolean(data.profile.avatarUrl)],
      ['profile', 'بيانات التواصل', Boolean(data.profile.email || data.profile.github || data.profile.linkedin)],
      ['projects', 'المشاريع', visible.projects.length > 0],
      ['certificates', 'الشهادات', visible.certificates.length > 0]
    ];
    return `<section class="overview-welcome"><span class="eyebrow" dir="ltr">MN / CONTENT STUDIO</span><h2>${h('أهلاً بك،')} ${e(data.profile.name)}</h2><p>${h('أدر محتواك وصورتك من مكان واحد.')}</p><button class="button primary" data-action="preview">${icon('Eye')}${h('معاينة محلية')}</button></section>
      <div class="stats-grid">${[['projects','المشاريع','Layers'],['certificates','الشهادات','Award'],['categories','التصنيفات','Tags'],['skills','المهارات','Code2']].map(([key,label,i]) => `<button class="stat-card" data-tab="${key}"><div>${icon(i)}<span>${h(label)}</span></div><strong>${items(key).length}</strong><small>${h('تعديل')}${icon('ArrowUpRight')}</small></button>`).join('')}</div>
      <div class="admin-content-grid"><section class="panel"><div class="panel-heading"><h2>${h('المحتوى الظاهر للزوار')}</h2>${icon('Eye')}</div><div class="content-checks">${checks.map(([key,label,ready]) => `<button class="${ready ? 'ready' : ''}" data-tab="${key}">${icon(ready ? 'Check' : 'Plus')}<span>${h(label)}</span><small>${h(ready ? 'جاهز للعرض' : 'غير ظاهر بعد')}</small></button>`).join('')}</div><p class="publish-note">${h('الأقسام الفارغة والعناصر التجريبية لا تظهر للزوار.')}</p></section>
      <section class="panel"><div class="panel-heading"><h2>${h('إجراءات سريعة')}</h2>${icon('Plus')}</div><div class="quick-actions">${[['projects','إضافة مشروع','Layers'],['certificates','إضافة شهادة','Award']].map(([key,label,i]) => `<button data-add="${key}">${icon(i)}<span>${h(label)}</span>${icon('Plus')}</button>`).join('')}<button data-tab="publish">${icon('Upload')}<span>${h('نشر المحتوى')}</span>${icon('ArrowUpRight')}</button></div></section></div>`;
  }

  function updatePortrait() {
    const preview = document.querySelector('[data-profile-portrait]');
    if (preview) preview.innerHTML = data.profile.avatarUrl && N.safeUrl(data.profile.avatarUrl, 'asset')
      ? `<img src="${e(N.url(data.profile.avatarUrl))}" alt="${e(data.profile.name)}" style="object-position:50% ${data.profile.avatarPosition ?? 35}%">` : '<span>MN</span>';
    const output = document.querySelector('[data-position-value]');
    if (output) output.textContent = (data.profile.avatarPosition ?? 35) + '%';
  }

  function uploadField(key, value, profile = false, imageOnly = false) {
    return `<div class="field full-width asset-field" data-asset-field="${key}"><span>${h(key === "avatarUrl" ? "الصورة الشخصية" : key === "resumeUrl" ? "السيرة الذاتية" : key === "imageUrl" ? "صورة الغلاف" : "صورة الشهادة أو ملف PDF")}</span><div class="asset-controls"><input type="text" inputmode="url" aria-label="${h(key === 'avatarUrl' ? 'الصورة الشخصية' : key === 'resumeUrl' ? 'السيرة الذاتية' : key === 'imageUrl' ? 'صورة الغلاف' : 'صورة الشهادة أو ملف PDF')}" dir="ltr" data-${profile ? "profile" : "editor"}-key="${key}" placeholder="https://…" value="${e(value?.startsWith("data:") ? "" : value || "")}"><label class="button secondary"><input class="sr-only" type="file" data-upload-key="${key}" data-upload-profile="${profile}" accept="${imageOnly ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,application/pdf"}">${icon("Upload")}${h("رفع ملف")}</label><button class="icon-button" type="button" data-remove-file="${key}" data-upload-profile="${profile}" aria-label="${h("إزالة الملف")}">${icon("Trash2")}</button></div><small data-asset-status>${value ? h("تم اختيار الملف.") : "PNG, JPG, WebP" + (imageOnly ? "" : " / PDF") + " · 8 MB"}</small></div>`;
  }

  function profile() {
    const p = data.profile;
    const field = (key, long = false) => input(labels[key], key, p[key], `data-profile-key="${key}" lang="en"`, long, ['name','role','headlineOne','headlineTwo'].includes(key));
    return `<div class="section-note">${icon('Languages')}<span>${h('الإنجليزية هي المحتوى الأصلي. أضف ترجمات العربية والتركية لكل قسم.')}</span><button data-tab="translations">${h('اللغات والترجمة')}</button></div>
      <div class="profile-panels"><section class="panel profile-basics"><h2>${h('معلوماتي الشخصية')}</h2>${['name','role','location','availabilityText'].map(k => field(k)).join('')}${toggle('الفرص والتوفر','available',p.available,'profile')}</section>
      <section class="panel profile-photo"><h2>${h('الصورة الشخصية')}</h2><div class="profile-portrait-preview" data-profile-portrait>${p.avatarUrl ? `<img src="${e(N.url(p.avatarUrl))}" alt="${e(p.name)}" style="object-position:50% ${p.avatarPosition ?? 35}%">` : '<span>MN</span>'}</div>${uploadField('avatarUrl',p.avatarUrl,true,true)}<label class="field portrait-position"><span>${h('موضع الصورة')}<output data-position-value>${p.avatarPosition ?? 35}%</output></span><input type="range" min="0" max="100" step="1" value="${p.avatarPosition ?? 35}" data-profile-key="avatarPosition"><small>${h('حرّك الصورة حتى يظهر الوجه بوضوح.')}</small></label>${uploadField('resumeUrl',p.resumeUrl,true)}</section>
      <section class="panel profile-bio"><h2>${h('التعريف والنبذة')}</h2><div class="form-grid">${field('intro',true)}${field('about',true)}</div><details><summary>${h('عناوين قسم النبذة')}</summary><div class="form-grid">${field('headlineOne')}${field('headlineTwo')}</div></details></section>
      <section class="panel profile-contact"><h2>${h('بيانات التواصل')}</h2><div class="form-grid">${['email','github','linkedin'].map(k => input(labels[k],k,p[k],`data-profile-key="${k}" type="${k === 'email' ? 'email' : 'url'}"`)).join('')}${field('contactTitle')}${field('contactText',true)}</div></section></div>`;
  }

  function listSection() {
    const rows = items(tab).filter((v) =>
      (v.title || v.name || v.label || "")
        .toLocaleLowerCase(N.locale)
        .includes(search.toLocaleLowerCase(N.locale)),
    );

    return `<section class="panel"><div class="list-toolbar"><label class="search-field">${icon("Search")}<input id="admin-search" placeholder="${h("البحث في المحتوى")}" value="${e(search)}"></label><button class="button primary" data-add="${tab}">${icon("Plus")}${h({ projects: "إضافة مشروع", certificates: "إضافة شهادة", categories: "تصنيف جديد", skills: "إضافة مهارة" }[tab])}</button></div><div class="static-admin-list" id="admin-list">${listRows(rows)}</div></section>`;
  }

  function listRows(rows) {
    return rows.length
      ? rows
          .map(
            (item) =>
              `<article class="static-list-row"><span class="list-emblem ${item.color || "violet"}">${icon({ projects: "Layers", certificates: "Award", categories: "Tags", skills: "Code2" }[tab])}</span><div class="list-info"><h3 dir="auto">${e(item.title || item.name || item.label)}</h3><p dir="auto">${e(item.issuer || item.subtitle || item.description || item.group || "")}</p>${"published" in item ? `<button class="status-badge ${item.published && !item.demo ? "published" : "draft"}" data-publish-toggle="${e(item.id)}" aria-pressed="${item.published && !item.demo}" title="${h(item.demo ? "عنصر تجريبي: عدّل محتواه أولًا" : item.published ? "إخفاء من الموقع" : "إظهار في الموقع")}" ${item.demo ? "disabled" : ""}>${h(item.demo ? "محتوى تجريبي مخفي" : item.published ? "ظاهر بالموقع" : "مسودة")}</button>` : ""}</div><div class="list-actions"><button class="icon-button" data-order="${e(item.id)}" data-step="-1" title="${h("أعلى")}" aria-label="${h("أعلى")}">${icon("ChevronUp")}</button><button class="icon-button" data-order="${e(item.id)}" data-step="1" title="${h("أسفل")}" aria-label="${h("أسفل")}">${icon("ChevronDown")}</button><button class="icon-button" data-edit="${e(item.id)}" aria-label="${h("تعديل")}">${icon("Pencil")}</button><button class="icon-button danger" data-delete="${e(item.id)}" aria-label="${h("حذف")}">${icon("Trash2")}</button></div></article>`,
          )
          .join("")
      : `<div class="empty-state"><h3>${h("لا توجد عناصر بعد.")}</h3></div>`;
  }

  function translation() {
    const list =
      translationSection === "profile" ? [] : items(translationSection);

    const current = list.find((v) => v.id === translationId) || list[0];
    translationId = current?.id || "";

    const original = translationSection === "profile" ? data.profile : current;

    const record =
      translationSection === "profile"
        ? data.translations[translationLocale].profile
        : data.translations[translationLocale][translationSection][
            translationId
          ] || {};

    return `<section class="translation-intro"><div class="translation-globe">${icon("Languages")}<span>EN · TR · AR</span></div><div><h2>${h("اكتب قصتك بثلاث لغات.")}</h2><p>${h("الإنجليزية هي المحتوى الأصلي. أضف ترجمات العربية والتركية لكل قسم.")}</p></div></section><div class="translation-controls"><div class="translation-target"><span>${h("لغة الترجمة")}</span><div dir="ltr">${["tr", "ar"].map((l) => `<button data-translation-locale="${l}" class="${translationLocale === l ? "active" : ""}">${l === "ar" ? "AR · العربية" : "TR · Türkçe"}</button>`).join("")}</div></div><div class="translation-sections">${["profile", "projects", "certificates", "categories", "skills"].map((s) => `<button data-translation-section="${s}" class="${s === translationSection ? "active" : ""}">${h(tabs.find((t) => t[0] === s)[1])}</button>`).join("")}</div></div>${list.length ? `<label class="field translation-selector"><span>${h("قسم المحتوى")}</span><select id="translation-item">${list.map((v) => `<option value="${e(v.id)}" ${v.id === translationId ? "selected" : ""}>${e(v.title || v.name || v.label)}</option>`).join("")}</select></label>` : ""}${original ? `<section class="translation-fields"><div class="translation-column-head"><span>EN <b>${h("النص الأصلي")}</b></span><span>${translationLocale.toUpperCase()} <b>${h("الترجمة")}</b></span></div>${N.textFields[translationSection].map((k) => `<div class="translation-field-pair"><div class="translation-source"><span>${h(labels[k])}</span><p dir="ltr" lang="en">${e(original[k]) || "—"}</p></div><label class="field translation-input"><span>${h(labels[k])}</span><textarea data-translation-key="${k}" rows="${["description", "about", "intro", "contactText"].includes(k) ? 4 : 2}" maxlength="${max[k] || 3000}" lang="${translationLocale}" dir="${translationLocale === "ar" ? "rtl" : "ltr"}" placeholder="${translationLocale === "ar" ? "اكتب الترجمة العربية…" : "Türkçe çeviriyi yazın…"}">${e(record[k] || "")}</textarea></label></div>`).join("")}</section>` : `<div class="empty-state">${h("لا توجد عناصر بعد.")}</div>`}<div class="translation-save"><p>${h("إذا تركت الترجمة فارغة سيظهر النص الأصلي.")}</p><button class="button primary" data-action="save">${icon("Save")}${h("حفظ الترجمات")}</button></div>`;
  }

  function publish() {
    return `<section class="panel publish-main"><span class="publish-icon">${icon('Globe')}</span><h2>${h('نشر المحتوى')}</h2><p>${h('الحفظ محلي. لتنشر التعديلات، نزّل الملفين وارفعهما مكان النسخة الحالية.')}</p>
      <ol class="publish-steps"><li><span>01</span><div><b>${h('نزّل المحتوى')}</b><p dir="ltr">data.js</p></div></li><li><span>02</span><div><b>${h('نزّل الصفحة المحدثة')}</b><p dir="ltr">index.html</p></div></li><li><span>03</span><div><b>${h('ارفع الملفين إلى استضافتك')}</b><p>${h('داخل المجلد نفسه مع assets وadmin.')}</p></div></li></ol>
      <div class="button-row"><button class="button primary" data-action="export-public">${icon('Download')}data.js</button><button class="button secondary" data-action="export-homepage">${icon('Download')}index.html</button></div><p class="publish-note">${h('الصفحة المحدثة تتضمن اسمك ومحتواك قبل تحميل JavaScript، حتى لا تظهر نسخة قديمة.')}</p><p class="publish-note">${h('يحتوي ملف النشر على المحتوى المنشور فقط. المسودات تبقى ضمن النسخة الاحتياطية الخاصة.')}</p></section>
      <div class="admin-content-grid"><section class="panel"><h2>${h('النسخ الاحتياطي')}</h2><p>${h('تصدير نسخة قبل استبدالها')}</p><div class="button-row"><button class="button secondary" data-action="export-backup">${icon('Download')}${h('تنزيل نسخة احتياطية خاصة')}</button><label class="button secondary">${icon('Upload')}${h('استيراد نسخة احتياطية')}<input type="file" class="sr-only" id="import-backup" accept="application/json,.json"></label></div><button class="text-link" data-action="restore-published">${icon('RotateCcw')}${h('استعادة النسخة المنشورة')}</button></section><section class="panel"><h2>${h('ملفاتك')}</h2><p>${h('احتفظ بمجلد assets مع المشروع. الملفات الجديدة التي ترفعها من اللوحة تُضمّن تلقائيًا في data.js.')}</p><p>PNG, JPG, WebP, PDF · 8 MB</p></section></div>`;
  }

  function settings() {
    return `<section class="panel credentials-panel"><h2>${h("تغيير بيانات الدخول")}</h2><p>${h("هذه شاشة دخول لمحرر محلي وليست حماية خادم. لا ترفع أسرارًا إلى ملفات الموقع.")}</p><form id="credentials-form"><div class="form-grid">${input("كلمة المرور الحالية", "password", "", 'name="current" type="password" autocomplete="current-password"', false, true)}${input("اسم المستخدم الجديد", "username", N.authConfig().username, 'name="username" autocomplete="username"', false, true)}${input("كلمة المرور الجديدة", "password", "", 'name="password" type="password" minlength="8" autocomplete="new-password"', false, true)}${input("تأكيد كلمة المرور", "password", "", 'name="confirm" type="password" minlength="8" autocomplete="new-password"', false, true)}</div><small>${h("استخدم 8 أحرف على الأقل.")}</small><button class="button primary" type="submit">${icon("LockKeyhole")}${h("تغيير بيانات الدخول")}</button></form><div class="credentials-export"><p>${h("ارفع ملف auth-config.js داخل مجلد admin لتطبيق بيانات الدخول الجديدة في المتصفحات الجديدة.")}</p><button class="button secondary" data-action="export-auth">${icon("Download")}${h("تنزيل إعدادات الدخول")}</button></div></section>`;
  }

  function shell() {
    const label = tabs.find((v) => v[0] === tab)[1];

    return `<div class="language-root" data-locale="${N.locale}" dir="${N.locale === "ar" ? "rtl" : "ltr"}"><div class="admin-app static-admin"><aside class="admin-sidebar"><div class="admin-brand">${N.brand()}</div><div class="sidebar-label">${h("مساحتك الإبداعية")}</div><nav aria-label="${h("أقسام لوحة التحكم")}">${tabs.map(([id, label, i]) => `<button data-tab="${id}" class="${tab === id ? "active" : ""}">${icon(i)}<span>${h(label)}</span></button>`).join("")}</nav><div class="sidebar-bottom"><div class="private-notice">${icon("Database")}<div>${h("محرر محلي")}<small>${h("حفظ محلي")}</small></div></div><button class="sidebar-preview" data-action="preview">${icon("Eye")}${h("معاينة محلية")}${icon("ArrowUpRight")}</button><button class="sidebar-preview" data-action="logout">${icon("LogOut")}${h("تسجيل الخروج")}</button></div></aside><button class="sidebar-scrim" data-action="close-sidebar" hidden aria-label="${h("إغلاق القائمة")}"></button><div class="admin-body"><header class="admin-header"><div class="admin-breadcrumb"><button class="icon-button admin-menu" data-action="sidebar" aria-label="${h("قائمة الإدارة")}">${icon("Menu")}</button><span>${h("لوحة التحكم")}</span>${icon("ChevronLeft")}<strong>${h(label)}</strong></div><div class="admin-header-actions">${N.languageSwitch()}${N.themeControl()}<button class="button secondary compact preview-button" data-action="preview" aria-label="${h("معاينة محلية")}">${icon("Eye")}<span>${h("معاينة محلية")}</span></button><span class="save-status" data-save-status>${h("محفوظ محليًا")}</span><button class="button primary compact" data-action="save">${icon("Save")}<span>${h("حفظ محلي")}</span></button></div></header><main class="admin-main" id="admin-main"><div class="admin-title"><div><span class="eyebrow" dir="ltr">MN / YOUR LOCAL STUDIO</span><h1>${h(label)}</h1><p>${h(tab === "translations" ? "الإنجليزية هي المحتوى الأصلي. أضف ترجمات العربية والتركية لكل قسم." : "التعديلات محفوظة في هذا المتصفح فقط. نزّل data.js وارفعه إلى GitHub لتظهر للجميع.")}</p></div></div>${tab === "overview" ? overview() : tab === "profile" ? profile() : ["projects", "certificates", "categories", "skills"].includes(tab) ? listSection() : tab === "translations" ? translation() : tab === "publish" ? publish() : settings()}</main><footer class="admin-footer"><span dir="ltr">MN / CONTENT STUDIO</span><span>${h("تغيير اللغة لا يحذف تعديلاتك.")}</span></footer></div></div></div>`;
  }

  function render() {
    editor = null;
    N.closeModal();
    document.getElementById("app").innerHTML = N.isLoggedIn()
      ? shell()
      : loginPage();

    document.title = N.t("لوحة التحكم") + " | MN";
    changed();
  }

  function openEditor(section, id) {
    const found = id ? items(section).find((v) => v.id === id) : null;
    const base = { id: N.id() };

    const defaults = {
      projects: {
        ...base,
        title: "",
        subtitle: "",
        description: "",
        tags: [],
        imageUrl: "",
        liveUrl: "",
        githubUrl: "",
        published: false,
        featured: false,
        demo: false,
        theme: "orbit",
      },
      certificates: {
        ...base,
        title: "",
        issuer: "",
        description: "",
        issuedAt: "",
        categoryId: data.categories[0].id,
        credentialId: "",
        credentialUrl: "",
        fileUrl: "",
        published: false,
        featured: false,
        demo: false,
      },
      categories: { ...base, name: "", description: "", color: "blue" },
      skills: { ...base, label: "", group: "Languages & frameworks" },
    };

    editor = {
      section,
      item: N.clone(found || defaults[section]),
      isNew: !found,
    };

    const v = editor.item;

    const fields = {
      projects: [
        "title",
        "subtitle",
        "description",
        "tags",
        "liveUrl",
        "githubUrl",
      ],
      certificates: [
        "title",
        "issuer",
        "issuedAt",
        "description",
        "credentialId",
        "credentialUrl",
      ],
      categories: ["name", "description"],
      skills: ["label", "group"],
    }[section];

    let form = fields
      .map((k) =>
        input(
          labels[k],
          k,
          k === "tags" ? v.tags.join(", ") : v[k],
          `data-editor-key="${k}" ${k === "issuedAt" ? 'type="date"' : /Url/.test(k) ? 'type="url"' : ""} lang="en"`,
          k === "description",
          ["title", "issuer", "name", "label", "group"].includes(k),
        ),
      )
      .join("");

    if (section === "certificates")
      form +=
        `<label class="field"><span>${h("التصنيف")}</span><select data-editor-key="categoryId">${data.categories.map((c) => `<option value="${e(c.id)}" ${c.id === v.categoryId ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label>` +
        uploadField("fileUrl", v.fileUrl);

    if (section === "projects")
      form +=
        uploadField("imageUrl", v.imageUrl, false, true) +
        `<label class="field"><span>${h("الغلاف البديل")}</span><select data-editor-key="theme">${["orbit", "frame", "flow"].map((theme) => `<option ${v.theme === theme ? "selected" : ""}>${theme}</option>`).join("")}</select></label>`;

    if (section === "categories")
      form += `<label class="field"><span>${h("لون التصنيف")}</span><select data-editor-key="color">${["violet", "blue", "green", "pink", "amber"].map((c, i) => `<option value="${c}" ${v.color === c ? "selected" : ""}>${h(["بنفسجي", "أزرق", "أخضر", "وردي", "ذهبي"][i])}</option>`).join("")}</select></label>`;

    N.modal(
      N.t(
        found
          ? "تعديل"
          : {
              projects: "إضافة مشروع",
              certificates: "إضافة شهادة",
              categories: "تصنيف جديد",
              skills: "إضافة مهارة",
            }[section],
      ),
      `<form id="editor-form"><div class="form-grid">${form}</div>${"published" in v ? `<div class="toggle-stack">${toggle("منشور", "published", v.published)}${toggle("المميزة", "featured", v.featured)}</div>` : ""}<div class="editor-footer"><button class="button secondary" type="button" data-action="close-modal">${h("إلغاء")}</button><button class="button primary" type="submit">${icon("Save")}${h("حفظ العنصر")}</button></div></form>`,
      section !== "skills",
    );
  }

  function deleteDialog(id) {
    const item = items(tab).find((v) => v.id === id);
    if (!item) return;

    if (tab === "categories" && data.categories.length === 1) {
      N.toast(N.t("لا يمكن حذف آخر تصنيف."), true);
      return;
    }

    const assigned =
      tab === "categories"
        ? data.certificates.filter((c) => c.categoryId === id).length
        : 0;

    N.modal(
      N.t("حذف هذا العنصر؟"),
      `<form id="delete-form" data-section="${tab}" data-id="${e(id)}"><p dir="auto">${e(item.title || item.name || item.label)}</p>${
        assigned
          ? `<label class="field"><span>${h("انقل شهادات التصنيف إلى")}</span><select name="transfer" required>${data.categories
              .filter((c) => c.id !== id)
              .map((c) => `<option value="${e(c.id)}">${e(c.name)}</option>`)
              .join("")}</select></label>`
          : ""
      }<div class="editor-footer"><button class="button secondary" type="button" data-action="close-modal">${h("إلغاء")}</button><button class="button danger" type="submit">${h("تأكيد الحذف")}</button></div></form>`,
    );
  }

  async function exportPublic() {
    const valid = N.validate(data);
    valid.revision = new Date().toISOString();

    if (!(await save(valid))) return;

    N.download("data.js", N.serialize(data), "text/javascript;charset=utf-8");
    N.toast(N.t("تم تنزيل الملف. ارفعه إلى GitHub للنشر."));
  }

  function bind() {
    document.addEventListener("input", (ev) => {
      const el = ev.target;

      if (el.dataset.profileKey) {
        data.profile[el.dataset.profileKey] = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
        if (['avatarUrl','avatarPosition','name'].includes(el.dataset.profileKey)) updatePortrait();
        changed();
      }

      if (el.dataset.editorKey && editor) {
        editor.item[el.dataset.editorKey] =
          el.type === "checkbox"
            ? el.checked
            : el.dataset.editorKey === "tags"
              ? Array.from(
                  new Set(
                    el.value
                      .split(/[,،]/)
                      .map((v) => v.trim())
                      .filter(Boolean),
                  ),
                )
              : el.value;
      }

      if (el.dataset.translationKey) {
        const container = data.translations[translationLocale];

        const target =
          translationSection === "profile"
            ? container.profile
            : container[translationSection][translationId] ||
              (container[translationSection][translationId] = {});

        target[el.dataset.translationKey] = el.value;
        changed();
      }

      if (el.id === "admin-search") {
        search = el.value;
        document.getElementById("admin-list").innerHTML = listRows(
          items(tab).filter((v) =>
            (v.title || v.name || v.label)
              .toLocaleLowerCase(N.locale)
              .includes(search.toLocaleLowerCase(N.locale)),
          ),
        );
      }
    });

    document.addEventListener("change", async (ev) => {
      const el = ev.target;

      if (el.id === "translation-item") {
        translationId = el.value;
        render();
      }

      if (el.dataset.uploadKey) {
        const file = el.files?.[0];
        if (!file) return;

        const key = el.dataset.uploadKey,
          isProfile = el.dataset.uploadProfile === "true";

        if (
          (key === "avatarUrl" || key === "imageUrl") &&
          !file.type.startsWith("image/")
        ) {
          N.toast(N.t("اختر ملف صورة"), true);
          return;
        }

        busy = true;

        document
          .querySelectorAll(
            '#editor-form button[type="submit"],[data-action="save"]',
          )
          .forEach((b) => (b.disabled = true));

        try {
          const target = isProfile ? data.profile : editor?.item;
          const url = await N.fileData(file);

          if (target) target[key] = url;
          if (isProfile) updatePortrait();

          el.closest(".asset-field")
            ?.querySelector("[data-asset-status]")
            ?.replaceChildren(document.createTextNode(N.t("تم اختيار الملف.")));

          N.toast(N.t("تم اختيار الملف."));
        } catch (error) {
          N.toast(error.message, true);
        } finally {
          busy = false;

          document
            .querySelectorAll('#editor-form button[type="submit"]')
            .forEach((b) => (b.disabled = false));

          changed();
          el.value = "";
        }
      }

      if (el.id === "import-backup" && el.files[0]) {
        try {
          const file = el.files[0];

          if (file.size > 50 * 1024 * 1024)
            throw new Error(N.t("ملف النسخة الاحتياطية كبير جدًا."));

          const incoming = N.validate(JSON.parse(await file.text()));

          if (
            confirm(N.t("استبدال التعديلات المحلية؟")) &&
            (await save(incoming))
          ) {
            render();
            N.toast(N.t("تم الاستيراد والحفظ محليًا."));
          }
        } catch (error) {
          N.toast(error.message, true);
        }

        el.value = "";
      }
    });

    document.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button,a");
      if (!b) return;

      const d = b.dataset;

      try {
        if (d.lang) {
          N.setLanguage(d.lang);
          render();
          return;
        }

        if (!N.isLoggedIn()) return;

        if (d.tab) {
          tab = d.tab;
          search = "";
          render();
        } else if (d.publishToggle) {
          const next = N.clone(data);
          const item = next[tab]?.find(v => v.id === d.publishToggle);
          if (item && !item.demo) { item.published = !item.published; if (await save(next)) render(); }
        } else if (d.add) openEditor(d.add);
        else if (d.edit) openEditor(tab, d.edit);
        else if (d.delete) deleteDialog(d.delete);
        else if (d.order) {
          const arr = items(tab),
            index = arr.findIndex((v) => v.id === d.order),
            next = index + Number(d.step);

          if (next >= 0 && next < arr.length) {
            [arr[index], arr[next]] = [arr[next], arr[index]];
            changed();
            render();
          }
        } else if (d.translationLocale) {
          translationLocale = d.translationLocale;
          render();
        } else if (d.translationSection) {
          translationSection = d.translationSection;
          translationId = "";
          render();
        } else if (d.removeFile) {
          const source =
            d.uploadProfile === "true" ? data.profile : editor?.item;

          if (source) source[d.removeFile] = "";

          b.closest(".asset-field").querySelector('[data-profile-key],[data-editor-key]').value =
            "";

          b
            .closest(".asset-field")
            .querySelector("[data-asset-status]").textContent = "";

          if (d.uploadProfile === 'true') updatePortrait();
          changed();
        } else if (d.action === "save" && !busy) await save();
        else if (d.action === "preview") {
          const previewWindow = window.open('about:blank', '_blank');
          if (await save()) {
            const url = N.base + 'index.html?preview=1&lang=' + N.locale;
            if (previewWindow) { previewWindow.location.href = url; previewWindow.opener = null; }
            else location.href = url;
          } else previewWindow?.close();
        } else if (d.action === "logout") {
          if (
            JSON.stringify(data) !== saved &&
            !confirm(
              N.t("تعديلات غير محفوظة") + " — " + N.t("تسجيل الخروج") + "?",
            )
          )
            return;

          sessionStorage.removeItem("nova-static-session");
          render();
        } else if (d.action === "export-public") await exportPublic();
        else if (d.action === 'export-homepage') {
          if (await save()) {
            const previousBase = N.base, previousLocale = N.locale;
            try {
              N.base = './'; N.locale = 'en';
              const content = N.renderPortfolio(data);
              N.download('index.html', N.pageDocument({ content, data }), 'text/html;charset=utf-8');
            } finally { N.base = previousBase; N.locale = previousLocale; }
          }
        }
        else if (d.action === "export-backup")
          N.download(
            "mn-private-backup.json",
            JSON.stringify(N.validate(data), null, 2),
            "application/json",
          );
        else if (d.action === "restore-published") {
          if (
            confirm(N.t("استبدال التعديلات المحلية؟")) &&
            (await save(N.clone(NOVA_DATA)))
          )
            render();
        } else if (d.action === "export-auth") {
          const { baseRevision, ...config } = N.authConfig();

          N.download(
            "auth-config.js",
            "/* Local editor settings — this is not server authentication. */\nwindow.NOVA_AUTH = " +
              JSON.stringify(config, null, 2) +
              ";\n",
            "text/javascript",
          );
        } else if (d.action === "sidebar" || d.action === "close-sidebar") {
          const sidebar = document.querySelector(".admin-sidebar"),
            open =
              d.action === "sidebar" && !sidebar.classList.contains("open");

          sidebar.classList.toggle("open", open);
          document.querySelector(".sidebar-scrim").hidden = !open;
        }
      } catch (error) {
        N.toast(error.message, true);
      }
    });

    document.addEventListener("submit", async (ev) => {
      const form = ev.target;
      ev.preventDefault();

      try {
        if (form.id === "login-form") {
          const button = form.querySelector('button[type="submit"]');
          button.disabled = true;

          const fields = new FormData(form);

          try {
            if (
              await N.login(
                String(fields.get("username")).trim(),
                String(fields.get("password")),
              )
            ) {
              await loadWorkspace();
              render();
            } else
              document.getElementById("login-error").textContent = N.t(
                "بيانات الدخول غير صحيحة.",
              );
          } finally {
            button.disabled = false;
          }

          return;
        }

        if (!N.isLoggedIn()) {
          render();
          return;
        }

        if (busy) return;

        if (form.id === "editor-form" && editor) {
          const next = N.clone(data),
            { section, item } = editor;

          if ('demo' in item) item.demo = false;
          const arr =
              section === "skills" ? next.profile.skills : next[section],
            index = arr.findIndex((v) => v.id === item.id);

          if (index >= 0) arr[index] = item;
          else arr.push(item);

          if (await save(next)) {
            editor = null;
            N.closeModal();
            render();
          }
        }

        if (form.id === "delete-form") {
          const next = N.clone(data),
            section = form.dataset.section,
            id = form.dataset.id;

          if (section === "categories") {
            const target = new FormData(form).get("transfer");

            next.certificates = next.certificates.map((c) =>
              c.categoryId === id ? { ...c, categoryId: target } : c,
            );
          }

          if (section === "skills")
            next.profile.skills = next.profile.skills.filter(
              (v) => v.id !== id,
            );
          else next[section] = next[section].filter((v) => v.id !== id);

          for (const l of ["ar", "tr"])
            delete next.translations[l][section][id];

          if (await save(next)) {
            N.closeModal();
            render();
          }
        }

        if (form.id === "credentials-form") {
          const fields = new FormData(form),
            old = N.authConfig();

          if (
            (await N.hashPassword(
              String(fields.get("current")),
              old.salt,
              old.iterations,
            )) !== old.passwordHash
          )
            throw new Error(N.t("بيانات الدخول غير صحيحة."));

          const password = String(fields.get("password"));

          if (password !== fields.get("confirm"))
            throw new Error(N.t("كلمتا المرور غير متطابقتين."));

          if (password.length < 8)
            throw new Error(N.t("استخدم 8 أحرف على الأقل."));

          const username = String(fields.get("username")).trim();
          if (!username) throw new Error(N.t("تحقق من البيانات."));

          const salt = Array.from(
              crypto.getRandomValues(new Uint8Array(16)),
              (v) => v.toString(16).padStart(2, "0"),
            ).join(""),
            passwordHash = await N.hashPassword(password, salt);

          const cfg = {
            username,
            salt,
            passwordHash,
            iterations: 210000,
            revision: new Date().toISOString(),
            baseRevision: window.NOVA_AUTH.revision,
          };

          localStorage.setItem("nova-static-credentials", JSON.stringify(cfg));
          sessionStorage.setItem("nova-static-session", passwordHash);
          render();
          N.toast(N.t("تم تغيير بيانات الدخول لهذا المتصفح."));
        }
      } catch (error) {
        N.toast(error.message, true);
      }
    });

    document.addEventListener('keydown', async event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && N.isLoggedIn()) {
        event.preventDefault();
        if (document.getElementById('editor-form')) document.getElementById('editor-form').requestSubmit();
        else if (!busy && !saving) await save();
      }
      if (event.key === 'Escape') {
        document.querySelector('.admin-sidebar')?.classList.remove('open');
        const scrim = document.querySelector('.sidebar-scrim');
        if (scrim) scrim.hidden = true;
      }
    });
    window.addEventListener("beforeunload", (ev) => {
      if (N.isLoggedIn() && JSON.stringify(data) !== saved) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    });
  }

  async function loadWorkspace() {
    try {
      const local = await N.readLocal("portfolio");
      if (local) data = N.validate(local);
      saved = JSON.stringify(data);
    } catch {
      N.toast(
        N.t("تعذّر الحفظ المحلي. صدّر نسخة احتياطية وتحقق من مساحة المتصفح."),
        true,
      );
    }
  }

  N.renderAdmin = shell;
  N.renderLogin = loginPage;

  N.adminSetTab = (value) => {
    tab = value;
  };

  window.addEventListener("DOMContentLoaded", async () => {
    if (N.isLoggedIn()) await loadWorkspace();
    bind();
    render();
  });
})();
