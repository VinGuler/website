<template>
  <div
    class="vendor-card"
    :class="{ recommended: option.recommended }"
    @click="$emit('select', option)"
  >
    <div class="vendor-header">
      <span class="vendor-name">{{ option.vendorDisplayName }}</span>
      <span v-if="option.recommended" class="recommended-badge">Recommended</span>
    </div>

    <div class="cost">
      ${{ option.estimatedCost.min }}-{{ option.estimatedCost.max }}
      {{ option.estimatedCost.currency }}/{{ option.estimatedCost.period }}
    </div>

    <div class="features">
      <ul>
        <li v-for="(feature, index) in option.features" :key="index">
          {{ feature }}
        </li>
      </ul>
    </div>

    <div class="cta">
      Click to sign up / login →
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  option: any;
}>();

defineEmits<{
  select: [option: any];
}>();
</script>

<style scoped>
.vendor-card {
  border: 2px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
  background: #161b22;
}

.vendor-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.vendor-card.recommended {
  border-color: #10b981;
  background: #064e3b;
}

.vendor-card.recommended:hover {
  border-color: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.vendor-name {
  font-weight: bold;
  font-size: 1.2em;
  color: #f0f6fc;
}

.recommended-badge {
  background: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 600;
}

.cost {
  color: #8b949e;
  font-size: 0.95em;
  margin-bottom: 12px;
  font-weight: 500;
}

.features {
  margin-bottom: 16px;
}

.features ul {
  margin: 0;
  padding-left: 20px;
  color: #8b949e;
  font-size: 0.9em;
}

.features li {
  margin: 6px 0;
}

.cta {
  text-align: center;
  color: #8b5cf6;
  font-weight: 600;
  padding-top: 12px;
  border-top: 1px solid #30363d;
  font-size: 0.95em;
}

.vendor-card.recommended .cta {
  color: #10b981;
}
</style>
