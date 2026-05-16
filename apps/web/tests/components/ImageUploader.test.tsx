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
  });

  it('rechaza archivos mayores de 5 MB', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByText(/supera el límite de 5 mb/i)).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sube el archivo y llama a onChange con la URL', async () => {
    render(<ImageUploader onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(MOCK_RESULT.url, MOCK_RESULT.publicId);
    });
  });

  it('muestra la preview cuando hay una imagen cargada', () => {
    render(<ImageUploader value={MOCK_RESULT.url} onChange={onChange} />);
    const img = screen.getByAltText('Cartel del evento') as HTMLImageElement;
    expect(img.src).toBe(MOCK_RESULT.url);
  });
});
