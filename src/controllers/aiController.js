import aiService from "../services/aiService.js";
import AIModel from "../models/aiModel.js";
import mongoose from "mongoose";

/**
 * Initialize and load the AI model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initializeModel = async (req, res) => {
  console.log("Initializing AI model");
  try {
    const { name, description, userId } = req.body;
    
    // Create model in the database
    const modelData = {
      name: name || "Default Model",
      description: description || "Created via API",
      modelType: "tensorflow",
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      config: {
        layers: [
          { type: "dense", units: 100, activation: "relu", inputShape: [10] },
          { type: "dense", units: 50, activation: "relu" },
          { type: "dense", units: 1, activation: "sigmoid" }
        ],
        optimizer: "adam",
        loss: "binaryCrossentropy",
        metrics: ["accuracy"]
      },
      status: "initialized"
    };
    
    // Save to MongoDB
    const aiModel = new AIModel(modelData);
    await aiModel.save();
    console.log("Model created in database:", aiModel._id);
    
    // Initialize in memory
    const success = await aiService.loadModel();
    if (success) {
      // Update model status
      aiModel.status = "initialized";
      await aiModel.save();
      
      console.log("AI model initialized successfully");
      return res.status(200).json({ 
        success: true, 
        message: "AI model initialized successfully",
        model: {
          id: aiModel._id,
          name: aiModel.name,
          description: aiModel.description,
          createdAt: aiModel.createdAt
        }
      });
    } else {
      // Update model with error status
      aiModel.status = "error";
      await aiModel.save();
      
      console.error("Failed to initialize AI model");
      return res.status(500).json({ success: false, message: "Failed to initialize AI model" });
    }
  } catch (error) {
    console.error("Error initializing AI model:", error);
    return res.status(500).json({ success: false, message: "Error initializing AI model", error: error.message });
  }
};

/**
 * Train the AI model with provided data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const trainModel = async (req, res) => {
  console.log("Training AI model route accessed");
  try {
    const { modelId, trainData, labels, epochs, batchSize } = req.body;
    
    // Validate input data
    if (!trainData || !labels) {
      console.error("Missing training data or labels");
      return res.status(400).json({ success: false, message: "Training data and labels are required" });
    }
    
    if (!modelId) {
      console.error("Missing model ID");
      return res.status(400).json({ success: false, message: "Model ID is required" });
    }
    
    // Check if model exists in database
    const aiModel = await AIModel.findById(modelId);
    if (!aiModel) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Save training data to model
    await aiModel.addTrainingData(trainData, labels);
    console.log("Training data saved to model:", aiModel._id);
    
    // Train the model
    const result = await aiService.trainModel(trainData, labels, epochs, batchSize);
    console.log("Model training completed");
    
    // Update model in database
    aiModel.status = "trained";
    aiModel.trainingHistory = {
      lastTrained: new Date(),
      epochs: result.epoch + 1,
      loss: result.history.loss[result.epoch],
      accuracy: result.history.acc[result.epoch]
    };
    await aiModel.save();
    
    return res.status(200).json({ 
      success: true, 
      message: "Model trained successfully", 
      result: {
        epochs: result.epoch + 1,
        loss: result.history.loss[result.epoch],
        accuracy: result.history.acc[result.epoch]
      }
    });
  } catch (error) {
    console.error("Error training AI model:", error);
    return res.status(500).json({ success: false, message: "Error training AI model", error: error.message });
  }
};

/**
 * Make a prediction using the AI model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const predict = async (req, res) => {
  console.log("AI prediction route accessed");
  try {
    const { modelId, inputData, userId } = req.body;
    
    // Validate input data
    if (!inputData) {
      console.error("Missing input data for prediction");
      return res.status(400).json({ success: false, message: "Input data is required for prediction" });
    }
    
    if (!modelId) {
      console.error("Missing model ID");
      return res.status(400).json({ success: false, message: "Model ID is required" });
    }
    
    // Check if model exists in database
    const aiModel = await AIModel.findById(modelId);
    if (!aiModel) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Make prediction
    const predictions = await aiService.predict(inputData);
    console.log("Prediction completed");
    
    // Save prediction to model
    const userIdObj = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    const prediction = await aiModel.addPrediction(inputData, predictions, userIdObj);
    console.log("Prediction saved to model:", aiModel._id);
    
    return res.status(200).json({ 
      success: true, 
      message: "Prediction completed successfully", 
      predictions,
      id: prediction._id
    });
  } catch (error) {
    console.error("Error making prediction:", error);
    return res.status(500).json({ success: false, message: "Error making prediction", error: error.message });
  }
};

/**
 * Save the trained model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const saveModel = async (req, res) => {
  console.log("Saving AI model route accessed");
  try {
    const { modelId, savePath } = req.body;
    
    if (!modelId) {
      console.error("Missing model ID");
      return res.status(400).json({ success: false, message: "Model ID is required" });
    }
    
    // Check if model exists in database
    const aiModel = await AIModel.findById(modelId);
    if (!aiModel) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Default path if not provided
    const path = savePath || `file://./models/model_${modelId}`;
    
    const success = await aiService.saveModel(path);
    if (success) {
      // Update model in database with path
      aiModel.modelPath = path;
      aiModel.status = "saved";
      await aiModel.save();
      
      console.log("Model saved successfully");
      return res.status(200).json({ 
        success: true, 
        message: "Model saved successfully", 
        path,
        modelId 
      });
    } else {
      console.error("Failed to save model");
      return res.status(500).json({ success: false, message: "Failed to save model" });
    }
  } catch (error) {
    console.error("Error saving model:", error);
    return res.status(500).json({ success: false, message: "Error saving model", error: error.message });
  }
};

/**
 * Get all models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getModels = async (req, res) => {
  console.log("Get models route accessed");
  try {
    const { userId } = req.query;
    
    let models;
    if (userId) {
      // Get models for specific user
      models = await AIModel.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 });
      console.log(`Retrieved ${models.length} models for user ID:`, userId);
    } else {
      // Get all models
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      
      models = await AIModel.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
      
      console.log(`Retrieved ${models.length} models`);
    }
    
    return res.status(200).json({
      success: true,
      models
    });
  } catch (error) {
    console.error("Error getting models:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error getting models", 
      error: error.message 
    });
  }
};

/**
 * Get model by ID with training data and predictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getModelDetails = async (req, res) => {
  console.log("Get model details route accessed");
  try {
    const { modelId } = req.params;
    
    // Get model from database
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    return res.status(200).json({
      success: true,
      model
    });
  } catch (error) {
    console.error("Error getting model details:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error getting model details", 
      error: error.message 
    });
  }
};

/**
 * Clone a model for transfer learning
 * @param {Object} req - Express request object 
 * @param {Object} res - Express response object
 */
export const cloneModelForTransfer = async (req, res) => {
  console.log("Clone model for transfer learning route accessed");
  try {
    const { modelId, name, description, freezeBaseLayers } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId) {
      console.error("Missing source model ID");
      return res.status(400).json({ success: false, message: "Source model ID is required" });
    }
    
    // Check if source model exists
    const sourceModel = await AIModel.findById(modelId);
    if (!sourceModel) {
      console.error("Source model not found:", modelId);
      return res.status(404).json({ success: false, message: "Source model not found" });
    }
    
    // Check if user has access to source model
    const hasAccess = 
      sourceModel.userId.toString() === userId.toString() || 
      sourceModel.isPublic;
    
    if (!hasAccess) {
      console.error("User does not have access to model:", modelId);
      return res.status(403).json({ success: false, message: "You do not have permission to clone this model" });
    }
    
    // Clone model for transfer learning
    const newModel = await sourceModel.clone(userId, {
      name,
      description,
      freezeBaseLayers: freezeBaseLayers !== false // Default to true
    });
    
    console.log("Model cloned successfully:", newModel._id);
    return res.status(200).json({
      success: true,
      message: "Model cloned successfully for transfer learning",
      model: {
        id: newModel._id,
        name: newModel.name,
        description: newModel.description,
        baseModel: newModel.baseModel,
        createdAt: newModel.createdAt
      }
    });
  } catch (error) {
    console.error("Error cloning model for transfer learning:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error cloning model for transfer learning", 
      error: error.message 
    });
  }
};

/**
 * Get public models for transfer learning
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPublicModels = async (req, res) => {
  console.log("Get public models route accessed");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filters
    const filters = {};
    
    if (req.query.modelType) {
      filters.modelType = req.query.modelType;
    }
    
    if (req.query.tag) {
      filters.tags = req.query.tag;
    }
    
    // Get public models
    const models = await AIModel.findPublicModels(filters)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .select('name description modelType tags baseModel performance createdAt userId');
    
    const total = await AIModel.countDocuments({ isPublic: true, ...filters });
    
    return res.status(200).json({
      success: true,
      count: models.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      models
    });
  } catch (error) {
    console.error("Error getting public models:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error getting public models", 
      error: error.message 
    });
  }
};

/**
 * Update model architecture
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateArchitecture = async (req, res) => {
  console.log("Update model architecture route accessed");
  try {
    const { modelId, layers, inputShape, outputShape } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId || !layers) {
      console.error("Missing required data");
      return res.status(400).json({ 
        success: false, 
        message: "Model ID and layers are required" 
      });
    }
    
    // Check if model exists
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Check if user owns the model
    if (model.userId.toString() !== userId.toString()) {
      console.error("User does not own model:", modelId);
      return res.status(403).json({ 
        success: false, 
        message: "You do not have permission to update this model" 
      });
    }
    
    // Update architecture
    await model.updateArchitecture(layers, inputShape, outputShape);
    
    console.log("Model architecture updated successfully");
    return res.status(200).json({
      success: true,
      message: "Model architecture updated successfully",
      model: {
        id: model._id,
        name: model.name,
        architecture: model.architecture,
        updatedAt: model.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating model architecture:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating model architecture", 
      error: error.message 
    });
  }
};

/**
 * Update model hyperparameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateHyperparameters = async (req, res) => {
  console.log("Update hyperparameters route accessed");
  try {
    const { modelId, hyperparameters } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId || !hyperparameters) {
      console.error("Missing required data");
      return res.status(400).json({ 
        success: false, 
        message: "Model ID and hyperparameters are required" 
      });
    }
    
    // Check if model exists
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Check if user owns the model
    if (model.userId.toString() !== userId.toString()) {
      console.error("User does not own model:", modelId);
      return res.status(403).json({ 
        success: false, 
        message: "You do not have permission to update this model" 
      });
    }
    
    // Update hyperparameters
    await model.updateHyperparameters(hyperparameters);
    
    console.log("Model hyperparameters updated successfully");
    return res.status(200).json({
      success: true,
      message: "Model hyperparameters updated successfully",
      model: {
        id: model._id,
        name: model.name,
        hyperparameters: model.hyperparameters,
        updatedAt: model.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating hyperparameters:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating hyperparameters", 
      error: error.message 
    });
  }
};

/**
 * Add visualization to a model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addVisualization = async (req, res) => {
  console.log("Add visualization route accessed");
  try {
    const { modelId, type, data } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId || !type || !data) {
      console.error("Missing required data");
      return res.status(400).json({ 
        success: false, 
        message: "Model ID, visualization type, and data are required" 
      });
    }
    
    // Check if model exists
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Check if user owns the model
    if (model.userId.toString() !== userId.toString()) {
      console.error("User does not own model:", modelId);
      return res.status(403).json({ 
        success: false, 
        message: "You do not have permission to add visualizations to this model" 
      });
    }
    
    // Add visualization
    const visualization = await model.addVisualization(type, data);
    
    console.log("Visualization added successfully");
    return res.status(200).json({
      success: true,
      message: "Visualization added successfully",
      visualization
    });
  } catch (error) {
    console.error("Error adding visualization:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error adding visualization", 
      error: error.message 
    });
  }
};

/**
 * Create a new model version
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createModelVersion = async (req, res) => {
  console.log("Create model version route accessed");
  try {
    const { modelId, description, modelPath, performance } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId) {
      console.error("Missing model ID");
      return res.status(400).json({ success: false, message: "Model ID is required" });
    }
    
    // Check if model exists
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Check if user owns the model
    if (model.userId.toString() !== userId.toString()) {
      console.error("User does not own model:", modelId);
      return res.status(403).json({ 
        success: false, 
        message: "You do not have permission to version this model" 
      });
    }
    
    // Default path if not provided
    const path = modelPath || `file://./models/model_${modelId}_v${model.currentVersion + 1}`;
    
    // Create new version
    await model.createVersion(path, description, performance);
    
    console.log("Model version created successfully");
    return res.status(200).json({
      success: true,
      message: "Model version created successfully",
      model: {
        id: model._id,
        name: model.name,
        currentVersion: model.currentVersion,
        versions: model.versions,
        updatedAt: model.updatedAt
      }
    });
  } catch (error) {
    console.error("Error creating model version:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error creating model version", 
      error: error.message 
    });
  }
};

/**
 * Make model public or private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const toggleModelVisibility = async (req, res) => {
  console.log("Toggle model visibility route accessed");
  try {
    const { modelId, isPublic } = req.body;
    const userId = req.user._id;
    
    // Validate input data
    if (!modelId || isPublic === undefined) {
      console.error("Missing required data");
      return res.status(400).json({ 
        success: false, 
        message: "Model ID and isPublic flag are required" 
      });
    }
    
    // Check if model exists
    const model = await AIModel.findById(modelId);
    if (!model) {
      console.error("Model not found:", modelId);
      return res.status(404).json({ success: false, message: "Model not found" });
    }
    
    // Check if user owns the model
    if (model.userId.toString() !== userId.toString()) {
      console.error("User does not own model:", modelId);
      return res.status(403).json({ 
        success: false, 
        message: "You do not have permission to change this model's visibility" 
      });
    }
    
    // Update visibility
    model.isPublic = isPublic;
    await model.save();
    
    console.log(`Model visibility set to ${isPublic ? 'public' : 'private'}`);
    return res.status(200).json({
      success: true,
      message: `Model is now ${isPublic ? 'public' : 'private'}`,
      model: {
        id: model._id,
        name: model.name,
        isPublic: model.isPublic,
        updatedAt: model.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating model visibility:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating model visibility", 
      error: error.message 
    });
  }
};
