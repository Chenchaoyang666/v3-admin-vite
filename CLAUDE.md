# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # Start dev server on port 3333
pnpm build          # Type-check + build for production
pnpm build:staging  # Type-check + build for staging
pnpm lint           # ESLint fix
pnpm test           # Run Vitest unit tests
pnpm preview        # Preview production build
```

Run a single test file:
```bash
pnpm test tests/demo.test.ts
```

Tests use happy-dom environment and live under tests/ (not co-located with source).

## Architecture

### Path Aliases
- @ -> src/
- @@ -> src/common/ (shared utilities, APIs, components, composables)

### Source Layout

```
src/
  common/         # Shared across the app (alias: @@)
    apis/         # API call functions
    assets/       # Images, icons (SVG sprite icons in assets/icons/)
    components/   # Reusable components
    composables/  # Shared composables (useTheme, useDevice, useRouteListener...)
    constants/    # App-wide enums and keys (e.g. LayoutModeEnum)
    utils/        # Helpers including cache (cookies, localStorage)
  http/
    axios.ts      # Axios instance with request/response interceptors
  layouts/
    config.ts     # LayoutsConfig interface + defaults (persisted to localStorage)
    modes/        # LeftMode.vue, TopMode.vue, LeftTopMode.vue
    components/   # Sidebar, header, tags-view, etc.
    composables/  # Layout-specific composables
  pages/          # Page components (one folder per route)
  pinia/
    stores/       # user, permission, settings, tags-view, app
  router/
    index.ts      # constantRoutes + dynamicRoutes + router instance
    config.ts     # routerConfig (history mode, dynamic routing toggle)
    guard.ts      # Navigation guards (auth, NProgress, title, page duration)
    helper.ts     # flatMultiLevelRoutes utility
  plugins/        # Vue plugin registrations
  hooks/          # App-level hooks (pageDurationTracker, etc.)
backend/          # Express mock server (port 3001)
tests/            # Vitest test files
types/auto/       # Auto-generated type declarations (do not edit)
```

### Permission and Routing System

Two route arrays defined in src/router/index.ts:
- constantRoutes: always accessible (login, 403, 404, dashboard, demos)
- dynamicRoutes: role-gated; added to the router at runtime by usePermissionStore

The navigation guard (src/router/guard.ts) calls userStore.getInfo() on first navigation to fetch roles, then permissionStore.setRoutes(roles) to filter and register dynamic routes. When routerConfig.dynamic is false, all routes are loaded for every user.

Route meta fields: hidden, roles, keepAlive, affix, alwaysShow.

### State Management (Pinia)

- useUserStore: token (cookie), roles, username; getInfo() currently hardcodes admin role (real API call commented out)
- usePermissionStore: computes accessible routes from roles; exposes addRoutes for the guard
- useSettingsStore: mirrors LayoutsConfig as reactive refs; auto-persists to localStorage on any change
- useTagsViewStore: manages visited/cached tab entries

### HTTP Layer

src/http/axios.ts wraps axios with Bearer token from cookie, business code convention (code === 0 means success, code === 401 triggers logout), and base URL from VITE_BASE_URL.

Dev proxy: /api/v1/* -> ApiFox mock; /api/* -> http://localhost:3001 (local backend, /api prefix stripped).

### Auto-Imports

unplugin-auto-import globally imports Vue, Vue Router, and Pinia APIs. Element Plus components auto-imported via unplugin-vue-components. No manual imports needed for ref, computed, defineStore, useRouter, etc.

### SVG Icons

SVGs in src/common/assets/icons/ compile to a sprite sheet via unplugin-svg-component. Use SvgIcon component with name prop. Files in preserve-color/ subfolder retain original colors.

### Layouts

Three modes (Left, Top, Left+Top hybrid) controlled by LayoutModeEnum in settings store. Active layout selected in src/layouts/index.vue based on settingsStore.layoutMode.

### Backend Mock Server

backend/ is an Express server on port 3001 for local API mocking. Start separately - not launched by pnpm dev.
