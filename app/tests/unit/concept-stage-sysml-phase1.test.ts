import { describe, expect, it } from 'vitest';
import {
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  createDocument,
  findByQualifiedName,
  getPortIds,
  getQualifiedName,
  namesInNamespace
} from '$lib/concept-stage/sysml/model';

describe('SysML abstract-syntax model construction (Phase 1)', () => {
  it('constructs package -> definition -> usages -> ports', () => {
    const document = createDocument('Vehicle');
    const library = addPackage(document, 'Library');
    const motor = addPartDefinition(document, 'Motor', library.id);
    const motorPort = addPortDefinition(document, 'PowerPort', library.id);
    const leftMotor = addPartUsage(document, 'leftMotor', motor.id, null);
    const port = addPortUsage(document, 'power', motorPort.id, leftMotor.id, 'in');

    expect(document.root.memberIds).toEqual([library.id, leftMotor.id]);
    expect(library.memberIds).toEqual([motor.id, motorPort.id]);
    expect(leftMotor.ownedUsageIds).toEqual([port.id]);
    expect(getPortIds(document, leftMotor.id)).toEqual([port.id]);
    expect(port.definitionId).toBe(motorPort.id);
  });

  it('resolves qualified names through explicit ownership', () => {
    const document = createDocument('Vehicle');
    const library = addPackage(document, 'Library');
    const motor = addPartDefinition(document, 'Motor', library.id);
    const usage = addPartUsage(document, 'motorA', motor.id, null);

    expect(getQualifiedName(document, library.id)).toBe('Vehicle::Library');
    expect(getQualifiedName(document, motor.id)).toBe('Vehicle::Library::Motor');
    expect(getQualifiedName(document, usage.id)).toBe('Vehicle::motorA');
    expect(findByQualifiedName(document, 'Vehicle::Library::Motor')?.id).toBe(motor.id);
    expect(findByQualifiedName(document, 'Vehicle::missing')).toBeUndefined();
  });

  it('derives port ids from ownership without double bookkeeping', () => {
    const document = createDocument('Vehicle');
    const motor = addPartDefinition(document, 'Motor');
    const motorPort = addPortDefinition(document, 'PowerPort');
    const usage = addPartUsage(document, 'leftMotor', motor.id);
    const port = addPortUsage(document, 'power', motorPort.id, usage.id, 'in');
    const nested = addPartUsage(document, 'innerPump', motor.id, usage.id);

    // A nested part usage is owned but is not a port.
    expect(usage.ownedUsageIds).toEqual([port.id, nested.id]);
    expect(getPortIds(document, usage.id)).toEqual([port.id]);
  });

  it('lists namespace members without exposing presentation state', () => {
    const document = createDocument('Vehicle');
    const library = addPackage(document, 'Library');
    addPartDefinition(document, 'Motor', library.id);
    addPartDefinition(document, 'Pump', library.id);

    expect(namesInNamespace(document, library.id)).toEqual(['Motor', 'Pump']);
    expect(document.elements[library.id]).not.toHaveProperty('position');
  });
});
