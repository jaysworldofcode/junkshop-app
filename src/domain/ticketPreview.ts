import { isPakyawMode, type PricingMode } from '@/constants/product';
import { formatPeso } from '@/domain/money';
import { formatQuantity } from '@/domain/quantity';

export type PreviewLine = {
  key: string;
  name: string;
  /** Quantity and unit price, such as "2 kg × ₱10.00". Null for pakyaw lines. */
  detail: string | null;
  total: number;
};

type PreviewSource = {
  key: string;
  name: string;
  unit: string;
  pricingMode: PricingMode;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
};

/** Lines that have no total yet are left out. Expects a validated ticket. */
export function buildPreviewLines(sources: PreviewSource[]): PreviewLine[] {
  return sources.flatMap((source) => {
    if (source.total === null) {
      return [];
    }

    const detail =
      isPakyawMode(source.pricingMode) || source.quantity === null || source.unitPrice === null
        ? null
        : `${formatQuantity(source.quantity)} ${source.unit} × ${formatPeso(source.unitPrice)}`;

    return [{ key: source.key, name: source.name, detail, total: source.total }];
  });
}
