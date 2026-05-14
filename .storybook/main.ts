import type { StorybookConfig } from '@storybook/nextjs-vite';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-a11y'), getAbsolutePath('@storybook/addon-vitest')],
  framework: {
    name: getAbsolutePath('@storybook/nextjs-vite'),
    options: {},
  },
  async viteFinal(viteConfig) {
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

    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string> | undefined),
      '@': path.resolve(dirname, '../src'),
    };
    return viteConfig;
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
