import { describe, expect, it } from 'vitest';
import {
  addBindingConnectorAsUsage,
  addConnectionDefinition,
  addConnectionUsage,
  addFlowUsage,
  addOwningMembership,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  createDocument
} from '$lib/concept-stage/sysml/model';

describe('SysML relationships and memberships (Phase 1)', () => {
  it('stores explicit ownership and relationship links', () => {
    const document = createDocument('Vehicle');
    const motor = addPartDefinition(document, 'Motor');
    const sourceDefinition = addPortDefinition(document, 'SourcePort');
    const targetDefinition = addPortDefinition(document, 'TargetPort');
    const source = addPartUsage(document, 'motorA', motor.id);
    const target = addPartUsage(document, 'motorB', motor.id);
    const sourcePort = addPortUsage(document, 'out', sourceDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', targetDefinition.id, target.id, 'in');
    const connectionDefinition = addConnectionDefinition(document, 'MotorConnection', [sourcePort.id, targetPort.id]);
    const connection = addConnectionUsage(document, 'connection', sourcePort.id, targetPort.id, connectionDefinition.id);
    const binding = addBindingConnectorAsUsage(document, 'binding', sourcePort.id, targetPort.id);
    const flow = addFlowUsage(document, 'flow', sourcePort.id, targetPort.id);
    const membership = addOwningMembership(document, motor.id, null, 'Motor');

    expect(connection.endA).toBe(sourcePort.id);
    expect(connection.endB).toBe(targetPort.id);
    expect(binding.endA).toBe(sourcePort.id);
    expect(flow.sourceEnd).toBe(sourcePort.id);
    expect(flow.targetEnd).toBe(targetPort.id);
    expect(connectionDefinition.endIds).toEqual([sourcePort.id, targetPort.id]);
    expect(membership.memberElementId).toBe(motor.id);
    expect(document.root.memberIds).toContain(connection.id);
    expect(document.root.memberIds).toContain(binding.id);
    expect(document.root.memberIds).toContain(flow.id);
  });

  it('round-trips as plain JSON without losing semantic references', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const usage = addPartUsage(document, 'motorA', definition.id);
    const restored = JSON.parse(JSON.stringify(document));

    expect(restored.elements[usage.id].definitionId).toBe(definition.id);
    expect(restored.normativeRelease).toBe('20250201');
    expect(restored.schemaVersion).toBe(1);
  });
});
