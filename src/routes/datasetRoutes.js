import express from 'express';
import {
  createDataset,
  getDatasets,
  getDatasetById,
  updateDataset,
  shareDataset,
  deleteDataset,
  addPreprocessingStep,
  addDatasetVersion,
  updateStatistics,
  updateMetadata
} from '../controllers/datasetController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all dataset routes
router.use(authenticate);

/**
 * @swagger
 * /api/datasets:
 *   post:
 *     summary: Create a new dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - format
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [csv, json, images, text, tabular, other]
 *               visibility:
 *                 type: string
 *                 enum: [private, public, shared]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Dataset created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', createDataset);

/**
 * @swagger
 * /api/datasets:
 *   get:
 *     summary: Get all datasets accessible by the user
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of datasets per page
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *         description: Filter by dataset format
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by dataset tag
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *         description: Filter by visibility
 *     responses:
 *       200:
 *         description: List of datasets
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', getDatasets);

/**
 * @swagger
 * /api/datasets/{id}:
 *   get:
 *     summary: Get a dataset by ID
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     responses:
 *       200:
 *         description: Dataset details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getDatasetById);

/**
 * @swagger
 * /api/datasets/{id}:
 *   put:
 *     summary: Update a dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [private, public, shared]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Dataset updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.put('/:id', updateDataset);

/**
 * @swagger
 * /api/datasets/{id}/share:
 *   post:
 *     summary: Share a dataset with another user
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               accessLevel:
 *                 type: string
 *                 enum: [view, edit, admin]
 *                 default: view
 *     responses:
 *       200:
 *         description: Dataset shared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.post('/:id/share', shareDataset);

/**
 * @swagger
 * /api/datasets/{id}:
 *   delete:
 *     summary: Delete a dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     responses:
 *       200:
 *         description: Dataset deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteDataset);

/**
 * @swagger
 * /api/datasets/{id}/preprocessing:
 *   post:
 *     summary: Add a preprocessing step to a dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preprocessing step added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.post('/:id/preprocessing', addPreprocessingStep);

/**
 * @swagger
 * /api/datasets/{id}/versions:
 *   post:
 *     summary: Add a new version of a dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Version added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.post('/:id/versions', addDatasetVersion);

/**
 * @swagger
 * /api/datasets/{id}/statistics:
 *   put:
 *     summary: Update dataset statistics
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summary:
 *                 type: object
 *               distributions:
 *                 type: object
 *               correlations:
 *                 type: object
 *     responses:
 *       200:
 *         description: Statistics updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.put('/:id/statistics', updateStatistics);

/**
 * @swagger
 * /api/datasets/{id}/metadata:
 *   put:
 *     summary: Update dataset metadata
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: number
 *               recordCount:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   rows:
 *                     type: number
 *                   columns:
 *                     type: number
 *               dataTypes:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metadata updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.put('/:id/metadata', updateMetadata);

console.log('Dataset routes initialized');
export default router; 