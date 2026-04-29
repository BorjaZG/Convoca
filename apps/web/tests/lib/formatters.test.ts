import { describe, expect, it } from 'vitest';
import { formatDate, formatDateRange, formatPrice } from '@/lib/formatters';

describe('formatPrice', () => {
  it('devuelve "Gratuito" para precio 0', () => {
    expect(formatPrice(0)).toBe('Gratuito');
  });

  it('formatea precio con 2 decimales y símbolo €', () => {
    expect(formatPrice(15.5)).toBe('15.50 €');
  });

  it('añade .00 a precio entero', () => {
    expect(formatPrice(20)).toBe('20.00 €');
  });
});

describe('formatDate', () => {
  it('incluye año y mes abreviado en locale es-ES', () => {
    const result = formatDate(new Date('2025-06-15T10:00:00Z'));
    expect(result).toContain('2025');
    expect(result).toMatch(/jun/i);
  });

  it('acepta string ISO como argumento', () => {
    const result = formatDate('2025-12-25T00:00:00Z');
    expect(result).toContain('2025');
  });
});

describe('formatDateRange', () => {
  it('mismo día devuelve una sola fecha', () => {
    const d = new Date('2025-08-10T10:00:00');
    const result = formatDateRange(d, d);
    expect(result).not.toContain('–');
  });

  it('días distintos devuelve rango con separador –', () => {
    const from = new Date('2025-08-10T10:00:00');
    const to = new Date('2025-08-15T18:00:00');
    const result = formatDateRange(from, to);
    expect(result).toContain('–');
  });
});
