<template>
  <h1>Dendrogram 生态树</h1>
  <div id="container"></div>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { Graph, treeToGraphData } from '@antv/g6';
  import dendrogramDatajson from './dendrogramData';

  onMounted(() => {
    const graph = new Graph({
      container: 'container',
      autoFit: 'view',
      data: treeToGraphData(dendrogramDatajson),
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      node: {
        style: {
          labelText: d => d.id,
          labelBackground: true,
        },
        animation: {
          enter: false,
        },
      },
      layout: {
        type: 'dendrogram',
        radial: true,
        nodeSep: 40,
        rankSep: 140,
      },
    });

    graph.render();
  });
</script>