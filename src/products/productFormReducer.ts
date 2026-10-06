import { createEmptyProductDraft, type ProductDraft, type ProductFieldErrors } from '@/domain/product';

export type ProductFormState = {
  draft: ProductDraft;
  fieldErrors: ProductFieldErrors;
  isSubmitting: boolean;
  submitError: string | null;
};

export type ProductFormAction =
  | { type: 'hydrate'; draft: ProductDraft }
  | { type: 'change'; field: keyof ProductDraft; value: string | boolean }
  | { type: 'setFieldErrors'; fieldErrors: ProductFieldErrors }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
  | { type: 'submitFailure'; message: string };

export function createProductFormState(draft: ProductDraft = createEmptyProductDraft()): ProductFormState {
  return {
    draft,
    fieldErrors: {},
    isSubmitting: false,
    submitError: null,
  };
}

export function productFormReducer(state: ProductFormState, action: ProductFormAction): ProductFormState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...createProductFormState(action.draft),
      };
    case 'change':
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.field]: action.value,
        },
        fieldErrors: {
          ...state.fieldErrors,
          [action.field]: undefined,
        },
        submitError: null,
      };
    case 'setFieldErrors':
      return {
        ...state,
        fieldErrors: action.fieldErrors,
        isSubmitting: false,
      };
    case 'submitStart':
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
      };
    case 'submitSuccess':
      return {
        ...state,
        isSubmitting: false,
        submitError: null,
      };
    case 'submitFailure':
      return {
        ...state,
        isSubmitting: false,
        submitError: action.message,
      };
    default:
      return state;
  }
}
