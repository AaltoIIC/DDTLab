// Type definitions for SSD (System Structure Description) format
// Based on SSP 2.0 standard

export interface SSDUnit {
    name: string;
    baseUnit: {
        [key: string]: number; // e.g., { m: 1, s: -1 } for m/s
    };
}

export interface SSDConnector {
    name: string;
    kind: 'input' | 'output';
    dataType?: {
        type: 'Real' | 'Integer' | 'Boolean' | 'String';
        unit?: string;
    };
    annotations?: SSDAnnotation[];
}

export interface SSDElementGeometry {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface SSDComponent {
    name: string;
    source?: string; // FMU file path
    type?: string; // e.g., 'application/x-fmu-sharedlibrary'
    connectors: SSDConnector[];
    geometry?: SSDElementGeometry;
    annotations?: SSDAnnotation[];
    parameters?: SSDParameter[];
}

export interface SSDSystem {
    name: string;
    elements: (SSDComponent | SSDSystem)[];
    connections: SSDConnection[];
    connectors?: SSDConnector[]; // Subsystems can have their own connectors
    geometry?: SSDElementGeometry;
    annotations?: SSDAnnotation[];
}

export interface SSDConnection {
    startElement?: string; // omitted if connecting from parent system connector
    startConnector: string;
    endElement?: string; // omitted if connecting to parent system connector
    endConnector: string;
}

export interface SSDAnnotation {
    type: string; // e.g., 'com.ddtlab.vsso'
    content: string; // Can be JSON string or other format
}

export interface SSDParameter {
    name: string;
    value: {
        type: 'Real' | 'Integer' | 'Boolean' | 'String';
        value: any;
        unit?: string;
    };
}

export interface SSDSignalDictionary {
    name: string;
    entries: Array<{
        name: string;
        dataType: string;
        unit?: string;
    }>;
}

export interface SSDDocument {
    version: string; // "2.0"
    name: string;
    units?: SSDUnit[];
    signalDictionaries?: SSDSignalDictionary[];
    rootSystem: SSDSystem;
}

// Validation types
export interface ValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ConversionContext {
    errors: ValidationError[];
    warnings: ValidationError[];
    usedUnits: Set<string>;
    componentMap: Map<string, SSDComponent>;
    systemMap: Map<string, SSDSystem>;
}