/**
 * Enhanced MCP Resources Registry
 * 
 * This module provides comprehensive MCP resources including assistant templates,
 * documentation, examples, and workflows with detailed annotations and metadata.
 * 
 * Features:
 * - Enhanced resource metadata with annotations
 * - Comprehensive documentation resources
 * - Complete, runnable example workflows
 * - Improved assistant templates with detailed instructions
 * - Support for resource annotations (audience, priority, tags, etc.)
 */

const fs = require('fs');
const path = require('path');

// Enhanced resource definitions with comprehensive metadata and annotations
const ENHANCED_RESOURCES = {
  // Assistant Templates - Enhanced with comprehensive instructions and annotations
  'assistant://templates/coding-assistant': {
    name: 'Coding Assistant Template',
    description: 'Enhanced coding assistant template with comprehensive development capabilities, security focus, and architectural guidance',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'engineers', 'architects'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['coding', 'development', 'security', 'architecture', 'best-practices'],
      difficulty: 'intermediate',
      version: '2.0.0'
    },
    filePath: 'definitions/resources/templates/coding-assistant-template.json'
  },
  
  'assistant://templates/data-analyst': {
    name: 'Data Analyst Template',
    description: 'Pre-configured template for a data analysis assistant with statistical and visualization capabilities',
    mimeType: 'application/json',
    annotations: {
      audience: ['data-scientists', 'analysts', 'researchers'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['data-analysis', 'statistics', 'visualization'],
      difficulty: 'intermediate'
    },
    filePath: 'definitions/resources/templates/data-analyst-template.json'
  },
  
  'assistant://templates/customer-support': {
    name: 'Customer Support Template',
    description: 'Template for a customer support assistant with friendly and helpful responses',
    mimeType: 'application/json',
    annotations: {
      audience: ['support-teams', 'customer-service', 'managers'],
      priority: 'medium',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['customer-support', 'communication', 'service'],
      difficulty: 'beginner'
    },
    filePath: 'definitions/resources/templates/customer-support-template.json'
  },

  // Documentation Resources - Comprehensive guides and references
  'docs://openai-assistants-api': {
    name: 'OpenAI Assistants API Reference',
    description: 'Comprehensive API reference with ID formats, parameters, and examples for all OpenAI Assistants API endpoints',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'integrators', 'technical-writers'],
      priority: 'critical',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['api-reference', 'documentation', 'openai', 'assistants'],
      difficulty: 'intermediate',
      completeness: 'comprehensive'
    },
    filePath: 'definitions/resources/documentation/api-reference.json'
  },
  
  'docs://best-practices': {
    name: 'Best Practices Guide',
    description: 'Guidelines for optimal usage, performance, security, and cost optimization when working with OpenAI Assistants',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'architects', 'product-managers'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['best-practices', 'optimization', 'security', 'performance'],
      difficulty: 'intermediate',
      actionable: true
    },
    filePath: 'definitions/resources/documentation/best-practices.json'
  },
  
  'docs://troubleshooting/common-issues': {
    name: 'Troubleshooting Guide',
    description: 'Common issues and solutions when working with OpenAI Assistants API, including debugging techniques',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'support-engineers', 'qa-engineers'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['troubleshooting', 'debugging', 'solutions', 'common-issues'],
      difficulty: 'intermediate',
      problemSolving: true
    },
    filePath: 'definitions/resources/documentation/troubleshooting-guide.json'
  },

  // New Comprehensive Documentation Resources
  'docs://getting-started': {
    name: 'Getting Started Guide',
    description: 'Comprehensive beginner guide with step-by-step instructions for setting up and using OpenAI Assistants MCP Server',
    mimeType: 'application/json',
    annotations: {
      audience: ['beginners', 'new-users', 'developers'],
      priority: 'critical',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['getting-started', 'tutorial', 'setup', 'beginner-friendly'],
      difficulty: 'beginner',
      estimatedTime: '15-30 minutes',
      stepByStep: true
    },
    filePath: 'definitions/resources/documentation/getting-started-guide.json'
  },

  'docs://tool-usage': {
    name: 'Tool Usage Guide',
    description: 'Detailed reference for all 22 tools in the MCP server with complete parameter documentation and examples',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'integrators', 'power-users'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['tools', 'reference', 'parameters', 'examples', 'comprehensive'],
      difficulty: 'intermediate',
      toolCount: 22,
      comprehensive: true
    },
    filePath: 'definitions/resources/documentation/tool-usage-guide.json'
  },

  // Example Workflows - Complete, runnable implementations
  'examples://workflows/batch-processing': {
    name: 'Batch Processing Workflow',
    description: 'Example of processing multiple tasks efficiently with concurrent operations and error handling',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'engineers', 'automation-specialists'],
      priority: 'medium',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['batch-processing', 'concurrency', 'workflow', 'automation'],
      difficulty: 'intermediate',
      executable: true
    },
    filePath: 'definitions/resources/examples/batch-processing-workflow.json'
  },

  // New Comprehensive Example Workflows
  'examples://workflows/code-review': {
    name: 'Code Review Workflow',
    description: 'Complete workflow for automated code reviews with security focus, quality checks, and actionable feedback',
    mimeType: 'application/json',
    annotations: {
      audience: ['developers', 'code-reviewers', 'team-leads', 'security-engineers'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['code-review', 'security', 'quality-assurance', 'automation', 'best-practices'],
      difficulty: 'intermediate',
      estimatedTime: '20-30 minutes',
      executable: true,
      securityFocused: true
    },
    filePath: 'definitions/resources/examples/code-review-workflow.json'
  },

  'examples://workflows/data-analysis': {
    name: 'Data Analysis Workflow',
    description: 'Complete workflow for automated data analysis using OpenAI Assistants with code interpreter, file search, and statistical analysis capabilities',
    mimeType: 'application/json',
    annotations: {
      audience: ['data-scientists', 'analysts', 'researchers', 'developers'],
      priority: 'high',
      lastModified: '2025-01-31T12:39:00.000Z',
      tags: ['data-analysis', 'statistics', 'visualization', 'code-interpreter', 'file-search', 'workflow'],
      difficulty: 'intermediate',
      estimatedTime: '30-45 minutes',
      executable: true,
      comprehensive: true
    },
    filePath: 'definitions/resources/examples/data-analysis-workflow.json'
  }
};

/**
 * Get all available resources with enhanced metadata
 * @returns {Array} Array of resource objects with comprehensive metadata
 */
function getAllResources() {
  return Object.entries(ENHANCED_RESOURCES).map(([uri, resource]) => ({
    uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
    annotations: resource.annotations || {}
  }));
}

/**
 * Get a specific resource by URI
 * @param {string} uri - The resource URI
 * @returns {Object|null} Resource object or null if not found
 */
function getResource(uri) {
  const resource = ENHANCED_RESOURCES[uri];
  if (!resource) {
    return null;
  }
  
  return {
    uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
    annotations: resource.annotations || {}
  };
}

/**
 * Get resource content by URI with proper error handling
 * @param {string} uri - The resource URI
 * @returns {Object|string|null} Resource content or null if not found
 */
function getResourceContent(uri) {
  const resource = ENHANCED_RESOURCES[uri];
  if (!resource) {
    return null;
  }
  
  try {
    // Construct the full file path
    const fullPath = path.join(__dirname, '../../', resource.filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`Resource file not found: ${fullPath}`);
      return null;
    }
    
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const parsedContent = JSON.parse(fileContent);
    
    return parsedContent;
  } catch (error) {
    console.error(`Error loading resource content for ${uri}:`, error.message);
    return null;
  }
}

/**
 * Search resources by tags, audience, or other criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Array of matching resources
 */
function searchResources(criteria = {}) {
  const allResources = getAllResources();
  
  return allResources.filter(resource => {
    const annotations = resource.annotations || {};
    
    // Search by tags
    if (criteria.tags && criteria.tags.length > 0) {
      const resourceTags = annotations.tags || [];
      const hasMatchingTag = criteria.tags.some(tag => 
        resourceTags.some(resourceTag => 
          resourceTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }
    
    // Search by audience
    if (criteria.audience && criteria.audience.length > 0) {
      const resourceAudience = annotations.audience || [];
      const hasMatchingAudience = criteria.audience.some(aud => 
        resourceAudience.some(resourceAud => 
          resourceAud.toLowerCase().includes(aud.toLowerCase())
        )
      );
      if (!hasMatchingAudience) return false;
    }
    
    // Search by difficulty
    if (criteria.difficulty) {
      if (annotations.difficulty !== criteria.difficulty) return false;
    }
    
    // Search by priority
    if (criteria.priority) {
      if (annotations.priority !== criteria.priority) return false;
    }
    
    // Text search in name and description
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      const matchesName = resource.name.toLowerCase().includes(query);
      const matchesDescription = resource.description.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) return false;
    }
    
    return true;
  });
}

/**
 * Get resources by category/type
 * @param {string} category - Category type (templates, docs, examples)
 * @returns {Array} Array of resources in the category
 */
function getResourcesByCategory(category) {
  const allResources = getAllResources();
  
  return allResources.filter(resource => {
    if (category === 'templates') {
      return resource.uri.startsWith('assistant://templates/');
    } else if (category === 'docs' || category === 'documentation') {
      return resource.uri.startsWith('docs://');
    } else if (category === 'examples') {
      return resource.uri.startsWith('examples://');
    }
    return false;
  });
}

/**
 * Get resource statistics and metadata summary
 * @returns {Object} Statistics about the resource collection
 */
function getResourceStats() {
  const allResources = getAllResources();
  
  const stats = {
    total: allResources.length,
    byCategory: {
      templates: 0,
      documentation: 0,
      examples: 0
    },
    byDifficulty: {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    },
    byPriority: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    tags: {},
    audience: {},
    lastUpdated: null
  };
  
  allResources.forEach(resource => {
    const annotations = resource.annotations || {};
    
    // Count by category
    if (resource.uri.startsWith('assistant://templates/')) {
      stats.byCategory.templates++;
    } else if (resource.uri.startsWith('docs://')) {
      stats.byCategory.documentation++;
    } else if (resource.uri.startsWith('examples://')) {
      stats.byCategory.examples++;
    }
    
    // Count by difficulty
    if (annotations.difficulty) {
      stats.byDifficulty[annotations.difficulty] = (stats.byDifficulty[annotations.difficulty] || 0) + 1;
    }
    
    // Count by priority
    if (annotations.priority) {
      stats.byPriority[annotations.priority] = (stats.byPriority[annotations.priority] || 0) + 1;
    }
    
    // Count tags
    if (annotations.tags) {
      annotations.tags.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    }
    
    // Count audience
    if (annotations.audience) {
      annotations.audience.forEach(aud => {
        stats.audience[aud] = (stats.audience[aud] || 0) + 1;
      });
    }
    
    // Track latest update
    if (annotations.lastModified) {
      const modifiedDate = new Date(annotations.lastModified);
      if (!stats.lastUpdated || modifiedDate > new Date(stats.lastUpdated)) {
        stats.lastUpdated = annotations.lastModified;
      }
    }
  });
  
  return stats;
}

module.exports = {
  getAllResources,
  getResource,
  getResourceContent,
  searchResources,
  getResourcesByCategory,
  getResourceStats,
  ENHANCED_RESOURCES
};