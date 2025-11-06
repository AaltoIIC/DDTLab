import {
    currentSystemMeta,
    currentNodes,
    currentEdges,
    currentReqs
} from '$lib/stores/stores.svelte'
import { get } from 'svelte/store'
import type { RequirementType, LogicalExpressionType, IntervalType } from '$lib/types/types'
import { env } from '$env/dynamic/public'

// Get API URL from environment variable, fallback to localhost for development
const API_URL = env.PUBLIC_API_URL || 'http://localhost:8001'

// Mapping from frontend temporal operators to MTL syntax
const TEMPORAL_OPERATOR_MAP = {
    'Globally': 'G',
    'Eventually': 'F',
    'Until': 'U',
    'Next': 'X',
    'Since': 'S',
    'Release': 'R'
} as const;

/**
 * Sanitizes variable names for MTL syntax (removes invalid characters)
 * Preserves dots (.) for hierarchical paths like "motor.motor_torque"
 */
function sanitizeVariableName(varName: string | number | boolean): string {
    // Convert to string first
    const str = String(varName);
    // Remove or replace invalid characters (colons, spaces, etc.)
    // Keep alphanumeric, underscores, and dots (for hierarchical paths)
    return str.replace(/[^a-zA-Z0-9_.]/g, '_');
}

/**
 * Converts a logical expression to MTL formula syntax
 */
function logicalExpressionToMTL(expr: LogicalExpressionType): string {
    const { leftHandSide, operator, rightHandSide } = expr;

    // Sanitize variable names but keep numbers as-is
    const left = typeof leftHandSide === 'number' ? leftHandSide : sanitizeVariableName(leftHandSide);
    const right = typeof rightHandSide === 'number' ? rightHandSide : sanitizeVariableName(rightHandSide);

    return `${left} ${operator} ${right}`;
}

/**
 * Converts a frontend requirement to MTL formula syntax
 */
function requirementToMTLFormula(req: RequirementType): string {
    const mtlOp = TEMPORAL_OPERATOR_MAP[req.temporalOperator];

    // Handle interval - MTL parser requires an interval for temporal operators
    let interval = '[0,inf]';  // Default unbounded interval

    if (req.interval) {
        // Handle both array format [0, 10] and object format {lowerBound: 0, upperBound: 10}
        let lowerBound: number | undefined;
        let upperBound: number | undefined;

        if (Array.isArray(req.interval)) {
            // Array format: [0, 10]
            lowerBound = req.interval[0];
            upperBound = req.interval[1];
        } else {
            // Object format: {lowerBound: 0, upperBound: 10}
            lowerBound = req.interval.lowerBound;
            upperBound = req.interval.upperBound;
        }

        if (typeof lowerBound === 'number' &&
            typeof upperBound === 'number' &&
            !isNaN(lowerBound) &&
            !isNaN(upperBound)) {
            interval = `[${lowerBound},${upperBound}]`;
        }
    }

    const rightExpr = logicalExpressionToMTL(req.rightHandSide);

    // Binary temporal operators (Until, Since, Release) use both left and right hand sides
    if (['Until', 'Since', 'Release'].includes(req.temporalOperator) && req.leftHandSide) {
        const leftExpr = logicalExpressionToMTL(req.leftHandSide);
        return `(${leftExpr}) ${mtlOp}${interval} (${rightExpr})`;
    }

    // Unary temporal operators (Globally, Eventually, Next)
    return `${mtlOp}${interval} (${rightExpr})`;
}

/**
 * Calls the FastAPI backend to convert an MTL formula to TTL ontology
 */
async function convertMTLToTTL(formula: string, requirementName: string): Promise<string> {
    const response = await fetch(`${API_URL}/convert-mtl`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            formula: formula,
            requirement_name: requirementName
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to convert MTL formula: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ttl_content;
}

const TTL_prefix = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix time: <http://www.w3.org/2006/time#> .
@prefix req: <http://example.com/powertrain-requirements#> .
@prefix mtl: <http://example.com/mtl#> .
@prefix fmu: <http://example.com/fmu#> .
@prefix ssp: <http://example.com/ssp#> .
@prefix vsso:<https://github.com/w3c/vsso#> .
@prefix unit: <http://qudt.org/2.1/vocab/unit> .
@prefix qudt: <http://qudt.org/2.1/schema/qudt> .
@prefix sys: <http://example.com/system#> .


`;

/**
 * Parse an MTL formula string back to a RequirementType object
 * Example: "(G[0.0, 10.0] (motor.speed < 50.0))" → RequirementType
 */
function parseMTLFormulaToRequirement(formula: string, name: string): RequirementType | null {
    try {
        // Remove outer parentheses if present
        formula = formula.trim();
        if (formula.startsWith('(') && formula.endsWith(')')) {
            formula = formula.slice(1, -1);
        }

        // MTL operator mapping (reverse of TEMPORAL_OPERATOR_MAP)
        const MTL_TO_OPERATOR: Record<string, RequirementType['temporalOperator']> = {
            'G': 'Globally',
            'F': 'Eventually',
            'U': 'Until',
            'X': 'Next',
            'S': 'Since',
            'R': 'Release'
        };

        // Parse temporal operator and interval
        // Match pattern: G[0.0, 10.0] or F[5.0, inf] etc.
        const tempOpMatch = formula.match(/^([GFUXSR])\[([0-9.]+),\s*([0-9.inf]+)\]\s*(.+)$/);

        if (!tempOpMatch) {
            console.error('Could not parse temporal operator from formula:', formula);
            return null;
        }

        const [, mtlOp, lowerBound, upperBound, rest] = tempOpMatch;
        const temporalOperator = MTL_TO_OPERATOR[mtlOp];

        if (!temporalOperator) {
            console.error('Unknown temporal operator:', mtlOp);
            return null;
        }

        // Parse interval
        const lower = parseFloat(lowerBound);
        const upper = upperBound === 'inf' ? Infinity : parseFloat(upperBound);
        const interval: IntervalType = { lowerBound: lower, upperBound: upper };

        // Parse the rest (logical expression)
        // For binary operators (Until, Since, Release), there will be two expressions
        // For unary operators (Globally, Eventually, Next), there will be one expression
        let leftHandSide: LogicalExpressionType | undefined = undefined;
        let rightHandSide: LogicalExpressionType;

        if (['Until', 'Since', 'Release'].includes(temporalOperator)) {
            // Binary operator - parse both sides
            // Pattern: (leftExpr) U[...] (rightExpr)
            const binaryMatch = rest.match(/^\(([^)]+)\)\s*([GFUXSR])\[.+\]\s*\(([^)]+)\)$/);
            if (binaryMatch) {
                const [, leftExpr, , rightExpr] = binaryMatch;
                leftHandSide = parseLogicalExpression(leftExpr);
                rightHandSide = parseLogicalExpression(rightExpr);
            } else {
                // Fallback: treat whole thing as right hand side
                rightHandSide = parseLogicalExpression(rest);
            }
        } else {
            // Unary operator - only right hand side
            // Remove outer parentheses from the expression
            let expr = rest.trim();
            if (expr.startsWith('(') && expr.endsWith(')')) {
                expr = expr.slice(1, -1);
            }
            rightHandSide = parseLogicalExpression(expr);
        }

        return {
            name,
            id: '',
            description: '',
            temporalOperator,
            leftHandSide,
            rightHandSide,
            interval
        };
    } catch (error) {
        console.error('Error parsing MTL formula:', error);
        return null;
    }
}

/**
 * Parse a logical expression like "motor.speed < 50.0"
 */
function parseLogicalExpression(expr: string): LogicalExpressionType {
    expr = expr.trim();

    // Match: leftHandSide operator rightHandSide
    // Operators: =, <, >, <=, >= (check two-char operators first)
    const match = expr.match(/^(.+?)\s*(<=|>=|[=<>])\s*(.+)$/);

    if (match) {
        const [, left, op, right] = match;
        return {
            leftHandSide: left.trim(),
            operator: op as '=' | '<' | '>' | '<=' | '>=',
            rightHandSide: isNaN(Number(right.trim())) ? right.trim() : Number(right.trim())
        };
    }

    // Fallback
    return {
        leftHandSide: expr,
        operator: '=',
        rightHandSide: ''
    };
}

/**
 * Parse metadata (ID and description) from TTL content for a specific requirement
 */
function parseRequirementMetadata(ttlContent: string, reqName: string): { id: string; description: string } {
    const lines = ttlContent.split('\n');
    let id = '';
    let description = '';

    // Find the requirement block
    const reqPattern = new RegExp(`req:${reqName}\\s+a\\s+req:Requirement`);
    const reqLineIndex = lines.findIndex(line => reqPattern.test(line));

    if (reqLineIndex !== -1) {
        // Look for metadata in the following lines until we hit a blank line or new requirement
        for (let i = reqLineIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '' || line.startsWith('req:') && line.includes('a req:Requirement')) {
                break; // End of this requirement block
            }

            // Parse ID
            const idMatch = line.match(/req:hasID\s+"([^"]+)"/);
            if (idMatch) {
                id = idMatch[1];
            }

            // Parse description
            const descMatch = line.match(/req:hasDescription\s+"([^"]+)"/);
            if (descMatch) {
                description = descMatch[1].replace(/\\"/g, '"'); // Unescape quotes
            }
        }
    }

    return { id, description };
}

/**
 * Parse TTL file content and convert to requirements
 */
export const parseTTLToRequirements = async (ttlContent: string): Promise<RequirementType[]> => {
    try {
        const response = await fetch(`${API_URL}/parse-ttl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ttl_content: ttlContent
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to parse TTL: ${response.statusText}`);
        }

        const data = await response.json();
        const requirements: RequirementType[] = [];

        for (const parsed of data.requirements) {
            const req = parseMTLFormulaToRequirement(parsed.formula, parsed.name);
            if (req) {
                // Parse metadata from TTL content
                const metadata = parseRequirementMetadata(ttlContent, parsed.name);
                req.id = metadata.id;
                req.description = metadata.description;

                requirements.push(req);
            }
        }

        console.log('Successfully parsed requirements from TTL:', requirements);
        return requirements;
    } catch (error) {
        console.error('Error parsing TTL to requirements:', error);
        throw error;
    }
}

/**
 * Adds requirement metadata (ID and description) to the TTL content
 * Inserts after the requirement name line: "req:RequirementName a req:Requirement ;"
 */
function addRequirementMetadata(ttlContent: string, req: RequirementType): string {
    const lines = ttlContent.split('\n');
    const reqNamePattern = /^req:\w+\s+a\s+req:Requirement\s*;/;

    // Find the line with the requirement declaration
    const reqLineIndex = lines.findIndex(line => reqNamePattern.test(line.trim()));

    if (reqLineIndex === -1) {
        console.warn('Could not find requirement declaration line in TTL, returning original content');
        return ttlContent;
    }

    // Build metadata lines to insert
    const metadataLines: string[] = [];

    if (req.id) {
        metadataLines.push(`    req:hasID "${req.id}" ;`);
    }

    if (req.description) {
        // Escape quotes in description
        const escapedDescription = req.description.replace(/"/g, '\\"');
        metadataLines.push(`    req:hasDescription "${escapedDescription}" ;`);
    }

    // Insert metadata lines after the requirement declaration
    if (metadataLines.length > 0) {
        lines.splice(reqLineIndex + 1, 0, ...metadataLines);
    }

    return lines.join('\n');
}

export const convertToTTL = async (): Promise<string> => {
    const requirements = get(currentReqs);

    console.log('Converting requirements to TTL:', requirements);

    // If no requirements, return just the prefix
    if (!requirements || requirements.length === 0) {
        console.log('No requirements found, returning TTL prefix only');
        return TTL_prefix;
    }

    try {
        // Convert each requirement to MTL formula and get TTL
        const ttlPromises = requirements.map(async (req, index) => {
            const mtlFormula = requirementToMTLFormula(req);
            console.log(`Requirement ${index + 1} "${req.name}":`, mtlFormula);

            // Use requirement name as the requirement identifier (sanitize for use in URIs)
            const reqName = req.name.replace(/[^a-zA-Z0-9_]/g, '_');

            const ttlContent = await convertMTLToTTL(mtlFormula, reqName);

            // Add metadata (ID and description) to the TTL
            return addRequirementMetadata(ttlContent, req);
        });

        const ttlResults = await Promise.all(ttlPromises);

        // Since each TTL result includes prefixes, we only need the requirement bodies
        // Extract just the requirement definitions (skip prefixes and comments)
        const requirementBodies = ttlResults.map(ttl => {
            const lines = ttl.split('\n');
            // Find where the actual requirement starts (after prefixes and comments)
            const startIndex = lines.findIndex(line => line.trim().startsWith('req:'));
            return lines.slice(startIndex).join('\n');
        });

        // Combine with a single set of prefixes
        const combinedTTL = TTL_prefix + '\n# System Requirements\n\n' + requirementBodies.join('\n\n');

        console.log('Successfully converted all requirements to TTL');
        return combinedTTL;

    } catch (error) {
        console.error('Error converting requirements to TTL:', error);
        throw error;
    }
}

// Import the new SSD exporter
import { exportToSSD } from '$lib/exporters/ssd';

export const convertToSSD = () => {
    try {
        // Use the new modular SSD exporter
        return exportToSSD();
    } catch (error) {
        console.error('Error converting to SSD:', error);
        // Return a basic error message as XML comment
        return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Error: Failed to generate SSD file
     ${error instanceof Error ? error.message : 'Unknown error'}
-->`;
    }
}