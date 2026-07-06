# Janaka Heshan — Portfolio

A premium, fully responsive personal portfolio for **Janaka Heshan**, a Computer
Hardware Technician & Web Developer based in Kegalle, Sri Lanka.

Design language: **"PCB after dark"** — a deep circuit-board void background,
copper solder-point accents, and a cyan trace glow, tying together Janaka's two
crafts (hardware repair and web development) into one visual identity. The
signature element is the vertical circuit trace running down the left edge of
the page, which doubles as the scroll-progress indicator.

Built with plain HTML, CSS, and JavaScript — no build step, no framework,
no dependencies to install for the front end.

---

## Project structure

```
portfolio/
├── index.html              Main site (all sections)
├── 404.html                 Custom error page
├── manifest.json             PWA manifest
├── sw.js                    Service worker (offline caching)
├── css/
│   └── style.css             All styling, design tokens at the top
├── js/
│   └── script.js              All interactivity, split into small init*() modules
├── assets/
│   └── icons/
│       ├── favicon.svg
│       ├── icon-192.png
│       └── icon-512.png
├── backend-example/           Optional reference backend for the contact form
│   ├── server.js
│   └── package.json
└── README.md
```

---

## Features implemented

- Custom animated loading screen with progress bar
- Circuit-trace scroll progress indicator (fixed left rail, desktop only)
- Canvas particle background with connecting trace lines (respects
  `prefers-reduced-motion`)
- Custom animated cursor (disabled automatically on touch devices)
- Sticky header that condenses and blurs on scroll
- Fully responsive nav with animated mobile menu
- Hero section with a typing effect cycling through:
  Web Developer → Computer Hardware Technician → Freelancer
- Scroll-triggered reveal animations (IntersectionObserver)
- Animated skill bars + a radial "client satisfaction" chart
- Services grid, glassmorphism project/testimonial/contact cards
- Filterable project grid with **live GitHub API sync** (falls back to a
  static list if the API is unreachable or rate-limited)
- Animated timeline for career milestones
- Animated stat counters
- Testimonial carousel with autoplay, arrows, and dot navigation
- Contact form with client-side validation, a honeypot spam trap, and a
  pluggable submission endpoint (falls back to `mailto:` if no backend is
  configured)
- Back-to-top button
- SEO: meta description/keywords, canonical tag, Open Graph + Twitter Card
  tags, and a `Person` JSON-LD structured data block
- Accessibility: skip link, visible focus states, `aria-*` attributes on
  interactive controls, semantic landmarks, reduced-motion support
- PWA: manifest + service worker for offline caching of the app shell
- Custom 404 page matching the design system

---

## Before you go live — checklist

1. **Contact form backend.** By default the form has no server to send to,
   so it opens the visitor's email client via `mailto:` as a graceful
   fallback. To make it fully automatic:
   - Use the included reference implementation in `backend-example/` (Node +
     Express + Nodemailer), **or**
   - Use a hosted form service like Formspree, Web3Forms, or Getform.
   - Either way, set `CONTACT_ENDPOINT` near the top of `js/script.js` to
     your endpoint URL.

2. **GitHub username.** The projects section calls the GitHub REST API for
   `janakaheshan`. Update the username in the `fetch()` call inside
   `initProjects()` in `js/script.js` if the real handle differs, and update
   the GitHub/LinkedIn links in `index.html`'s contact and footer sections.

3. **Domain.** Replace `https://janakaheshan.dev/` in the `<meta>` tags and
   JSON-LD block in `index.html` with the real production domain once
   you know it (used for canonical URL and Open Graph previews).

4. **Open Graph image.** Add a real `assets/img/og-cover.jpg` (1200×630px)
   for link previews on social platforms, replacing the placeholder path.

5. **Content accuracy.** Testimonials, stats, and the "Signature Build"
   client-satisfaction number are placeholder content written to match the
   brief — swap in real numbers and quotes as they become available.

---

## Running locally

No build step is required. Any static file server works:

```bash
# Option A — Python
python3 -m http.server 8080

# Option B — Node
npx serve .
```

Then open `http://localhost:8080`.

> Note: the service worker and manifest icons only activate correctly when
> served over `http://localhost` or `https://` — opening `index.html`
> directly via `file://` will skip PWA features but everything else works.

---

## Deployment

### Deploying to GitHub Pages

1. Push this project to a GitHub repository (e.g. `janakaheshan/portfolio`).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the `main` branch and `/ (root)` folder, then **Save**.
5. GitHub will publish the site at
   `https://<username>.github.io/<repo-name>/` within a minute or two.
6. If using a custom domain, add a `CNAME` file at the project root
   containing your domain, and configure the DNS records GitHub provides
   under **Settings → Pages → Custom domain**.

Because this is a static site with relative paths, no additional
configuration is required for GitHub Pages.

### Deploying to Netlify

**Option A — drag and drop**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the entire `portfolio/` folder onto the page.
3. Netlify deploys instantly and gives you a live URL.

**Option B — Git-based deploy (recommended for updates)**
1. Push the project to GitHub/GitLab/Bitbucket.
2. In Netlify, click **Add new site → Import an existing project**.
3. Connect your repository.
4. Build settings:
   - **Build command:** *(leave blank — no build step needed)*
   - **Publish directory:** `.` (project root, where `index.html` lives)
5. Click **Deploy site**.
6. Optionally add a custom domain under **Site configuration → Domain
   management**.

### Deploying the optional contact-form backend

The example in `backend-example/` is a plain Node/Express app and can be
deployed to any Node host (Render, Railway, Fly.io, a VPS, etc.):

```bash
cd backend-example
npm install
# set EMAIL_USER / EMAIL_PASS / PORT in a .env file
npm start
```

Then point `CONTACT_ENDPOINT` in `js/script.js` at the deployed API URL
(e.g. `https://your-api.onrender.com/api/contact`).

---

## Browser support

Built with modern, broadly supported CSS/JS (CSS custom properties,
`backdrop-filter`, `IntersectionObserver`, `fetch`). Degrades gracefully —
glass effects and particle background simply become plain backgrounds on
very old browsers, and all core content remains readable and functional
with JavaScript disabled (except for the animated interactive extras).

---

## Credits

Fonts: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk),
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), and
[Inter](https://fonts.google.com/specimen/Inter), via Google Fonts.

Design & build: crafted for Janaka Heshan.
