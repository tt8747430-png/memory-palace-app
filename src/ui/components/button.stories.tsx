import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@/ui';

const meta = {
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Save palace',
    variant: 'primary',
    size: 'md',
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Button label / content',
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: 'Visual style variant from `buttonVariants` CVA',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Padding/height preset',
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: { control: 'boolean' },
    type: {
      control: { type: 'inline-radio' },
      options: ['button', 'submit', 'reset'],
    },
    className: { control: 'text' },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Primary: Story = {
  args: { children: 'Save palace', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Cancel', variant: 'secondary' },
};

export const Outline: Story = {
  args: { children: 'Learn more', variant: 'outline' },
};

export const Ghost: Story = {
  args: { children: 'Settings', variant: 'ghost' },
};

export const Destructive: Story = {
  args: { children: 'Delete', variant: 'destructive' },
};

export const LinkVariant: Story = {
  name: 'Link',
  args: { children: 'View all rooms', variant: 'link' },
};

export const Small: Story = {
  args: { children: 'Edit', size: 'sm' },
};

export const Large: Story = {
  args: { children: 'Get started', size: 'lg' },
};

export const Disabled: Story = {
  args: { children: 'Save', disabled: true },
};

export const AllVariants: Story = {
  name: 'All variants',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const InteractiveClick: Story = {
  name: 'Interactive: click',
  args: { children: 'Click me' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click me/i });
    await userEvent.click(button);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
