import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { log } from '@workspace/utils';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');

log('info', 'landing-page', 'App mounted');
