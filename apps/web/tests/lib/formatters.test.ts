import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice } from '@/lib/formatters';

describe('formatPrice', () => {
  it('devuelve "Gratuito" para precio 0', () => {
    expect(formatPrice(0)).toBe('Gratuito');
  });

  it('formatea precio con símbolo €', () => {
    expect(formatPrice(15.5)).toBe('15.50 €');
  });

  it('añade .00 a precio entero', () => {
    expect(formatPrice(20)).toBe('20.00 €');
  });
});

describe('formatDate', () => {
  it('incluye el año en el resultado', () => {
    const result = formatDate(new Date('2025-06-15T10:00:00Z'));
    expect(result).toContain('2025');
  });

  it('acepta string ISO como argumento', () => {
    const result = formatDate('2025-12-25T00:00:00Z');
    expect(result).toContain('2025');
  });
});
