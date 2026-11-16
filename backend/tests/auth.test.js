import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/user.model.js";
import { checkQueue } from "../src/queues/checkQueue.js";
import {
  clearCollections,
  connectTestDB,
  disconnectTestDB,
} from "./helpers/db.js";

const registerUrl = "/api/v1/auth/register";
const loginUrl = "/api/v1/auth/login";
const meUrl = "/api/v1/auth/me";
const logoutUrl = "/api/v1/auth/logout";

const user = {
  name: "Manoj",
  email: "manoj@test.com",
  password: "password123",
};

beforeAll(connectTestDB);
beforeEach(clearCollections);

afterAll(async () => {
  await disconnectTestDB();
  // Importing the app opens a BullMQ Redis connection. Close it or Jest hangs.
  if (checkQueue) {
    await checkQueue.close();
  }
});

describe("POST /api/v1/auth/register", () => {
  it("creates the account and sets a login cookie", async () => {
    const response = await request(app).post(registerUrl).send(user);

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe("manoj@test.com");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.headers["set-cookie"][0]).toMatch(/token=.+; .*HttpOnly/);

    // The password must be stored as a bcrypt hash, never as plain text.
    const saved = await User.findOne({ email: user.email }).select(
      "+passwordHash",
    );
    expect(saved.passwordHash).not.toBe(user.password);
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("trims and lowercases the email", async () => {
    const response = await request(app)
      .post(registerUrl)
      .send({ ...user, email: "  MANOJ@Test.com " });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe("manoj@test.com");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post(registerUrl).send(user);

    const response = await request(app)
      .post(registerUrl)
      .send({ ...user, email: "MANOJ@test.com" });

    expect(response.status).toBe(409);
  });

  it("returns 400 with the failing fields for invalid input", async () => {
    const response = await request(app)
      .post(registerUrl)
      .send({ name: "", email: "bad", password: "123" });

    const fields = response.body.details.map((item) => item.field);

    expect(response.status).toBe(400);
    expect(fields).toEqual(
      expect.arrayContaining(["name", "email", "password"]),
    );
  });

  it("rejects an object where the email should be a string", async () => {
    const response = await request(app)
      .post(registerUrl)
      .send({ ...user, email: { $gt: "" } });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post(registerUrl).send(user);
  });

  it("logs in and sets a cookie, even if the email case differs", async () => {
    const response = await request(app)
      .post(loginUrl)
      .send({ email: "MANOJ@Test.com", password: user.password });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("returns 401 for a wrong password", async () => {
    const response = await request(app)
      .post(loginUrl)
      .send({ email: user.email, password: "wrongpass1" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("gives the same 401 message for an unknown email", async () => {
    const response = await request(app)
      .post(loginUrl)
      .send({ email: "nobody@test.com", password: "wrongpass1" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("rejects an object where the email should be a string", async () => {
    const response = await request(app)
      .post(loginUrl)
      .send({ email: { $gt: "" }, password: "wrongpass1" });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns 401 without a cookie", async () => {
    const response = await request(app).get(meUrl);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Please log in");
  });

  it("returns the user when logged in", async () => {
    // An agent keeps cookies between requests, like a browser.
    const agent = request.agent(app);
    await agent.post(registerUrl).send(user);

    const response = await agent.get(meUrl);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(user.email);
  });

  it("returns 401 for a tampered token", async () => {
    const response = await request(app)
      .get(meUrl)
      .set("Cookie", "token=abc.def.ghi");

    expect(response.status).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const token = jwt.sign(
      {
        sub: "507f1f77bcf86cd799439011",
        exp: Math.floor(Date.now() / 1000) - 10,
      },
      env.JWT_SECRET,
    );

    const response = await request(app)
      .get(meUrl)
      .set("Cookie", `token=${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Session expired/);
  });

  it("returns 401 when the token is valid but the user was deleted", async () => {
    const agent = request.agent(app);
    await agent.post(registerUrl).send(user);
    await User.deleteMany({});

    const response = await agent.get(meUrl);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Please log in");
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("clears the cookie, so /me fails afterwards", async () => {
    const agent = request.agent(app);
    await agent.post(registerUrl).send(user);

    const logout = await agent.post(logoutUrl);

    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"][0]).toMatch(/token=;/);

    const response = await agent.get(meUrl);

    expect(response.status).toBe(401);
  });
});