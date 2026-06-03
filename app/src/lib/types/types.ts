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
    operator: '=' | '>' | '<' | '>=' | '<=';
    rightHandSide: string | number | boolean;
}
export interface IntervalType {
    lowerBound: number;
    upperBound: number;
}

export interface RequirementType {
    name: string;
    id: string;
    description: string;
    temporalOperator: 'Until' | 'Globally' | 'Eventually' | 'Next' | 'Since' | 'Release';
    leftHandSide?: LogicalExpressionType;
    rightHandSide: LogicalExpressionType;
    interval?: IntervalType | number[];  // Support both object and array formats
}

export interface SystemType extends SystemMetaType {
    nodes: Node[];
    edges: Edge[];
    requirements: RequirementType[];
    partDefinitions: PartDefinition[];
    itemDefinitions: ItemDefinition[];
    packages: PackageTemplate[];
    parentSystemId?: string | null;
    sourceConceptSystemId?: string | null;
    sourceConceptSystemName?: string | null;
    sourceAnalysisRequestIds?: string[];
    stage?: 'concept' | 'design';
}

export interface AnalysisReportRecord {
    id: string;
    analysisType: 'torsional_vibration';
    title: string;
    summary: string;
    engine: string;
    filename: string;
    pdfBase64: string;
    fileSizeBytes: number;
    generatedAt: string;
    sourceConceptSystemId: string;
    sourceConceptSystemName: string;
    designSystemId: string;
    designSystemName: string;
    requestIds: string[];
    oemNames: string[];
    oemShortCodes: string[];
    sharedRequestIds?: string[];
    sharedAt?: string | null;
}

export interface TemplateSimulationSimpleVariable {
    id: string;
    name: string;
    type?: string;
    [key: string]: unknown;
}

export interface TemplateSimulationSeries {
    id?: string;
    name?: string;
    type?: string;
    t: number[];
    value: number[];
    first?: number | null;
    last?: number | null;
    min?: number | null;
    max?: number | null;
}

export interface TemplateSimulationResultRecord {
    id: string;
    jobId: string;
    status: string;
    message?: string;
    launcherStatus?: string;
    modelId?: string;
    modelUrl?: string;
    resultFile?: string;
    files: string[];
    hdf5Files: string[];
    variables: string[];
    simpleVariables: TemplateSimulationSimpleVariable[];
    variablesByFile?: Record<string, string[]>;
    series: TemplateSimulationSeries[];
    createdAt: string;
    updatedAt: string;
    designSystemId: string;
    designSystemName: string;
}

export interface ConnectorType {
    name: string;
    VSSoClass: string | null;
    type: 'input' | 'output';
    dataType: string;
    unit: string;
    metadata?: string;
}

export interface ElementDataType {
    type: 'system' | 'component';
    VSSoClass: string | null;
    connectors: ConnectorType[];
    metadata?: Array<{ key: string; value: string }>;
    mass?: number | string;
    fmiComponentId?: string;
    fmiBinding?: {
        sourceNodeId: string;
        requestId: string;
        responseId: string;
        fmuId: string;
        fmuName: string | null;
        oemName: string | null;
        oemShortCode: string | null;
        partName?: string | null;
    };
}

export interface HistoryEntryType {
    systemMeta: SystemMetaType;
    nodes: Node[];
    edges: Edge[];
    requirements: RequirementType[];
    partDefinitions: PartDefinition[];
    itemDefinitions: ItemDefinition[];
    packages: PackageTemplate[];
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
    fmiVersion: string;
    fmiType: string;
    linkedElements: string[];  // IDs of linked editor elements
    uploadDate: string;
    isUserUploaded: boolean;
    requirements?: RequirementType[];  // Requirements from FMU modelDescription.xml
    filename?: string;
    domain?: string;
    oemName?: string;
    oemShortCode?: string;
    downloadUrl?: string;
    downloadAssets?: string[];
    variableCount?: number;
    inputCount?: number;
    outputCount?: number;
    parameterCount?: number;
    variables?: FMIVariableType[];
    catalogSource?: 'api' | 'mock' | 'upload';
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

  // Template stores
export interface ConceptTemplate {
    id: string;
    name: string;
    type?: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
    category?: string;
    tags?: string[];
    data: {
        nodes: Node[];
        edges: Edge[];
        metadata?: Record<string, any>;
    };
}

export interface PackageTemplate extends ConceptTemplate {
    type?: 'package';
};

interface PartData {
    attributes: string[];
    partRefs: PartDefinition[];
    itemRefs: ItemDefinition[];
    nodes: Node[];
    edges: Edge[];
}

interface ItemData extends Omit<PartData, 'partRefs'> {
    partRefs: null;
}

export interface PartDefinition extends Omit<ConceptTemplate, 'data'> {
    type: 'part';
    data: PartData;
}

export interface ItemDefinition extends Omit<ConceptTemplate, 'data'> {
    type: 'item';
    data: ItemData;
}

export type SysMLDefinition = PartDefinition | ItemDefinition;

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
