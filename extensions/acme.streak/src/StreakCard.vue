<script setup lang="ts">
import { useRpc } from '@dolphy-app/extension-sdk/client';
import { onMounted, ref } from 'vue';
import { streakRpc } from './shared/rpc.ts';
import type { StreakStatus } from './streak.ts';

// `useRpc` binds the shared contract to the server part of this extension:
// the input and the answer are checked with its schemas
const loadStatus = useRpc(streakRpc);
const status = ref<StreakStatus | null>(null);
const failed = ref(false);

onMounted(async () => {
  try {
    status.value = await loadStatus({});
  } catch {
    failed.value = true;
  }
});
</script>

<template>
  <v-card
    class="streak-card"
    variant="tonal"
    :color="status?.atRisk ? 'warning' : undefined"
  >
    <v-card-text v-if="failed"
      >The streak is not available right now.</v-card-text
    >
    <v-card-text v-else-if="status === null">Loading the streak…</v-card-text>
    <v-card-text v-else-if="status.days === 0">
      No streak yet. Close an attempt today to start one.
    </v-card-text>
    <v-card-text v-else>
      <strong>{{ status.days }}-day streak.</strong>
      <span v-if="status.atRisk"> Practice today to keep it.</span>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.streak-card {
  margin-bottom: 16px;
}
</style>
