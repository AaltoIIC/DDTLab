import type { Node, Edge } from '@xyflow/svelte';

export interface ConceptTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  data: {
    nodes: Node[];
    edges: Edge[];
    metadata?: Record<string, any>;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface TemplateStore {
  templates: ConceptTemplate[];
  categories: TemplateCategory[];
}

export interface TemplateMetadata {
  packageCount: number;
  partCount: number;
  itemCount: number;
  connectionCount: number;
}