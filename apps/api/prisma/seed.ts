import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_USERS = [
  { email: 'admin@convoca.com', password: 'Admin1234', name: 'Admin User', role: Role.ADMIN },
  { email: 'org@convoca.com', password: 'Org12345', name: 'Organizer User', role: Role.ORGANIZER },
  { email: 'user@convoca.com', password: 'User1234', name: 'Regular User', role: Role.USER },
];

async function main() {
  for (const userData of SEED_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { email: userData.email, passwordHash, name: userData.name, role: userData.role },
    });
    console.log(`✓ ${userData.role}: ${userData.email}`);
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
