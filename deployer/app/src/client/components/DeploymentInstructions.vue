<template>
  <div class="deployment-instructions">
    <h4>How to Deploy {{ package.name }}</h4>

    <div class="instructions-card">
      <div class="step-section">
        <h5>Build Configuration</h5>
        <div v-if="plan.buildCommand" class="info-row">
          <strong>Build Command:</strong>
          <code>{{ plan.buildCommand }}</code>
        </div>
        <div v-if="plan.outputDirectory" class="info-row">
          <strong>Output Directory:</strong>
          <code>{{ plan.outputDirectory }}</code>
        </div>
      </div>

      <div v-if="plan.notes && plan.notes.length > 0" class="step-section">
        <h5>Important Notes</h5>
        <ul class="notes-list">
          <li v-for="(note, index) in plan.notes" :key="index">{{ note }}</li>
        </ul>
      </div>

      <div class="step-section">
        <h5>General Deployment Steps</h5>
        <ol class="steps-list">
          <li>Select a vendor above and create an account</li>
          <li>Connect your repository to the vendor's platform</li>
          <li>
            Configure the build settings using the information above:
            <ul>
              <li v-if="plan.buildCommand">Build command: <code>{{ plan.buildCommand }}</code></li>
              <li v-if="plan.outputDirectory">Output directory: <code>{{ plan.outputDirectory }}</code></li>
            </ul>
          </li>
          <li v-if="package.requiredEnvVars && package.requiredEnvVars.length > 0">
            Set up environment variables:
            <ul>
              <li v-for="envVar in package.requiredEnvVars" :key="envVar">
                <code>{{ envVar }}</code>
              </li>
            </ul>
          </li>
          <li>Deploy and monitor your application</li>
        </ol>
      </div>

      <div class="help-text">
        💡 Each vendor has specific setup instructions. After signing up, refer to their documentation for detailed guidance.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  plan: any;
  package: any;
}>();
</script>

<style scoped>
.deployment-instructions {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #30363d;
}

.deployment-instructions h4 {
  color: #f0f6fc;
  font-size: 1.3em;
  margin-bottom: 20px;
}

.instructions-card {
  background: #0d1117;
  border-radius: 8px;
  padding: 24px;
  border-left: 4px solid #8b5cf6;
}

.step-section {
  margin-bottom: 24px;
}

.step-section:last-child {
  margin-bottom: 0;
}

.step-section h5 {
  color: #f0f6fc;
  font-size: 1.1em;
  margin-bottom: 12px;
}

.info-row {
  margin: 8px 0;
  font-size: 0.95em;
}

.info-row strong {
  color: #c9d1d9;
  margin-right: 8px;
}

code {
  background: #1e1e1e;
  color: #7dd3fc;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.notes-list {
  margin: 0;
  padding-left: 24px;
  color: #8b949e;
}

.notes-list li {
  margin: 8px 0;
}

.steps-list {
  margin: 0;
  padding-left: 24px;
  color: #c9d1d9;
}

.steps-list li {
  margin: 12px 0;
  line-height: 1.6;
}

.steps-list ul {
  margin-top: 8px;
  padding-left: 20px;
}

.steps-list ul li {
  margin: 6px 0;
  list-style-type: circle;
}

.help-text {
  margin-top: 20px;
  padding: 12px;
  background: #1e3a8a;
  border-radius: 6px;
  color: #93c5fd;
  font-size: 0.95em;
  border-left: 3px solid #3b82f6;
}
</style>
