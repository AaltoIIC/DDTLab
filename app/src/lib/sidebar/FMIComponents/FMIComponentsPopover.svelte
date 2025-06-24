  <script lang="ts">
  interface Props {
    isOpen?: boolean;
  }

  let { isOpen = false }: Props = $props();

      let activeTab: 'library' | 'uploaded' = 'library';
      let searchQuery = '';
      let selectedCategory = 'all';

      // Mock data for MVP
      const mockComponents = [
          {
              id: '1',
              name: 'DC Motor Model',
              category: 'motors',
              description: 'Simple DC motor with speed control',
              inputs: ['voltage', 'load'],
              outputs: ['speed', 'torque']
          },
      ];
  </script>
