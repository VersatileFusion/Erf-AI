import express from "express";
import {
  initializeModel,
  trainModel,
  predict,
  saveModel,
  getModels,
  getModelDetails,
  cloneModelForTransfer,
  getPublicModels,
  updateArchitecture,
  updateHyperparameters,
  addVisualization,
  createModelVersion,
  toggleModelVisibility
} from "../controllers/aiController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required)
/**
 * @swagger
 * /api/ai/models:
 *   get:
 *     summary: Get list of AI models
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter models by user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of models to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of models to skip
 *     responses:
 *       200:
 *         description: List of models
 *       500:
 *         description: Server error
 */
router.get("/models", getModels);

/**
 * @swagger
 * /api/ai/models/{modelId}:
 *   get:
 *     summary: Get model details with training data and predictions
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model details
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.get("/models/:modelId", getModelDetails);

/**
 * @swagger
 * /api/ai/public-models:
 *   get:
 *     summary: Get list of public AI models for transfer learning
 *     tags: [AI]
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
 *         description: Number of models per page
 *       - in: query
 *         name: modelType
 *         schema:
 *           type: string
 *         description: Filter by model type
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: List of public models
 *       500:
 *         description: Server error
 */
router.get("/public-models", getPublicModels);

// Protected routes (authentication required)
// Apply authentication middleware to all routes below
router.use(authenticate);

/**
 * @swagger
 * /api/ai/initialize:
 *   post:
 *     summary: Initialize the AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the model
 *               description:
 *                 type: string
 *                 description: Description of the model
 *     responses:
 *       200:
 *         description: AI model initialized successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/initialize", initializeModel);

/**
 * @swagger
 * /api/ai/train:
 *   post:
 *     summary: Train the AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - trainData
 *               - labels
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model to train
 *               trainData:
 *                 type: array
 *                 description: Training data
 *               labels:
 *                 type: array
 *                 description: Training labels
 *               epochs:
 *                 type: integer
 *                 description: Number of epochs
 *               batchSize:
 *                 type: integer
 *                 description: Batch size
 *     responses:
 *       200:
 *         description: Model trained successfully
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/train", trainModel);

/**
 * @swagger
 * /api/ai/predict:
 *   post:
 *     summary: Make prediction with the AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - inputData
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model to use for prediction
 *               inputData:
 *                 type: array
 *                 description: Input data for prediction
 *     responses:
 *       200:
 *         description: Prediction completed successfully
 *       400:
 *         description: Missing input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/predict", predict);

/**
 * @swagger
 * /api/ai/save:
 *   post:
 *     summary: Save the trained AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model to save
 *               savePath:
 *                 type: string
 *                 description: Path to save the model
 *     responses:
 *       200:
 *         description: Model saved successfully
 *       400:
 *         description: Model ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/save", saveModel);

/**
 * @swagger
 * /api/ai/clone:
 *   post:
 *     summary: Clone a model for transfer learning
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model to clone
 *               name:
 *                 type: string
 *                 description: Name of the new model
 *               description:
 *                 type: string
 *                 description: Description of the new model
 *               freezeBaseLayers:
 *                 type: boolean
 *                 description: Whether to freeze base model layers
 *     responses:
 *       200:
 *         description: Model cloned successfully
 *       400:
 *         description: Model ID is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/clone", cloneModelForTransfer);

/**
 * @swagger
 * /api/ai/architecture:
 *   put:
 *     summary: Update model architecture
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - layers
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model
 *               layers:
 *                 type: array
 *                 description: Model layers
 *               inputShape:
 *                 type: array
 *                 description: Input shape
 *               outputShape:
 *                 type: array
 *                 description: Output shape
 *     responses:
 *       200:
 *         description: Architecture updated successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.put("/architecture", updateArchitecture);

/**
 * @swagger
 * /api/ai/hyperparameters:
 *   put:
 *     summary: Update model hyperparameters
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - hyperparameters
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model
 *               hyperparameters:
 *                 type: object
 *                 description: Hyperparameters to update
 *     responses:
 *       200:
 *         description: Hyperparameters updated successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.put("/hyperparameters", updateHyperparameters);

/**
 * @swagger
 * /api/ai/visualization:
 *   post:
 *     summary: Add visualization to a model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - type
 *               - data
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model
 *               type:
 *                 type: string
 *                 enum: [confusionMatrix, featureImportance, layerActivation, gradientMap, other]
 *                 description: Type of visualization
 *               data:
 *                 type: object
 *                 description: Visualization data
 *     responses:
 *       200:
 *         description: Visualization added successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/visualization", addVisualization);

/**
 * @swagger
 * /api/ai/version:
 *   post:
 *     summary: Create a new model version
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model
 *               description:
 *                 type: string
 *                 description: Version description
 *               modelPath:
 *                 type: string
 *                 description: Path to save the model version
 *               performance:
 *                 type: object
 *                 description: Performance metrics
 *     responses:
 *       200:
 *         description: Version created successfully
 *       400:
 *         description: Model ID is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post("/version", createModelVersion);

/**
 * @swagger
 * /api/ai/visibility:
 *   put:
 *     summary: Toggle model visibility (public/private)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - isPublic
 *             properties:
 *               modelId:
 *                 type: string
 *                 description: ID of the model
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the model should be public
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.put("/visibility", toggleModelVisibility);

console.log("AI routes initialized");
export default router;
