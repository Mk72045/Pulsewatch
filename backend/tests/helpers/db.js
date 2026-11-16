import mongoose from "mongoose";
// Importing db.js also applies its DNS workaround, which hosted MongoDB
// needs on some networks.
import "../../src/config/db.js";
import { env } from "../../src/config/env.js";

// Tests delete data, so they get their own database inside the same cluster.
const TEST_DB_NAME = "pulsewatch_test";

export async function connectTestDB() {
  await mongoose.connect(env.MONGO_URI, {
    dbName: TEST_DB_NAME,
    serverSelectionTimeoutMS: 5000,
  });

  // Seat belt: never let a test run against a real database.
  if (!mongoose.connection.name.endsWith("_test")) {
    await mongoose.disconnect();
    throw new Error("Refusing to run tests on a non-test database");
  }

  // Unique indexes are built in the background. Wait for them, or the
  // duplicate-email test could pass by accident on a fresh database.
  await Promise.all(
    Object.values(mongoose.connection.models).map((model) => model.init()),
  );
}

export async function clearCollections() {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDB() {
  await mongoose.disconnect();
}