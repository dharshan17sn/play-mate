// Database configuration for PostgreSQL
require('dotenv').config();

const databaseConfig = {
    development: {
        url: process.env.DATABASE_URL || "postgresql:postgres:6362@localhost:5432/playmate_dev?schema=public"
    },
    production: {
        url: process.env.DATABASE_URL
    },
    test: {
        url: process.env.DATABASE_URL || "postgresql://postgres:6362@localhost:5432/playmate_test?schema=public"
    }
};

module.exports = databaseConfig;
