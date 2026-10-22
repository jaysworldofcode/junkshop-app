import { DEFAULT_PAYMENT_METHOD, DEFAULT_PAYMENT_STATUS } from '@/constants/payment';
import type { PricingMode } from '@/constants/product';
import type { LocalDateKey } from '@/domain/localDate';
import {
  createEmptyPurchaseLine,
  type PurchaseDraft,
  type PurchaseErrors,
  type PurchaseLineField,
  type SavedPurchase,
} from '@/domain/purchase';

type PurchaseHeaderField = 'purchaseDate' | 'sellerName' | 'paymentStatus' | 'paymentMethod' | 'notes';

export type PurchaseFormState = {
  draft: PurchaseDraft;
  /** The phone's day when the form last checked. A ticket dated this day moves forward when the day changes. */
  today: LocalDateKey;
  errors: PurchaseErrors;
  nextLineNumber: number;
  isSubmitting: boolean;
  submitError: string | null;
  lastSaved: SavedPurchase | null;
};

export type PurchaseFormAction =
  | { type: 'changeHeader'; field: PurchaseHeaderField; value: string }
  | { type: 'pickSeller'; personId: string; name: string }
  | { type: 'changeLine'; key: string; field: PurchaseLineField; value: string }
  | {
      type: 'selectProduct';
      key: string;
      materialId: string;
      pricingMode: PricingMode;
      buyPrice: string;
      supplierPrice: string;
    }
  | { type: 'addLine' }
  | { type: 'removeLine'; key: string }
  | { type: 'setErrors'; errors: PurchaseErrors }
  | { type: 'submitStart' }
  | { type: 'submitSuccess'; saved: SavedPurchase }
  | { type: 'submitFailure'; message: string }
  | { type: 'dismissSaved' }
  | { type: 'syncToday'; today: LocalDateKey };

const FIRST_LINE_NUMBER = 1;

function lineKey(lineNumber: number): string {
  return `line-${lineNumber}`;
}

export function createPurchaseFormState(purchaseDate: LocalDateKey, today: LocalDateKey = purchaseDate): PurchaseFormState {
  return {
    today,
    draft: {
      purchaseDate,
      sellerName: '',
      sellerId: null,
      lines: [createEmptyPurchaseLine(lineKey(FIRST_LINE_NUMBER))],
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

export function purchaseFormReducer(state: PurchaseFormState, action: PurchaseFormAction): PurchaseFormState {
  switch (action.type) {
    case 'changeHeader':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.field]: action.value,
          ...(action.field === 'sellerName' ? { sellerId: null } : {}),
        },
        errors: { ...state.errors, [action.field]: undefined },
        submitError: null,
        lastSaved: null,
      };
    case 'pickSeller':
      return {
        ...state,
        draft: { ...state.draft, sellerId: action.personId, sellerName: action.name },
        errors: { ...state.errors, sellerName: undefined },
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
        errors: clearLineError(state.errors, action.key, action.field),
        submitError: null,
        lastSaved: null,
      };
    case 'selectProduct': {
      const { key, materialId, pricingMode, buyPrice, supplierPrice } = action;
      const lineErrors = state.errors.lines[key];

      return {
        ...state,
        draft: {
          ...state.draft,
          lines: state.draft.lines.map((line) =>
            line.key === key ? { ...line, materialId, pricingMode, buyPrice, supplierPrice } : line
          ),
        },
        errors: lineErrors
          ? {
              ...state.errors,
              lines: {
                ...state.errors.lines,
                [key]: { quantity: lineErrors.quantity, plannedBuyer: lineErrors.plannedBuyer },
              },
            }
          : state.errors,
        submitError: null,
        lastSaved: null,
      };
    }
    case 'addLine':
      return {
        ...state,
        draft: {
          ...state.draft,
          lines: [...state.draft.lines, createEmptyPurchaseLine(lineKey(state.nextLineNumber))],
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
      const fresh = createPurchaseFormState(state.draft.purchaseDate, state.today);
      return {
        ...fresh,
        draft: { ...fresh.draft, lines: [createEmptyPurchaseLine(lineKey(state.nextLineNumber))] },
        nextLineNumber: state.nextLineNumber + 1,
        lastSaved: action.saved,
      };
    }
    case 'submitFailure':
      return { ...state, isSubmitting: false, submitError: action.message };
    case 'dismissSaved':
      return { ...state, lastSaved: null };
    case 'syncToday':
      return syncPurchaseToday(state, action.today);
    default:
      return state;
  }
}

/** Moves a ticket still dated the old today onto the new day. Back-dated tickets keep their date. */
export function syncPurchaseToday(state: PurchaseFormState, today: LocalDateKey): PurchaseFormState {
  if (state.today === today) {
    return state;
  }

  const followsToday = state.draft.purchaseDate === state.today;
  return {
    ...state,
    today,
    draft: followsToday ? { ...state.draft, purchaseDate: today } : state.draft,
  };
}

function clearLineError(errors: PurchaseErrors, key: string, field: PurchaseLineField): PurchaseErrors {
  const lineErrors = errors.lines[key];
  if (!lineErrors?.[field]) {
    return errors;
  }

  return { ...errors, lines: { ...errors.lines, [key]: { ...lineErrors, [field]: undefined } } };
}
