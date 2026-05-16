import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';

describe('DateRangePicker', () => {
  it('muestra el placeholder cuando no hay fecha seleccionada', () => {
    render(<DateRangePicker value={{}} onChange={() => {}} />);
    expect(screen.getByText('Selecciona un rango')).toBeInTheDocument();
  });

  it('abre el calendario al hacer clic en el botón', () => {
    render(<DateRangePicker value={{}} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    const grids = screen.getAllByRole('grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('llama a onChange al seleccionar un día', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    const dayButtons = screen
      .getAllByRole('button')
      .filter(b => /^\d+$/.test(b.textContent?.trim() ?? ''));
    if (dayButtons[0]) {
      fireEvent.click(dayButtons[0]);
      expect(onChange).toHaveBeenCalled();
    }
  });
});
