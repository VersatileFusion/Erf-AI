import Dataset from '../models/datasetModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define dataset storage directory
const DATASET_DIR = path.join(__dirname, '../../datasets');

// Ensure dataset directory exists
if (!fs.existsSync(DATASET_DIR)) {
  fs.mkdirSync(DATASET_DIR, { recursive: true });
}

/**
 * Create a new dataset
 */
export const createDataset = async (req, res) => {
  try {
    const { name, description, format, visibility, tags } = req.body;
    
    // Check if dataset with same name already exists for this user
    const existingDataset = await Dataset.findOne({ 
      name, 
      creator: req.user._id 
    });
    
    if (existingDataset) {
      return res.status(400).json({
        success: false,
        message: 'You already have a dataset with this name'
      });
    }
    
    // Create user-specific dataset directory
    const userDatasetDir = path.join(DATASET_DIR, req.user._id.toString());
    if (!fs.existsSync(userDatasetDir)) {
      fs.mkdirSync(userDatasetDir, { recursive: true });
    }
    
    // Create dataset
    const dataset = await Dataset.create({
      name,
      description,
      format,
      visibility: visibility || 'private',
      tags: tags || [],
      creator: req.user._id,
      storageInfo: {
        location: userDatasetDir,
        fileName: `${name.replace(/\s+/g, '_').toLowerCase()}.${format}`
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Dataset created successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error creating dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating dataset',
      error: error.message
    });
  }
};

/**
 * Get all datasets accessible by the current user
 */
export const getDatasets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {
      $or: [
        { creator: req.user._id },
        { visibility: 'public' },
        { 'sharedWith.user': req.user._id }
      ],
      isActive: true
    };
    
    // Apply filters if provided
    if (req.query.format) {
      query.format = req.query.format;
    }
    
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    if (req.query.visibility) {
      // Only filter by visibility if looking at user's own datasets
      query.$or = [{ creator: req.user._id, visibility: req.query.visibility }];
      
      // Always include public datasets unless specifically filtering for private
      if (req.query.visibility !== 'private') {
        query.$or.push({ visibility: 'public' });
      }
      
      // Include shared datasets
      query.$or.push({ 'sharedWith.user': req.user._id });
    }
    
    const datasets = await Dataset.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .populate('creator', 'username fullName');
    
    const total = await Dataset.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: datasets.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: datasets
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching datasets',
      error: error.message
    });
  }
};

/**
 * Get a single dataset by ID
 */
export const getDatasetById = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id)
      .populate('creator', 'username fullName')
      .populate('sharedWith.user', 'username fullName');
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user has access to this dataset
    const hasAccess = 
      dataset.creator._id.toString() === req.user._id.toString() ||
      dataset.visibility === 'public' ||
      dataset.sharedWith.some(share => share.user._id.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this dataset'
      });
    }
    
    res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dataset',
      error: error.message
    });
  }
};

/**
 * Update dataset metadata
 */
export const updateDataset = async (req, res) => {
  try {
    const { name, description, visibility, tags } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator
    if (dataset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update datasets you created'
      });
    }
    
    // If name is changing, check for conflicts
    if (name && name !== dataset.name) {
      const nameExists = await Dataset.findOne({
        name,
        creator: req.user._id,
        _id: { $ne: dataset._id }
      });
      
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'You already have another dataset with this name'
        });
      }
    }
    
    // Update the dataset
    dataset.name = name || dataset.name;
    dataset.description = description !== undefined ? description : dataset.description;
    dataset.visibility = visibility || dataset.visibility;
    
    if (tags) {
      dataset.tags = tags;
    }
    
    await dataset.save();
    
    res.status(200).json({
      success: true,
      message: 'Dataset updated successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error updating dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating dataset',
      error: error.message
    });
  }
};

/**
 * Share a dataset with another user
 */
export const shareDataset = async (req, res) => {
  try {
    const { userId, accessLevel } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator
    if (dataset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only share datasets you created'
      });
    }
    
    // Share the dataset
    await dataset.shareWith(userId, accessLevel);
    
    res.status(200).json({
      success: true,
      message: 'Dataset shared successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error sharing dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing dataset',
      error: error.message
    });
  }
};

/**
 * Delete a dataset
 */
export const deleteDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator
    if (dataset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete datasets you created'
      });
    }
    
    // Soft delete - mark as inactive
    dataset.isActive = false;
    await dataset.save();
    
    res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting dataset',
      error: error.message
    });
  }
};

/**
 * Add preprocessing step to dataset
 */
export const addPreprocessingStep = async (req, res) => {
  try {
    const { name, description, parameters } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator
    if (dataset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify datasets you created'
      });
    }
    
    // Add preprocessing step
    await dataset.addPreprocessingStep({
      name,
      description,
      parameters,
      appliedAt: Date.now()
    });
    
    res.status(200).json({
      success: true,
      message: 'Preprocessing step added successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error adding preprocessing step:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding preprocessing step',
      error: error.message
    });
  }
};

/**
 * Add a new version of the dataset
 */
export const addDatasetVersion = async (req, res) => {
  try {
    const { description } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator
    if (dataset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify datasets you created'
      });
    }
    
    // Generate version filename
    const baseName = path.basename(dataset.storageInfo.fileName, path.extname(dataset.storageInfo.fileName));
    const ext = path.extname(dataset.storageInfo.fileName);
    const versionNumber = dataset.versions.length > 0 
      ? Math.max(...dataset.versions.map(v => v.versionNumber)) + 1 
      : 1;
    const versionFileName = `${baseName}_v${versionNumber}${ext}`;
    
    // Add version
    await dataset.addVersion({
      description,
      storageInfo: {
        location: dataset.storageInfo.location,
        fileName: versionFileName,
        fileSize: dataset.storageInfo.fileSize
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Dataset version added successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error adding dataset version:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding dataset version',
      error: error.message
    });
  }
};

/**
 * Update dataset statistics
 */
export const updateStatistics = async (req, res) => {
  try {
    const { summary, distributions, correlations } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator or has edit access
    const hasEditAccess = 
      dataset.creator.toString() === req.user._id.toString() ||
      dataset.sharedWith.some(share => 
        share.user.toString() === req.user._id.toString() && 
        ['edit', 'admin'].includes(share.accessLevel)
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this dataset'
      });
    }
    
    // Update statistics
    dataset.statistics = {
      summary: summary || dataset.statistics?.summary,
      distributions: distributions || dataset.statistics?.distributions,
      correlations: correlations || dataset.statistics?.correlations
    };
    
    await dataset.save();
    
    res.status(200).json({
      success: true,
      message: 'Dataset statistics updated successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error updating dataset statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating dataset statistics',
      error: error.message
    });
  }
};

/**
 * Update dataset metadata
 */
export const updateMetadata = async (req, res) => {
  try {
    const { size, recordCount, features, dimensions, dataTypes } = req.body;
    
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }
    
    // Check if user is the creator or has edit access
    const hasEditAccess = 
      dataset.creator.toString() === req.user._id.toString() ||
      dataset.sharedWith.some(share => 
        share.user.toString() === req.user._id.toString() && 
        ['edit', 'admin'].includes(share.accessLevel)
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this dataset'
      });
    }
    
    // Update metadata
    dataset.metadata = {
      size: size !== undefined ? size : dataset.metadata?.size,
      recordCount: recordCount !== undefined ? recordCount : dataset.metadata?.recordCount,
      features: features || dataset.metadata?.features,
      dimensions: dimensions || dataset.metadata?.dimensions,
      dataTypes: dataTypes || dataset.metadata?.dataTypes
    };
    
    await dataset.save();
    
    res.status(200).json({
      success: true,
      message: 'Dataset metadata updated successfully',
      data: dataset
    });
  } catch (error) {
    console.error('Error updating dataset metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating dataset metadata',
      error: error.message
    });
  }
}; 