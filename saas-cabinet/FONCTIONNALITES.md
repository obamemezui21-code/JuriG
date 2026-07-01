# Fonctionnalites de l'application

Derniere mise a jour: 23 fevrier 2026

## Objectif du document

Ce fichier est la reference unique des fonctionnalites actives de l'application.
Il doit etre mis a jour a chaque ajout, modification ou suppression de fonctionnalite.

## Processus de mise a jour

1. Mettre a jour la date en haut du fichier.
2. Mettre a jour la section fonctionnelle concernee.
3. Ajouter une ligne dans `Historique des mises a jour`.
4. Si une route API change, mettre aussi a jour `README.md`.

## 1) Authentification et session

- Inscription d'un nouveau cabinet avec creation du premier utilisateur admin.
- Connexion par email/mot de passe.
- Verification de session via `GET /api/auth/me`.
- Gestion du token JWT cote frontend (stockage local + deconnexion).
- Protection des routes privees cote frontend et backend.

## 2) Gestion du cabinet (organization)

- Consultation du profil cabinet (`GET /api/organizations/me`).
- Mise a jour du nom, du theme visuel et des infos cabinet (`PATCH /api/organizations/me`).
- Upload du logo (`POST /api/organizations/me/logo`).
- Liste des themes disponibles (`GET /api/organizations/themes`).
- Application automatique du theme choisi dans l'interface (variables CSS).

## 3) Tableau de bord

- KPIs principaux: nombre de clients, nombre de dossiers, revenus encaisses.
- Creation rapide d'un client.
- Creation rapide d'un dossier.
- Recherche de clients.
- Liste clients (vue compacte).
- Liste dossiers recents.

## 4) Clients

- CRUD clients via API:
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

## 5) Dossiers (cases)

- CRUD dossiers via API:
- `GET /api/cases`
- `POST /api/cases`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id`
- `DELETE /api/cases/:id`
- Liaison possible dossier <-> client.
- Statuts de dossier: `open`, `in_progress`, `closed`.

## 6) Services juridiques

- Gestion du catalogue des services:
- `GET /api/services`
- `POST /api/services`
- `GET /api/services/:id`
- `PATCH /api/services/:id`
- `DELETE /api/services/:id` (archivage logique)
- Recherche et filtrage des services.
- Affichage des services actifs/inactifs.

## 7) Procedures

- Gestion des demandes/procedures:
- `GET /api/procedures`
- `POST /api/procedures`
- `GET /api/procedures/:id`
- `PATCH /api/procedures/:id`
- Liaison procedure <-> client <-> service.
- Suivi par statut (`nouvelle`, `en_cours`, `en_attente`, `terminee`).
- Suivi par priorite (`normale`, `haute`, `urgente`).
- Echeance et date de completion.

## 8) Paiements et factures

- Gestion des paiements:
- `GET /api/payments`
- `GET /api/payments/summary`
- `GET /api/payments/:id`
- `POST /api/payments`
- `PATCH /api/payments/:id`
- `DELETE /api/payments/:id`
- Filtrage par statut de paiement.
- Page frontend dediee "Factures".
- Generation de facture imprimable par paiement.
- Facture adaptee a l'identite du cabinet:
- theme actif (couleurs)
- logo du cabinet
- nom du cabinet

## 9) Export Excel (.xlsx)

Tous les tableaux principaux sont exportables en vrai format Excel `.xlsx`:

- Dashboard:
- tableau clients
- tableau dossiers recents
- Services:
- liste des services
- Procedures:
- liste des procedures
- Factures:
- liste des factures/paiements

Implementation technique:

- Utilitaire commun frontend: `frontend/src/utils/excelExport.js`
- Librairie: `xlsx` (SheetJS)

## 10) Multi-tenant et securite

- Isolation des donnees par `organization_id`.
- Middlewares backend:
- `authMiddleware` pour verifier le JWT
- `tenantMiddleware` pour injecter et controler le tenant
- Toutes les routes metier sont protegees (sauf auth et health).

## 11) Donnees et stockage

Tables principales:

- `organizations`
- `users`
- `clients`
- `cases`
- `payments`
- `legal_services`
- `procedure_requests`

Autres:

- Upload logo/fichiers dans `backend/uploads/`
- Exposition statique via `/uploads`

## 12) Historique des mises a jour

- 23 fevrier 2026: ajout du module factures avec generation de facture imprimee selon theme/logo cabinet.
- 23 fevrier 2026: ajout de l'export Excel `.xlsx` sur tous les tableaux principaux.
