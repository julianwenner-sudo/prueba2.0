'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Client, Offer, OfferStatus } from '../types';

type DataContextValue = {
  clients: Client[];
  offers: Offer[];
  hydrated: boolean;
  addClient: (input: { name: string; email?: string | null }) => Client;
  addOffer: (input: Omit<Offer, 'id' | 'margin'> & { margin?: number }) => Offer;
};

const STORAGE_KEY = 'gestion-ofertas-state-v1';

const DataContext = createContext<DataContextValue | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

type PersistedState = {
  clients: Client[];
  offers: Offer[];
};

const normalizeStatus = (status: string): OfferStatus => {
  const statuses: OfferStatus[] = ['borrador', 'en revisión', 'enviada', 'ganada', 'perdida'];
  return statuses.includes(status as OfferStatus) ? (status as OfferStatus) : 'borrador';
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        const sanitizedClients = Array.isArray(parsed.clients)
          ? parsed.clients.filter((client): client is Client =>
              Boolean(client && client.id && client.name)
            )
          : [];
        const sanitizedOffers = Array.isArray(parsed.offers)
          ? parsed.offers
              .filter((offer): offer is Offer =>
                Boolean(offer && offer.id && offer.offerNumber && offer.clientId)
              )
              .map((offer) => ({
                ...offer,
                status: normalizeStatus(offer.status),
                margin: typeof offer.margin === 'number' ? offer.margin : offer.price - offer.cost
              }))
          : [];
        setClients(sanitizedClients);
        setOffers(sanitizedOffers);
      }
    } catch (error) {
      console.warn('No se pudieron leer los datos almacenados', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    const payload: PersistedState = { clients, offers };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [clients, offers, hydrated]);

  const contextValue = useMemo<DataContextValue>(() => {
    const addClient: DataContextValue['addClient'] = ({ name, email }) => {
      const trimmedName = name.trim();
      const normalizedEmail = email?.trim() || undefined;
      const existing = clients.find((client) => client.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) {
        return existing;
      }
      const client: Client = {
        id: generateId(),
        name: trimmedName,
        email: normalizedEmail ?? null,
        createdAt: new Date().toISOString()
      };
      setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
      return client;
    };

    const addOffer: DataContextValue['addOffer'] = (input) => {
      const offer: Offer = {
        id: generateId(),
        offerNumber: input.offerNumber,
        clientId: input.clientId,
        price: input.price,
        cost: input.cost,
        margin: input.margin ?? input.price - input.cost,
        status: normalizeStatus(input.status),
        createdAt: input.createdAt,
        validUntil: input.validUntil
      };
      setOffers((prev) => [offer, ...prev]);
      return offer;
    };

    return {
      clients,
      offers,
      hydrated,
      addClient,
      addOffer
    };
  }, [clients, offers, hydrated]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
};
