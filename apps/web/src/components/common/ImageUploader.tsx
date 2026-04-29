import { useRef, useState } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { getSignature, uploadToCloudinary } from '@/services/uploadService';

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string, publicId: string) => void;
  folder?: string;
}

type UploadState = 'idle' | 'uploading' | 'error';

export function ImageUploader({ value, onChange, folder = 'convoca/events' }: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Solo se aceptan imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('El archivo supera el límite de 5 MB');
      return;
    }

    setState('uploading');
    setProgress(0);
    try {
      const sig = await getSignature(folder);
      const { url, publicId } = await uploadToCloudinary(file, sig, setProgress);
      onChange(url, publicId);
      setState('idle');
    } catch {
      setState('error');
      setError('Error al subir la imagen. Inténtalo de nuevo.');
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function clear() {
    onChange('', '');
    setState('idle');
    setError(null);
    setProgress(0);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ aspectRatio: '16/7', maxHeight: '240px' }}>
          <img src={value} alt="Cartel del evento" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded bg-background/80 px-2 py-1 text-xs backdrop-blur-sm transition-colors hover:bg-muted"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={clear}
              aria-label="Eliminar imagen"
              className="rounded-full bg-background/80 p-1 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => state !== 'uploading' && inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && state !== 'uploading' && inputRef.current?.click()}
          className={[
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
            state === 'uploading' ? 'pointer-events-none opacity-70' : '',
          ].join(' ')}
        >
          {state === 'uploading' ? (
            <>
              <div className="w-full max-w-xs overflow-hidden rounded-full bg-muted h-1.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Subiendo… {progress}%</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {state === 'error' ? (
                  <ImageIcon className="h-6 w-6 text-destructive" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Arrastra una imagen o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WebP · máx. 5 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
