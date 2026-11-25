import { z } from "zod";
import {
  getPublicStatus,
  setPublicStatus,
} from "../services/statusPage.service.js";
import { validate } from "../middlewares/validate.js";

const toggleSchema = z.object({ enabled: z.boolean() });

// GET /status/settings — is the page on, and what is its address?
// requireAuth has already loaded the user, so there is no second query.
export const getStatusSettings = async (req, res) => {
  const { publicStatusToken } = req.user;

  res.json({
    success: true,
    data: {
      enabled: Boolean(publicStatusToken),
      token: publicStatusToken ?? null,
    },
  });
};

// PUT /status/settings — turn the page on or off.
export const updateStatusSettings = [
  validate(toggleSchema),
  async (req, res) => {
    const settings = await setPublicStatus(req.user.id, req.body.enabled);

    res.json({
      success: true,
      message: settings.enabled ? "Status page is on" : "Status page is off",
      data: settings,
    });
  },
];

// GET /status/:token — the public page. No login, so it is mounted separately
// from the routes that use requireAuth.
export const getStatusPage = async (req, res) => {
  const status = await getPublicStatus(req.params.token);

  res.json({ success: true, data: { status } });
};
