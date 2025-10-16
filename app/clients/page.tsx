'use client';

import { FormEvent, useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../lib/format';

export default function ClientsPage() {
  const { clients, addClient, hydrated } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!hydrated) {
    return <p className="text-muted">Cargando datos locales…</p>;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setMessage('El nombre del cliente es obligatorio.');
      return;
    }
    const client = addClient({ name, email });
    setMessage(`Cliente "${client.name}" guardado correctamente.`);
    setName('');
    setEmail('');
  };

  return (
    <div className="row g-4">
      <div className="col-md-5">
        <div className="card">
          <div className="card-header">Nuevo cliente</div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label htmlFor="name" className="form-label">
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="form-label">
                  Correo electrónico (opcional)
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="cliente@empresa.com"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Guardar cliente
              </button>
              {message && <span className="text-success small">{message}</span>}
            </form>
          </div>
        </div>
      </div>

      <div className="col-md-7">
        <div className="card">
          <div className="card-header">Listado de clientes</div>
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Registrado</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.name}</td>
                      <td>{client.email ?? '—'}</td>
                      <td>{formatDate(client.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      Todavía no hay clientes registrados.
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
