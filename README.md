# Pratham Joshi — Field Notes

A personal portfolio: AI/backend work, projects, a photography contact sheet,
poems, a CLI easter-egg, light/dark themes, and a **Gemini-powered "digital twin"**
you can chat with — with the API key kept **off** the page.

Files:
- `index.html` — the whole site (no build step, hostable anywhere static)
- `worker.js` — the tiny proxy that holds your Gemini key as a secret
- `README.md` — this file

---

## 1. Put the site online (GitHub Pages)

1. Create a repo and add `index.html`.
2. Push to GitHub.
3. Repo → **Settings → Pages** → Source: **Deploy from a branch** → `main` / `/(root)` → **Save**.
4. ~1 minute later it's live at `https://<your-username>.github.io/<repo>/`.

> Cleaner URL: name the repo `<your-username>.github.io` and it serves at the root.

The site works immediately. The chat runs in **demo mode** until you do step 3.

---

## 2. The digital twin — key stays secret (no key in the repo or page)

A static page can't hide a key, so we don't put one there. Instead a **serverless
proxy** holds the key as an encrypted secret and does the Gemini call for you. The
browser only ever talks to the proxy.

### Easiest: Cloudflare Workers (free, no card, paste-in-browser)

1. Sign up at **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Create Worker**.
2. Give it a name (e.g. `pratham-twin`) → **Deploy**, then **Edit code**.
3. Delete the sample, paste in everything from **`worker.js`**, and **Deploy**.
4. In `worker.js`, set `ALLOWED_ORIGINS` to your site, e.g.
   `"https://<your-username>.github.io"` (origin only — no path). Re-deploy.
5. Add the key as a secret: Worker → **Settings → Variables → Add variable**,
   name it exactly **`GEMINI_API_KEY`**, paste your key, tick **Encrypt**, save.
   (Get a free key at https://aistudio.google.com/app/apikey.)
6. Copy your Worker URL (looks like `https://pratham-twin.<you>.workers.dev`).
7. In `index.html`, set `PROXY_URL` in the `CONFIG` block to that URL. Re-deploy the site.

Done — the chat is live and your key never leaves Cloudflare.

> Prefer Vercel? Drop `worker.js`'s logic into `api/twin.js` as an Edge Function,
> set `GEMINI_API_KEY` in Project → Settings → Environment Variables, and point
> `PROXY_URL` at `https://<project>.vercel.app/api/twin`. Same idea, same secrecy.

### Why this is safe
- The key lives only in Cloudflare's secret store.
- `ALLOWED_ORIGINS` stops other sites from spending your quota.
- The persona lives in the Worker, so nobody can repurpose your proxy as a free chatbot.
- `maxOutputTokens` is capped, so replies stay small.

If the model name errors, edit `MODEL` in `worker.js` (`gemini-2.5-flash` /
`gemini-1.5-flash`) and re-deploy.

---

## 3. Add your photos

The contact sheet is the `PHOTOS` array near the top of the script in `index.html`.

1. Make a folder called **`photos`** in your repo.
2. Add your images (on github.com you can literally **drag files** into the folder —
   no git needed). Keep them reasonably sized (≈1600px wide, < ~500 KB each).
3. For each photo, set `src` to its path:
   ```js
   { place:"Spiti Valley, HP", meta:"35mm · f/8 · cold light", tone:["#1b2a3a","#3a5a72","#dfe9f0"], src:"photos/spiti.jpg" },
   ```
4. Any entry with an empty `src` shows a filmic colored placeholder instead — handy
   while you're still gathering shots. `tone` is just the placeholder's colors.

Edit `place` and `meta` to whatever you like; they show under each frame and in the
enlarged view.

---

## 4. Poems

The `POEMS` array (top of the script) holds your verse. Each poem:
```js
{ title:"Window Seat", place:"a slow train", date:"travel",
  lines:`line one
line two

new stanza after a blank line` }
```
Line breaks and blank lines between stanzas are preserved exactly. Add as many as
you want — the layout flows them into columns. The five there now are placeholders;
swap in your own.

---

## 5. Résumé button

In `CONFIG`, set `RESUME_URL`:
- **Cleanest:** commit a PDF to the repo (e.g. `resume.pdf`) and use `"resume.pdf"`.
  Loads instantly, looks professional, no third-party UI.
- **Or** a Google Drive share link set to *Anyone with the link → Viewer*.

Leave it `""` and the résumé buttons (hero + footer) hide themselves automatically.

---

## 6. Light / dark theme
Toggle with the ☾ / ☀ button in the header. The site remembers your choice
(when the browser allows storage) and defaults to dark.

---

## Design notes
- **Type:** Fraunces (display + verse), Inter (body), JetBrains Mono (labels / terminal).
- **Color story:** cyan = the machine/system side, amber = the human/analog side
  (photography, poems, travel).
- Respects `prefers-reduced-motion`, responsive to mobile, keyboard-friendly
  (Esc / arrows in the photo viewer; ↑↓ history + Tab-complete in the terminal).

Built to be edited. ⚡