# Money Manager Premium

## Structure
- `dashboard.html` — dashboard page
- `category.html` — individual category page
- `history.html` — archived budgets page
- `setup.html` — create/start budget page
- `styles.css` — premium responsive design
- `app.js` — shared data layer, IndexedDB persistence, actions
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — offline cache

## Improvements
- Real separate pages instead of query-string SPA views.
- IndexedDB persistence with localStorage fallback.
- Responsive desktop/tablet/mobile layout.
- Safer numeric validation and expense deletion.
- Proper budget/category/history navigation.
- Cleaner modal interactions and event delegation.
- Offline/PWA caching updated to include every page and shared asset.
- Premium visual system with sidebar navigation, cards, progress bars and polished spacing.

Open `index.html` through a local/static server for best PWA/IndexedDB behavior.
