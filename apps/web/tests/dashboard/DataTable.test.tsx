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
  it('muestra todas las filas', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
  });

  it('ordena por nombre al hacer clic en la columna', () => {
    render(<DataTable columns={columns} data={data} />);
    fireEvent.click(screen.getByText('Nombre'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Ana');
  });

  it('muestra el mensaje vacío cuando no hay datos', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Sin resultados"
        emptyDescription="Prueba otros filtros"
      />
    );
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('filtra filas con globalFilter', () => {
    render(<DataTable columns={columns} data={data} globalFilter="Ana" />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Carlos')).not.toBeInTheDocument();
  });
});
