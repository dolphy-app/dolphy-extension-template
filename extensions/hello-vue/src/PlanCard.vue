<script setup lang="ts">
import { useApp } from '@dolphy-app/extension-sdk/client';

// `useApp()` is the list of window capabilities an extension may use
const app = useApp();

const openPanel = () =>
  app.openPanel('hello-vue', 'hello-vue.view', {
    name: 'the daily plan',
  });
</script>

<template>
  <v-card class="plan-card" variant="tonal">
    <v-card-text>Hello from hello-vue, drawn into the daily plan.</v-card-text>
    <v-btn class="plan-card__open" variant="text" @click="openPanel">
      Open the panel
    </v-btn>
  </v-card>
</template>

<style scoped>
.plan-card {
  margin-top: 16px;
}

.plan-card__open {
  margin: 0 8px 8px;
}
</style>
