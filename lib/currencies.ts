export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'COP', name: 'Peso colombiano',    symbol: '$' },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro',               symbol: '€' },
  { code: 'GBP', name: 'Libra esterlina',    symbol: '£' },
  { code: 'MXN', name: 'Peso mexicano',      symbol: '$' },
  { code: 'ARS', name: 'Peso argentino',     symbol: '$' },
  { code: 'CLP', name: 'Peso chileno',       symbol: '$' },
  { code: 'PEN', name: 'Sol peruano',        symbol: 'S/' },
  { code: 'BRL', name: 'Real brasileño',     symbol: 'R$' },
  { code: 'CAD', name: 'Dólar canadiense',   symbol: '$' },
  { code: 'AUD', name: 'Dólar australiano',  symbol: '$' },
  { code: 'JPY', name: 'Yen japonés',        symbol: '¥' },
  { code: 'CNY', name: 'Yuan chino',         symbol: '¥' },
  { code: 'CHF', name: 'Franco suizo',       symbol: 'Fr' },
  { code: 'KRW', name: 'Won surcoreano',     symbol: '₩' },
  { code: 'INR', name: 'Rupia india',        symbol: '₹' },
  { code: 'BTC', name: 'Bitcoin',            symbol: '₿' },
  { code: 'ETH', name: 'Ethereum',           symbol: 'Ξ' },
];

const LOCALE_MAP: Record<string, string> = {
  COP: 'es-CO', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  MXN: 'es-MX', ARS: 'es-AR', CLP: 'es-CL', PEN: 'es-PE',
  BRL: 'pt-BR', CAD: 'en-CA', AUD: 'en-AU', JPY: 'ja-JP',
  CNY: 'zh-CN', CHF: 'de-CH', KRW: 'ko-KR', INR: 'hi-IN',
};

export function formatAmount(amount: number, currencyCode: string, showDecimals = false): string {
  if (currencyCode === 'BTC' || currencyCode === 'ETH') {
    const info = CURRENCIES.find(c => c.code === currencyCode);
    return `${info?.symbol ?? ''}${amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
  }

  const locale = LOCALE_MAP[currencyCode] ?? 'es-CO';
  const fracDigits = showDecimals && amount % 1 !== 0 ? 2 : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: fracDigits,
      maximumFractionDigits: fracDigits,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currencyCode}`;
  }
}

/** Parse a string like "1.234,56" or "1,234.56" to a number */
export function parseBalanceInput(value: string): number {
  if (!value) return 0;
  // Remove all non-numeric except . , -
  const cleaned = value.replace(/[^\d.,-]/g, '');
  // Detect comma as decimal (Spanish format: "1.234,56")
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot   = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const result = parseFloat(normalized);
  return isFinite(result) ? result : 0;
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find(c => c.code === code) ?? { code, name: code, symbol: code };
}
