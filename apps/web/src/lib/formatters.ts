export function formatPrice(price: number): string {
  if (price === 0) return 'Gratuito';
  return `${price.toFixed(2)} €`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateRange(from: Date, to: Date): string {
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();
  if (sameDay) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}
