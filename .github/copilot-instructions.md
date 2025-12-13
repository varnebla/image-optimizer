# Image Optimizer Codebase Guide

## Project Overview
Client-side image optimization tool built with Astro + Vue 3 + TypeScript. All processing happens in-browser using Pica (high-quality resize), exifr (EXIF handling), and JSZip (batch downloads). No server uploads—complete privacy.

## Architecture & Data Flow

### State Management Pattern
**Global reactive store** (`src/utils/imageStore.ts`) using Vue refs/reactive, shared across all components:
- `files`: Selected images awaiting optimization
- `options`: Current optimization settings (maxWidth, format, quality)
- `progress`, `results`, `sessionLog`: Processing state and history
- `validationInfo`: File validation warnings and rejected files

All Vue components import and mutate this shared store directly—no Vuex/Pinia. Components are reactive to store changes automatically.

### Processing Flow
```
ImageDrop → files store → OptimizeButton triggers → 
  imageUtils.optimizeImage() per file → 
  results store → zipUtils.generateZip() → 
  ResultSummary displays download
```

**Sequential processing** (not Web Workers) because File objects aren't serializable and Canvas/Pica APIs are already async and non-blocking.

## Key Conventions

### Path Aliases (tsconfig.json)
Always use `@utils/`, `@components/`, `@i18n/`, etc. for imports—never relative paths across directories.

```typescript
// ✅ Correct
import { optimizeImage } from '@utils/imageUtils';
// ❌ Avoid
import { optimizeImage } from '../utils/imageUtils';
```

### Internationalization (i18n)
- Two locales: `es` (default), `en`
- Translation keys in `src/i18n/ui.ts`
- Use `useTranslations(lang)` function in components
- **Every Vue component requires `lang` prop** passed from Astro pages

```vue
<script setup lang="ts">
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{ lang: Lang }>();
const t = useTranslations(props.lang);
</script>
```

### Astro Island Architecture
Components use specific hydration strategies:
- `client:load` - Interactive immediately (ImageDrop, PresetsSelector, OptimizeButton)
- `client:idle` - Load after page idle (ValidationWarnings, ImagePreview)
- `client:visible` - Load when scrolled into view (SessionLog)
- `client:only="vue"` - Vue-only, no SSR (ProgressList, ResultSummary)

Example: `<ImageDrop client:load lang={lang} />`

### Image Processing (imageUtils.ts)
1. Read EXIF orientation with `exifr.orientation()`
2. Apply rotation transformations (orientations 5-8 swap width/height)
3. Resize with **Pica** for high-quality Lanczos filtering
4. Convert to WebP or AVIF format
5. **AVIF uses dynamic ESM import** from `https://esm.sh/@jsquash/avif` (not bundled due to WASM complexity)

### File Validation (fileValidation.ts)
- Configurable limits: `maxFileSize` (12MB), `maxFiles` (10), `maxTotalSize` (60MB)
- Auto-filtering enabled by default
- Validation produces `warnings` and `rejectedFiles` arrays
- Display warnings via `ValidationWarnings.vue` component

## Development Workflows

### Running Tests
```bash
pnpm test              # Run Vitest tests
pnpm test:ui           # Open Vitest UI
pnpm test:coverage     # Generate coverage report
```

Tests use `@vue/test-utils` with `happy-dom` environment. Mock `optimizeImage` in integration tests to avoid real image processing.

### Build & Preview
```bash
pnpm dev               # Dev server (localhost:4321)
pnpm build             # Production build
pnpm preview           # Preview production build
```

### Adding New Pages
For multilingual pages, create both:
- `src/pages/pagename.astro` (Spanish, default locale)
- `src/pages/en/pagename.astro` (English)

Use `getLangFromUrl(Astro.url)` to detect language and `useTranslations(lang)` for content.

## Common Tasks

### Adding New Optimization Options
1. Update `OptimizeOptions` type in `imageUtils.ts`
2. Add field to `options` reactive object in `imageStore.ts`
3. Add control in `SettingsPanel.vue`
4. Implement logic in `optimizeImage()` function
5. Add translation keys to `ui.ts` for both `es` and `en`

### Creating New Presets
Add to `getPredefinedPresets()` in `presets.ts` with translation keys. Custom presets are saved to localStorage and merged via `getAllPresets()`.

### Debugging Processing Issues
- Check browser console for errors (especially EXIF/AVIF loading)
- Verify orientation handling with test images (EXIF 6, 8)
- Use `processingTime` field in results for performance analysis
- Coverage reports available in `coverage/` directory

## Important Notes

- **No external image uploads**—all processing is client-side for privacy
- **AVIF codec loaded dynamically**—don't bundle `@jsquash/avif`, use CDN import
- **Pica configuration** hardcoded to quality:3, unsharpAmount:80 for best results
- **Analytics**: Umami analytics disabled in dev mode via localStorage check
- **Node.js version**: Requires >=18.20.8 (check `.nvmrc`)

## File Structure Reference
```
src/
├── components/        # Vue reactive components
├── i18n/             # Translation system (ui.ts, utils.ts)
├── integration/      # E2E integration tests
├── layouts/          # Astro layout wrapper
├── pages/            # Astro routes (es + en/)
├── utils/            # Core business logic
│   ├── imageStore.ts      # Global reactive state
│   ├── imageUtils.ts      # Image processing (Pica + EXIF)
│   ├── fileValidation.ts  # Size/type validation
│   ├── presets.ts         # Config presets system
│   └── zipUtils.ts        # Batch download ZIP generation
```
