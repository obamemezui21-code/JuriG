const { pool } = require("../config/db");
const {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
  listClientProcedureSelections,
  replaceClientProcedureSelections,
  updateClientStatusFromPayments,
} = require("../models/client.model");

const listAllClients = async (req, res, next) => {
  try {
    const q = req.query.q ? String(req.query.q) : "";
    const clients = await listClients(req.organizationId, q);
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

const createNewClient = async (req, res, next) => {
  try {
    const { fullName, email, phone, notes, serviceId } = req.body;
    const birthDateRaw =
      req.body.birthDate !== undefined
        ? req.body.birthDate
        : req.body.dateNaissance !== undefined
          ? req.body.dateNaissance
          : req.body.birth_date;
    const birthPlaceRaw =
      req.body.birthPlace !== undefined
        ? req.body.birthPlace
        : req.body.lieuNaissance !== undefined
          ? req.body.lieuNaissance
          : req.body.birth_place;
    const nationalityRaw =
      req.body.nationality !== undefined ? req.body.nationality : req.body.nationalite;

    if (!fullName) {
      res.status(400).json({ message: "fullName est obligatoire." });
      return;
    }

    if (serviceId === undefined || serviceId === null || String(serviceId).trim() === "") {
      res.status(400).json({ message: "serviceId est obligatoire." });
      return;
    }

    const normalizedServiceId = Number(serviceId);
    if (!Number.isInteger(normalizedServiceId)) {
      res.status(400).json({ message: "serviceId doit être un entier." });
      return;
    }

    const serviceCheck = await pool.query(
      `SELECT id FROM legal_services WHERE organization_id = $1 AND id = $2 LIMIT 1`,
      [req.organizationId, normalizedServiceId]
    );
    if (!serviceCheck.rows[0]) {
      res.status(400).json({ message: "Le service n'appartient pas à ce cabinet." });
      return;
    }

    const birthDateNormalized = birthDateRaw ? String(birthDateRaw).trim() : "";
    if (birthDateNormalized && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateNormalized)) {
      res.status(400).json({ message: "birthDate doit être au format YYYY-MM-DD." });
      return;
    }

    const client = await createClient({
      organizationId: req.organizationId,
      fullName: String(fullName).trim(),
      email: email !== undefined ? String(email).trim() : undefined,
      phone: phone !== undefined ? String(phone).trim() : undefined,
      birthDate: birthDateNormalized || undefined,
      birthPlace: birthPlaceRaw !== undefined ? String(birthPlaceRaw).trim() : undefined,
      nationality: nationalityRaw !== undefined ? String(nationalityRaw).trim() : undefined,
      photoUrl: req.body.photoUrl !== undefined ? String(req.body.photoUrl).trim() : undefined,
      identityDocumentUrl:
        req.body.identityDocumentUrl !== undefined ? String(req.body.identityDocumentUrl).trim() : undefined,
      serviceId: normalizedServiceId,
      notes: notes !== undefined ? String(notes).trim() : undefined,
    });

    res.status(201).json({
      message: "Client créé avec succès.",
      client,
    });
  } catch (error) {
    next(error);
  }
};

const uploadOneClientPhoto = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Aucune photo client reçue." });
      return;
    }

    const photoPath = `/uploads/${req.file.filename}`;
    const client = await updateClient(req.organizationId, clientId, { photoUrl: photoPath });

    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    res.json({
      message: "Photo client téléversée avec succès.",
      client,
    });
  } catch (error) {
    next(error);
  }
};

const uploadOneClientIdentityDocument = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Aucune pièce d'identité reçue." });
      return;
    }

    const documentPath = `/uploads/${req.file.filename}`;
    const client = await updateClient(req.organizationId, clientId, {
      identityDocumentUrl: documentPath,
    });

    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    await updateClientStatusFromPayments(req.organizationId, clientId);

    res.json({
      message: "Pièce d'identité téléversée avec succès.",
      client,
    });
  } catch (error) {
    next(error);
  }
};

const getOneClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    const client = await getClientById(req.organizationId, clientId);

    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
};

const updateOneClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    const payload = { ...(req.body || {}) };

    if (payload.dateNaissance !== undefined && payload.birthDate === undefined) {
      payload.birthDate = payload.dateNaissance;
    }
    if (payload.birth_date !== undefined && payload.birthDate === undefined) {
      payload.birthDate = payload.birth_date;
    }
    if (payload.lieuNaissance !== undefined && payload.birthPlace === undefined) {
      payload.birthPlace = payload.lieuNaissance;
    }
    if (payload.birth_place !== undefined && payload.birthPlace === undefined) {
      payload.birthPlace = payload.birth_place;
    }
    if (payload.nationalite !== undefined && payload.nationality === undefined) {
      payload.nationality = payload.nationalite;
    }

    if (payload.serviceId !== undefined) {
      if (payload.serviceId === null || String(payload.serviceId).trim() === "") {
        res.status(400).json({ message: "serviceId ne peut pas être vide." });
        return;
      }

      const normalizedServiceId = Number(payload.serviceId);
      if (!Number.isInteger(normalizedServiceId)) {
        res.status(400).json({ message: "serviceId doit être un entier." });
        return;
      }
      const serviceCheck = await pool.query(
        `SELECT id FROM legal_services WHERE organization_id = $1 AND id = $2 LIMIT 1`,
        [req.organizationId, normalizedServiceId]
      );
      if (!serviceCheck.rows[0]) {
        res.status(400).json({ message: "Le service n'appartient pas à ce cabinet." });
        return;
      }
      payload.serviceId = normalizedServiceId;
    }

    if (payload.birthDate !== undefined) {
      const birthDateNormalized = payload.birthDate ? String(payload.birthDate).trim() : "";
      if (birthDateNormalized && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateNormalized)) {
        res.status(400).json({ message: "birthDate doit être au format YYYY-MM-DD." });
        return;
      }
      payload.birthDate = birthDateNormalized || null;
    }

    const client = await updateClient(req.organizationId, clientId, payload);

    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    if (payload.identityDocumentUrl !== undefined) {
      await updateClientStatusFromPayments(req.organizationId, clientId);
    }

    res.json({
      message: "Client mis à jour avec succès.",
      client,
    });
  } catch (error) {
    next(error);
  }
};

const removeOneClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    const deleted = await deleteClient(req.organizationId, clientId);

    if (!deleted) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    res.json({ message: "Client supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

const getClientProcedures = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    const client = await getClientById(req.organizationId, clientId);
    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    const procedureIds = await listClientProcedureSelections(req.organizationId, clientId);
    let procedures = [];

    if (procedureIds.length) {
      const result = await pool.query(
        `SELECT p.id,
                p.organization_id,
                p.client_id,
                p.service_id,
                p.title,
                p.montant,
                p.details,
                p.status,
                p.priority,
                p.expected_deadline,
                p.completed_at,
                p.created_at,
                p.updated_at,
                c.full_name AS client_name,
                s.name AS service_name
         FROM procedure_requests p
         LEFT JOIN clients c ON c.id = p.client_id
         LEFT JOIN legal_services s ON s.id = p.service_id
         WHERE p.organization_id = $1 AND p.id = ANY($2::int[])
         ORDER BY array_position($2::int[], p.id)`,
        [req.organizationId, procedureIds]
      );
      procedures = result.rows || [];
    }

    res.json({ procedureIds, procedures });
  } catch (error) {
    next(error);
  }
};

const updateClientProcedures = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    const client = await getClientById(req.organizationId, clientId);
    if (!client) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    const rawProcedureIds = req.body?.procedureIds ?? req.body?.procedures ?? [];
    if (!Array.isArray(rawProcedureIds)) {
      res.status(400).json({ message: "procedureIds doit être un tableau." });
      return;
    }

    const normalizedProcedureIds = [];
    const seen = new Set();

    for (const value of rawProcedureIds) {
      const id = Number(value);
      if (!Number.isInteger(id)) {
        res.status(400).json({ message: "procedureIds doit contenir des entiers." });
        return;
      }
      if (!seen.has(id)) {
        seen.add(id);
        normalizedProcedureIds.push(id);
      }
    }

    if (normalizedProcedureIds.length) {
      const check = await pool.query(
        `SELECT id
         FROM procedure_requests
         WHERE organization_id = $1 AND id = ANY($2::int[])`,
        [req.organizationId, normalizedProcedureIds]
      );

      if (check.rows.length !== normalizedProcedureIds.length) {
        res.status(400).json({ message: "Certaines procédures sont introuvables." });
        return;
      }
    }

    const clientConnection = await pool.connect();
    try {
      await clientConnection.query("BEGIN");
      await replaceClientProcedureSelections(
        req.organizationId,
        clientId,
        normalizedProcedureIds,
        clientConnection
      );
      await updateClientStatusFromPayments(req.organizationId, clientId, clientConnection);
      await clientConnection.query("COMMIT");
    } catch (error) {
      await clientConnection.query("ROLLBACK");
      throw error;
    } finally {
      clientConnection.release();
    }

    res.json({
      message: "Procédures mises à jour avec succès.",
      procedureIds: normalizedProcedureIds,
    });
  } catch (error) {
    next(error);
  }
};

const updateClientStatus = async (req, res, next) => {
  try {
    const clientId = Number(req.params.id);
    const status = String(req.body?.status || "").trim().toLowerCase();

    if (!Number.isInteger(clientId)) {
      res.status(400).json({ message: "ID client invalide." });
      return;
    }

    if (!status || !["termine", "auto"].includes(status)) {
      res.status(400).json({ message: "Statut invalide. Valeurs acceptées: 'termine', 'auto'." });
      return;
    }

    // Vérifier que le client existe et appartient à l'organisation
    const clientCheck = await pool.query(
      `SELECT id FROM clients WHERE organization_id = $1 AND id = $2 LIMIT 1`,
      [req.organizationId, clientId]
    );

    if (!clientCheck.rows[0]) {
      res.status(404).json({ message: "Client introuvable." });
      return;
    }

    let nextStatus = status;

    if (status === "auto") {
      const automaticStatus = await updateClientStatusFromPayments(req.organizationId, clientId);
      nextStatus = automaticStatus.status;
    } else {
      await pool.query(
        `UPDATE clients SET status = $1, updated_at = NOW() WHERE organization_id = $2 AND id = $3`,
        [status, req.organizationId, clientId]
      );
    }

    res.json({
      message: "Statut du client mis à jour avec succès.",
      status: nextStatus
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllClients,
  createNewClient,
  uploadOneClientPhoto,
  uploadOneClientIdentityDocument,
  getOneClient,
  updateOneClient,
  removeOneClient,
  getClientProcedures,
  updateClientProcedures,
  updateClientStatus,
};


