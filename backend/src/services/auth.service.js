import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const SALT_ROUNDS = 12;

// Compared against when the email is unknown, so a wrong email takes as long
// as a wrong password and does not reveal which emails are registered.
const fakeHash = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

// The only user fields that are allowed to leave the server.
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await User.create({ name, email, passwordHash });

    return toPublicUser(user);
  } catch (error) {
    // 11000 is MongoDB's duplicate key error from the unique email index.
    if (error.code === 11000) {
      throw new ApiError(409, "Email is already registered");
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  // passwordHash is hidden by default, so it must be asked for here.
  const user = await User.findOne({ email }).select("+passwordHash");

  const isMatch = await bcrypt.compare(
    password,
    user ? user.passwordHash : fakeHash,
  );

  if (!user || !isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  return toPublicUser(user);
}

export async function getUserById(id) {
  const user = await User.findById(id);

  return user ? toPublicUser(user) : null;
}
