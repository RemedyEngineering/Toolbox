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

## Staff access gate

Every page loads `shared/gate.js`, which shows a sign-in overlay before the tools
can be used. A visitor must enter:

- an email ending in **`@remedyeng.com`**, and
- the shared team password.

Once they pass, the browser is remembered (via `localStorage`) so each person only
signs in **once per device**.

> ⚠️ **This is a deterrent, not real security.** Because the site is fully static,
> the check runs in the browser. Someone technical can read the page source, disable
> JavaScript, or clear the stored flag to bypass it. The password is stored as a hash
> (not plain text) so it isn't handed out in "View Source", but that only stops casual
> snooping. If you need genuine protection for sensitive content, host it behind real
> authentication (a server login, Cloudflare Access, or a private site) instead of — or
> in addition to — this gate.

**To change the password or domain**, edit the constants at the top of `shared/gate.js`:
- Domain: `DOMAIN_RE`.
- Password: replace `PWHASH` with the djb2 hash of the new password (the file explains how).
- To force everyone to sign in again after a change, bump `KEY` (`remedy.gate.v1` → `v2`).

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
