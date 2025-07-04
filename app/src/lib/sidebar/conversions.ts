import { 
    currentSystemMeta,
    currentNodes,
    currentEdges,
    currentReqs
} from '$lib/stores/stores.svelte'
import { get } from 'svelte/store'

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

# we define a an ontology to represent the requirements and mtl formulas

req:Requirement a owl:Class ;
    rdfs:label "Requirement" ;
    rdfs:comment "Represents a system requirement expressed using MTL." .

req:hasFormula a owl:ObjectProperty ;
    rdfs:domain req:Requirement ;
    rdfs:range mtl:MTLFormula ;
    rdfs:label "has formula" ;
    rdfs:comment "Links a requirement to its formal MTL representation." .

req:hasDescription a owl:DatatypeProperty ;
    rdfs:domain req:Requirement ;
    rdfs:range xsd:string ;
    rdfs:label "has description" ;
    rdfs:comment "Provides a human-readable description of the requirement." .

req:hasID a owl:DatatypeProperty ;
    rdfs:domain req:Requirement ;
    rdfs:range xsd:string ;
    rdfs:label "has ID" ;
    rdfs:comment "Unique identifier for the requirement." .

req:appliesTo a owl:ObjectProperty ;
    rdfs:domain req:Requirement ;
    rdfs:range ssp:Component ;
    rdfs:label "applies to" ;
    rdfs:comment "Specifies which component a requirement applies to." .

mtl:Operator a owl:Class ;
    rdfs:label "MTL Operator" ;
    rdfs:comment "The base class for all MTL operators." .

mtl:TemporalOperator rdfs:subClassOf mtl:Operator ;
    rdfs:label "Temporal Operator" ;
    rdfs:comment "The class of temporal operators in MTL." .

mtl:BooleanOperator rdfs:subClassOf mtl:Operator ;
    rdfs:label "Boolean Operator" ;
    rdfs:comment "The class of boolean operators in MTL." .

mtl:TemporalOperator owl:disjointWith mtl:BooleanOperator .

mtl:Operator owl:equivalentClass [
    a owl:Class ;
    owl:unionOf (mtl:TemporalOperator mtl:BooleanOperator)
] .

mtl:Until a mtl:TemporalOperator .
mtl:Globally a mtl:TemporalOperator .
mtl:Eventually a mtl:TemporalOperator .
mtl:Next a mtl:TemporalOperator .
mtl:Since a mtl:TemporalOperator . # new
mtl:Release a mtl:TemporalOperator . # new

mtl:EqualTo a mtl:BooleanOperator ;
    rdfs:label "Equal To" ;
    rdfs:comment "Represents the equality comparison in MTL formulas." .

mtl:GreaterThan a mtl:BooleanOperator ;
    rdfs:label "Greater Than" ;
    rdfs:comment "Represents the greater than comparison in MTL formulas." .

mtl:LessThan a mtl:BooleanOperator ;
    rdfs:label "Less Than" ;
    rdfs:comment "Represents the less than comparison in MTL formulas." .

mtl:IfThenElse a mtl:BooleanOperator ;
    rdfs:label "If-Then-Else" ;
    rdfs:comment "Represents the if-then-else conditional operator in MTL formulas." .

mtl:True a mtl:BooleanOperator ;
    rdfs:label "True" ;
    rdfs:comment "Represents conditions being true in MTL formulas." .

mtl:False a mtl:BooleanOperator ;
    rdfs:label "False" ;
    rdfs:comment "Represents conditions being false in MTL formulas." .

mtl:And a mtl:BooleanOperator ;
    rdfs:label "And" ;
    rdfs:comment "Represents the logical AND operator in MTL formulas." .

mtl:Or a mtl:BooleanOperator ;
    rdfs:label "Or" ;
    rdfs:comment "Represents the logical OR operator in MTL formulas." .

# these are new ------------------------------------------
mtl:Xor a mtl:BooleanOperator ;
    rdfs:label "Xor" ;
    rdfs:comment "Represents the logical XOR operator in MTL formulas." .

mtl:IfThen a mtl:BooleanOperator ;
    rdfs:label "If Then" ;
    rdfs:comment "Represents the implication operation in MTL formulas." .

mtl:IfAndOnlyIf a mtl:BooleanOperator ;
    rdfs:label "If and Only If" ;
    rdfs:comment "Represents the bi-implication (equivalence) operation in MTL formulas." .

mtl:CausesBefore a mtl:TemporalOperator ;
    rdfs:label "Causes Before" ;
    rdfs:comment "Represents a causal relationship with a time bound in MTL formulas." .

mtl:CausesWithinInterval a mtl:TemporalOperator ;
    rdfs:label "Causes Within Interval" ;
    rdfs:comment "Represents a causal relationship within a specific time interval in MTL formulas." .
# end these are new ------------------------------------------

mtl:MTLFormula a owl:Class ;
    rdfs:label "MTL Formula" ;
    rdfs:comment "Represents a formula in the Metric Temporal Logic (MTL)." .

mtl:hasOperator a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range mtl:Operator .

mtl:hasLeftOperand a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range mtl:MTLFormula .

mtl:hasRightOperand a rdf:Property ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range [ a owl:Class ;
        owl:unionOf (mtl:MTLFormula rdfs:Literal)
    ] ;
    rdfs:label "has right operand" ;
    rdfs:comment "Specifies the right operand of an MTL formula, which can be another formula or a literal value." .

mtl:hasCondition a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range mtl:MTLFormula . 

mtl:hasThenClause a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range mtl:MTLFormula .

mtl:hasElseClause a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range mtl:MTLFormula .

mtl:hasTimeInterval a owl:ObjectProperty ;
    rdfs:domain mtl:MTLFormula ;
    rdfs:range time:Interval ;
    rdfs:label "has time interval" ;
    rdfs:comment "Specifies the time interval for an MTL formula." .

fmu:FMU a owl:Class ;
    rdfs:label "FMU" ;
    rdfs:comment "Represents a Functional Mock-up Unit." .

fmu:fmuType a owl:DatatypeProperty ;
    rdfs:domain fmu:FMU ;
    rdfs:range xsd:string ;
    rdfs:label "FMU type" ;
    rdfs:comment "Specifies the type of the FMU (e.g., 'Motor', 'Driver', 'Load')." .

ssp:System a owl:Class ;
    rdfs:label "SSP System" ;
    rdfs:comment "Represents a system defined in an SSP file" .

ssp:Component a owl:Class ;
    rdfs:label "SSP Component" ;
    rdfs:comment "Represents a component in an SSP file" .

ssp:hasComponent a owl:ObjectProperty ;
    rdfs:domain ssp:System ;
    rdfs:range ssp:Component ;
    rdfs:label "has component" ;
    rdfs:comment "Links a system to its components" .

ssp:componentType a owl:DatatypeProperty ;
    rdfs:domain ssp:Component ;
    rdfs:range xsd:string ;
    rdfs:label "component type" ;
    rdfs:comment "Specifies the type of a component in an SSP file (example: 'Motor', 'Driver')" .

ssp:SSPComponentID a owl:DatatypeProperty ;
    rdfs:domain ssp:Component ;
    rdfs:range xsd:string ;
    rdfs:label "SSP Component ID" ;
    rdfs:comment "Unique identifier for SSP component." .

ssp:hasVariableName a owl:DatatypeProperty ;
    rdfs:domain ssp:Component ;
    rdfs:range xsd:string ;
    rdfs:label "has variable name" ;
    rdfs:comment "Specifies the name of a variable in an SSP component." .

ssp:hasVariable a owl:ObjectProperty;
    rdfs:domain ssp:Component ;
    rdfs:range ssp:Component ;
    rdfs:label "has variable" ;
    rdfs:comment "Specifies the variables belonging to an SSP component." .

ssp:hasDataType a owl:DatatypeProperty ;
    rdfs:domain ssp:Component ;
    rdfs:range rdfs:Datatype ;
    rdfs:label "has data type" ;
    rdfs:comment "Specifies the data type of a variable in an SSP component." .

fmu:FMUComponentID a owl:DatatypeProperty ;
    rdfs:domain fmu:FMU ;
    rdfs:range xsd:string ;
    rdfs:label "FMU Component ID" ;
    rdfs:comment "Unique identifier for FMU." .

ssp:linkedToFMU a owl:ObjectProperty ;
    rdfs:domain ssp:Component ;
    rdfs:range fmu:FMU ;
    rdfs:label "linked to FMU" ;
    rdfs:comment "Links an SSP component to its corresponding FMU." .

fmu:FMUVariable a owl:Class ;
    rdfs:label "FMU Variable" ;
    rdfs:comment "Represents a variable in the FMU Model." .

fmu:hasVariable a owl:ObjectProperty ;
    rdfs:domain fmu:FMU ;
    rdfs:range fmu:FMUVariable ;
    rdfs:label "has variable" ;
    rdfs:comment "Links an FMU to its variables." .

fmu:hasDataType a owl:DatatypeProperty ;
    rdfs:domain fmu:FMUVariable ;
    rdfs:range rdfs:Datatype ;
    rdfs:label "variable type" ;
    rdfs:comment "The data type of the FMU variable (example: 'double', 'Integer')." .

fmu:hasFMUVariableName a owl:DatatypeProperty ;
    rdfs:domain fmu:FMUVariable ;
    rdfs:range xsd:string .

sys:SSPComponent rdfs:subClassOf ssp:Component ;
    rdfs:label "SSP Component" ;
    rdfs:comment "Represents a component in an SSP file" .

sys:SSPSystem rdfs:subClassOf ssp:System ;
    rdfs:label "SSP System" ;
    rdfs:comment "Represents a system defined in an SSP file" .

# --------------------------------------------------------------
# intial parameters
# --------------------------------------------------------------
fmu:InitialParameter a owl:Class ;
    rdfs:label "Initial Parameters" ;
    rdfs:comment "Represents the initial parameters for an FMU." .

fmu:hasInitialParameter a owl:ObjectProperty ;
    rdfs:domain fmu:FMU ;
    rdfs:range fmu:InitialParameter ;
    rdfs:label "has initial parameter" ;
    rdfs:comment "Links an FMU to its initial parameters." .

fmu:paramaterName a owl:DatatypeProperty ;
    rdfs:domain fmu:InitialParameter ;
    rdfs:range xsd:string ;
    rdfs:label "parameter name" ;
    rdfs:comment "Specifies the name of an initial parameter." .

fmu:parameterValue a owl:DatatypeProperty ;
    rdfs:domain fmu:InitialParameter ;
    rdfs:range rdfs:Literal ;
    rdfs:label "parameter value" ;
    rdfs:comment "Specifies the value of an initial parameter." .

req:RequirementSet a owl:Class ;
    rdfs:label "Requirement Set" ;
    rdfs:comment "Represents a set of requirements that are executed together." .

req:hasRequirement a owl:ObjectProperty ;
    rdfs:domain req:RequirementSet ;
    rdfs:range req:Requirement ;
    rdfs:label "has requirement" ;
    rdfs:comment "Links a requirement set to its requirements." .

req:ConditionalRequirement a owl:Class ;
    rdfs:label "Conditional Requirement Set" ;
    rdfs:comment "Represents a requirement that depends on initial parameters." .

req:conditionParameter a owl:ObjectProperty ;
    rdfs:domain req:ConditionalRequirement ;
    rdfs:range [ a owl:Class ;
        owl:unionOf (xsd:string fmu:FMUVariable)
    ] ;
    rdfs:label "condition parameter" ;
    rdfs:comment "Specifies the parameter name or FMU variable for the condition." .

req:conditionValue a owl:DatatypeProperty ;
    rdfs:domain req:ConditionalRequirement ;
    rdfs:range rdfs:Literal ;
    rdfs:label "condition value" ;
    rdfs:comment "Specifies the value for the condition." .

req:hasRequirementSet a owl:ObjectProperty ;
    rdfs:domain req:ConditionalRequirement ;
    rdfs:range req:RequirementSet ;
    rdfs:label "has requirement set" ;
    rdfs:comment "Links a conditional requirement to its requirement set." .

req:ConditionalDefaultRequirement a owl:Class ;
    rdfs:subClassOf req:ConditionalRequirement, req:DefaultRequirementSet ;
    rdfs:label "Conditional Default Requirement Set" ;
    rdfs:comment "Represents a default requirement set that is applied conditionally based on initial parameters." .

req:DefaultRequirementSet a owl:Class ;
    rdfs:subClassOf req:RequirementSet ;
    rdfs:label "Default Requirement Set" ;
    rdfs:comment "Represents a set of requirements that always apply, regardless of conditions." .

req:hasDefaultRequirementSet a owl:ObjectProperty ;
    rdfs:domain fmu:FMU ;
    rdfs:range [
        a owl:Class ;
        owl:unionOf (req:DefaultRequirementSet req:ConditionalDefaultRequirement)
    ] ;
    rdfs:label "has default requirement set" ;
    rdfs:comment "Links an FMU to its default requirement set, which may be conditional or unconditional." .
# --------------------------------------------------------------
# end intial parameters
# --------------------------------------------------------------

`;

export const convertToTTL = () => {
    console.log(get(currentSystemMeta))
    console.log(get(currentNodes))
    console.log(get(currentEdges))
    console.log(get(currentReqs))

    return (`${TTL_prefix}`);
}

export const convertToSSD = () => {
    console.log(get(currentSystemMeta))
    console.log(get(currentNodes))
    console.log(get(currentEdges))
    console.log(get(currentReqs))

    return (`test
        `);
}