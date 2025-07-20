# Internationalization (i18n) Setup

## Overview
This project uses a custom translation service for Spanish (ES) and English (EN) support.

## Files Structure
```
src/app/
├── services/
│   └── translation.service.ts    # Main translation service
├── pipes/
│   └── translate.pipe.ts         # Translation pipe
└── app.ts                        # Updated with translation support
```

## Usage

### In Templates
Use the translate pipe:
```html
{{ 'translation.key' | translate }}
```

### In Components
Inject the service:
```typescript
constructor(private translationService: TranslationService) {}

// Get translation
const text = this.translationService.translate('key');

// Change language
this.translationService.setLanguage('en');
```

## Adding New Translations

1. Open `src/app/services/translation.service.ts`
2. Add new keys to both `es` and `en` objects in the `translations` property
3. Use the new keys in your templates with the translate pipe

Example:
```typescript
'new.key': 'Spanish text',  // in es object
'new.key': 'English text',  // in en object
```

## Language Persistence
The selected language is automatically saved to localStorage and restored on app reload.

## Supported Languages
- Spanish (es) - Default
- English (en)

## Features
- Real-time language switching
- Persistent language preference
- Clean pipe-based usage in templates
- Fallback to key if translation missing
