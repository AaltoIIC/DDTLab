import {
    type Node,
    type Edge
} from '@xyflow/svelte';

export interface NotificationType {
    message: string;
    type: string;
    duration: number;
}

export interface SystemMetaType {
    name: string;
    id: string;
    date: string;
}

// Types for requirements

export interface LogicalExpressionType {
    leftHandSide: string | number | boolean;
    operator: '=' | '>' | '<';
    rightHandSide: string | number | boolean;
}
export interface IntervalType {
    lowerBound: number;
    upperBound: number;
}

export interface RequirementType {
    name: string;
    description: string;
    temporalOperator: 'Until' | 'Globally' | 'Eventually' | 'Next' | 'Since' | 'Release';
    leftHandSide?: LogicalExpressionType;
    rightHandSide: LogicalExpressionType;
    interval?: IntervalType;
}

export interface SystemType extends SystemMetaType {
    nodes: Node[];
    edges: Edge[];
    requirements: RequirementType[];
    isSubsystem?: boolean;
}

export interface ConnectorType {
    name: string;
    VSSoClass: string | null;
    type: 'input' | 'output';
    dataType: string;
    unit: string;
}

export interface ElementDataType {
    type: 'system' | 'component';
    VSSoClass: string | null;
    connectors: ConnectorType[];
}

export interface HistoryEntryType {
    systemMeta: SystemMetaType;
    nodes: Node[];
    edges: Edge[];
    requirements: RequirementType[];
}

export interface SubsystemDataType extends ElementDataType {
    subsystemId?: string;
    hasSubsystems?: boolean;
}

export interface NavigationContextType {
    path: SystemMetaType[];
    currentSystemId: string;
    parentSystemId: string;
    rootSystemId: string;
}

export type NodeDataType = ElementDataType | SubsystemDataType;


  export interface FMIComponentType {
      id: string;
      name: string;
      category: 'motors' | 'propellers' | 'engines' | 'sensors' | 'controllers' | 'other';
      description: string;
      filePath?: string;  // For uploaded components
      modelIdentifier: string;
      inputs: FMIVariableType[];
      outputs: FMIVariableType[];
      parameters: FMIVariableType[];
      linkedElements: string[];  // IDs of linked editor elements
      uploadDate: string;
      isUserUploaded: boolean;
  }

    export interface FMIVariableType {
      name: string;
      type: 'Real' | 'Integer' | 'Boolean' | 'String';
      unit?: string;
      description?: string;
      causality: 'input' | 'output' | 'parameter';
  }

    export interface FMILibraryType {
      components: FMIComponentType[];
      categories: string[];
  }