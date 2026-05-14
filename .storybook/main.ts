import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    // Stub server actions and server-only modules so client components that
    // import them can render in the Storybook browser preview without
    // pulling in Node-only code (db client, supabase server, etc.).
    const stubServerOnly = {
      name: 'storybook-stub-server-only',
      enforce: 'pre' as const,
      load(id: string) {
        const normalized = id.split('?')[0];
        const actionMatch = normalized.match(/\/src\/features\/[^/]+\/actions\/([^/]+)\.ts$/);
        if (actionMatch) {
          const name = actionMatch[1];
          return `export const ${name} = async () => ({ success: true, data: null });
export default ${name};`;
        }
        // Stub shared server-only modules if imported transitively
        if (/\/src\/shared\/lib\/(supabase|action)(\.ts|\/index\.ts)?$/.test(normalized)) {
          return `export const defineAction = () => async () => ({ success: true, data: null });
export class ActionError extends Error { code; constructor(code, message) { super(message); this.code = code; } }
export const getCurrentUser = async () => null;
export const createSupabaseForProxy = () => null;
export default {};`;
        }
        return null;
      },
    };

    viteConfig.plugins = [...(viteConfig.plugins ?? []), stubServerOnly];

    // Ensure @/ alias resolves to /src for stories importing from app code
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string> | undefined),
      '@': path.resolve(dirname, '../src'),
    };
    return viteConfig;
  },
};

export default config;
