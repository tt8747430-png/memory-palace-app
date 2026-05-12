import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Input } from './input';

const meta = {
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'Palace name…',
    type: 'text',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'search', 'url', 'tel'],
      description: 'Native `<input>` type attribute',
      table: { defaultValue: { summary: 'text' } },
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Default: Story = {
  args: { placeholder: 'Palace name…' },
};

export const WithValue: Story = {
  args: { defaultValue: 'My Roman Forum', placeholder: 'Palace name…' },
};

export const Email: Story = {
  args: { type: 'email', placeholder: 'you@example.com' },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Enter password…' },
};

export const Disabled: Story = {
  args: { placeholder: 'Unavailable', disabled: true },
};

export const Search: Story = {
  args: { type: 'search', placeholder: 'Search palaces…' },
};

export const InteractiveTyping: Story = {
  name: 'Interactive: typing',
  args: { placeholder: 'Type a palace name…' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/type a palace name/i);
    await userEvent.type(input, 'Roman Forum');
    await expect(input).toHaveValue('Roman Forum');
    await expect(args.onChange).toHaveBeenCalled();
  },
};
