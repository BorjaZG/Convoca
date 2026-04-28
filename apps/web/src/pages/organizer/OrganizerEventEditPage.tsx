import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { EventForm, eventToFormValues, type EventFormData } from '@/components/events/EventForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context/ToastContext';
import { useEvent } from '@/hooks/useEvent';
import { eventsService } from '@/services/eventsService';

export function OrganizerEventEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, loading, error, refetch } = useEvent(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const success = toast.success;
  const toastError = toast.error;

  const handleSubmit = async (data: EventFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await eventsService.update(id, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        imageUrl: data.imageUrl || undefined,
      });
      success('Evento actualizado correctamente');
      navigate(`/events/${id}`);
    } catch {
      toastError('No se pudo actualizar el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="p-8"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!event) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Editar evento</h1>
        <p className="truncate text-sm text-muted-foreground">{event.title}</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Detalles del evento</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            defaultValues={eventToFormValues(event)}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
