import type { OfferStatus } from '../types';

const STATUS_STYLES: Record<OfferStatus, string> = {
  borrador: 'bg-secondary',
  'en revisión': 'bg-info text-dark',
  enviada: 'bg-primary',
  ganada: 'bg-success',
  perdida: 'bg-danger'
};

interface StatusBadgeProps {
  status: OfferStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = STATUS_STYLES[status] ?? 'bg-secondary';
  return <span className={`badge ${style}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};
