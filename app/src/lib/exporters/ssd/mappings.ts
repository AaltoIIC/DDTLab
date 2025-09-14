// Mappings for data types, units, and other conversions

export const DATA_TYPE_MAPPING: Record<string, string | null> = {
    'real': 'Real',
    'double': 'Real',
    'float': 'Real',
    'integer': 'Integer',
    'int': 'Integer',
    'boolean': 'Boolean',
    'bool': 'Boolean',
    'string': 'String',
    'no-dt': null, // No data type - element will be omitted
    '': null
};

// Common engineering units with their base unit definitions
export const UNIT_DEFINITIONS: Record<string, { [key: string]: number }> = {
    // Length
    'm': { m: 1 },
    'mm': { m: 1, scale: 0.001 },
    'cm': { m: 1, scale: 0.01 },
    'km': { m: 1, scale: 1000 },

    // Time
    's': { s: 1 },
    'ms': { s: 1, scale: 0.001 },
    'min': { s: 1, scale: 60 },
    'h': { s: 1, scale: 3600 },

    // Velocity
    'm/s': { m: 1, s: -1 },
    'km/h': { m: 1, s: -1, scale: 0.27778 },

    // Angular velocity
    'rad/s': { rad: 1, s: -1 },
    'deg/s': { rad: 1, s: -1, scale: 0.017453 },
    'rpm': { rad: 1, s: -1, scale: 0.10472 },

    // Force
    'N': { kg: 1, m: 1, s: -2 },
    'kN': { kg: 1, m: 1, s: -2, scale: 1000 },

    // Torque
    'Nm': { kg: 1, m: 2, s: -2 },

    // Pressure
    'Pa': { kg: 1, m: -1, s: -2 },
    'kPa': { kg: 1, m: -1, s: -2, scale: 1000 },
    'bar': { kg: 1, m: -1, s: -2, scale: 100000 },

    // Power
    'W': { kg: 1, m: 2, s: -3 },
    'kW': { kg: 1, m: 2, s: -3, scale: 1000 },
    'hp': { kg: 1, m: 2, s: -3, scale: 745.7 },

    // Energy
    'J': { kg: 1, m: 2, s: -2 },
    'kJ': { kg: 1, m: 2, s: -2, scale: 1000 },

    // Temperature
    'K': { K: 1 },
    'degC': { K: 1, offset: 273.15 },

    // Electric current
    'A': { A: 1 },
    'mA': { A: 1, scale: 0.001 },

    // Voltage
    'V': { kg: 1, m: 2, s: -3, A: -1 },

    // Frequency
    'Hz': { s: -1 },
    'kHz': { s: -1, scale: 1000 },

    // Mass
    'kg': { kg: 1 },
    'g': { kg: 1, scale: 0.001 },
    't': { kg: 1, scale: 1000 },

    // Angle
    'rad': { rad: 1 },
    'deg': { rad: 1, scale: 0.017453 },

    // Dimensionless
    '-': {},
    '1': {},
    'ratio': {},
    '%': { scale: 0.01 }
};

// VSSo class to annotation mapping
export function formatVSSoAnnotation(vssoClass: string | null): string | null {
    if (!vssoClass) return null;

    // Format as JSON for the annotation content
    return JSON.stringify({
        class: vssoClass,
        source: 'DDTLab',
        version: '1.0'
    });
}

// Sanitize names for XML compatibility
export function sanitizeXMLName(name: string): string {
    // Replace invalid XML characters
    return name
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
        .replace(/^[0-9\-\.]/, '_'); // Ensure it doesn't start with number or dash
}

// Generate unique names with prefixes if needed
export function ensureUniqueName(name: string, existingNames: Set<string>, prefix?: string): string {
    let safeName = sanitizeXMLName(name);

    if (prefix) {
        safeName = `${prefix}_${safeName}`;
    }

    if (!existingNames.has(safeName)) {
        existingNames.add(safeName);
        return safeName;
    }

    // Add numeric suffix if name already exists
    let counter = 1;
    while (existingNames.has(`${safeName}_${counter}`)) {
        counter++;
    }

    const uniqueName = `${safeName}_${counter}`;
    existingNames.add(uniqueName);
    return uniqueName;
}

// Map component types to SSD
export function mapComponentType(type: 'component' | 'system'): 'Component' | 'System' {
    return type === 'component' ? 'Component' : 'System';
}

// Default FMU type if not specified
export const DEFAULT_FMU_TYPE = 'application/x-fmu-sharedlibrary';

// Default canvas size for geometry calculations
export const DEFAULT_CANVAS_SIZE = {
    width: 1920,
    height: 1080
};

// Component default size for geometry
export const COMPONENT_SIZE = {
    width: 200,
    height: 200
};