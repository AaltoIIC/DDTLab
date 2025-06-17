  <script lang="ts">
      import { Handle, Position } from '@xyflow/svelte';
      import { Package } from 'lucide-svelte';
      import type { NodeProps } from '@xyflow/svelte';

      type PackageData = {
          declaredName: string;
          comment: string;
          id: string;
      };

      type $$Props = NodeProps<PackageData>;

      export let data: PackageData;
      export let id: string;
      export let selected: boolean = false;
      export let dragging: boolean = false;
  </script>

    <div class="package-node">
      <Handle type="target" position={Position.Left} />

      <div class="package-header">
          <Package size={16} />
          <span class="package-title">Package</span>
      </div>

      <div class="package-content">
          <div class="package-field">
              <span class="field-label">Name:</span>
              <span class="field-value">{data.declaredName || 'Unnamed'}</span>
          </div>

          {#if data.comment}
              <div class="package-field">
                  <span class="field-label">Comment:</span>
                  <span class="field-value">{data.comment}</span>
              </div>
          {/if}

          <div class="package-field">
              <span class="field-label">ID:</span>
              <span class="field-value">{data.id}</span>
          </div>
      </div>

      <Handle type="source" position={Position.Right} />
  </div>

    <style>
      .package-node {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: move;
      }

      .package-node:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .package-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
      }

      .package-title {
          font-weight: 600;
          font-size: 14px;
      }

      .package-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
      }

      .package-field {
          display: flex;
          gap: 6px;
          font-size: 12px;
      }

      .field-label {
          color: #6b7280;
          font-weight: 500;
      }

      .field-value {
          color: #111827;
          word-break: break-word;
      }
  </style>