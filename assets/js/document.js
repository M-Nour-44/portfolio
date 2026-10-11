/* A shared static document builder keeps downloadable HTML in sync with data. */
(function () {
  'use strict';
  const N = window.NOVA;
  N.pageDocument = function ({ admin = false, content = '', data = window.NOVA_DATA } = {}) {
    const prefix = admin ? '../' : '';
    const p = data.profile;
    const title = admin ? 'MN | Dashboard' : `${p.name} | ${p.role}`;
    const scripts = [
      prefix + 'data.js', prefix + 'assets/js/dictionary.js',
      prefix + 'assets/js/icons.js', prefix + 'admin/auth-config.js',
      prefix + 'assets/js/common.js',
      ...(!admin ? [prefix + 'assets/js/effects.js'] : []), prefix + 'assets/js/portfolio.js',
      ...(admin ? [prefix + 'assets/js/document.js', prefix + 'assets/js/admin.js'] : [])
    ];
    return `<!doctype html>
<html lang="en" dir="ltr" data-page="${admin ? 'admin' : 'portfolio'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#060e20">
  <meta name="description" content="${N.esc(admin ? 'MN local content studio.' : p.intro)}">
  <meta name="robots" content="${admin ? 'noindex,nofollow' : 'index,follow'}">
  ${admin ? '' : `<meta property="og:type" content="website"><meta property="og:title" content="${N.esc(title)}"><meta property="og:description" content="${N.esc(p.intro)}">`}
  <title>${N.esc(title)}</title>
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
  <script src="${prefix}assets/js/theme.js"></script>
  <link rel="stylesheet" href="${prefix}assets/fonts.css">
  <link rel="stylesheet" href="${prefix}assets/base.css">
  <link rel="stylesheet" href="${prefix}assets/${admin ? 'admin' : 'portfolio'}.css">
${scripts.map(file => `  <script defer src="${file}"></script>`).join('\n')}
</head>
<body>
  <div id="app">${content}</div>
  <noscript><p class="preview-notice">${admin ? 'Enable JavaScript to use the content editor.' : 'Enable JavaScript for language switching and interactive details.'}</p></noscript>
</body>
</html>
`;
  };
})();
