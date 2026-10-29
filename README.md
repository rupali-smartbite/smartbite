# SmartBite: AI food health scanner for India

Live app: https://smartbite-pro.netlify.app
Atal Tinkering Lab project.

## What it is built with

| Part | Language / tool | Where |
|---|---|---|
| Frontend (the app people use) | HTML, CSS, JavaScript (no framework) | `public/` |
| Backend (the API) | JavaScript on Node.js, as Netlify Functions | `netlify/functions/`, `netlify/lib/` |
| Storage | Netlify Blobs (photos, sponsor enquiries, rate-limit counters) | on Netlify |
| Food data | Built-in database + Open Food Facts (world food database) | `public/js/data.js`, `public/js/india-db.js` |
| AI (photo scan, Bitu chat) | Claude, through Netlify AI Gateway | `netlify/functions/analyze.mjs`, `chat.mjs` |
| Hosting | Netlify | `netlify.toml` |
| Hardware version | C++ (Arduino) on ESP32 | separate sketch |

## Folders

```
public/                 the website
  index.html            app shell: splash, no-JS fallback, HTML templates
  about.html            project page (plain HTML)
  styles.css            all styling (light/dark themes)
  js/app.js             screens, login, scanning, swaps, shop, games
  js/score.js           health scoring rules (adult and child verdicts, junk meter)
  js/data.js            built-in products, fresh foods, additives
  js/india-db.js        verified Indian-pack products (Sprite, Maaza, Haldiram's, Parle...)
  js/i18n.js            English, Hindi, Marathi text
  js/validate.js        partner form checks (used by the app and the server)
netlify/functions/      the API, one file per address (/api/...)
netlify/lib/            shared backend code (Open Food Facts, security guard, shop)
database/               the whole built-in database as Excel and JSON
netlify.toml            hosting settings and security headers
```

## Why index.html is small, and why "Inspect" shows more

SmartBite is a **single-page app**, the same way Gmail or YouTube on the web work.

- `public/index.html` is the **app shell**: page structure, splash screen, the no-JavaScript fallback, search-engine data and HTML `<template>`s for fixed screens such as the Partner form.
- Screens that depend on your data (home, scan results, swaps, games, tracker) are built by `public/js/app.js` while the app runs. For example `screenHome()` and `screenSwaps()` write that screen's HTML.
- So when you right-click → **Inspect** on the live site, you see the **live page after JavaScript has filled it in**, which is much more HTML than the file. GitHub counts the HTML written inside JavaScript files as JavaScript, which is why the language bar shows mostly JavaScript and CSS.
- `public/about.html` is a normal static HTML page about the project.

Why build it this way: switching screens never reloads the page, so it feels like a phone app and works well on slow mobile internet.

## How verdicts stay consistent

The same product must always get the same verdict. A packet photo is resolved in this order:

1. **Verified database** (`india-db.js`, `data.js`): Indian pack values. Always wins when the product is recognised.
2. **Numbers read from the back of the pack**, only if they add up (sugar not more than carbs, calories match fat + carbs + protein). Blurry photos fail this check instead of giving a wrong score.
3. **Open Food Facts**, Indian packs first. Recipes differ by country (Sprite: UK 3.3 g sugar, India 9.8 g, US 10.7 g per 100 ml), which is what made scores jump before.
4. **AI estimate**, clearly marked "verify with pack".

Scores are then worked out by fixed rules in `score.js` (never by the AI), with WHO / ICMR-NIN limits.
Typing errors in crowd-sourced data (for example sodium typed 1000 times too big) are corrected before scoring.
Sugar-free and diet variants are never matched to the regular product.

## Security

- No passwords, API keys or secret keys in the code. Secrets live only in Netlify environment variables.
- Strict Content-Security-Policy: only the app's own scripts run (plus the barcode scanner, pinned with an integrity hash). No inline scripts, so injected code cannot run. Other sites cannot frame the app.
- HTTPS forced (HSTS), no MIME sniffing, camera allowed only for the app itself, microphone and location blocked.
- The API only accepts requests from the SmartBite site itself, and has per-visitor rate limits, so nobody can misuse the AI or flood the database.
- Visitors are identified only by a salted one-way hash of their IP address. IP addresses and health details are never stored on the server; it only keeps what people choose to send (sponsor enquiries).
- Each user's profile, history and coins stay on their own phone only, and are wiped on log out or when someone else logs in.
- Every input is length-limited and cleaned; everything shown on screen is escaped.

### Environment variables (Netlify > Site configuration > Environment variables)

| Name | What for | Needed? |
|---|---|---|
| `ASSET_UPLOAD_KEY` | Lets the owner upload new app photos. Leave unset to keep uploads switched off. | Optional |
| `VISITOR_SALT` | Any long random text. Makes visitor hashes impossible to reverse. | Recommended |
| AI Gateway | Switched on in Netlify (AI features). No key needed in the code. | For photo scan and Bitu |

## Deploy

Drag the project zip onto https://app.netlify.com/projects/smartbite-pro/deploys, or connect a Git repository.
Payments (Razorpay) are prepared but not connected: see the plan in `app.js` (`startPayment`) and `netlify/functions/shop.mjs`.
When Razorpay is added, add `https://checkout.razorpay.com` to `script-src` and `frame-src` in `netlify.toml`.

## Data credits

Open Food Facts (ODbL), Unsplash and Pexels photos, WHO and ICMR-NIN guidance.
