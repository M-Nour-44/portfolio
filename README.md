<div align="center">

# Mohamad Nour Almasri — Personal Portfolio

**Computer Engineer · Web & Backend Developer**

A modern, multilingual portfolio built to showcase my background, technical skills, projects, and professional experience — with a clean interface and a lightweight, dependency-free architecture.

[View Repository](https://github.com/M-Nour-44/portfolio) · [Get in Touch](mailto:mhmdnormasre99@gmail.com)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No Build Step](https://img.shields.io/badge/Build%20Step-Not%20Required-0A66C2)

</div>

---

## Overview

This repository contains my personal portfolio website, designed with an emphasis on clarity, performance, accessibility, and maintainability. It presents my work and skills through a responsive interface while keeping the underlying stack simple: **HTML, CSS, and vanilla JavaScript**.

The portfolio also includes a **browser-based content editor** for maintaining profile information, projects, certificates, translations, and other site content without introducing a backend or database server.

## Highlights

- **Responsive design** — layouts adapted for desktop, tablet, and mobile screens.
- **Three languages** — English, Turkish, and Arabic, including right-to-left layout support.
- **Light and dark themes** — a consistent visual identity across both modes.
- **Subtle interactive effects** — animated particles, decorative circuits, and section-aware navigation.
- **Accessibility-conscious motion** — respects reduced-motion preferences and pauses effects when the page is hidden.
- **Content-driven sections** — unpublished or empty project and certificate sections stay hidden.
- **Professional profile** — introduction, technical skills, résumé, and contact links.
- **Local content management** — browser-based editing, preview, draft visibility, and import/export tools.
- **Static hosting ready** — no mandatory package installation, framework, or build pipeline.

## Tech Stack

| Area | Technology |
| --- | --- |
| Structure | HTML5 |
| Styling | CSS3, responsive layouts, local fonts |
| Interactivity | Vanilla JavaScript |
| Localization | English, Turkish, Arabic |
| Local editor storage | IndexedDB |
| Deployment | GitHub Pages or any static web host |
| Optional maintenance and tests | Node.js (built-in modules; no npm dependencies required) |

> The site displays additional backend technologies among my personal skills; they are **not dependencies of this portfolio**.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/M-Nour-44/portfolio.git
cd portfolio
```

### 2. Run locally

Open the folder in **Visual Studio Code** and use the **Live Server** extension to serve `index.html`.

Alternatively, if Python is installed:

```bash
python -m http.server 5500
```

Then visit **http://localhost:5500**.

> The public site is static. You do not need `npm install`, React, or a JavaScript bundler.

## Content Management

The repository includes a local content editor at:

```text
/admin/
```

You can also use `admin.html` as an entry point.

The editor supports updating profile details, managing projects and certificates, adjusting translations, previewing changes, and controlling which entries appear publicly.

**Important:** Changes made in the editor are stored **locally in the current browser** using IndexedDB. Saving an edit does **not** update the deployed website automatically.

### Publish your edits

1. Make your changes in the editor and preview the result.
2. Open the editor's publishing/export section.
3. Export the updated `data.js` and `index.html` files.
4. Replace the corresponding files in your repository or hosting directory.
5. Commit and deploy the updated files.

Keep the `assets/` and `admin/` directories when transferring or deploying the site. Back up local editor data before changing devices or clearing browser storage.

> **Security note:** The built-in editor uses client-side access controls only. It is **not secure server-side authentication** and must not be relied upon to protect confidential data. Do not place API keys, secrets, or private information in this public repository. A production-grade, remotely managed admin panel would require a backend with proper authentication and authorization.

## Project Structure

```text
portfolio/
├── index.html               # Public portfolio page
├── data.js                  # Published portfolio content
├── admin.html               # Shortcut to the editor
├── admin/
│   ├── index.html           # Browser-based content editor
│   └── auth-config.js       # Client-side editor configuration
├── assets/
│   ├── base.css             # Design tokens and shared styles
│   ├── portfolio.css        # Public page layout and styles
│   ├── admin.css            # Editor styles
│   ├── fonts.css            # Local font definitions
│   ├── fonts/               # Font assets and license files
│   ├── profile/             # Profile image and résumé
│   └── js/                  # Application, editor, and effect scripts
├── scripts/
│   └── generate.mjs         # Optional static HTML generation
├── tests/
│   ├── check.mjs            # Project consistency checks
│   └── effects.mjs          # Navigation and visual-effect tests
├── .nojekyll               # GitHub Pages compatibility
└── README.md
```

## Validation and Maintenance

If Node.js is installed, you can run the included checks without installing third-party packages:

```bash
node tests/check.mjs
node tests/effects.mjs
```

To regenerate the published HTML files from the current content data:

```bash
node scripts/generate.mjs
```

**Note:** The generation command writes to `index.html` and `admin/index.html`. Review or commit your work before running it if you have made manual edits to those files.

These scripted checks do not replace visual testing in real desktop and mobile browsers.

## Deployment

The portfolio can be deployed to **GitHub Pages** or another static host.

For GitHub Pages:

1. Open your repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose the `main` branch and the `/ (root)` folder, then save.
4. After deployment is enabled, use the Pages URL shown in your repository settings.

For other static hosts, upload the repository's public HTML, JavaScript, CSS, and asset files while preserving their relative directory structure.

No server-side runtime or build step is required for the published portfolio.

## Customization

| What to change | Where |
| --- | --- |
| Public content | Local editor, then export `data.js` and `index.html` |
| Colors and shared styles | `assets/base.css` |
| Portfolio layout and responsiveness | `assets/portfolio.css` |
| Theme switching | `assets/js/theme.js` |
| Animations and section navigation | `assets/js/effects.js` |
| Language strings | `assets/js/dictionary.js` and the content editor |
| Profile photo and résumé | `assets/profile/` |

## Contact

I'm interested in building practical, reliable software and connecting with people working on meaningful projects.

- **Email:** [mhmdnormasre99@gmail.com](mailto:mhmdnormasre99@gmail.com)
- **GitHub:** [M-Nour-44](https://github.com/M-Nour-44)

---

<div align="center">

**Designed and developed by Mohamad Nour Almasri**

</div>
