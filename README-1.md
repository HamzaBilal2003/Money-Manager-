# Money Manager

A lightweight, installable budget tracker for splitting your money into categories, logging expenses against each one, and closing out months to track savings over time.

Built as a single-page app with no framework, no build step, and no backend — just HTML, CSS, and vanilla JavaScript.

---

## Features

- **Category-based budgeting** — split one monthly budget across multiple categories (e.g. Petrol, Outside Food, House Expense)
- **Per-category expense tracking** — log an expense against a specific category and see its remaining balance update instantly
- **Dashboard overview** — total budgeted, total spent, and total remaining at a glance, plus a breakdown per category
- **Custom category colors** — pick from a preset palette or choose a custom color per category
- **Monthly cycle** — end the current month to lock it into history, then start a new budget (previous category names and amounts are carried over as a starting point)
- **Savings history** — every closed month is saved with its totals, so you can see how much you carried over across months
- **Persistent data** — your budget and history are saved automatically and reload the same way after closing the app
- **Responsive design** — adapts from small phones up to tablets and desktop
- **Installable (PWA)** — can be installed to a phone's home screen and opened like a native app, including offline access

---

## Tech Stack

| Layer         | Choice                          |
|---------------|----------------------------------|
| Markup/Styles | Plain HTML5 + CSS3 (no framework) |
| Logic         | Vanilla JavaScript (no build tools) |
| Persistence   | Key-value storage API (per-user, private) |
| Offline/Install | Web App Manifest + Service Worker |

No npm install, no bundler, no dependencies. Open the file and it runs.

---

## Project Structure

```
money-manager-app/
├── index.html            # The entire application (markup, styles, and logic)
├── manifest.webmanifest  # PWA metadata — app name, colors, icons
├── service-worker.js     # Caches app assets for offline use and installability
├── icon-192.png          # App icon (small)
└── icon-512.png          # App icon (large)
```

If you only need the app itself with no install/offline support, `index.html` alone is fully functional on its own.

---

## Getting Started

### Option 1 — Just open it
Double-click `index.html` (or `money-manager.html`) and it opens in your browser. Fully functional immediately — no server required.

### Option 2 — Install it as an app (Android/Chrome)
Installability requires the manifest and service worker to be served over **HTTPS** (browsers block installation from local files for security reasons).

1. Keep all five files in the `money-manager-app` folder together — the paths between them are relative.
2. Deploy the folder to any static host, for example:
   - [Vercel](https://vercel.com)
   - [Netlify](https://netlify.com)
   - [GitHub Pages](https://pages.github.com)
   - [Firebase Hosting](https://firebase.google.com/products/hosting)
3. Open the hosted URL in Chrome on Android.
4. Tap **Install app** (or **Add to Home screen**) when prompted.
5. The app now opens full-screen, without browser chrome, and works offline.

---

## Usage Guide

### 1. Set up your first budget
On first launch, name your budget (defaults to the current month) and add categories with an allocated amount and a color.

### 2. Log an expense
Tap the **+** on any category card from the dashboard, or open a category and tap **Add expense**. Enter an amount and an optional note.

### 3. Track your progress
The dashboard shows totals across all categories. Each category card shows its own spent/remaining amount and a progress bar that turns red if it goes over budget.

### 4. Close the month
Tap **End month & start new** on the dashboard. This locks the current budget into your history with its final totals, then opens setup for the next month — your category names and amounts are pre-filled so you only need to adjust what's changed.

### 5. Review your history
Open the history tab (icon top-right of the dashboard) to see every closed month with its total, spent, and remaining, plus a running total of what's been carried over across all closed months.

---

## Data & Privacy

All budget and history data is stored using the app's private key-value storage — it is tied to your account and is not shared with, or visible to, other users. There is no external server, analytics, or tracking involved.

---

## Customization

- **Theme colors** — defined as CSS custom properties at the top of the `<style>` block in `index.html` (`--green`, `--green-deep`, `--bg`, etc.)
- **Category color palette** — defined in the `COLORS` array near the top of the `<script>` block; add or remove hex values to change the preset swatches
- **Currency symbol** — search for `$` in the formatting logic and swap for your preferred currency symbol

---

## Browser Support

Works in all modern browsers (Chrome, Edge, Safari, Firefox). Installability as a PWA is supported on Chrome/Edge (Android and desktop) and Safari (iOS, via "Add to Home Screen").

---

## License

Free to use, modify, and distribute for personal or commercial use.
