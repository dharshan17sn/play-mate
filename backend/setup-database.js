#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up PostgreSQL database with Prisma...\n');

try {
    // Check if .env file exists
    const fs = require('fs');
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        console.log('📝 Creating .env file...');
        const envContent = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/playmate_dev?schema=public"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Other environment variables
NODE_ENV="development"
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created. Please update the DATABASE_URL with your actual PostgreSQL credentials.\n');
    } else {
        console.log('✅ .env file already exists.\n');
    }

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated.\n');

    // Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    console.log('✅ Database migrations completed.\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with actual PostgreSQL credentials');
    console.log('2. Make sure PostgreSQL is running on your machine');
    console.log('3. Create the database if it doesn\'t exist');
    console.log('4. Run "npm run dev" to start your server');

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('- PostgreSQL is installed and running');
    console.log('- You have the correct database credentials');
    console.log('- The database exists (or create it manually)');
    process.exit(1);
}
