# Google Sheets API Research

## Context
Salary calculator app needs to read schedule data from user's Google Sheets.

## Key Findings

### Authentication Approaches

| Method | Use Case | Complexity |
|--------|----------|------------|
| **API Key** | Public sheets, read-only | ✅ Simplest |
| **Service Account** | Private sheets, server-side | ⚠️ OAuth setup |
| **OAuth 2.0** | User-owned sheets | ⚠️⚠️ Complex |

**Recommendation**: API Key for public sheets + CSV export fallback

### Data Fetching Strategies

**Option 1: Google Sheets API v4**
- `spreadsheets.values.get` endpoint
- Returns structured JSON
- Requires API authentication
- Rate limit: 100 requests/100s

**Option 2: CSV Export (Recommended)**
- URL: `/export?format=csv&gid={SHEET_ID}`
- No authentication for public sheets
- Simple parsing
- Works with `papaparse` library

### Sheet Structure Analysis

Based on user's sheet:
```
VỊ TRÍ | THỨ 2 (Ca1, Ca2, Ca3) | THỨ 3 (Ca1, Ca2, Ca3) | ...
Barista | "Nhật M - 14h" | "Thu Na M" | ...
```

### Parsing Strategy

```typescript
// Regex patterns for cell parsing
const patterns = {
  withTime: /^(.+?) ([MN]) - (\d+)h$/,      // "Nhật M - 14h"
  shiftOnly: /^(.+?) ([MN])$/,              // "Thu Na N"
  nameOnly: /^(.+)$/,                        // Just name
  customRange: /^(.+?) (\d{1,2})h?-(\d{1,2})h?$/  // Custom hours
}
```

### Implementation Notes

1. **Server-side fetching**: Use Next.js API routes to avoid CORS
2. **Caching**: Cache sheet data for 1 hour to reduce API calls
3. **Error handling**: Graceful fallback if sheet is inaccessible

## Sources
- Google Sheets API v4 Documentation
- CSV Export format specification

## Unresolved Questions
- None for MVP scope
