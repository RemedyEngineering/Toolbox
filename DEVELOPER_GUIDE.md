# Remedy Toolbox — Developer Guide

This toolbox now uses **shared files** so each piece of common code lives in **one place**
instead of being copy-pasted into every page. Edit once → every page updates.

## Folder layout (on the server)

```
/                         ← site root
├─ Remedy_Home.html        (hub: tiles + search)
├─ Remedy_Tools.html       (hub: tiles + search)
├─ Training_Library.html   (hub: docs + search)
├─ Remedy_Profile.html
├─ shared/                 ← ALL shared code lives here (deploy this folder!)
│  ├─ remedy-core.css       brand palette, header, tab nav, toast
│  ├─ header.js             injects header + tabs + greeting (tab list lives here)
│  ├─ achievements.js       the achievements engine + registry (single copy)
│  ├─ feedback.js           the Feedback button/modal (self-mounting)
│  ├─ remedy-logo.png       the logo (referenced, not re-embedded)
│  ├─ search.js             the search engine + index (one copy for all 3 bars)
│  └─ copilot.js            the Ask-Copilot fallback
└─ SubTools/               ← every calculator tool
   ├─ _TEMPLATE.html         starter for a new tool
   ├─ Duct_Sizer.html
   ├─ VAV_Sizer.html
   └─ … etc.
```

> **Important:** pages now depend on the `shared/` folder. Whenever you copy the site
> somewhere, copy `shared/` too. Root pages reference `shared/…`; tools in `SubTools/`
> reference `../shared/…` (the template already does this correctly).

## How to add a NEW standalone tool

1. **Copy** `SubTools/_TEMPLATE.html` → `SubTools/My_Tool.html`.
2. In that file, change three things at the top: the `<title>`, the `window.REMEDY_PAGE`
   `title`, and the **TOOL BODY** + **TOOL LOGIC** sections (your calculator). Everything
   else (header, tabs, greeting, achievements, feedback) is wired automatically.
3. **Make it findable** — add one entry to the `const INDEX = [ … ]` array near the top of
   `shared/search.js`:
   ```js
   { kind:'tool', section:'HVAC', title:'My Tool', url:'SubTools/My_Tool.html',
     desc:'One-line description.', keywords:['my','tool','keywords'] },
   ```
   That single entry makes it searchable in all three search bars. (The hub *tiles* are
   still hand-written HTML on Home/Tools today — adding the tile is the one remaining manual
   step; making tiles registry-driven from this same list is the planned next improvement.)

## How to add a TAB

Edit the `REMEDY_TABS` array near the top of `shared/header.js` — add one entry:
```js
{ key: 'reports', label: 'Reports', file: 'Reports.html' }
```
Every page's nav updates at once.

## Where to change things (each lives in ONE file now)

| Want to change… | Edit |
|---|---|
| Brand colours, header, tab styling, toast | `shared/remedy-core.css` |
| The tab list | `shared/header.js` (`REMEDY_TABS`) |
| Achievements (add/edit/registry) | `shared/achievements.js` |
| The Feedback form (email key, fields) | `shared/feedback.js` |
| The search engine / smart cards | `shared/search.js` |
| The tool & document list (search index) | `shared/search.js` (the `INDEX` array) |
| The Ask-Copilot behaviour / endpoint | `shared/copilot.js` |
| A single tool's calculator | that tool's `SubTools/*.html` |

## Cache-busting (so updates actually show up)

Browsers cache `shared/*.js` and `*.css`. After you edit a shared file, bump the version
query string on the include in the pages — e.g. `header.js?v=1` → `header.js?v=2`. Use the
**same number everywhere** so it's a one-find-and-replace per release.

## Copilot (search bar AI)

Configured at the top of `shared/copilot.js` with one `mode` switch:
- `handoff` (current) — opens each user's Microsoft Copilot and copies the question to the
  clipboard (Copilot can't be reliably pre-filled or forced into the desktop app from a web
  page; the user pastes with Ctrl+V).
- `api` — inline answers via your internal M365 Copilot proxy (set the endpoint). This is the
  only mode where the answer appears automatically.
- `local` — inline answers from a local model server.

Switching modes is a one-line change at the top of the file.

## Status of the migration

- ✅ **Built & ready:** the whole `shared/` library — `remedy-core.css`, `header.js`,
  `achievements.js`, `feedback.js`, `search.js`, `copilot.js`, the logo — plus
  `_TEMPLATE.html` and this guide.
- ⏭ **Final step (needs a browser check):** convert the three hub pages and the existing
  tool pages to *load* the shared files (delete their inlined copies and reference
  `shared/…`). Recommended order: wire **one** hub page, confirm search + Copilot +
  achievements + feedback work in a browser, then roll out to the others and the tools.
  The shared files are drop-in ready for this.
