'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import type { OfferStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';

const AVAILABLE_STATUSES: OfferStatus[] = ['borrador', 'en revisión', 'enviada', 'ganada', 'perdida'];

const COLUMN_STORAGE_KEY = 'dashboard-columns-v1';

type ColumnKey =
  | 'offerNumber'
  | 'client'
  | 'price'
  | 'cost'
  | 'margin'
  | 'createdAt'
  | 'validUntil'
  | 'status';

const COLUMN_CONFIG: Record<ColumnKey, string> = {
  offerNumber: 'Número de oferta',
  client: 'Cliente',
  price: 'Precio',
  cost: 'Costo',
  margin: 'Margen',
  createdAt: 'Fecha de creación',
  validUntil: 'Vigente hasta',
  status: 'Estado'
};

const DEFAULT_COLUMNS: ColumnKey[] = Object.keys(COLUMN_CONFIG) as ColumnKey[];

type DashboardOffer = {
  id: string;
  offerNumber: string;
  clientId: string;
  clientName: string;
  price: number;
  cost: number;
  margin: number;
  status: OfferStatus;
  createdAt: string;
  validUntil: string;
};

export default function DashboardPage() {
  const { clients, offers, hydrated } = useData();
  const [clientIdFilter, setClientIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OfferStatus[]>(AVAILABLE_STATUSES);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [columns, setColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ColumnKey[];
        if (Array.isArray(parsed) && parsed.length) {
          setColumns(parsed.filter((column): column is ColumnKey => column in COLUMN_CONFIG));
        }
      } catch (error) {
        console.warn('No se pudieron cargar las columnas guardadas', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const offersWithClient = useMemo<DashboardOffer[]>(() => {
    return offers.map((offer) => {
      const client = clients.find((item) => item.id === offer.clientId);
      return {
        id: offer.id,
        offerNumber: offer.offerNumber,
        clientId: offer.clientId,
        clientName: client?.name ?? 'Cliente eliminado',
        price: offer.price,
        cost: offer.cost,
        margin: offer.margin,
        status: offer.status,
        createdAt: offer.createdAt,
        validUntil: offer.validUntil
      };
    });
  }, [offers, clients]);

  const filteredOffers = useMemo(() => {
    const applyDateFilter = (value: string, from: string, to: string) => {
      if (!from && !to) {
        return true;
      }
      const dateValue = new Date(value);
      if (Number.isNaN(dateValue.getTime())) {
        return false;
      }
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime()) && dateValue < fromDate) {
          return false;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime()) && dateValue > toDate) {
          return false;
        }
      }
      return true;
    };

    return offersWithClient
      .filter((offer) => {
        const matchesClient = clientIdFilter ? offer.clientId === clientIdFilter : true;
        const matchesStatus = statusFilter.includes(offer.status);
        const matchesCreated = applyDateFilter(offer.createdAt, createdFrom, createdTo);
        const matchesValid = applyDateFilter(offer.validUntil, validFrom, validTo);
        return matchesClient && matchesStatus && matchesCreated && matchesValid;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [offersWithClient, statusFilter, createdFrom, createdTo, validFrom, validTo, clientIdFilter]);

  const totals = useMemo(() => {
    return filteredOffers.reduce(
      (acc, offer) => {
        acc.count += 1;
        acc.value += offer.price;
        acc.cost += offer.cost;
        acc.margin += offer.margin;
        return acc;
      },
      { count: 0, value: 0, cost: 0, margin: 0 }
    );
  }, [filteredOffers]);

  const statusSummary = useMemo(() => {
    return AVAILABLE_STATUSES.reduce((acc, status) => {
      acc[status] = filteredOffers.filter((offer) => offer.status === status).length;
      return acc;
    }, {} as Record<OfferStatus, number>);
  }, [filteredOffers]);

  const handleStatusChange = (status: OfferStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
  };

  const handleColumnsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedMessage('Preferencias guardadas correctamente.');
    window.setTimeout(() => setSavedMessage(''), 2500);
  };

  if (!hydrated) {
    return <p className="text-muted">Cargando datos locales…</p>;
  }

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card h-100">
          <div className="card-header">Filtros</div>
          <div className="card-body">
            <form className="row g-3" onSubmit={(event) => event.preventDefault()}>
              <div className="col-12">
                <label htmlFor="client" className="form-label">
                  Cliente
                </label>
                <select
                  id="client"
                  className="form-select"
                  value={clientIdFilter}
                  onChange={(event) => setClientIdFilter(event.target.value)}
                >
                  <option value="">Todos</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <span className="form-label">Estado</span>
                {AVAILABLE_STATUSES.map((status) => (
                  <div className="form-check" key={status}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`status-${status}`}
                      checked={statusFilter.includes(status)}
                      onChange={() => handleStatusChange(status)}
                    />
                    <label className="form-check-label" htmlFor={`status-${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
              <div className="col-6">
                <label htmlFor="created-from" className="form-label">
                  Creada desde
                </label>
                <input
                  id="created-from"
                  type="date"
                  className="form-control"
                  value={createdFrom}
                  onChange={(event) => setCreatedFrom(event.target.value)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="created-to" className="form-label">
                  Creada hasta
                </label>
                <input
                  id="created-to"
                  type="date"
                  className="form-control"
                  value={createdTo}
                  onChange={(event) => setCreatedTo(event.target.value)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="valid-from" className="form-label">
                  Vigente desde
                </label>
                <input
                  id="valid-from"
                  type="date"
                  className="form-control"
                  value={validFrom}
                  onChange={(event) => setValidFrom(event.target.value)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="valid-to" className="form-label">
                  Vigente hasta
                </label>
                <input
                  id="valid-to"
                  type="date"
                  className="form-control"
                  value={validTo}
                  onChange={(event) => setValidTo(event.target.value)}
                />
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setClientIdFilter('');
                    setStatusFilter(AVAILABLE_STATUSES);
                    setCreatedFrom('');
                    setCreatedTo('');
                    setValidFrom('');
                    setValidTo('');
                  }}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Preferencias del dashboard</div>
          <div className="card-body">
            <form onSubmit={handleColumnsSubmit} className="d-flex flex-column gap-2">
              <p className="small text-muted mb-1">
                Selecciona las columnas que deseas ver en la tabla. Los cambios se guardan automáticamente en tu navegador.
              </p>
              {DEFAULT_COLUMNS.map((column) => (
                <div className="form-check" key={column}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`column-${column}`}
                    checked={columns.includes(column)}
                    onChange={(event) => {
                      const { checked } = event.target;
                      setColumns((prev) => {
                        if (checked) {
                          return [...prev, column];
                        }
                        return prev.filter((item) => item !== column);
                      });
                    }}
                  />
                  <label className="form-check-label" htmlFor={`column-${column}`}>
                    {COLUMN_CONFIG[column]}
                  </label>
                </div>
              ))}
              <button type="submit" className="btn btn-success mt-2">
                Guardar preferencias
              </button>
              {savedMessage && <span className="text-success small">{savedMessage}</span>}
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Estado de las ofertas</div>
          <ul className="list-group list-group-flush">
            {AVAILABLE_STATUSES.map((status) => (
              <li className="list-group-item d-flex justify-content-between" key={status}>
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span className="badge bg-primary rounded-pill">{statusSummary[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="col-lg-8">
        <h2 className="h4 mb-3">Resumen</h2>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-bg-primary h-100">
              <div className="card-body">
                <h3 className="h6 text-uppercase">Ofertas</h3>
                <p className="display-6 mb-0">{totals.count}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-bg-success h-100">
              <div className="card-body">
                <h3 className="h6 text-uppercase">Valor total</h3>
                <p className="display-6 mb-0">{formatCurrency(totals.value)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-bg-secondary h-100">
              <div className="card-body">
                <h3 className="h6 text-uppercase">Costo total</h3>
                <p className="display-6 mb-0">{formatCurrency(totals.cost)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-bg-warning h-100">
              <div className="card-body">
                <h3 className="h6 text-uppercase">Margen total</h3>
                <p className="display-6 mb-0">{formatCurrency(totals.margin)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Ofertas</div>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  {columns.includes('offerNumber') && <th scope="col">Número</th>}
                  {columns.includes('client') && <th scope="col">Cliente</th>}
                  {columns.includes('price') && <th scope="col">Precio</th>}
                  {columns.includes('cost') && <th scope="col">Costo</th>}
                  {columns.includes('margin') && <th scope="col">Margen</th>}
                  {columns.includes('createdAt') && <th scope="col">Creada</th>}
                  {columns.includes('validUntil') && <th scope="col">Vigente hasta</th>}
                  {columns.includes('status') && <th scope="col">Estado</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <tr key={offer.id}>
                      {columns.includes('offerNumber') && <td>{offer.offerNumber}</td>}
                      {columns.includes('client') && <td>{offer.clientName}</td>}
                      {columns.includes('price') && <td>{formatCurrency(offer.price)}</td>}
                      {columns.includes('cost') && <td>{formatCurrency(offer.cost)}</td>}
                      {columns.includes('margin') && <td>{formatCurrency(offer.margin)}</td>}
                      {columns.includes('createdAt') && <td>{formatDate(offer.createdAt)}</td>}
                      {columns.includes('validUntil') && <td>{formatDate(offer.validUntil)}</td>}
                      {columns.includes('status') && (
                        <td>
                          <StatusBadge status={offer.status} />
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length || DEFAULT_COLUMNS.length} className="text-center py-4">
                      No se encontraron ofertas con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
