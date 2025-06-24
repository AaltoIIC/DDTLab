import type { ConceptTemplate } from '../types/template';
import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'concept-templates';

function loadTemplatesFromStorage(): ConceptTemplate[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load templates from storage:', error);
    return [];
  }
}

function saveTemplatesToStorage(templates: ConceptTemplate[]) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save templates to storage:', error);
  }
}

export const templates = writable<ConceptTemplate[]>(loadTemplatesFromStorage());

templates.subscribe(value => {
  saveTemplatesToStorage(value);
});

export const templatesByCategory = derived(templates, $templates => {
  const grouped: Record<string, ConceptTemplate[]> = {
    uncategorized: []
  };
  
  $templates.forEach(template => {
    const category = template.category || 'uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(template);
  });
  
  return grouped;
});

export function saveTemplate(template: Omit<ConceptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ConceptTemplate {
  const newTemplate: ConceptTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  templates.update(temps => [...temps, newTemplate]);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<ConceptTemplate>) {
  templates.update(temps => 
    temps.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: Date.now() }
        : t
    )
  );
}

export function deleteTemplate(id: string) {
  templates.update(temps => temps.filter(t => t.id !== id));
}

export function duplicateTemplate(id: string): ConceptTemplate | null {
  const allTemplates = loadTemplatesFromStorage();
  const original = allTemplates.find(t => t.id === id);
  
  if (!original) return null;
  
  const duplicate = saveTemplate({
    ...original,
    name: `${original.name} (Copy)`,
    description: original.description
  });
  
  return duplicate;
}

export function exportTemplate(id: string): string | null {
  const allTemplates = loadTemplatesFromStorage();
  const template = allTemplates.find(t => t.id === id);
  
  if (!template) return null;
  
  return JSON.stringify(template, null, 2);
}

export function importTemplate(jsonString: string): ConceptTemplate | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.name || !parsed.data || !parsed.data.nodes) {
      throw new Error('Invalid template format');
    }
    
    return saveTemplate({
      name: parsed.name,
      description: parsed.description || '',
      category: parsed.category,
      tags: parsed.tags || [],
      data: parsed.data
    });
  } catch (error) {
    console.error('Failed to import template:', error);
    return null;
  }
}