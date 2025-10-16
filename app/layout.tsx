import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DataProvider } from '../context/DataContext';

export const metadata: Metadata = {
  title: 'Gestión de Ofertas',
  description: 'Dashboard ligero para gestionar clientes y ofertas comerciales.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <DataProvider>
          <header className="bg-dark text-white py-3">
            <div className="container d-flex justify-content-between align-items-center">
              <h1 className="h4 mb-0">Gestión de Ofertas</h1>
              <nav className="d-flex gap-3">
                <Link href="/" className="text-white text-decoration-none">
                  Dashboard
                </Link>
                <Link href="/clients" className="text-white text-decoration-none">
                  Clientes
                </Link>
                <Link href="/offers/new" className="text-white text-decoration-none">
                  Nueva oferta
                </Link>
              </nav>
            </div>
          </header>
          <main>
            <div className="container">{children}</div>
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
