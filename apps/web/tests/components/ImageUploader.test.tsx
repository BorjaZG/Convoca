import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploader } from '@/components/common/ImageUploader';
import * as uploadService from '@/services/uploadService';

vi.mock('@/services/uploadService');

const MOCK_SIG: uploadService.SignatureData = {
  signature: 'abc123',
  timestamp: 1700000000,
  apiKey: 'test-api-key',
  cloudName: 'test-cloud',
  folder: 'convoca/events',
};

const MOCK_RESULT: uploadService.UploadResult = {
  url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/convoca/events/photo.jpg',
  publicId: 'convoca/events/photo',
};

function makeFile(overrides: { name?: string; type?: string; size?: number } = {}) {
  const { name = 'photo.jpg', type = 'image/jpeg', size = 1024 } = overrides;
  return new File(['x'.repeat(size)], name, { type });
}

describe('ImageUploader', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
    vi.mocked(uploadService.getSignature).mockResolvedValue(MOCK_SIG);
    vi.mocked(uploadService.uploadToCloudinary).mockResolvedValue(MOCK_RESULT);
  });

  it('renderiza la zona de drop en estado inicial', () => {
    render(<ImageUploader onChange={onChange} />);
    expect(screen.getByText(/arrastra una imagen/i)).toBeInTheDocument();
    expect(screen.getByText(/jpg, png o webp/i)).toBeInTheDocument();
  });

  it('rechaza archivos mayores de 5 MB', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile({ size: 6 * 1024 * 1024 })] } });

    await waitFor(() => {
      expect(screen.getByText(/supera el límite de 5 mb/i)).toBeInTheDocument();
    });
    expect(uploadService.getSignature).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rechaza tipos de archivo no permitidos', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'doc.pdf', type: 'application/pdf' })] },
    });

    await waitFor(() => {
      expect(screen.getByText(/solo se aceptan imágenes/i)).toBeInTheDocument();
    });
    expect(uploadService.getSignature).not.toHaveBeenCalled();
  });

  it('llama a getSignature y luego a uploadToCloudinary con un archivo válido', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadService.getSignature).toHaveBeenCalledWith('convoca/events');
    });
    await waitFor(() => {
      expect(uploadService.uploadToCloudinary).toHaveBeenCalledWith(
        file,
        MOCK_SIG,
        expect.any(Function)
      );
    });
  });

  it('dispara onChange con url y publicId tras subida exitosa', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(MOCK_RESULT.url, MOCK_RESULT.publicId);
    });
  });

  it('muestra la preview cuando value tiene URL', () => {
    render(<ImageUploader value={MOCK_RESULT.url} onChange={onChange} />);
    const img = screen.getByAltText('Cartel del evento') as HTMLImageElement;
    expect(img.src).toBe(MOCK_RESULT.url);
    expect(screen.getByText('Reemplazar')).toBeInTheDocument();
  });

  it('llama a onChange con strings vacíos al pulsar el botón de eliminar', () => {
    render(<ImageUploader value={MOCK_RESULT.url} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Eliminar imagen'));
    expect(onChange).toHaveBeenCalledWith('', '');
  });

  it('muestra error si getSignature falla', async () => {
    vi.mocked(uploadService.getSignature).mockRejectedValue(new Error('Network error'));
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(screen.getByText(/error al subir la imagen/i)).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('usa el folder personalizado al llamar a getSignature', async () => {
    render(<ImageUploader onChange={onChange} folder="convoca/prueba" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(uploadService.getSignature).toHaveBeenCalledWith('convoca/prueba');
    });
  });
});
