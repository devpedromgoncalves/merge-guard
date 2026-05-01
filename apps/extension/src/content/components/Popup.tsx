import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  ChevronDown,
  Save,
  GitPullRequest
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import type { Provider, Settings } from '@/types/review';

const PROVIDER_INFO: Record<
  Provider,
  { label: string; defaultModel: string; keyLink: string; keyHint: string }
> = {
  groq: {
    label: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    keyLink: 'https://console.groq.com/keys',
    keyHint: 'console.groq.com/keys'
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    keyLink: 'https://platform.openai.com/api-keys',
    keyHint: 'platform.openai.com/api-keys'
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-3-5-haiku-20241022',
    keyLink: 'https://console.anthropic.com/settings/keys',
    keyHint: 'console.anthropic.com'
  },
  google: {
    label: 'Google',
    defaultModel: 'gemini-2.0-flash',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyHint: 'aistudio.google.com/app/apikey'
  },
  huggingface: {
    label: 'Hugging Face',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
    keyLink: 'https://huggingface.co/settings/tokens',
    keyHint: 'huggingface.co/settings/tokens'
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'anthropic/claude-3.5-haiku',
    keyLink: 'https://openrouter.ai/settings/keys',
    keyHint: 'openrouter.ai/settings/keys'
  }
};

export function Popup() {
  const { isDark } = useTheme();
  const [provider, setProvider] = useState<Provider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const chromeAPI = (globalThis as any).chrome;
    chromeAPI.storage.local.get(['provider', 'apiKey', 'model'], (result: Partial<Settings>) => {
      if (result.provider) setProvider(result.provider);
      if (result.apiKey) {
        setApiKey(result.apiKey);
        setIsConfigured(true);
      }
      if (result.model) setModel(result.model);
    });
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    const chromeAPI = (globalThis as any).chrome;
    const settings: Settings = { provider, apiKey: apiKey.trim(), model: model.trim() };
    chromeAPI.storage.local.set(settings, () => {
      setIsConfigured(true);
      setTimeout(() => window.close(), 900);
    });
  };

  const info = PROVIDER_INFO[provider];
  const canSave = !!apiKey.trim() && !saving;

  return (
    <div className={`${isDark ? 'dark ' : ''}bg-white dark:bg-[#1a1a1a]`}>
      <div className="bg-white dark:bg-[#1a1a1a] text-zinc-950 dark:text-zinc-50 w-80 overflow-hidden border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
          <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50">
            <GitPullRequest size={22} className="text-zinc-700 dark:text-zinc-300" />
            <div>
              <div className="text-sm font-semibold tracking-tight">Merge Guard</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Tooltip label="Close" position="bottom">
              <button
                onClick={() => window.close()}
                type="button"
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center text-zinc-500 dark:text-zinc-400 bg-transparent border-0 rounded-md cursor-pointer transition-colors duration-150 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                <X size={16} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="px-3.5 pt-3.5 pb-4">
          <div
            className={[
              'flex flex-col gap-0.5 text-xs px-2.5 py-2 rounded-md mb-3',
              isConfigured
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-500 border border-green-300 dark:border-green-700/40'
                : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-amber-400 border border-orange-300 dark:border-orange-700/40'
            ].join(' ')}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              {isConfigured ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
              {isConfigured ? 'API key set' : 'API key required'}
            </div>
            <p className="m-0 pl-[18px] font-normal opacity-80">
              {isConfigured
                ? 'Open a GitLab MR and click Review.'
                : 'Enter your API key below to get started.'}
            </p>
          </div>

          <div className="mb-3">
            <label
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-1"
              htmlFor="provider-select"
            >
              Provider
            </label>
            <div className="relative flex items-center">
              <select
                id="provider-select"
                className="w-full px-2.5 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-950 dark:text-zinc-50 rounded-md outline-none cursor-pointer appearance-none pr-8 focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors duration-150"
                value={provider}
                onChange={(e) => {
                  setProvider((e.target as HTMLSelectElement).value as Provider);
                  setModel('');
                  setApiKey('');
                  setIsConfigured(false);
                }}
              >
                {(Object.keys(PROVIDER_INFO) as Provider[]).map((p) => (
                  <option key={p} value={p} className="bg-white dark:bg-zinc-800">
                    {PROVIDER_INFO[p].label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 text-zinc-500 dark:text-zinc-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <label
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-1"
              htmlFor="api-key-input"
            >
              API Key
            </label>
            <div className="relative flex items-center">
              <input
                id="api-key-input"
                className="w-full px-2.5 py-2 pr-9 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-950 dark:text-zinc-50 rounded-md outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors duration-150"
                type={showKey ? 'text' : 'password'}
                placeholder={`${info.label} API key`}
                value={apiKey}
                onChange={(e) => setApiKey((e.target as HTMLInputElement).value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="absolute right-2 flex items-center text-zinc-400 bg-transparent border-0 cursor-pointer p-0.5 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors duration-150"
                onClick={() => setShowKey((v) => !v)}
                type="button"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Get your key at{' '}
              <a
                className="text-blue-600 dark:text-blue-400 no-underline flex items-center gap-0.5 hover:underline"
                href={info.keyLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {info.keyHint}
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          <div className="mb-4">
            <label
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-1"
              htmlFor="model-input"
            >
              Model <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              id="model-input"
              className="w-full px-2.5 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-950 dark:text-zinc-50 rounded-md outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors duration-150"
              type="text"
              placeholder={`Default: ${info.defaultModel}`}
              value={model}
              onChange={(e) => setModel((e.target as HTMLInputElement).value)}
              spellCheck={false}
            />
          </div>

          <button
            className={[
              'w-full py-2 px-4 inline-flex items-center justify-center gap-1.5',
              'text-sm font-medium leading-none rounded-md',
              'transition-all duration-150 shadow-sm group',
              saving
                ? 'bg-zinc-900 dark:bg-zinc-800 text-zinc-50 cursor-default opacity-70'
                : canSave
                ? 'bg-zinc-900 dark:bg-zinc-800 text-zinc-50 cursor-pointer hover:bg-zinc-950 dark:hover:bg-zinc-700'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400  opacity-60'
            ].join(' ')}
            onClick={handleSave}
            disabled={!canSave}
            type="button"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
            ) : (
              <Save
                size={15}
                className={[
                  'transition-colors duration-150',
                  canSave
                    ? 'text-zinc-300 dark:text-zinc-400 group-hover:text-zinc-100 dark:group-hover:text-zinc-300'
                    : 'text-zinc-500 dark:text-zinc-500'
                ].join(' ')}
              />
            )}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
