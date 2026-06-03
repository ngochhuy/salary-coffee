// Test extractEmployees function with the actual logic
const invalidPatterns = [
  /^CONTACT INFO$/i, /^VỊ TRÍ/i, /^BARISTA$/i, /^\d+$/, /^0\d{9}$/,
  /^[`~!@#$%^&*()_+=\[\]{};':"\|,.<>\/?]+$/, /^[a-z0-9]$/i,
];

function cleanEmployeeName(name) {
  let n = name.trim();
  if (!n || n.length < 2) return null;
  if (invalidPatterns.some(p => p.test(n))) return null;
  
  const m1 = n.match(/[MN]$/);
  if (m1 && n.length > 1) n = n.substring(0, m1.index).trim();
  const m2 = n.match(/\s+[MN]\s+-\s*\d+h\d*\b/);
  if (m2) n = n.substring(0, m2.index).trim();
  const m3 = n.match(/\s+-\s*\d+h\d*\b/);
  if (m3) n = n.substring(0, m3.index).trim();
  const m4 = n.match(/\s*\(.*\)?$/);
  if (m4) n = n.substring(0, m4.index).trim();
  const m5 = n.match(/\s+[MN]$/);
  if (m5) n = n.substring(0, m5.index).trim();
  
  return n.length >= 2 ? n : null;
}

// Mock schedule.cells data based on what might be in Google Sheets
const mockCells = [
  { employee: 'Cường' },
  { employee: 'Dũng' },
  { employee: 'Dũng M - 14h (thứ việc)' },
  { employee: 'Hạnh' },
  { employee: 'Linh' },
  { employee: 'Linh (thứ việc)' },
  { employee: 'Linh M - 14h (thứ việc)' },
  { employee: 'PhươngM' },
  { employee: 'Phương -14h' },
  { employee: 'Phúc -9h30' },
  { employee: 'Nga M -14h' },
  { employee: '0898160703' },
  { employee: 'CONTACT INFO' },
];

const employees = new Set();
mockCells.forEach(cell => {
  if (cell.employee) {
    const cleaned = cleanEmployeeName(cell.employee);
    if (cleaned) employees.add(cleaned);
  }
});

console.log('=== Employees from schedule.cells ===');
console.log(Array.from(employees).sort());
console.log('Total:', employees.size);
