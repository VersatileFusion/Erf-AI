import * as tf from "@tensorflow/tfjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get directory name for models storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.join(__dirname, "../../models");

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

class AIService {
  constructor() {
    this.model = null;
    this.transferBaseModel = null;
    this.modelArchitecture = null;
    this.hyperparameters = null;
    this.isTransferLearning = false;
    this.frozenLayers = [];
    console.log("AI Service initialized");
  }

  // Load a pre-trained model or create a new one
  async loadModel(modelPath = null, modelConfig = {}) {
    try {
      console.log("Loading AI model");

      // Reset state
      this.isTransferLearning = false;
      this.frozenLayers = [];

      if (modelPath) {
        // Load pre-trained model
        this.model = await tf.loadLayersModel(modelPath);
        console.log("Pre-trained model loaded successfully");
      } else if (modelConfig.architecture && modelConfig.architecture.layers) {
        // Create model from configuration
        this.modelArchitecture = modelConfig.architecture;
        this.hyperparameters = modelConfig.hyperparameters || {};

        await this.createModelFromArchitecture();
        console.log("Model created from architecture successfully");
      } else if (modelConfig.baseModelPath && modelConfig.transferLearning) {
        // Load base model for transfer learning
        await this.setupTransferLearning(
          modelConfig.baseModelPath,
          modelConfig.freezeBaseLayers,
          modelConfig.outputLayers
        );
        console.log("Transfer learning model setup successfully");
      } else {
        // Create a simple sequential model as fallback
        this.model = tf.sequential();
        this.model.add(
          tf.layers.dense({ units: 100, activation: "relu", inputShape: [10] })
        );
        this.model.add(tf.layers.dense({ units: 50, activation: "relu" }));
        this.model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

        // Compile the model
        this.model.compile({
          optimizer: "adam",
          loss: "binaryCrossentropy",
          metrics: ["accuracy"],
        });

        console.log("Default model created successfully");
      }

      return true;
    } catch (error) {
      console.error("Error loading AI model:", error);
      return false;
    }
  }

  // Create model from architecture description
  async createModelFromArchitecture() {
    try {
      console.log("Creating model from architecture");

      const { layers, inputShape } = this.modelArchitecture;
      const hp = this.hyperparameters || {};

      this.model = tf.sequential();

      // Add layers based on architecture
      layers.forEach((layer, index) => {
        const layerConfig = { ...layer.config };

        // Add input shape for first layer
        if (index === 0) {
          layerConfig.inputShape = inputShape || layerConfig.inputShape;
        }

        // Create layer based on type
        switch (layer.type) {
          case "dense":
            this.model.add(tf.layers.dense(layerConfig));
            break;
          case "conv2d":
            this.model.add(tf.layers.conv2d(layerConfig));
            break;
          case "maxPooling2d":
            this.model.add(tf.layers.maxPooling2d(layerConfig));
            break;
          case "flatten":
            this.model.add(tf.layers.flatten(layerConfig));
            break;
          case "dropout":
            this.model.add(tf.layers.dropout(layerConfig));
            break;
          case "lstm":
            this.model.add(tf.layers.lstm(layerConfig));
            break;
          case "gru":
            this.model.add(tf.layers.gru(layerConfig));
            break;
          case "batchNormalization":
            this.model.add(tf.layers.batchNormalization(layerConfig));
            break;
          default:
            console.warn(`Unsupported layer type: ${layer.type}`);
        }
      });

      // Compile the model
      this.model.compile({
        optimizer: hp.optimizer || "adam",
        loss: hp.lossFunction || "categoricalCrossentropy",
        metrics: hp.metrics || ["accuracy"],
      });

      console.log("Model created from architecture");
      return true;
    } catch (error) {
      console.error("Error creating model from architecture:", error);
      throw error;
    }
  }

  // Set up transfer learning
  async setupTransferLearning(
    baseModelPath,
    freezeBaseLayers = true,
    outputLayers = []
  ) {
    try {
      console.log("Setting up transfer learning");

      // Load the base model
      this.transferBaseModel = await tf.loadLayersModel(baseModelPath);
      console.log("Base model loaded for transfer learning");

      this.isTransferLearning = true;

      // Create a new sequential model
      this.model = tf.sequential();

      // Add layers from base model to new model and optionally freeze them
      const baseModelLayers = this.transferBaseModel.layers;

      // If no output layers specified, use all layers except the last one
      if (!outputLayers || outputLayers.length === 0) {
        outputLayers = [baseModelLayers.length - 1];
      }

      baseModelLayers.forEach((layer, index) => {
        // Skip output layers
        if (outputLayers.includes(index)) {
          return;
        }

        // Clone the layer configuration
        const newLayer = layer.getConfig();

        // Create a new layer with the same configuration
        const tfLayer = tf.layers[layer.getClassName().toLowerCase()](newLayer);

        // Add to the new model
        this.model.add(tfLayer);

        // Freeze the layer if needed
        if (freezeBaseLayers) {
          tfLayer.trainable = false;
          this.frozenLayers.push(index);
        }
      });

      console.log(
        `Base model added with ${this.frozenLayers.length} frozen layers`
      );

      return true;
    } catch (error) {
      console.error("Error setting up transfer learning:", error);
      throw error;
    }
  }

  // Add custom output layers for transfer learning
  addOutputLayers(outputLayers = []) {
    try {
      console.log("Adding output layers for transfer learning");

      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      // Add new output layers
      outputLayers.forEach((layer) => {
        const layerConfig = { ...layer.config };

        switch (layer.type) {
          case "dense":
            this.model.add(tf.layers.dense(layerConfig));
            break;
          case "conv2d":
            this.model.add(tf.layers.conv2d(layerConfig));
            break;
          case "flatten":
            this.model.add(tf.layers.flatten(layerConfig));
            break;
          case "dropout":
            this.model.add(tf.layers.dropout(layerConfig));
            break;
          default:
            console.warn(`Unsupported layer type for output: ${layer.type}`);
        }
      });

      console.log(`Added ${outputLayers.length} custom output layers`);
      return true;
    } catch (error) {
      console.error("Error adding output layers:", error);
      throw error;
    }
  }

  // Train the model
  async trainModel(
    trainData,
    labels,
    epochs = 10,
    batchSize = 32,
    validationSplit = 0.2
  ) {
    try {
      console.log("Training AI model");

      // Get hyperparameters
      const hp = this.hyperparameters || {};

      // Compile the model with current hyperparameters if not done already
      if (!this.model.optimizer) {
        this.model.compile({
          optimizer: hp.optimizer || "adam",
          loss: hp.lossFunction || "categoricalCrossentropy",
          metrics: hp.metrics || ["accuracy"],
          learningRate: hp.learningRate || 0.001,
        });
      }

      // Convert data to tensors
      const trainTensors = tf.tensor2d(trainData);
      const labelTensors = tf.tensor2d(labels);

      // Prepare callbacks
      const callbacks = [
        {
          onEpochEnd: (epoch, logs) => {
            console.log(
              `Epoch ${
                epoch + 1
              } of ${epochs} completed, loss: ${logs.loss.toFixed(
                4
              )}, accuracy: ${logs.acc.toFixed(4)}`
            );
          },
        },
      ];

      // Add custom callbacks from hyperparameters
      if (hp.callbacks) {
        callbacks.push(...hp.callbacks);
      }

      // Train the model
      const result = await this.model.fit(trainTensors, labelTensors, {
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: validationSplit,
        callbacks: callbacks,
      });

      console.log("Model training completed");

      // Clean up tensors
      trainTensors.dispose();
      labelTensors.dispose();

      return result;
    } catch (error) {
      console.error("Error training AI model:", error);
      throw error;
    }
  }

  // Make predictions
  async predict(inputData) {
    try {
      console.log("Making AI prediction");

      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      // Convert input to tensor
      const inputTensor = tf.tensor2d(inputData);

      // Make prediction
      const predictions = await this.model.predict(inputTensor);
      const results = await predictions.array();

      // Calculate confidence scores
      const confidences = results.map((predArray) => {
        // For binary classification
        if (predArray.length === 1) {
          const value = predArray[0];
          return value > 0.5 ? value : 1 - value;
        }
        // For multi-class classification
        else {
          return Math.max(...predArray);
        }
      });

      // Clean up tensors
      inputTensor.dispose();
      predictions.dispose();

      console.log("Prediction completed successfully");
      return {
        predictions: results,
        confidence: confidences,
      };
    } catch (error) {
      console.error("Error making prediction with AI model:", error);
      throw error;
    }
  }

  // Evaluate model on test data
  async evaluateModel(testData, testLabels) {
    try {
      console.log("Evaluating model performance");

      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      // Convert test data to tensors
      const testTensors = tf.tensor2d(testData);
      const labelTensors = tf.tensor2d(testLabels);

      // Evaluate the model
      const evaluation = await this.model.evaluate(testTensors, labelTensors);

      // Extract metrics
      const loss = await evaluation[0].dataSync();
      const accuracy = await evaluation[1].dataSync();

      // Clean up tensors
      testTensors.dispose();
      labelTensors.dispose();
      evaluation.forEach((tensor) => tensor.dispose());

      console.log(`Evaluation - Loss: ${loss[0]}, Accuracy: ${accuracy[0]}`);

      return {
        loss: loss[0],
        accuracy: accuracy[0],
      };
    } catch (error) {
      console.error("Error evaluating model:", error);
      throw error;
    }
  }

  // Save the model
  async saveModel(path, metadata = {}) {
    try {
      console.log(`Saving AI model to path: ${path}`);

      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      // If path is relative, make it absolute with models directory
      if (
        !path.startsWith("file://") &&
        !path.startsWith("http://") &&
        !path.startsWith("https://")
      ) {
        // Remove file:// prefix if present
        const cleanPath = path.replace(/^file:\/\//, "");
        path = `file://${path.join(MODELS_DIR, cleanPath)}`;
      }

      // Save the model with metadata
      await this.model.save(path, {
        includeOptimizer: true,
        metadata: {
          ...metadata,
          isTransferLearning: this.isTransferLearning,
          frozenLayers: this.frozenLayers,
          modelArchitecture: this.modelArchitecture,
          hyperparameters: this.hyperparameters,
          date: new Date().toISOString(),
        },
      });

      console.log("Model saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving AI model:", error);
      return false;
    }
  }

  // Get model summary as an object
  getModelSummary() {
    try {
      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      const layers = this.model.layers.map((layer) => ({
        name: layer.name,
        type: layer.getClassName(),
        trainable: layer.trainable,
        units: layer.units,
        inputShape: layer.inputShape,
        outputShape: layer.outputShape,
        params: layer.countParams(),
      }));

      const totalParams = this.model.countParams();
      const trainableParams = layers.reduce(
        (sum, layer) => (layer.trainable ? sum + layer.params : sum),
        0
      );

      return {
        layers,
        totalParams,
        trainableParams,
        nonTrainableParams: totalParams - trainableParams,
        isTransferLearning: this.isTransferLearning,
        frozenLayers: this.frozenLayers,
      };
    } catch (error) {
      console.error("Error getting model summary:", error);
      throw error;
    }
  }

  // Change hyperparameters of the model
  updateHyperparameters(hyperparameters = {}) {
    try {
      console.log("Updating model hyperparameters");

      if (!this.model) {
        throw new Error("No model available. Create or load a model first.");
      }

      // Store the new hyperparameters
      this.hyperparameters = {
        ...(this.hyperparameters || {}),
        ...hyperparameters,
      };

      // Recompile model with new hyperparameters
      const hp = this.hyperparameters;

      this.model.compile({
        optimizer: hp.optimizer || "adam",
        loss: hp.lossFunction || "categoricalCrossentropy",
        metrics: hp.metrics || ["accuracy"],
        learningRate: hp.learningRate || 0.001,
      });

      console.log("Model hyperparameters updated");
      return true;
    } catch (error) {
      console.error("Error updating hyperparameters:", error);
      throw error;
    }
  }
}

export default new AIService();
