import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Merge Guard',
  version: packageJson.version,
  description: packageJson.description,

  permissions: ['activeTab', 'storage'],

  host_permissions: [
    'https://api.groq.com/*',
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api-inference.huggingface.co/*',
    'https://openrouter.ai/*'
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Merge Guard Settings'
  },

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },

  content_scripts: [
    {
      matches: ['https://*/*', 'http://*/*'],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
      exclude_matches: [
        'https://www.google.com/*',
        'https://www.youtube.com/*',
        'https://github.com/*'
      ]
    }
  ]
});
