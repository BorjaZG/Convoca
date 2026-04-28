import { render, screen, fireEvent } from '@testing-library/react';
import { type ColumnDef } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';
import { DataTable } from '@/components/dashboard/DataTable';

type Row = { name: string; city: string; score: number };

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'city', header: 'Ciudad' },
  { accessorKey: 'score', header: 'Puntos' },
];

const data: Row[] = [
  { name: 'Carlos', city: 'Madrid', score: 80 },
  { name: 'Ana', city: 'Barcelona', score: 95 },
  { name: 'Beatriz', city: 'Sevilla', score: 60 },
];

describe('DataTable', () => {
  it('renders all rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
  });

  it('sorts ascending by Nombre on first click', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('Nombre'));
    const rows = screen.getAllByRole('row');
    // row[0] = header, row[1] = first data row after asc sort
    expect(rows[1]).toHaveTextContent('Ana');
    expect(rows[3]).toHaveTextContent('Carlos');
  });

  it('sorts descending by Nombre on second click', () => {
    render(<DataTable columns={columns} data={data} />);
    const header = screen.getByText('Nombre');
    fireEvent.click(header);
    fireEvent.click(header);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Carlos');
  });

  it('sorts by Puntos column (clicking twice reverses the order)', () => {
    render(<DataTable columns={columns} data={data} />);
    const header = screen.getByText('Puntos');

    fireEvent.click(header); // first sort (asc or desc depending on column type)
    const rows1 = screen.getAllByRole('row');
    const firstValueAfterOne = rows1[1].textContent ?? '';

    fireEvent.click(header); // second click reverses it
    const rows2 = screen.getAllByRole('row');
    const firstValueAfterTwo = rows2[1].textContent ?? '';

    // The first row must have changed after the second click
    expect(firstValueAfterOne).not.toEqual(firstValueAfterTwo);
  });

  it('sorts by Ciudad column', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('Ciudad'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Barcelona');
  });

  it('shows EmptyState when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Sin resultados"
        emptyDescription="Prueba otros filtros"
      />
    );
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('Prueba otros filtros')).toBeInTheDocument();
  });

  it('filters rows via globalFilter prop', () => {
    render(<DataTable columns={columns} data={data} globalFilter="Ana" />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Carlos')).not.toBeInTheDocument();
  });

  it('shows skeleton rows when loading', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
