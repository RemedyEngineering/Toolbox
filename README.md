# Remedy Toolbox

Internal engineering tools (HVAC, plumbing, fire-protection calculators) as a set of
static HTML pages. No build step, no server code — it runs straight from files.

## Hosting on GitHub Pages

Everything needed to go live is already here:

- **`index.html`** — the site entry point. GitHub Pages serves this first; it forwards to
  `Remedy_Home.html` (the hub). The hub stays the single source for the home screen.
- **`.nojekyll`** — tells GitHub Pages **not** to run Jekyll. This is required so files and
  folders that start with an underscore (e.g. `SubTools/_TEMPLATE.html`) are published
  instead of silently skipped.

### Steps

1. Create a GitHub repository and push the **contents of this folder** to the repo root
   (so `index.html`, `shared/`, and `SubTools/` sit at the top level of the repo).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**, pick your branch
   (usually `main`) and folder **`/ (root)`**, then **Save**.
4. Wait ~1 minute. Your site will be live at
   `https://<your-username>.github.io/<repo-name>/`.

> **Case sensitivity:** GitHub Pages runs on Linux, which is case-sensitive (Windows is not).
> Links must match file names exactly — e.g. `SubTools/Duct_Sizer.html`, not
> `subtools/duct_sizer.html`. If a page 404s live but works on your PC, check the casing.

## Versioning

The current version is shown on the **Profile** page (**About** card) and is defined by a
single constant near the bottom of `Remedy_Profile.html`:

```
VXX.YY.ZZ
  XX = major   large releases / redesigns
  YY = minor   a new tool or feature added
  ZZ = patch   small hotfixes (e.g. the readability/colour pass)
```

Bump that one constant when you cut a release.

## Staff access + cross-device sync (Firebase)

Every page loads Firebase + **`shared/auth.js`**, which shows a real **magic-link
sign-in** before the tools can be used: a person enters their `@remedyeng.com` email,
gets a one-time link, and clicks it. Sign-in is verified by Google's servers (no
bypass), and each person's profile, theme, favorites, and achievements sync across
their devices via Firestore.

- **Only runs on the live authorized domain** (your `github.io` site, or `localhost`
  via a local server) — not from `file://`. Requires internet.
- To finish setup / test / change the password model, see **`FIREBASE_SETUP.md`**.
- The old static password gate, `shared/gate.js`, is kept as a **rollback** only (not
  loaded). See the Rollback section in `FIREBASE_SETUP.md`.

## Mobile / phone layout

Phone and tablet styling lives in **`shared/mobile.css`** (loaded last in every page's
`<head>`). Because the header, tab nav, cards and layout containers are the same on every
page, editing this one file adjusts the mobile experience everywhere. Tool-specific tweaks
still live in each tool's own `<style>`.

## Editing shared code

Brand colours, theme (light/dark/custom), header, search, achievements, feedback, the
access gate, and the mobile layer all live in `shared/`. Edit once → every page updates.
After editing a shared file, bump its `?v=` number in the page includes so browsers reload
it (see `DEVELOPER_GUIDE.md`).

## Coming next: cross-device profiles

To let a user's profile/theme/achievements follow them between devices, see
**`FIREBASE_SETUP.md`** — it walks through the (free) Firebase + magic-link setup to do on
your end before that feature is wired in.
