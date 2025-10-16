'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../../context/DataContext';
import type { OfferStatus } from '../../../types';
import { formatCurrency } from '../../../lib/format';

const STATUSES: OfferStatus[] = ['borrador', 'en revisión', 'enviada', 'ganada', 'perdida'];

const toISODate = (value: string) => new Date(`${value}T00:00:00`).toISOString();

const computeNextOfferNumber = (existing: { offerNumber: string }[]): string => {
  const numericParts = existing
    .map((offer) => offer.offerNumber.match(/(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => !Number.isNaN(value));
  const nextNumber = numericParts.length > 0 ? Math.max(...numericParts) + 1 : existing.length + 1;
  return `OF-${nextNumber.toString().padStart(4, '0')}`;
};

export default function NewOfferPage() {
  const { clients, offers, addOffer, addClient, hydrated } = useData();
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [offerNumber, setOfferNumber] = useState(() => computeNextOfferNumber(offers));
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [createdAt, setCreatedAt] = useState(today);
  const [validUntil, setValidUntil] = useState(today);
  const [status, setStatus] = useState<OfferStatus>('borrador');
  const [clientId, setClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedPrice = Number.parseFloat(price || '0');
  const parsedCost = Number.parseFloat(cost || '0');
  const margin = parsedPrice - parsedCost;

  if (!hydrated) {
    return <p className="text-muted">Cargando datos locales…</p>;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!offerNumber.trim()) {
      setError('El número de oferta es obligatorio.');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('El precio debe ser un número mayor a cero.');
      return;
    }
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      setError('El costo debe ser un número válido mayor o igual a cero.');
      return;
    }
    if (!createdAt) {
      setError('Debes indicar la fecha de creación.');
      return;
    }
    if (!validUntil) {
      setError('Debes indicar la fecha de vigencia.');
      return;
    }

    let targetClientId = clientId;
    if (!targetClientId) {
      if (!newClientName.trim()) {
        setError('Selecciona un cliente existente o indica los datos de uno nuevo.');
        return;
      }
      const client = addClient({ name: newClientName, email: newClientEmail });
      targetClientId = client.id;
    }

    const newOffer = addOffer({
      offerNumber: offerNumber.trim(),
      clientId: targetClientId,
      price: parsedPrice,
      cost: parsedCost,
      status,
      createdAt: toISODate(createdAt),
      validUntil: toISODate(validUntil)
    });

    setMessage('Oferta creada correctamente.');
    setOfferNumber(computeNextOfferNumber([newOffer, ...offers]));
    setPrice('');
    setCost('');
    setClientId('');
    setNewClientName('');
    setNewClientEmail('');
    router.prefetch('/');
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 col-xl-7">
        <div className="card">
          <div className="card-header">Registrar nueva oferta</div>
          <div className="card-body">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-6">
                <label htmlFor="offerNumber" className="form-label">
                  Número de oferta
                </label>
                <input
                  id="offerNumber"
                  className="form-control"
                  value={offerNumber}
                  onChange={(event) => setOfferNumber(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="status" className="form-label">
                  Estado
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OfferStatus)}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="price" className="form-label">
                  Precio
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="cost" className="form-label">
                  Costo
                </label>
                <input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="createdAt" className="form-label">
                  Fecha de creación
                </label>
                <input
                  id="createdAt"
                  type="date"
                  className="form-control"
                  value={createdAt}
                  onChange={(event) => setCreatedAt(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="validUntil" className="form-label">
                  Vigente hasta
                </label>
                <input
                  id="validUntil"
                  type="date"
                  className="form-control"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label htmlFor="client" className="form-label">
                  Cliente existente
                </label>
                <select
                  id="client"
                  className="form-select"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">Si no existe, completa los datos a continuación.</div>
              </div>

              <div className="col-md-6">
                <label htmlFor="newClientName" className="form-label">
                  Nombre del nuevo cliente
                </label>
                <input
                  id="newClientName"
                  className="form-control"
                  value={newClientName}
                  onChange={(event) => setNewClientName(event.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="newClientEmail" className="form-label">
                  Correo del nuevo cliente
                </label>
                <input
                  id="newClientEmail"
                  type="email"
                  className="form-control"
                  value={newClientEmail}
                  onChange={(event) => setNewClientEmail(event.target.value)}
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="col-12">
                <div className="alert alert-light border">
                  <strong>Margen estimado:</strong> {formatCurrency(Number.isFinite(margin) ? margin : 0)}
                </div>
              </div>

              {error && (
                <div className="col-12">
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                </div>
              )}

              {message && (
                <div className="col-12">
                  <div className="alert alert-success" role="alert">
                    {message}
                  </div>
                </div>
              )}

              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => router.push('/')}>
                  Volver al dashboard
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
