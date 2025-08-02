/**
 * Generated Resources Types
 * 
 * This file is auto-generated from JSON resources definitions.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: 2025-08-02T09:09:17.225Z
 */

export interface Coding Assistant TemplateResource {
  uri: 'assistant://templates/coding-assistant';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Data Analyst TemplateResource {
  uri: 'assistant://templates/data-analyst';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Customer Support TemplateResource {
  uri: 'assistant://templates/customer-support';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface AI Provider Assistants API ReferenceResource {
  uri: 'docs://openai-assistants-api';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Best Practices GuideResource {
  uri: 'docs://best-practices';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Troubleshooting GuideResource {
  uri: 'docs://troubleshooting/common-issues';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Basic Workflow ExampleResource {
  uri: 'examples://workflows/basic-workflow';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Advanced Workflow ExampleResource {
  uri: 'examples://workflows/advanced-workflow';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Batch Processing WorkflowResource {
  uri: 'examples://workflows/batch-processing';
  name: string;
  description: string;
  mimeType: string;
  content: string;
  metadata: Record<string, any>;
}

// Union type of all resources types
export type ResourcesTypes = Coding Assistant TemplateResource | Data Analyst TemplateResource | Customer Support TemplateResource | AI Provider Assistants API ReferenceResource | Best Practices GuideResource | Troubleshooting GuideResource | Basic Workflow ExampleResource | Advanced Workflow ExampleResource | Batch Processing WorkflowResource;

// resources name to type mapping
export interface ResourcesTypesMap {
  'Coding Assistant Template': Coding Assistant TemplateResource;
  'Data Analyst Template': Data Analyst TemplateResource;
  'Customer Support Template': Customer Support TemplateResource;
  'AI Provider Assistants API Reference': AI Provider Assistants API ReferenceResource;
  'Best Practices Guide': Best Practices GuideResource;
  'Troubleshooting Guide': Troubleshooting GuideResource;
  'Basic Workflow Example': Basic Workflow ExampleResource;
  'Advanced Workflow Example': Advanced Workflow ExampleResource;
  'Batch Processing Workflow': Batch Processing WorkflowResource;
}
