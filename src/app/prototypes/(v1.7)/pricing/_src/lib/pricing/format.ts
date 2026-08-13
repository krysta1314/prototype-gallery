export function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtMoney(n: number): string {
  return '$' + Math.ceil(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
