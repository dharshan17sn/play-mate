import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

async function main() {
  logger.info('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await prisma.message.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.tournamentTeam.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.userGame.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.team.deleteMany();
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();

    logger.info('🗑️ Cleared existing data');

    // Create games
    const games = await Promise.all([
      prisma.game.create({ data: { name: 'Counter-Strike 2' } }),
      prisma.game.create({ data: { name: 'Valorant' } }),
      prisma.game.create({ data: { name: 'League of Legends' } }),
      prisma.game.create({ data: { name: 'Dota 2' } }),
      prisma.game.create({ data: { name: 'Rocket League' } }),
    ]);

    logger.info(`🎮 Created ${games.length} games`);

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          user_id: 'john_doe',
          displayName: 'John Doe',
          email: 'john@example.com',
          passwordHash: hashedPassword,
          gender: 'Male',
          location: 'New York, USA',
        },
      }),
      prisma.user.create({
        data: {
          user_id: 'jane_smith',
          displayName: 'Jane Smith',
          email: 'jane@example.com',
          passwordHash: hashedPassword,
          gender: 'Female',
          location: 'Los Angeles, USA',
        },
      }),
      prisma.user.create({
        data: {
          user_id: 'mike_johnson',
          displayName: 'Mike Johnson',
          email: 'mike@example.com',
          passwordHash: hashedPassword,
          gender: 'Male',
          location: 'Chicago, USA',
        },
      }),
      prisma.user.create({
        data: {
          user_id: 'sarah_wilson',
          displayName: 'Sarah Wilson',
          email: 'sarah@example.com',
          passwordHash: hashedPassword,
          gender: 'Female',
          location: 'Miami, USA',
        },
      }),
    ]);

    logger.info(`👥 Created ${users.length} users`);

    // Create teams
    const teams = await Promise.all([
      prisma.team.create({
        data: {
          title: 'CS2 Elite',
          description: 'Professional Counter-Strike 2 team',
          creatorId: users[0].id,
          gameId: games[0].id,
        },
      }),
      prisma.team.create({
        data: {
          title: 'Valorant Warriors',
          description: 'Competitive Valorant team',
          creatorId: users[1].id,
          gameId: games[1].id,
        },
      }),
      prisma.team.create({
        data: {
          title: 'LoL Champions',
          description: 'League of Legends champions',
          creatorId: users[2].id,
          gameId: games[2].id,
        },
      }),
    ]);

    logger.info(`🏆 Created ${teams.length} teams`);

    // Add team members
    await Promise.all([
      prisma.teamMember.create({
        data: {
          userId: users[0].id,
          teamId: teams[0].id,
          status: 'ACCEPTED',
        },
      }),
      prisma.teamMember.create({
        data: {
          userId: users[1].id,
          teamId: teams[0].id,
          status: 'ACCEPTED',
        },
      }),
      prisma.teamMember.create({
        data: {
          userId: users[2].id,
          teamId: teams[1].id,
          status: 'ACCEPTED',
        },
      }),
      prisma.teamMember.create({
        data: {
          userId: users[3].id,
          teamId: teams[1].id,
          status: 'PENDING',
        },
      }),
    ]);

    logger.info('👥 Added team members');

    // Create tournaments
    const tournaments = await Promise.all([
      prisma.tournament.create({
        data: {
          title: 'CS2 Championship 2024',
          description: 'Annual Counter-Strike 2 tournament',
          creatorId: users[0].id,
          gameId: games[0].id,
          startDate: new Date('2024-06-15'),
          location: 'Online',
        },
      }),
      prisma.tournament.create({
        data: {
          title: 'Valorant Masters',
          description: 'Valorant masters tournament',
          creatorId: users[1].id,
          gameId: games[1].id,
          startDate: new Date('2024-07-20'),
          location: 'Los Angeles, CA',
        },
      }),
    ]);

    logger.info(`🏆 Created ${tournaments.length} tournaments`);

    // Register teams for tournaments
    await Promise.all([
      prisma.tournamentTeam.create({
        data: {
          tournamentId: tournaments[0].id,
          teamId: teams[0].id,
          users: { connect: [{ id: users[0].id }, { id: users[1].id }] },
        },
      }),
      prisma.tournamentTeam.create({
        data: {
          tournamentId: tournaments[1].id,
          teamId: teams[1].id,
          users: { connect: [{ id: users[2].id }] },
        },
      }),
    ]);

    logger.info('📝 Registered teams for tournaments');

    // Create invitations
    await prisma.invitation.create({
      data: {
        fromUserId: users[0].id,
        toUserId: users[3].id,
        teamId: teams[0].id,
        status: 'PENDING',
      },
    });

    logger.info('📨 Created invitations');

    // Create messages
    await Promise.all([
      prisma.message.create({
        data: {
          senderId: users[0].id,
          teamId: teams[0].id,
          content: 'Welcome to CS2 Elite! Let\'s practice tonight.',
        },
      }),
      prisma.message.create({
        data: {
          senderId: users[1].id,
          teamId: teams[0].id,
          content: 'Great! I\'m ready to practice.',
        },
      }),
    ]);

    logger.info('💬 Created messages');

    // Add user game preferences
    await Promise.all([
      prisma.userGame.create({
        data: {
          userId: users[0].id,
          gameId: games[0].id,
        },
      }),
      prisma.userGame.create({
        data: {
          userId: users[1].id,
          gameId: games[1].id,
        },
      }),
      prisma.userGame.create({
        data: {
          userId: users[2].id,
          gameId: games[2].id,
        },
      }),
    ]);

    logger.info('🎮 Added user game preferences');

    logger.info('✅ Database seeding completed successfully!');
    logger.info('📊 Sample data created:');
    logger.info(`   - ${games.length} games`);
    logger.info(`   - ${users.length} users`);
    logger.info(`   - ${teams.length} teams`);
    logger.info(`   - ${tournaments.length} tournaments`);
    logger.info('🔑 Default password for all users: password123');

  } catch (error) {
    logger.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
main()
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
