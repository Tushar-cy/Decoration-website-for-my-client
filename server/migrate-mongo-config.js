// migrate-mongo-config.js
// docs: https://github.com/seppevs/migrate-mongo

require("dotenv").config();

const config = {
  mongodb: {
    url: process.env.MONGO_URI,
    options: {
      serverSelectionTimeoutMS: 5000,
    },
  },

  // Name of the migrations collection in MongoDB
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",

  // Extension of your migration files
  migrationFileExtension: ".js",

  // Enable/disable use of the 'MigrationName' field in the changelog collection
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
