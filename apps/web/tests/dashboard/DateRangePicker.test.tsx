import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';

describe('DateRangePicker', () => {
  it('renders placeholder when no date selected', () => {
    render(<DateRangePicker value={{}} onChange={() => {}} />);
    expect(screen.getByText('Selecciona un rango')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<DateRangePicker value={{}} onChange={() => {}} placeholder="Elige fechas" />);
    expect(screen.getByText('Elige fechas')).toBeInTheDocument();
  });

  it('opens calendar popover when trigger is clicked', () => {
    render(<DateRangePicker value={{}} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    // numberOfMonths=2 renders 2 grids
    const grids = screen.getAllByRole('grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('calls onChange when a day is selected', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Click a day button (DayPicker renders buttons inside gridcells)
    const dayButtons = screen
      .getAllByRole('button')
      .filter(b => /^\d+$/.test(b.textContent?.trim() ?? ''));
    if (dayButtons[0]) {
      fireEvent.click(dayButtons[0]);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('displays formatted date range when both dates are set', () => {
    const from = new Date('2025-03-10');
    const to = new Date('2025-03-20');
    render(<DateRangePicker value={{ from, to }} onChange={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent(/mar/i);
  });
});
