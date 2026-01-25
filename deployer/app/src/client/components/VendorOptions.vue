<template>
  <div class="vendor-options">
    <h3>Deployment Options for {{ package.name }}</h3>

    <div class="vendor-grid">
      <VendorCard
        v-for="option in plan.deploymentOptions"
        :key="option.vendor"
        :option="option"
        @select="handleVendorSelect"
      />
    </div>

    <DeploymentInstructions :plan="plan" :package="package" />
  </div>
</template>

<script setup lang="ts">
import VendorCard from './VendorCard.vue';
import DeploymentInstructions from './DeploymentInstructions.vue';

defineProps<{
  plan: any;
  package: any;
}>();

function handleVendorSelect(option: any) {
  const confirmed = confirm(
    `You will be redirected to ${option.vendorDisplayName} to sign up/login and create your deployment.\n\n` +
    `Once you have an account, you can return here to view setup instructions.\n\n` +
    `Continue to ${option.vendorDisplayName}?`
  );

  if (confirmed) {
    window.open(option.signupUrl, '_blank');
  }
}
</script>

<style scoped>
.vendor-options {
  padding: 20px;
}

.vendor-options h3 {
  color: #f0f6fc;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.vendor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
</style>
