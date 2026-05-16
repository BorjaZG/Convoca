import { ArrowRight, Calendar, Mic, Palette, BookOpen, Ticket, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  {
    icon: Ticket,
    title: 'Reserva al instante',
    description:
      'Encuentra el evento que buscas y asegura tu plaza en segundos. Sin colas, sin complicaciones.',
  },
  {
    icon: Users,
    title: 'Organiza con facilidad',
    description:
      'Publica tus eventos, controla el aforo y gestiona reservas desde un panel centralizado.',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas en tiempo real',
    description:
      'Los organizadores acceden a métricas detalladas: asistencia, tendencias y rendimiento de cada evento.',
  },
];

const CATEGORIES = [
  { icon: Mic, label: 'Conciertos' },
  { icon: BookOpen, label: 'Talleres' },
  { icon: Palette, label: 'Exposiciones' },
  { icon: Calendar, label: 'Más eventos' },
];

const STEPS = [
  { number: '01', title: 'Crea tu cuenta', description: 'Regístrate gratis en menos de un minuto.' },
  {
    number: '02',
    title: 'Explora eventos',
    description: 'Filtra por categoría, fecha o ubicación y encuentra lo que te gusta.',
  },
  {
    number: '03',
    title: 'Reserva tu plaza',
    description: 'Confirma tu asistencia al instante y recibe todos los detalles del evento.',
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(262_83%_58%/0.15),transparent)]" />
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Plataforma de eventos culturales
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Descubre y reserva{' '}
            <span className="text-primary">eventos culturales</span>{' '}
            en tu ciudad
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Conciertos, talleres, exposiciones y mucho más. Convoca conecta a organizadores y
            asistentes en una plataforma sencilla y potente.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/events">
                Explorar eventos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/register">Crear cuenta gratis</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="border-y bg-muted/40 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                to="/events"
                className="flex flex-col items-center gap-3 rounded-xl border bg-background p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <Icon className="h-7 w-7 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tanto si quieres asistir a un evento como organizarlo, Convoca lo hace simple.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-muted/40 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Cómo funciona?</h2>
            <p className="mt-4 text-muted-foreground">Tres pasos y estás dentro.</p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="flex flex-col items-center text-center">
                <span className="text-5xl font-black text-primary/20">{number}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      {!isAuthenticated && (
        <section className="px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold sm:text-3xl">
              ¿Listo para empezar?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Únete a Convoca y no te pierdas ningún evento cultural de tu ciudad.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to="/register">
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer mínimo */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Convoca — Plataforma de eventos culturales
      </footer>
    </div>
  );
}
