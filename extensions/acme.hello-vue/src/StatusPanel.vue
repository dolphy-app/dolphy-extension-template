<script setup lang="ts">
import { usePanel } from '@dolphy-app/extension-sdk/client';
import { computed, ref } from 'vue';

// `usePanel()` gives the panel the properties it was opened with and `call`
// for the commands of the extension
const panel = usePanel();
const message = ref('');
// the app opens the panel again with new properties: `panel.props` is
// reactive, the title follows it
const name = computed(() => {
  const { props } = panel;
  return typeof props === 'object' && props !== null && 'name' in props
    ? String(props.name)
    : 'world';
});

const load = async () => {
  // `call` returns the JSON the `data` command of this extension replied with
  const data = await panel.call('acme.hello-vue.data');
  if (typeof data === 'object' && data !== null && 'message' in data) {
    message.value = String(data.message);
  }
};
void load();
</script>

<template>
  <section class="status-panel">
    <h2>Hello, {{ name }}!</h2>
    <p>{{ message }}</p>
    <v-btn color="primary" @click="load">Reload</v-btn>
  </section>
</template>

<style scoped>
.status-panel {
  padding: 16px;
}
</style>
