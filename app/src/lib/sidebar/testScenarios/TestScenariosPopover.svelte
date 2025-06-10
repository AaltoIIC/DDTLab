  <script lang="ts">
      interface Props {
          onclose: () => void;
      }

      let { onclose }: Props = $props();

      let activeTab: 'standard' | 'custom' = $state('standard');
      let selectedStandardTests = $state<Set<string>>(new Set());
      let customScenarios = $state<Array<{id: string, name: string, actions: Array<{time: string, action:
  string}>}>>([]);

      // Mock data for standard test scenarios
      const standardTestCategories = [
          {
              name: "Mechanical Tests",
              tests: [
                  { id: "vib-1", name: "Standard Vibration Test (ISO 10816)", description: "Vibration severity testing for rotating machinery" },
                  { id: "vib-2", name: "Shock Test (IEC 60068-2-27)", description: "Mechanical shock resistance test" },
                  { id: "vib-3", name: "Random Vibration (MIL-STD-810)", description: "Environmental vibration testing" }
              ]
          },
          {
              name: "Marine Systems",
              tests: [
                  { id: "mar-1", name: "Standard Ship Engine Operation", description: "Full operational cycle test for marine engines" },
                  { id: "mar-2", name: "Emergency Stop Procedure", description: "Emergency shutdown sequence validation" },
                  { id: "mar-3", name: "Load Acceptance Test", description: "Sudden load change response test" }
              ]
          },
          {
              name: "Environmental Tests",
              tests: [
                  { id: "env-1", name: "Temperature Cycling (IEC 60068-2-14)", description: "Thermal stress testing" },
                  { id: "env-2", name: "Humidity Test (IEC 60068-2-78)", description: "Damp heat steady state test" }
              ]
          }
      ];

      function toggleStandardTest(testId: string) {
          if (selectedStandardTests.has(testId)) {
              selectedStandardTests.delete(testId);
          } else {
              selectedStandardTests.add(testId);
          }
          selectedStandardTests = selectedStandardTests;
      }

      function addCustomScenario() {
          customScenarios.push({
              id: Date.now().toString(),
              name: "New Test Scenario",
              actions: [{ time: "0", action: "" }]
          });
          customScenarios = customScenarios;
      }

      function addAction(scenarioId: string) {
          const scenario = customScenarios.find(s => s.id === scenarioId);
          if (scenario) {
              scenario.actions.push({ time: "", action: "" });
              customScenarios = customScenarios;
          }
      }
  </script>

  <div class="popover-wrapper" onclick={onclose}>
      <div class="popover-content test-scenarios-popover" onclick={(e) => e.stopPropagation()}>
          <div class="popover-header">
              <h3>Test Scenarios</h3>
              <button class="close-button" onclick={onclose}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
              </button>
          </div>

          <div class="tabs">
              <button
                  class="tab {activeTab === 'standard' ? 'active' : ''}"
                  onclick={() => activeTab = 'standard'}>
                  Standard Tests
              </button>
              <button
                  class="tab {activeTab === 'custom' ? 'active' : ''}"
                  onclick={() => activeTab = 'custom'}>
                  Custom Scenarios
              </button>
          </div>

          <div class="popover-body">
              {#if activeTab === 'standard'}
                  <div class="standard-tests">
                      <p class="description">Select predefined test scenarios from industry standards</p>

                      {#each standardTestCategories as category}
                          <div class="test-category">
                              <h4>{category.name}</h4>
                              {#each category.tests as test}
                                  <div class="test-item">
                                      <label>
                                          <input
                                              type="checkbox"
                                              checked={selectedStandardTests.has(test.id)}
                                              onchange={() => toggleStandardTest(test.id)}
                                          />
                                          <div class="test-info">
                                              <span class="test-name">{test.name}</span>
                                              <span class="test-description">{test.description}</span>
                                          </div>
                                      </label>
                                  </div>
                              {/each}
                          </div>
                      {/each}
                  </div>
              {:else}
                  <div class="custom-scenarios">
                      <div class="custom-header">
                          <p class="description">Define custom test scenarios with timed actions</p>
                          <button class="add-scenario-btn" onclick={addCustomScenario}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              Add Scenario
                          </button>
                      </div>

                      {#each customScenarios as scenario}
                          <div class="scenario-card">
                              <input
                                  class="scenario-name"
                                  type="text"
                                  bind:value={scenario.name}
                                  placeholder="Scenario name"
                              />

                              <div class="actions-list">
                                  {#each scenario.actions as action, index}
                                      <div class="action-row">
                                          <span class="time-label">t =</span>
                                          <input
                                              class="time-input"
                                              type="text"
                                              bind:value={action.time}
                                              placeholder="0"
                                          />
                                          <span class="time-unit">s</span>
                                          <input
                                              class="action-input"
                                              type="text"
                                              bind:value={action.action}
                                              placeholder="Define action..."
                                          />
                                      </div>
                                  {/each}
                                  <button class="add-action-btn" onclick={() => addAction(scenario.id)}>
                                      + Add Action
                                  </button>
                              </div>
                          </div>
                      {/each}

                      {#if customScenarios.length === 0}
                          <div class="empty-state">
                              <p>No custom scenarios defined yet</p>
                          </div>
                      {/if}
                  </div>
              {/if}
          </div>

          <div class="popover-footer">
              <button class="cancel-btn" onclick={onclose}>Cancel</button>
              <button class="apply-btn">Apply Test Scenarios</button>
          </div>
      </div>
  </div>

  <style>
      .popover-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
      }

      .popover-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
      }

      .test-scenarios-popover {
          width: 700px;
          max-height: 80vh;
      }

      .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .popover-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
      }

      .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
      }

      .close-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      .tabs {
          display: flex;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0 20px;
      }

      .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.6);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
      }

      .tab:hover {
          color: rgba(0, 0, 0, 0.8);
      }

      .tab.active {
          color: var(--main-dark-color);
          border-bottom-color: var(--main-dark-color);
      }

      .popover-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
      }

      .description {
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
          margin-bottom: 20px;
      }

      .test-category {
          margin-bottom: 24px;
      }

      .test-category h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: rgba(0, 0, 0, 0.8);
      }

      .test-item {
          margin-bottom: 8px;
      }

      .test-item label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
      }

      .test-item label:hover {
          background-color: rgba(0, 0, 0, 0.02);
      }

      .test-item input[type="checkbox"] {
          margin-right: 12px;
          margin-top: 2px;
      }

      .test-info {
          display: flex;
          flex-direction: column;
      }

      .test-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.9);
      }

      .test-description {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.5);
          margin-top: 2px;
      }

      .custom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
      }

      .add-scenario-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: var(--main-dark-color);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: opacity 0.2s;
      }

      .add-scenario-btn:hover {
          opacity: 0.9;
      }

      .scenario-card {
          background-color: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
      }

      .scenario-name {
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
      }

      .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .action-row {
          display: flex;
          align-items: center;
          gap: 8px;
      }

      .time-label {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
      }

      .time-input {
          width: 60px;
          padding: 6px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
      }

      .time-unit {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
          margin-right: 8px;
      }

      .action-input {
          flex: 1;
          padding: 6px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
      }

      .add-action-btn {
          align-self: flex-start;
          padding: 4px 8px;
          background: none;
          border: 1px dashed rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: all 0.2s;
      }

      .add-action-btn:hover {
          border-color: rgba(0, 0, 0, 0.5);
          color: rgba(0, 0, 0, 0.8);
      }

      .empty-state {
          text-align: center;
          padding: 40px;
          color: rgba(0, 0, 0, 0.4);
      }

      .popover-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
      }

      .cancel-btn, .apply-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
      }

      .cancel-btn {
          background: none;
          border: 1px solid rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
      }

      .cancel-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      .apply-btn {
          background-color: var(--main-dark-color);
          border: none;
          color: white;
      }

      .apply-btn:hover {
          opacity: 0.9;
      }
  </style>