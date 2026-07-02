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
