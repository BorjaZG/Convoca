import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context/ToastContext';
import { EventForm, type EventFormData } from '@/components/events/EventForm';
import { eventsService } from '@/services/eventsService';

export function OrganizerEventNewPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const success = toast.success;
  const toastError = toast.error;

  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      const event = await eventsService.create({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        imageUrl: data.imageUrl || undefined,
        imagePublicId: data.imagePublicId || undefined,
      });
      success('Evento creado correctamente');
      navigate(`/events/${event.id}`);
    } catch {
      toastError('No se pudo crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nuevo evento</h1>
        <p className="text-sm text-muted-foreground">
          Rellena los datos para crear un nuevo evento
        </p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Detalles del evento</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={handleSubmit}
            submitLabel="Crear evento"
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
