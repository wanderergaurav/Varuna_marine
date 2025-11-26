export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    ...options
  }).format(value);
