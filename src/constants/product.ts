export const DEFAULT_PRODUCT_UNIT = 'kg';
export const PRODUCT_UNIT_OPTIONS = ['kg', 'g', 'pc'] as const;
export const PAKYAW_UNIT = 'pc';
export const PRICING_MODES = ['per_unit', 'pakyaw'] as const;
export type PricingMode = (typeof PRICING_MODES)[number];
export const DEFAULT_PRICING_MODE: PricingMode = 'per_unit';
export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  per_unit: 'By weight / count',
  pakyaw: 'Pakyaw — amount only',
};

export function isPakyawMode(mode: PricingMode | null | undefined): boolean {
  return mode === 'pakyaw';
}

export function parsePricingMode(value: string | null | undefined): PricingMode {
  return value === 'pakyaw' ? 'pakyaw' : DEFAULT_PRICING_MODE;
}
export const PRODUCT_NAME_MAX_LENGTH = 80;
export const PRODUCT_UNIT_MAX_LENGTH = 20;
export const PRODUCT_CODE_MAX_LENGTH = 40;
export const PRODUCT_CATEGORY_MAX_LENGTH = 40;
