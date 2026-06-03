# 💰 Tính Lương Nhân Viên - Coffee Shop Salary Calculator

Web application to calculate employee salaries from Google Sheets work schedules.

## ✨ Features

- 📊 **Import from Google Sheets**: Fetch schedule data from publicly accessible Google Sheets
- 🔄 **Multi-Sheet Support**: Automatically fetches from ALL tabs in the workbook
- 📅 **Monthly Calculations**: Groups shifts by month (day 1 to last day)
- 🎯 **Hybrid Shift Parsing**: Content markers (M-14h, M, N) take priority, column position as fallback
- 💵 **Hourly Wage Input**: Set individual wages per employee (saved to localStorage)
- 🍔 **Allowance Calculation**: Shifts > 7 hours automatically get +30,000 VND
- 👁️ **Employee Detail View**: Click on employee to see shift breakdown and allowance details
- 💾 **Data Caching**: Schedule data cached in localStorage with manual refresh
- 🖨️ **Print/Save PDF**: Built-in print functionality for salary reports

## 📋 Shift Types & Hours

| Marker | Hours | Time Range | Allowance |
|--------|-------|------------|-----------|
| `M - 14h` | 7.5h | 6:30 - 14:00 | ✅ (+30k) |
| `M` | 8.5h | 6:30 - 15:00 | ✅ (+30k) |
| `N` | 8h | 14:00 - 22:00 | ✅ (+30k) |
| `Ca 3` | 4h | 18:00 - 22:00 | ❌ |
| `Custom` | Variable | As specified | If > 7h |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ngochhuy/salary-coffee.git
cd salary-coffee
```

2. Install dependencies:
```bash
npm install
```

3. Configure Google Sheets URL:
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and paste your sheet URL
# NEXT_PUBLIC_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 📝 Google Sheets Setup

1. Make your sheet **publicly accessible**:
   - File → Share → General access → "Anyone with the link"

2. Format your schedule:
   - Row 1: Day headers (e.g., "1/6", "2/6", ...)
   - Column A: Position names (e.g., "Barista", "Cashier")
   - Cells: `EmployeeName ShiftMarker` (e.g., "Nhật M", "Thúy N")

3. Supported formats:
   - `Nhật M - 14h` → 7.5h morning shift ending at 14:00
   - `Lan M` → 8.5h morning shift
   - `Thu Na N` → 8h afternoon shift
   - `Hùng 10h-18h` → 8h custom shift
   - (empty cell in Ca 3 column) → 4h evening shift (18:00-22:00)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **CSV Parsing**: PapaParse
- **Date Utilities**: date-fns

## 📁 Project Structure

```
salary-coffee/
├── app/
│   ├── api/sheets/route.ts    # Multi-sheet fetch endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main dashboard
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── schedule-table.tsx      # Schedule display
│   ├── wage-input.tsx          # Hourly wage inputs
│   ├── month-selector.tsx      # Month filter
│   ├── monthly-salary-summary.tsx  # Salary results
│   └── employee-detail-dialog.tsx  # Employee detail popup
├── lib/
│   ├── constants.ts            # Shift mappings & allowance config
│   ├── sheets-parser.ts        # CSV parsing (hybrid logic)
│   ├── salary-calculator.ts    # Calculation engine
│   └── storage.ts              # localStorage wrapper
└── types/
    └── index.ts                # TypeScript types
```

## 💾 Data Storage

All data is stored locally in the browser:

| Key | Data |
|-----|------|
| `salary-calculator-wages` | Employee hourly wages |
| `salary-calculator-sheet-data` | Cached schedule data |
| `salary-calculator-last-fetch` | Last fetch timestamp |

## 🧮 Calculation Formula

```
Base Salary = Total Hours × Hourly Wage
Allowance = (Shifts > 7h) × 30,000 VND
Final Salary = Base Salary + Allowance
```

## 📄 License

ISC

## 👤 Author

ngochhuy
