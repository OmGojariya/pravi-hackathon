const Project = require('../models/Project');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all projects with linked asset counts
 * @route   GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('projectManager', 'name email phone')
      .sort({ createdAt: -1 });

    // Fetch linked assets for each project
    const projectsWithAssets = await Promise.all(
      projects.map(async (prj) => {
        const assets = await Asset.find({ projectId: prj._id }).select('assetCode name type condition lifecycle');
        return {
          ...prj.toObject(),
          linkedAssets: assets,
          assetCount: assets.length,
        };
      })
    );

    return res.json({
      success: true,
      data: projectsWithAssets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('projectManager', 'name email phone department');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const linkedAssets = await Asset.find({ projectId: project._id })
      .populate('categoryId', 'name code');

    return res.json({
      success: true,
      data: {
        ...project.toObject(),
        linkedAssets,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { name, type, description, contractor, projectManager, startDate, expectedCompletion, budget } = req.body;

    const year = new Date().getFullYear();
    const count = await Project.countDocuments();
    const projectId = req.body.projectId || `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;

    const project = await Project.create({
      projectId,
      name,
      type: type || 'Infrastructure Expansion',
      description: description || '',
      contractor: contractor || '',
      projectManager: projectManager || (req.user ? req.user._id : null),
      startDate: startDate || new Date(),
      expectedCompletion: expectedCompletion || null,
      budget: Number(budget || 0),
      status: 'PLANNED',
    });

    await logAudit({
      userId: req.user._id,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project._id,
      newData: { projectId, name },
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    Object.assign(project, req.body);
    await project.save();

    await logAudit({
      userId: req.user._id,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id,
      newData: { name: project.name, status: project.status },
    });

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const assetCount = await Asset.countDocuments({ projectId: req.params.id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete project. There are ${assetCount} assets linked to this project. Unlink them first.`,
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
