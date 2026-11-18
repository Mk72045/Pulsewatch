import {
  createMonitor,
  deleteMonitor,
  findOwnedMonitor,
  listMonitors,
  updateMonitor,
} from "../services/monitor.service.js";

// requireAuth runs before all of these, so req.user is always set.
export const getMonitors = async (req, res) => {
  const monitors = await listMonitors(req.user.id);

  res.json({ success: true, data: { monitors } });
};

export const getMonitor = async (req, res) => {
  const monitor = await findOwnedMonitor(req.user.id, req.params.id);

  res.json({ success: true, data: { monitor } });
};

export const addMonitor = async (req, res) => {
  const monitor = await createMonitor(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Monitor created",
    data: { monitor },
  });
};

export const editMonitor = async (req, res) => {
  const monitor = await updateMonitor(req.user.id, req.params.id, req.body);

  res.json({
    success: true,
    message: "Monitor updated",
    data: { monitor },
  });
};

export const removeMonitor = async (req, res) => {
  await deleteMonitor(req.user.id, req.params.id);

  res.json({ success: true, message: "Monitor deleted" });
};
