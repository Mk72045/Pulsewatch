import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { checkQueue } from "../src/queues/checkQueue.js";

describe("GET /api/v1/health", () => {
  // Importing the app opens a BullMQ Redis connection.
  // Close it or Jest stays running after the test finishes.
  afterAll(async () => {
    if (checkQueue) {
      await checkQueue.close();
    }
  });

  it("returns the server status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Server is running");
    expect(response.body.data.status).toBe("ok");
    expect(typeof response.body.data.uptime).toBe("number");
    expect(response.body.data).toHaveProperty("mongodb");
    expect(response.body.data).toHaveProperty("redis");
  });
});
