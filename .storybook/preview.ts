import type { Decorator, Preview } from '@storybook/nextjs-vite';
import React from 'react';
import '../src/app/globals.css';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string | undefined) ?? 'light';
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }
  return React.createElement(
    'div',
    {
      className:
        theme === 'dark' ? 'dark bg-background text-foreground' : 'bg-background text-foreground',
      style: { minHeight: '100vh', padding: '1.5rem' },
    },
    React.createElement(Story, null),
  );
};

const preview: Preview = {
  parameters: {
    layout: 'centered',

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: 'hsl(0 0% 100%)' },
        { name: 'app dark', value: 'hsl(240 10% 4%)' },
        { name: 'muted', value: 'hsl(240 5% 96%)' },
      ],
    },

    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },

    nextjs: {
      appDirectory: true,
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
  globalTypes: {
    theme: {
      description: 'App theme (light or dark)',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  tags: ['autodocs'],
};

export default preview;
