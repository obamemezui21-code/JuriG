const {
  listServices,
  createService,
  updateService,
  archiveService,
  deleteService,
  getServiceById,
} = require("../models/service.model");

const listAllServices = async (req, res, next) => {
  try {
    const services = await listServices(req.organizationId, {
      search: req.query.search,
      includeInactive: req.query.includeInactive === "true",
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
};

const createNewService = async (req, res, next) => {
  try {
    const { name, category, description, dossierElements, dossier_elements, procedureSteps, procedure_steps } =
      req.body;
    const basePrice =
      req.body.basePrice !== undefined
        ? req.body.basePrice
        : req.body.base_price !== undefined
          ? req.body.base_price
          : undefined;

    if (!name) {
      res.status(400).json({ message: "Le nom du service est obligatoire." });
      return;
    }

    if (basePrice !== undefined && Number(basePrice) < 0) {
      res.status(400).json({ message: "Le prix de base doit être positif." });
      return;
    }

    const service = await createService({
      organizationId: req.organizationId,
      name: String(name).trim(),
      category: category !== undefined ? String(category).trim() : null,
      description: description !== undefined ? String(description).trim() : null,
      dossierElements:
        dossierElements !== undefined
          ? String(dossierElements).trim()
          : dossier_elements !== undefined
            ? String(dossier_elements).trim()
            : null,
      procedureSteps:
        procedureSteps !== undefined
          ? String(procedureSteps).trim()
          : procedure_steps !== undefined
            ? String(procedure_steps).trim()
            : null,
      basePrice: basePrice !== undefined ? Number(basePrice) : 0,
    });

    res.status(201).json({
      message: "Service créé avec succès.",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const updateOneService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      res.status(400).json({ message: "ID service invalide." });
      return;
    }

    const basePrice =
      req.body.basePrice !== undefined
        ? req.body.basePrice
        : req.body.base_price !== undefined
          ? req.body.base_price
          : undefined;

    if (basePrice !== undefined && Number(basePrice) < 0) {
      res.status(400).json({ message: "Le prix de base doit être positif." });
      return;
    }

    const service = await updateService(req.organizationId, serviceId, {
      name: req.body.name !== undefined ? String(req.body.name).trim() : undefined,
      category: req.body.category !== undefined ? String(req.body.category).trim() : undefined,
      description: req.body.description !== undefined ? String(req.body.description).trim() : undefined,
      dossierElements:
        req.body.dossierElements !== undefined
          ? String(req.body.dossierElements).trim()
          : req.body.dossier_elements !== undefined
            ? String(req.body.dossier_elements).trim()
            : undefined,
      procedureSteps:
        req.body.procedureSteps !== undefined
          ? String(req.body.procedureSteps).trim()
          : req.body.procedure_steps !== undefined
            ? String(req.body.procedure_steps).trim()
            : undefined,
      basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
      isActive:
        req.body.isActive !== undefined
          ? req.body.isActive
          : req.body.is_active !== undefined
            ? req.body.is_active
            : undefined,
    });

    if (!service) {
      res.status(404).json({ message: "Service introuvable." });
      return;
    }

    res.json({
      message: "Service mis à jour avec succès.",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const archiveOneService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      res.status(400).json({ message: "ID service invalide." });
      return;
    }

    const service = await archiveService(req.organizationId, serviceId);

    if (!service) {
      res.status(404).json({ message: "Service introuvable." });
      return;
    }

    res.json({
      message: "Service archivé avec succès.",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOneService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      res.status(400).json({ message: "ID service invalide." });
      return;
    }

    const service = await deleteService(req.organizationId, serviceId);

    if (!service) {
      res.status(404).json({ message: "Service introuvable." });
      return;
    }

    res.json({
      message: "Service supprimé avec succès.",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const getOneService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      res.status(400).json({ message: "ID service invalide." });
      return;
    }

    const service = await getServiceById(req.organizationId, serviceId);

    if (!service) {
      res.status(404).json({ message: "Service introuvable." });
      return;
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllServices,
  createNewService,
  updateOneService,
  archiveOneService,
  deleteOneService,
  getOneService,
};
