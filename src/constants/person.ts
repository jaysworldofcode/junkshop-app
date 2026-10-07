export const PERSON_TYPES = ['seller', 'buyer', 'both', 'destination'] as const;
export type PersonType = (typeof PERSON_TYPES)[number];

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  seller: 'Seller',
  buyer: 'Buyer',
  both: 'Seller & buyer',
  destination: 'Destination',
};

export const PERSON_TYPE_HINTS: Record<PersonType, string> = {
  seller: 'Brings scrap to sell to the shop. Shown on Buy.',
  buyer: 'Buys scrap from the shop. Shown on Sell.',
  both: 'Sells to and buys from the shop. Shown on Buy and Sell.',
  destination: 'Where the shop delivers scrap, like a supplier or recycler.',
};

/** Which saved people a ticket's picker offers. */
export type TicketRole = 'seller' | 'buyer';

export const PERSON_TYPES_FOR_ROLE: Record<TicketRole, readonly PersonType[]> = {
  seller: ['seller', 'both'],
  buyer: ['buyer', 'both'],
};

export const PERSON_PHONE_MAX_LENGTH = 32;
export const PERSON_ADDRESS_MAX_LENGTH = 200;

export const TOP_SELLERS_LIMIT = 10;
