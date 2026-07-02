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

## Editing shared code

Brand colours, theme (light/dark/custom), header, search, achievements and feedback all live
in `shared/`. Edit once → every page updates. After editing a shared file, bump its `?v=`
number in the page includes so browsers reload it (see `DEVELOPER_GUIDE.md`).
