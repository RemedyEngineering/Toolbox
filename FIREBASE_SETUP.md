# Firebase + Magic-Link Setup (for cross-device profiles)

This is the prep you do **on your end** before we wire real logins + cross-device
sync into the toolbox. It stays on Firebase's **free (Spark) plan** — no billing
required. Budget ~20–30 minutes. When you're done, send me the small config block
from Step 6 and confirm Steps 2–5, and I'll do the code.

> **Why this replaces the current gate:** the sign-in becomes *real* (verified by
> Google's servers), so the "view-source / disable-JS" bypass goes away, and a
> person's profile, theme, and achievements follow them to any device.

---

## Step 1 — Create the Firebase project
1. Go to <https://console.firebase.google.com> and sign in with a Google account
   you're happy to own this under (ideally a Remedy Google account, not personal).
2. Click **Add project** → name it e.g. `remedy-toolbox` → continue.
3. Google Analytics is **optional** — you can turn it off. Click **Create project**.

## Step 2 — Turn on Magic-Link sign-in
1. Left menu: **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab.
3. Click **Email/Password** → **enable** it, and in the same panel toggle **ON**
   the sub-option **Email link (passwordless sign-in)** → **Save**.
   *(Magic link lives inside the Email/Password provider — that's expected.)*

> If you'd rather use **Google sign-in** (one-click, if staff have Google
> Workspace accounts), enable the **Google** provider here instead/as well and
> tell me — the wiring is slightly different but easy.

## Step 3 — Authorize your live domain
1. **Authentication → Settings → Authorized domains → Add domain**.
2. Add your GitHub Pages domain, e.g. `your-username.github.io`
   (and any custom domain you use). `localhost` is already there for testing.

> **Note about "Dynamic Links":** Firebase is retiring Dynamic Links, and you may
> see a warning. It is **not needed** for a website — magic-link sign-in on the web
> uses a normal return URL. Only mobile *apps* needed Dynamic Links. Ignore the
> warning for our purposes.

## Step 4 — Create the database (Firestore)
1. **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (we'll add exact rules next) → pick a
   region close to you (e.g. `nam5` / `us-central`) → **Enable**.

## Step 5 — Lock the database to @remedyeng.com staff
1. In **Firestore Database → Rules**, replace everything with the block below and
   click **Publish**. This makes each person able to read/write **only their own**
   profile, and **only** if signed in with a verified `@remedyeng.com` address —
   enforced by Google's servers, not the browser.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isRemedyStaff() {
      return request.auth != null
          && request.auth.token.email_verified == true
          && request.auth.token.email.matches('(?i).*@remedyeng[.]com$');
    }
    match /users/{uid} {
      allow read, write: if isRemedyStaff() && request.auth.uid == uid;
    }
  }
}
```

## Step 6 — Get the web config (this is what you send me)
1. Click the **gear icon → Project settings**.
2. Scroll to **Your apps** → click the **web** icon **`</>`** → register an app
   (nickname `Remedy Toolbox`, you do **not** need Firebase Hosting).
3. It shows a `firebaseConfig` object. **Copy the whole block** and send it to me:

```js
const firebaseConfig = {
  apiKey: "…",
  authDomain: "remedy-toolbox.firebaseapp.com",
  projectId: "remedy-toolbox",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…"
};
```

> These values are **safe to put in the site's code** — they're identifiers, not
> passwords. Your data is protected by the rules in Step 5, not by hiding these.

---

## What I'll build once you send that
- A real sign-in screen (enter `@remedyeng.com` email → get a one-time link →
  click it → you're in), replacing `gate.js`.
- Move profile (name, avatar), theme choice/custom colours, achievements, and
  favourites into Firestore, so they sync across every device — with the local
  browser copy kept as an offline cache.
- Set it up as a first slice (login + profile) so we can confirm it syncs between
  two devices before extending to the rest.

## Free-tier reality check
Spark (free) covers ~50K reads / 20K writes per day and plenty of auth — a few
dozen staff won't get close. Expected ongoing cost: **$0/month**. The only upkeep
is the Firebase console you now own (e.g. disable a leaver's account there).

---

# ✅ It's now built in — how to finish & test (V1.3.0)

The real login + cross-device sync is **already wired into the toolbox**. Your
`firebaseConfig` is embedded in `shared/auth.js`, and every page now loads Firebase
+ the sign-in gate (the old password gate, `shared/gate.js`, is left in place but no
longer loaded — kept only as a fallback, see Rollback below).

**Before it works, make sure you finished Steps 2–5 above in the Firebase console:**
- [ ] Step 2 — Email link (passwordless) sign-in is **enabled**
- [ ] Step 3 — your GitHub Pages domain (`your-username.github.io`) is in **Authorized domains**
- [ ] Step 4 — Firestore database **created**
- [ ] Step 5 — the security **rules published**

## ⚠️ Important behavior change
Because sign-in is now verified by Google's servers, the toolbox **only runs on the
live, authorized domain** (your `github.io` site, or `localhost` via a local web
server). **Double-clicking the HTML files to open them from disk (`file://`) will no
longer work** — the sign-in can't complete there. It also needs an internet
connection (it was fully offline before). For a hosted staff tool this is normal, but
if anyone relied on local copies, point them at the live URL instead.

## Test it (2 minutes, on the deployed site)
1. Deploy the new build to GitHub Pages and open `https://your-username.github.io/<repo>/`.
2. You'll get the **Staff sign-in** screen. Enter your `@remedyeng.com` email →
   **Email me a sign-in link**.
3. Open the email on the **same device/browser**, click the link — it returns you to
   the site and you're in. (Non-`@remedyeng.com` addresses are refused.)
4. Change something that syncs — e.g. switch to Dark theme, or favorite a tool.
5. **On a second device** (or a different browser), open the site and sign in with the
   same email. Your name, theme, favorites, and achievements should already be there.
6. To sign out (e.g. shared computer): **Profile page → About → Sign out**.

## What syncs
Name, email, avatar, theme (incl. custom colors), favorited tools, tile order, and
achievements. First device to sign in seeds the cloud; after that, settings follow you,
and achievements **merge** (you never lose one earned on another device). Tool working
files (Scratchpad, Schedule Builder drafts) stay local for now — easy to add later.

## Rollback (if you ever need the simple gate back)
`shared/gate.js` is still in the package. To revert, in each page's `<head>` swap the
Firebase + `auth.js` block back to a single `<script src="shared/gate.js?v=1"></script>`
(SubTools use `../shared/`). Tell me and I can do that in one pass.
