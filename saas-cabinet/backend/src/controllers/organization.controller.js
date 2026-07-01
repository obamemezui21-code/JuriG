const { getOrganizationById, updateOrganization } = require("../models/organization.model");
const { THEME_KEYS, DEFAULT_THEME_KEY, isValidThemeKey } = require("../constants/themes");

const getMyOrganization = async (req, res, next) => {
  try {
    const organization = await getOrganizationById(req.organizationId);

    if (!organization) {
      res.status(404).json({ message: "Cabinet introuvable." });
      return;
    }

    res.json({ organization });
  } catch (error) {
    next(error);
  }
};

const updateMyOrganization = async (req, res, next) => {
  try {
    const { name, logoUrl, themeKey, address, phone, email } = req.body;

    if (
      name === undefined &&
      logoUrl === undefined &&
      themeKey === undefined &&
      address === undefined &&
      phone === undefined &&
      email === undefined
    ) {
      res.status(400).json({ message: "Aucune valeur fournie à mettre à jour." });
      return;
    }

    if (themeKey !== undefined && !isValidThemeKey(themeKey)) {
      res.status(400).json({
        message: "Thème invalide.",
        allowedThemes: THEME_KEYS,
      });
      return;
    }

    const organization = await updateOrganization(req.organizationId, {
      name: name !== undefined ? String(name).trim() : undefined,
      logoUrl: logoUrl !== undefined ? String(logoUrl).trim() : undefined,
      themeKey: themeKey !== undefined ? String(themeKey).trim() : undefined,
      address: address !== undefined ? String(address).trim() : undefined,
      phone: phone !== undefined ? String(phone).trim() : undefined,
      email: email !== undefined ? String(email).trim() : undefined,
    });

    if (!organization) {
      res.status(404).json({ message: "Cabinet introuvable." });
      return;
    }

    res.json({
      message: "Cabinet mis à jour avec succès.",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

const uploadMyOrganizationLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier logo reçu." });
      return;
    }

    const logoPath = `/uploads/${req.file.filename}`;

    const organization = await updateOrganization(req.organizationId, {
      logoUrl: logoPath,
    });

    if (!organization) {
      res.status(404).json({ message: "Cabinet introuvable." });
      return;
    }

    res.json({
      message: "Logo téléversé avec succès.",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

const listThemes = (_req, res) => {
  res.json({
    defaultTheme: DEFAULT_THEME_KEY,
    themes: THEME_KEYS,
  });
};

module.exports = {
  getMyOrganization,
  updateMyOrganization,
  uploadMyOrganizationLogo,
  listThemes,
};
