import { checkQueue } from "../queues/checkQueue.js";
import { ApiError } from "../utils/ApiError.js";

// Puts one test job on the "checks" queue. The worker process does the work.
export async function addTestCheckJob() {
  if (!checkQueue) {
    throw new ApiError(503, "Set REDIS_URL in backend/.env before adding a job.");
  }

  const job = await checkQueue.add("test", {
    message: "hello from the API",
  });

  return { jobId: job.id };
}
