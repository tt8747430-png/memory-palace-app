# Memory Palace Manager

A comprehensive web application for organizing and managing your memory palaces using the Method of Loci technique.

## Features

- ✅ **Create & Manage**: Create, edit, and delete memory palaces
- 📄 **Duplicate & Undo**: Duplicate a palace instantly and undo accidental deletes
- 🔍 **Search & Filter**: Quick search by name, location, book, or tags
- 🔗 **Connect Palaces**: Link related palaces together
- 📊 **Track Progress**: Monitor stations, verses, and completion
- 🧠 **Quiz Practice Mode**: Practice with multiple-choice and typed recall prompts
- 📈 **Richer Analytics**: Review weakest palaces, recent sessions, and 7-day activity
- 🏷️ **Organize with Tags**: Categorize palaces with custom tags
- 💾 **Import/Export**: Backup and share palaces as JSON files
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ☁️ **Cloud Sync**: Optional Google sign-in sync across desktop/mobile
- 🔄 **Smart PWA Updates**: Fresh app versions can prompt for immediate refresh
- 💡 **Persistent Storage**: Data saved automatically in browser (guest + per-user scope)

## Quick Start

### Running the App

Start a local server:

```bash
npm run dev
# or
python3 -m http.server 8000
```

Then visit `http://localhost:8000`

> Recommended: use `http://localhost:8000` instead of opening `index.html` directly so the Service Worker, caching, and
> install/update behavior work correctly.

## Project Structure

```
MemoryPalaces/
├── index.html              # Main HTML file
├── package.json            # Project metadata & scripts
├── vercel.json             # Vercel deployment config & headers
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (caching & updates)
├── eslint.config.js        # ESLint configuration (flat config)
├── vitest.config.js        # Vitest test configuration
├── jsconfig.json           # JS/IDE type-checking config
├── .editorconfig           # Editor configuration
├── .prettierrc             # Prettier configuration
├── AGENTS.md               # Developer guide & conventions
├── README.md               # This file
├── src/
│   ├── css/
│   │   ├── variables.css   # CSS custom properties
│   │   ├── base.css        # Base styles & resets
│   │   ├── components.css  # Component styles
│   │   ├── layout.css      # Layout styles
│   │   ├── features.css    # Feature-specific styles
│   │   ├── responsive.css  # Media queries & breakpoints
│   │   └── theme-dark.css  # Dark mode overrides
│   └── js/
│       ├── app.js          # Application entry point
│       ├── types.js        # JSDoc type definitions
│       └── modules/
│           ├── PalaceManager.js    # Palace data CRUD & persistence
│           ├── PracticeManager.js  # Practice sessions & spaced repetition
│           ├── UIController.js     # View layer & modal orchestration
│           ├── EventHandlers.js    # DOM event wiring & shortcuts
│           ├── SyncManager.js      # Firebase Auth & Firestore sync
│           ├── EventBus.js         # Pub/sub event system
│           ├── Logger.js           # Structured logging with ring buffer
│           ├── ThemeManager.js     # Theme persistence (light/dark/auto)
│           ├── NotificationManager.js # Toast & confirm UX helpers
│           ├── PracticeUI.js       # Practice quiz UI (lazy-loaded)
│           ├── JourneyUI.js        # Journey viewer UI (lazy-loaded)
│           ├── StationEditorUI.js  # Station editor UI (lazy-loaded)
│           ├── StatisticsUI.js     # Statistics modal UI (lazy-loaded)
│           ├── HtmlPalaceParser.js # HTML-to-JSON palace parser
│           ├── WebVitals.js        # Core Web Vitals collection
│           ├── validation.js       # HTML sanitisation & data validation
│           └── firebase-config.js  # Firebase client credentials
├── tests/                  # Vitest unit tests
├── public/                 # Static assets (icons, data)
└── tools/                  # Developer utilities
```

## Architecture

### Separation of Concerns

The app follows a modular monolith architecture with dependency injection and lazy-loaded sub-views:

- **PalaceManager**: Source of truth for palace data (CRUD, localStorage, emits events via EventBus)
- **PracticeManager**: Source of truth for practice sessions and spaced repetition
- **UIController**: View orchestration — renders the palace grid and lazy-loads sub-view modules
- **EventHandlers**: Wires DOM events to managers and UI (toolbar, modals, grid delegation, shortcuts)
- **SyncManager**: Optional Firebase Auth + Firestore cloud sync layer
- **EventBus**: Pub/sub event system decoupling data producers from UI consumers

**Lazy-loaded UI modules** (only downloaded when the user opens the feature):

- **PracticeUI** — Quiz sessions with data-action event delegation
- **JourneyUI** — Station-by-station palace walkthrough
- **StationEditorUI** — Station CRUD editor
- **StatisticsUI** — Analytics dashboard with log export

### Data Flow

```
User Event → EventHandlers → PalaceManager (mutate + emit event) → UIController (re-render)
```

### Data Model

Each memory palace has the following structure:

```javascript
const examplePalace = {
  id: 'unique-id',
  name: 'Palace Name',
  location: 'Physical/imagined location',
  description: 'Brief description',
  book: 'Category or book name',
  chapter: 'Chapter or section',
  stations: 17,
  verses: 33,
  tags: ['tag1', 'tag2'],
  notes: 'Additional notes',
  connections: ['id1', 'id2'],
  createdAt: 'ISO timestamp',
  updatedAt: 'ISO timestamp',
};
```

## Usage

### Creating a Palace

1. Click "➕ New Palace"
2. Fill in the required fields (name, location)
3. Add optional metadata (tags, connections, notes)
4. Click "Save Palace"

### Editing a Palace

- Click on any palace card or the "✏️ Edit" button
- Update the information
- Click "Save Palace"

### Connecting Palaces

- When creating/editing a palace, select connected palaces from the dropdown
- Hold Ctrl/Cmd to select multiple connections
- Connections are bidirectional

### Importing/Exporting

**Export single palace**: Click "💾 Export" on any palace card

**Export all palaces**: Click "💾 Export All" in the toolbar

**Import palaces**: Click "📥 Import Palace" and select a JSON file

### Practice Mode

- Click `🎯 Practice` to open the practice picker
- Use `⏭️ Practice Next Due` to jump straight into the next review
- Toggle between due-only practice and all palaces
- Complete quiz sessions to update mastery, streaks, and session history

### PWA / Cache Refresh

- The app uses a Service Worker and versioned caches
- When a newer app version is available, you'll get a refresh prompt
- Click `Refresh` in the prompt to activate the latest cached version immediately

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new palace
- `Ctrl/Cmd + P`: Open practice
- `Ctrl/Cmd + K`: Open statistics
- `/`: Focus search
- `Ctrl/Cmd + Shift + Backspace`: Clear search
- `Esc`: Close modal

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Data Storage

- **Guest mode** stores data in browser localStorage.
- **Signed-in mode** stores data in user-scoped local keys and syncs to Firestore.
- On first sign-in, local guest data is seeded into that user scope, then merged with cloud.

For Firebase setup, see the comments in `src/js/modules/firebase-config.js`.

## Development

### Code Quality

```bash
# Lint JavaScript
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting without writing
npm run format:check

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Validate everything (lint + format check + tests)
npm run validate
```

### Best Practices

- ES6 modules for code organization
- CSS custom properties for theming
- Semantic HTML for accessibility
- Mobile-first responsive design
- XSS protection via HTML escaping

### Releasing a New Version

The app version is defined in three places that **must stay in sync**:

| File                        | Constant      | Purpose                                                |
| --------------------------- | ------------- | ------------------------------------------------------ |
| `src/js/modules/version.js` | `APP_VERSION` | Single source of truth; imported by app & StatisticsUI |
| `sw.js`                     | `APP_VERSION` | Derives `CACHE_NAME`; triggers cache invalidation      |
| `package.json`              | `version`     | npm metadata; matched to above                         |

**To release:**

1. Bump the version in all three files (e.g. `1.0.0` → `1.1.0`).
2. Commit: `git commit -m "release: v1.1.0"`.
3. Tag: `git tag v1.1.0 && git push --tags`.
4. Push to `main` — Vercel deploys automatically; the CI pipeline validates first.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Test your changes
5. Submit a pull request

## License

MIT License - feel free to use for personal or educational purposes

## Credits

Based on the Magnetic Memory Method (magneticmemorymethod.com) for memorizing scripture and other material.
