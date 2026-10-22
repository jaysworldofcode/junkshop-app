import { DEFAULT_PAYMENT_METHOD, DEFAULT_PAYMENT_STATUS } from '@/constants/payment';
import type { PricingMode } from '@/constants/product';
import type { LocalDateKey } from '@/domain/localDate';
import { createEmptySaleLine, type SaleDraft, type SaleErrors, type SaleLineField, type SavedSale } from '@/domain/sale';

type SaleHeaderField = 'saleDate' | 'buyerName' | 'paymentStatus' | 'paymentMethod' | 'notes';

export type SaleFormState = {
  draft: SaleDraft;
  /** The phone's day when the form last checked. A ticket dated this day moves forward when the day changes. */
  today: LocalDateKey;
  errors: SaleErrors;
  nextLineNumber: number;
  isSubmitting: boolean;
  submitError: string | null;
  lastSaved: SavedSale | null;
};

export type SaleFormAction =
  | { type: 'changeHeader'; field: SaleHeaderField; value: string }
  | { type: 'pickBuyer'; personId: string; name: string }
  | { type: 'changeLine'; key: string; field: SaleLineField; value: string }
  | { type: 'selectProduct'; key: string; materialId: string; pricingMode: PricingMode; sellPrice: string }
  | { type: 'addLine' }
  | { type: 'removeLine'; key: string }
  | { type: 'setErrors'; errors: SaleErrors }
  | { type: 'submitStart' }
  | { type: 'submitSuccess'; saved: SavedSale }
  | { type: 'submitFailure'; message: string }
  | { type: 'dismissSaved' }
  | { type: 'syncToday'; today: LocalDateKey };

const FIRST_LINE_NUMBER = 1;

function lineKey(lineNumber: number): string {
  return `line-${lineNumber}`;
}

export function createSaleFormState(saleDate: LocalDateKey, today: LocalDateKey = saleDate): SaleFormState {
  return {
    today,
    draft: {
      saleDate,
      buyerName: '',
      buyerId: null,
      lines: [createEmptySaleLine(lineKey(FIRST_LINE_NUMBER))],
      paymentStatus: DEFAULT_PAYMENT_STATUS,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      notes: '',
    },
    errors: { lines: {} },
    nextLineNumber: FIRST_LINE_NUMBER + 1,
    isSubmitting: false,
    submitError: null,
    lastSaved: null,
  };
}

export function saleFormReducer(state: SaleFormState, action: SaleFormAction): SaleFormState {
  switch (action.type) {
    case 'changeHeader':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.field]: action.value,
          ...(action.field === 'buyerName' ? { buyerId: null } : {}),
        },
        errors: { ...state.errors, [action.field]: undefined },
        submitError: null,
        lastSaved: null,
      };
    case 'pickBuyer':
      return {
        ...state,
        draft: { ...state.draft, buyerId: action.personId, buyerName: action.name },
        errors: { ...state.errors, buyerName: undefined },
        submitError: null,
        lastSaved: null,
      };
    case 'changeLine':
      return {
        ...state,
        draft: {
          ...state.draft,
          lines: state.draft.lines.map((line) =>
            line.key === action.key ? { ...line, [action.field]: action.value } : line
          ),
        },
        errors: clearLineErrors(state.errors, action.key, [action.field]),
        submitError: null,
        lastSaved: null,
      };
    case 'selectProduct': {
      const { key, materialId, pricingMode, sellPrice } = action;

      return {
        ...state,
        draft: {
          ...state.draft,
          lines: state.draft.lines.map((line) =>
            line.key === key ? { ...line, materialId, pricingMode, sellPrice, buyPrice: '' } : line
          ),
        },
        errors: clearLineErrors(state.errors, key, ['materialId', 'sellPrice', 'buyPrice']),
        submitError: null,
        lastSaved: null,
      };
    }
    case 'addLine':
      return {
        ...state,
        draft: {
          ...state.draft,
          lines: [...state.draft.lines, createEmptySaleLine(lineKey(state.nextLineNumber))],
        },
        nextLineNumber: state.nextLineNumber + 1,
        lastSaved: null,
      };
    case 'removeLine': {
      if (state.draft.lines.length <= 1) {
        return state;
      }

      const remainingLineErrors = { ...state.errors.lines };
      delete remainingLineErrors[action.key];

      return {
        ...state,
        draft: { ...state.draft, lines: state.draft.lines.filter((line) => line.key !== action.key) },
        errors: { ...state.errors, lines: remainingLineErrors },
      };
    }
    case 'setErrors':
      return { ...state, errors: action.errors, isSubmitting: false };
    case 'submitStart':
      return { ...state, isSubmitting: true, submitError: null };
    case 'submitSuccess': {
      const fresh = createSaleFormState(state.draft.saleDate, state.today);
      return {
        ...fresh,
        draft: { ...fresh.draft, lines: [createEmptySaleLine(lineKey(state.nextLineNumber))] },
        nextLineNumber: state.nextLineNumber + 1,
        lastSaved: action.saved,
      };
    }
    case 'submitFailure':
      return { ...state, isSubmitting: false, submitError: action.message };
    case 'dismissSaved':
      return { ...state, lastSaved: null };
    case 'syncToday':
      return syncSaleToday(state, action.today);
    default:
      return state;
  }
}

/** Moves a ticket still dated the old today onto the new day. Back-dated tickets keep their date. */
export function syncSaleToday(state: SaleFormState, today: LocalDateKey): SaleFormState {
  if (state.today === today) {
    return state;
  }

  const followsToday = state.draft.saleDate === state.today;
  return {
    ...state,
    today,
    draft: followsToday ? { ...state.draft, saleDate: today } : state.draft,
  };
}

function clearLineErrors(
  errors: SaleErrors,
  key: string,
  fields: ('materialId' | SaleLineField)[]
): SaleErrors {
  const lineErrors = errors.lines[key];
  if (!lineErrors || !fields.some((field) => lineErrors[field])) {
    return errors;
  }

  const cleared = { ...lineErrors };
  for (const field of fields) {
    delete cleared[field];
  }

  return { ...errors, lines: { ...errors.lines, [key]: cleared } };
}
