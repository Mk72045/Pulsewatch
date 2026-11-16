import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { checkQueue } from "../src/queues/checkQueue.js";

describe("auth rate limiter", () => {
  afterAll(async () => {
    if (checkQueue) {
      await checkQueue.close();
    }
  });

  it("blocks the 11th failed login attempt with 429", async () => {
    // An invalid body fails fast with 400 and never touches the database.
    // The limiter runs before validation, so these still count as failures.
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "bad" });

      expect(response.status).toBe(400);
    }

    const blocked = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bad" });

    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many failed attempts/);
  });
});