# Next.js Architecture Research

## Context
Simple salary calculator UI with localStorage persistence.

## Key Findings

### Router Selection

| Aspect | App Router | Pages Router |
|--------|------------|--------------|
| Modern | ✅ Yes | ❌ Legacy |
| Server Components | ✅ Yes | ❌ No |
| API Routes | ✅ route.ts | pages/api/ |
| Recommendation | ✅ **Use App Router** | - |

### State Management

| Solution | Complexity | When to Use |
|----------|------------|-------------|
| **useState + Context** | ✅ Simplest | Small app, shared state |
| Zustand | ⚠️ Medium | Medium complexity |
| Redux | ⚠️⚠️ Complex | Large scale apps |

**Recommendation**: `useState` + `localStorage` for this use case

### Data Persistence Strategy

| Option | Use Case | Size Limit |
|--------|----------|------------|
| **localStorage** | Hourly rates, settings | ~5MB |
| IndexedDB | Large datasets | No practical limit |
| Simple backend | Multi-user support | Unlimited |

**Recommendation**: `localStorage` for single-user MVP

### UI Library Recommendation

| Library | Pros | Cons |
|---------|------|------|
| **shadcn/ui** | ✅ Modern, customizable, built on Radix | Requires setup |
| Chakra UI | ✅ Easy theming | Larger bundle |
| Tailwind only | ✅ Full control | ⚠️ More custom work |

**Recommendation**: shadcn/ui for modern, polished UI with less custom CSS

## Proposed Architecture

```
app/
├── api/
│   └── sheets/
│       └── route.ts          # Fetch & parse Google Sheets
├── page.tsx                   # Main dashboard
├── layout.tsx                 # Root layout
└── globals.css
components/
├── ui/                        # shadcn/ui components
├── schedule-viewer.tsx        # Display parsed schedule
├── wage-input.tsx             # Input hourly rates
└── salary-summary.tsx         # Display calculated salaries
lib/
├── sheets-parser.ts           # Parse CSV/JSON from sheets
├── salary-calculator.ts       # Calculate hours × wage
└── storage.ts                 # localStorage wrapper
types/
└── index.ts                   # TypeScript types
```

## Sources
- [App Router vs Pages Router 2024+](https://medium.com/@tanziribneali/app-router-vs-pages-router-in-next-js-why-i-finally-made-the-switch-b704a97b2be0)
- [LocalStorage vs IndexedDB](https://shiftasia.com/community/localstorage-vs-indexeddb-choosing-the-right-solution-for-your-web-application/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## Unresolved Questions
- None for MVP scope
