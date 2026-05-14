import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Textarea } from './textarea';

const meta = {
  component: Textarea,
  tags: ['autodocs'],
  args: {
    placeholder: 'Describe your palace…',
    rows: 4,
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    rows: { control: { type: 'number', min: 1, max: 20, step: 1 } },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Default: Story = {
  args: { placeholder: 'Describe your palace…' },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      'A grand atrium with marble columns. The first locus is a fountain at the centre.',
  },
};

export const TallRows: Story = {
  args: { rows: 10, placeholder: 'Write a long story…' },
};

export const Disabled: Story = {
  args: { placeholder: 'Locked', disabled: true },
};

export const InteractiveTyping: Story = {
  name: 'Interactive: typing',
  args: { placeholder: 'Type a description…' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(/type a description/i);
    await userEvent.type(textarea, 'A vivid scene with a fountain.');
    await expect(textarea).toHaveValue('A vivid scene with a fountain.');
    await expect(args.onChange).toHaveBeenCalled();
  },
};
