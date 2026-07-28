# 🌌 Stardance // APOD Dashboard Devlogs

Hey! This is my devlog documenting how I built the NASA Astronomy Picture of the Day (APOD) Mission Control dashboard. 

---

## 📟 Project Logs Status

| Log # | Phase / Feature | Status | Core Tech Used |
| :--- | :--- | :--- | :--- |
| **#1** | Fetching NASA APOD API Data | `COMPLETED` | Vanilla JS Fetch, dotenv config |
| **#2** | Retro-Futuristic HUD Design & CSS | `COMPLETED` | CSS variables, Google Fonts, Parallax Starfield |
| **#3** | Radar Loading Indicator | `COMPLETED` | CSS rotate keyframes, dynamic DOM swaps |
| **#4** | Displaying Different Media Types | `COMPLETED` | YouTube parsing, responsive video iframes |
| **#5** | Paging Dates & Keyboard Navigation | `COMPLETED` | Event listeners, Date boundaries, keydown hooks |
| **#6** | Local Proxy, Direct Downloads & Clean Up | `COMPLETED` | Vite Proxy, Netlify rewrites, AbortController timeout |

---

## 🛰️ Log #1: Fetching NASA APOD API Data
**Date:** July 24, 2026

First day of the project. My goal was simple: connect my code to NASA's public database and pull the daily picture metadata. I registered for a NASA developer API key, created a local `.env` file in Vite to store it safely, and wrote a clean JavaScript `fetch` wrapper. The fetch handles network errors and successfully outputs raw JSON data in the console.

---

## 🎨 Log #2: Retro-Futuristic HUD Design & CSS
**Date:** July 24, 2026

Today I focused entirely on design. I didn't want a generic grid list, so I went for a retro-futuristic spaceship HUD (Heads-Up Display) aesthetic. I imported three custom fonts from Google Fonts (`Orbitron`, `Space Grotesk`, and `Black Ops One`) and set up high-contrast neon CSS variables. I also added three layers of parallax stars using pure CSS translation loops to make the background feel like scrolling deep space.

---

## 🌀 Log #3: Radar Loading Indicator
**Date:** July 24, 2026

Sometimes the high-resolution images from NASA take a few seconds to load. Having a blank screen during the fetch looked terrible, so I built a glowing, circular radar loader. I wrote a CSS animation that handles both the rotation and a glowing shadow pulse. In `main.js`, I added a `showLoading` state that replaces the container HTML during fetching, removing layout shifts.

---

## 🖼️ Log #4: Displaying Different Media Types
**Date:** July 24, 2026

While testing various dates, I noticed a big bug: the APOD API doesn't just return images. On some days, they post YouTube video streams or interactive space maps. Trying to render a video inside an `<img>` tag broke the site. I wrote a helper function `buildMediaHTML(data)` to inspect `media_type`. If it's a video, it parses the YouTube ID and loads it inside a clean, autoplaying, and muted `<iframe>` container.

---

## 🧭 Log #5: Paging Dates & Keyboard Navigation
**Date:** July 25, 2026

I wanted a quick way to browse different days. I added 'PREV SOL' and 'NEXT SOL' chevron buttons and set the date boundary rules—you can't step earlier than NASA's first post (June 16, 1995) or past today's date. I also hooked up browser keydown listeners so you can page through days using the Left and Right Arrow keys. After that, I built an 'Auto-Scan' mode that cycles random space pictures every 15 seconds. If you manually select a date, the scanner pauses so it doesn't interrupt your reading.

---

## 🚀 Log #6: Local Proxy, Direct Downloads & Clean Up
**Date:** July 25, 2026

Final touch-ups today! Sometimes the NASA API hangs indefinitely, leaving the site stuck. I wrapped the fetches in a custom 8-second timeout using `AbortController` so it fails gracefully. 

Also, the 'Download Image' button was opening in a new tab due to CORS blocks on NASA's servers. To fix this, I set up a local proxy rewrite in `vite.config.js` and a deployment rewrite in `netlify.toml`. Now, clicking download actually fetches the image as a binary blob and saves it directly to the user's PC. Finally, I stripped out all internal code comments to keep it tidy and deployed the final package to Netlify! Done!
