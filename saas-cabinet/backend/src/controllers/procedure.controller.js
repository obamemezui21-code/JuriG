const { pool } = require("../config/db");
const {
  listProcedures,
  getProcedureById,
  createProcedure,
  updateProcedure,
  deleteProcedure,
} = require("../models/procedure.model");

const ensureClientBelongsToOrg = async (organizationId, clientId) => {
  const result = await pool.query(
    `SELECT id
     FROM clients
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );

  return Boolean(result.rows[0]);
};

const ensureServiceBelongsToOrg = async (organizationId, serviceId) => {
  const result = await pool.query(
    `SELECT id
     FROM legal_services
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, serviceId]
  );

  return Boolean(result.rows[0]);
};

const listAllProcedures = async (req, res, next) => {
  try {
    const procedures = await listProcedures(req.organizationId, {
      status: req.query.status,
    });

    res.json({ procedures });
  } catch (error) {
    next(error);
  }
};

const createNewProcedure = async (req, res, next) => {
  try {
    const { clientId, serviceId, intitule, title, montant, details, status, priority, expectedDeadline } =
      req.body;
    const normalizedIntitule = String(intitule || title || "").trim();
    const normalizedMontant = montant === undefined || montant === null || montant === "" ? 0 : Number(montant);

    if (!normalizedIntitule) {
      res.status(400).json({ message: "L'intitulé de la procédure est obligatoire." });
      return;
    }

    if (!Number.isFinite(normalizedMontant) || normalizedMontant < 0) {
      res.status(400).json({ message: "Le montant doit être un nombre positif ou nul." });
      return;
    }

    const normalizedClientId = clientId === undefined || clientId === null ? null : Number(clientId);
    const normalizedServiceId = serviceId === undefined || serviceId === null ? null : Number(serviceId);

    if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
      res.status(400).json({ message: "clientId doit être un entier." });
      return;
    }

    if (normalizedServiceId !== null && !Number.isInteger(normalizedServiceId)) {
      res.status(400).json({ message: "serviceId doit être un entier." });
      return;
    }

    if (normalizedClientId !== null) {
      const clientOk = await ensureClientBelongsToOrg(req.organizationId, normalizedClientId);
      if (!clientOk) {
        res.status(400).json({ message: "Le client n'appartient pas à ce cabinet." });
        return;
      }
    }

    if (normalizedServiceId !== null) {
      const serviceOk = await ensureServiceBelongsToOrg(req.organizationId, normalizedServiceId);
      if (!serviceOk) {
        res.status(400).json({ message: "Le service n'appartient pas à ce cabinet." });
        return;
      }
    }

    const procedure = await createProcedure({
      organizationId: req.organizationId,
      clientId: normalizedClientId,
      serviceId: normalizedServiceId,
      title: normalizedIntitule,
      montant: normalizedMontant,
      details: details ? String(details).trim() : null,
      status: status ? String(status).trim() : "nouvelle",
      priority: priority ? String(priority).trim() : "normale",
      expectedDeadline: expectedDeadline || null,
    });

    res.status(201).json({
      message: "Procédure enregistrée avec succès.",
      procedure,
    });
  } catch (error) {
    next(error);
  }
};

const updateOneProcedure = async (req, res, next) => {
  try {
    const procedureId = Number(req.params.id);

    if (!Number.isInteger(procedureId)) {
      res.status(400).json({ message: "ID procédure invalide." });
      return;
    }

    const payload = {};

    if (req.body.intitule !== undefined || req.body.title !== undefined) {
      payload.title = String(req.body.intitule || req.body.title || "").trim();
    }

    if (payload.title !== undefined && !payload.title) {
      res.status(400).json({ message: "L'intitulé de la procédure ne peut pas être vide." });
      return;
    }

    if (req.body.details !== undefined) {
      payload.details = req.body.details ? String(req.body.details).trim() : null;
    }

    if (req.body.montant !== undefined) {
      const normalizedMontant = req.body.montant === null || req.body.montant === "" ? 0 : Number(req.body.montant);
      if (!Number.isFinite(normalizedMontant) || normalizedMontant < 0) {
        res.status(400).json({ message: "Le montant doit être un nombre positif ou nul." });
        return;
      }
      payload.montant = normalizedMontant;
    }

    if (req.body.status !== undefined) {
      payload.status = String(req.body.status).trim();
      if (payload.status === "terminee" && req.body.completedAt === undefined) {
        payload.completedAt = new Date().toISOString().slice(0, 10);
      }
    }

    if (req.body.priority !== undefined) {
      payload.priority = String(req.body.priority).trim();
    }

    if (req.body.expectedDeadline !== undefined) {
      payload.expectedDeadline = req.body.expectedDeadline || null;
    }

    if (req.body.completedAt !== undefined) {
      payload.completedAt = req.body.completedAt || null;
    }

    if (req.body.clientId !== undefined) {
      const normalizedClientId = req.body.clientId === null ? null : Number(req.body.clientId);

      if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
        res.status(400).json({ message: "clientId doit être un entier." });
        return;
      }

      if (normalizedClientId !== null) {
        const clientOk = await ensureClientBelongsToOrg(req.organizationId, normalizedClientId);
        if (!clientOk) {
          res.status(400).json({ message: "Le client n'appartient pas à ce cabinet." });
          return;
        }
      }

      payload.clientId = normalizedClientId;
    }

    if (req.body.serviceId !== undefined) {
      const normalizedServiceId = req.body.serviceId === null ? null : Number(req.body.serviceId);

      if (normalizedServiceId !== null && !Number.isInteger(normalizedServiceId)) {
        res.status(400).json({ message: "serviceId doit être un entier." });
        return;
      }

      if (normalizedServiceId !== null) {
        const serviceOk = await ensureServiceBelongsToOrg(req.organizationId, normalizedServiceId);
        if (!serviceOk) {
          res.status(400).json({ message: "Le service n'appartient pas à ce cabinet." });
          return;
        }
      }

      payload.serviceId = normalizedServiceId;
    }

    const procedure = await updateProcedure(req.organizationId, procedureId, payload);

    if (!procedure) {
      res.status(404).json({ message: "Procédure introuvable." });
      return;
    }

    res.json({
      message: "Procédure mise à jour avec succès.",
      procedure,
    });
  } catch (error) {
    next(error);
  }
};

const getOneProcedure = async (req, res, next) => {
  try {
    const procedureId = Number(req.params.id);

    if (!Number.isInteger(procedureId)) {
      res.status(400).json({ message: "ID procédure invalide." });
      return;
    }

    const procedure = await getProcedureById(req.organizationId, procedureId);

    if (!procedure) {
      res.status(404).json({ message: "Procédure introuvable." });
      return;
    }

    res.json({ procedure });
  } catch (error) {
    next(error);
  }
};

const deleteOneProcedure = async (req, res, next) => {
  try {
    const procedureId = Number(req.params.id);

    if (!Number.isInteger(procedureId)) {
      res.status(400).json({ message: "ID procédure invalide." });
      return;
    }

    const deleted = await deleteProcedure(req.organizationId, procedureId);

    if (!deleted) {
      res.status(404).json({ message: "Procédure introuvable." });
      return;
    }

    res.json({ message: "Procédure supprimée avec succès." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllProcedures,
  createNewProcedure,
  updateOneProcedure,
  getOneProcedure,
  deleteOneProcedure,
};
