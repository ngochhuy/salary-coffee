# Environment Variables

## Required Variables

Create a `.env.local` file in the project root with:

```bash
# Google Sheets URL (publicly accessible)
NEXT_PUBLIC_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

## Setup Instructions

1. Open your Google Sheet
2. Make it public: **File → Share → Anyone with the link**
3. Copy the sheet URL
4. Paste in `.env.local` as `NEXT_PUBLIC_SHEET_URL`

## Notes

- The sheet must be **publicly accessible** (no authentication)
- URL should be the full edit URL or share URL
- Changes to `.env.local` require restart of dev server
