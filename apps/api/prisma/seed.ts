import 'dotenv/config';
import { Category, EventStatus, PrismaClient, ReservationStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_USERS = [
  { email: 'admin@convoca.com', password: 'Admin1234', name: 'Admin User', role: Role.ADMIN },
  { email: 'org@convoca.com', password: 'Org12345', name: 'Organizer User', role: Role.ORGANIZER },
  { email: 'user@convoca.com', password: 'User1234', name: 'Regular User', role: Role.USER },
];

const now = new Date();
const past = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const EVENTS_DATA = [
  // ── Pasados (status COMPLETED) ─────────────────────────────────────────────
  {
    title: 'Concierto de Jazz en el Retiro',
    description: 'Una noche mágica con los mejores músicos de jazz de la escena madrileña bajo las estrellas del Parque del Retiro.',
    category: Category.CONCIERTO,
    startDate: past(60),
    endDate: past(60),
    venue: 'Parque del Retiro - Rosaleda',
    city: 'Madrid',
    capacity: 100,
    price: 15,
    status: EventStatus.COMPLETED,
    featured: true,
  },
  {
    title: 'Exposición: Arte Moderno en el MACBA',
    description: 'Muestra temporal de obras de artistas emergentes del panorama nacional e internacional. Entrada libre para menores de 18 años.',
    category: Category.EXPOSICION,
    startDate: past(45),
    endDate: past(30),
    venue: 'MACBA - Museu d\'Art Contemporani',
    city: 'Barcelona',
    capacity: 50,
    price: 0,
    status: EventStatus.COMPLETED,
    featured: false,
  },
  {
    title: 'Taller de Cocina Japonesa',
    description: 'Aprende a preparar sushi, ramen y gyozas con el chef Hiroshi Tanaka. Incluye degustación y recetario exclusivo.',
    category: Category.TALLER,
    startDate: past(30),
    endDate: past(30),
    venue: 'Escuela de Cocina Gastrolab',
    city: 'Madrid',
    capacity: 20,
    price: 25,
    status: EventStatus.COMPLETED,
    featured: false,
  },
  {
    title: 'Mercado Artesanal de Triana',
    description: 'Más de 80 artesanos locales presentan sus creaciones únicas: cerámica, textiles, joyería y gastronomía tradicional.',
    category: Category.MERCADILLO,
    startDate: past(20),
    endDate: past(18),
    venue: 'Mercado de Triana',
    city: 'Sevilla',
    capacity: 200,
    price: 0,
    status: EventStatus.COMPLETED,
    featured: false,
  },
  {
    title: 'Hamlet — Compañía Nacional de Teatro Clásico',
    description: 'La obra más universal de Shakespeare interpretada por la Compañía Nacional de Teatro Clásico en versión de David Toscano.',
    category: Category.TEATRO,
    startDate: past(15),
    endDate: past(15),
    venue: 'Teatro Valle-Inclán',
    city: 'Madrid',
    capacity: 150,
    price: 20,
    status: EventStatus.COMPLETED,
    featured: true,
  },
  {
    title: 'Carrera Solidaria 10K Valencia',
    description: 'Corre con nosotros en favor de la Asociación Española contra el Cáncer. Recorrido urbano de 10 km por el centro histórico de Valencia.',
    category: Category.DEPORTE,
    startDate: past(10),
    endDate: past(10),
    venue: 'Palau de la Música - Salida',
    city: 'Valencia',
    capacity: 500,
    price: 0,
    status: EventStatus.COMPLETED,
    featured: false,
  },

  // ── Futuros (status PUBLISHED) ─────────────────────────────────────────────
  {
    title: 'Festival de Flamenco Ciudad de Sevilla',
    description: 'Tres días con los mejores artistas del flamenco contemporáneo. Actuaciones al aire libre, talleres y exposiciones fotográficas.',
    category: Category.CONCIERTO,
    startDate: future(15),
    endDate: future(17),
    venue: 'Plaza de España',
    city: 'Sevilla',
    capacity: 300,
    price: 30,
    status: EventStatus.PUBLISHED,
    featured: true,
  },
  {
    title: 'Exposición: Fotografía Urbana — Miradas de Ciudad',
    description: 'Fotógrafos de 20 países retratan la vida cotidiana en las grandes metrópolis. Una reflexión visual sobre el espacio urbano y sus habitantes.',
    category: Category.EXPOSICION,
    startDate: future(7),
    endDate: future(35),
    venue: 'Círculo de Bellas Artes',
    city: 'Madrid',
    capacity: 80,
    price: 0,
    status: EventStatus.PUBLISHED,
    featured: false,
  },
  {
    title: 'Taller de Cerámica — Técnica Raku',
    description: 'Descubre la ancestral técnica japonesa del Raku. Crearás tu propia pieza y te la llevarás a casa. Nivel: principiantes bienvenidos.',
    category: Category.TALLER,
    startDate: future(10),
    endDate: future(10),
    venue: 'Taller El Barro Vivo',
    city: 'Barcelona',
    capacity: 15,
    price: 40,
    status: EventStatus.PUBLISHED,
    featured: false,
  },
  {
    title: 'Conferencia: IA y el Futuro del Trabajo',
    description: 'Ponentes de Google, Mistral AI y el MIT debatirán sobre el impacto de la inteligencia artificial en los mercados laborales. Mesa redonda incluida.',
    category: Category.CONFERENCIA,
    startDate: future(20),
    endDate: future(20),
    venue: 'Espacio IFEMA — Sala Norte',
    city: 'Madrid',
    capacity: 200,
    price: 50,
    status: EventStatus.PUBLISHED,
    featured: true,
  },
  {
    title: 'Feria de la Gastronomía Vasca',
    description: 'Pintxos, txakoli y cocina de autor. Los mejores restaurantes del País Vasco se reúnen en una experiencia gastronómica única.',
    category: Category.GASTRONOMIA,
    startDate: future(25),
    endDate: future(26),
    venue: 'Palacio Euskalduna',
    city: 'Bilbao',
    capacity: 60,
    price: 50,
    status: EventStatus.PUBLISHED,
    featured: false,
  },
  {
    title: 'Mercado Navideño de la Plaza Mayor',
    description: 'El mercado más tradicional de Madrid con más de 100 puestos de artesanía, decoración navideña y productos gourmet de temporada.',
    category: Category.MERCADILLO,
    startDate: future(30),
    endDate: future(45),
    venue: 'Plaza Mayor',
    city: 'Madrid',
    capacity: 400,
    price: 0,
    status: EventStatus.PUBLISHED,
    featured: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ── Usuarios ────────────────────────────────────────────────────────────────
  const users: Record<string, string> = {};
  for (const userData of SEED_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { email: userData.email, passwordHash, name: userData.name, role: userData.role },
    });
    users[userData.role] = user.id;
    console.log(`✓ ${userData.role}: ${userData.email}`);
  }

  const organizerId = users[Role.ORGANIZER];
  const userId = users[Role.USER];
  const adminId = users[Role.ADMIN];

  // ── Eventos ─────────────────────────────────────────────────────────────────
  console.log('\n📅 Creando eventos...');
  const eventIds: string[] = [];

  for (const eventData of EVENTS_DATA) {
    const existing = await prisma.event.findFirst({
      where: { title: eventData.title, organizerId },
    });
    if (existing) {
      eventIds.push(existing.id);
      console.log(`  · (existente) ${eventData.title}`);
      continue;
    }
    const event = await prisma.event.create({
      data: { ...eventData, organizerId },
    });
    eventIds.push(event.id);
    console.log(`  ✓ ${eventData.title}`);
  }

  // Índices de conveniencia (basados en el orden de EVENTS_DATA)
  const [eJazz, eArte, eCocina, eMercado, eTeatro, eMaraton, eFlamenco, eFoto, eCeramica, eConf, eGastro, eNavidad] = eventIds;

  // ── Reservas ────────────────────────────────────────────────────────────────
  console.log('\n🎟️  Creando reservas...');

  const RESERVATIONS = [
    // ── Pasados (ATTENDED) ──────────────────────────────────────────────────
    { eventId: eJazz,    userId, quantity: 2, totalPrice: 30,  status: ReservationStatus.ATTENDED },
    { eventId: eJazz,    userId: adminId, quantity: 1, totalPrice: 15, status: ReservationStatus.ATTENDED },
    { eventId: eArte,    userId, quantity: 1, totalPrice: 0,   status: ReservationStatus.ATTENDED },
    { eventId: eArte,    userId: adminId, quantity: 1, totalPrice: 0,  status: ReservationStatus.ATTENDED },
    { eventId: eCocina,  userId, quantity: 1, totalPrice: 25,  status: ReservationStatus.ATTENDED },
    { eventId: eCocina,  userId: adminId, quantity: 1, totalPrice: 25, status: ReservationStatus.ATTENDED },
    { eventId: eMercado, userId, quantity: 2, totalPrice: 0,   status: ReservationStatus.ATTENDED },
    { eventId: eTeatro,  userId, quantity: 1, totalPrice: 20,  status: ReservationStatus.ATTENDED },
    { eventId: eTeatro,  userId: adminId, quantity: 1, totalPrice: 20, status: ReservationStatus.ATTENDED },
    { eventId: eMaraton, userId, quantity: 1, totalPrice: 0,   status: ReservationStatus.ATTENDED },
    { eventId: eMaraton, userId: adminId, quantity: 1, totalPrice: 0,  status: ReservationStatus.CANCELLED },

    // ── Futuros (CONFIRMED / CANCELLED) ─────────────────────────────────────
    { eventId: eFlamenco, userId, quantity: 2, totalPrice: 60,  status: ReservationStatus.CONFIRMED },
    { eventId: eFlamenco, userId: adminId, quantity: 1, totalPrice: 30, status: ReservationStatus.CONFIRMED },
    { eventId: eFoto,     userId, quantity: 1, totalPrice: 0,   status: ReservationStatus.CONFIRMED },
    { eventId: eCeramica, userId, quantity: 1, totalPrice: 40,  status: ReservationStatus.CONFIRMED },
    { eventId: eCeramica, userId: adminId, quantity: 1, totalPrice: 40, status: ReservationStatus.CANCELLED },
    { eventId: eConf,     userId, quantity: 1, totalPrice: 50,  status: ReservationStatus.CONFIRMED },
    { eventId: eConf,     userId: adminId, quantity: 1, totalPrice: 50, status: ReservationStatus.CONFIRMED },
    { eventId: eGastro,   userId: adminId, quantity: 2, totalPrice: 100, status: ReservationStatus.CONFIRMED },
    { eventId: eNavidad,  userId, quantity: 1, totalPrice: 0,   status: ReservationStatus.CONFIRMED },
  ];

  for (const res of RESERVATIONS) {
    const existing = await prisma.reservation.findFirst({
      where: { eventId: res.eventId, userId: res.userId },
    });
    if (!existing) {
      await prisma.reservation.create({ data: res });
      process.stdout.write('.');
    } else {
      process.stdout.write('·');
    }
  }
  console.log(`\n  ✓ ${RESERVATIONS.length} reservas procesadas`);

  // ── Reseñas ─────────────────────────────────────────────────────────────────
  console.log('\n⭐ Creando reseñas...');

  const REVIEWS = [
    { eventId: eJazz,   userId,   rating: 5, comment: 'Una noche increíble, la acústica del Retiro es perfecta. Los músicos estuvieron soberbios.' },
    { eventId: eArte,   userId,   rating: 4, comment: 'Selección de obras muy interesante. Eché de menos más artistas locales pero en conjunto impresionante.' },
    { eventId: eCocina, userId,   rating: 5, comment: 'El chef Hiroshi es un genio. Aprendí más en 3 horas que en años viendo vídeos. Totalmente recomendable.' },
    { eventId: eMercado, userId,  rating: 3, comment: 'Ambiente muy bueno y artesanía de calidad, aunque había demasiada gente y resultó difícil moverse.' },
    { eventId: eTeatro, userId,   rating: 4, comment: 'Puesta en escena magnífica y la interpretación de Hamlet fue memorable. La segunda parte se hizo algo larga.' },
    { eventId: eMaraton, userId,  rating: 5, comment: 'Organización impecable y ambiente solidario contagioso. Repetiré el año que viene sin dudarlo.' },
    { eventId: eJazz,   userId: adminId, rating: 4, comment: 'Gran nivel musical y muy buen ambiente. La ubicación en el parque le da un toque especial único.' },
    { eventId: eArte,   userId: adminId, rating: 3, comment: 'Interesante propuesta aunque algunas obras resultaron demasiado herméticas para el público general.' },
  ];

  for (const review of REVIEWS) {
    await prisma.review.upsert({
      where: { userId_eventId: { userId: review.userId, eventId: review.eventId } },
      update: {},
      create: review,
    });
    process.stdout.write('.');
  }
  console.log(`\n  ✓ ${REVIEWS.length} reseñas procesadas`);

  console.log('\n✅ Seed completado.\n');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
