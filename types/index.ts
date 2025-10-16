export type OfferStatus = 'borrador' | 'en revisión' | 'enviada' | 'ganada' | 'perdida';

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
}

export interface Offer {
  id: string;
  offerNumber: string;
  clientId: string;
  price: number;
  cost: number;
  margin: number;
  status: OfferStatus;
  createdAt: string;
  validUntil: string;
}
