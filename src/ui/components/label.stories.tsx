import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from './label';
import { Input } from './input';

const meta = {
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Palace name',
    htmlFor: 'palace-name',
  },
  argTypes: {
    children: { control: 'text' },
    htmlFor: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithInput: Story = {
  name: 'With input',
  render: (args) => (
    <div className="flex w-72 flex-col gap-2">
      <Label {...args} htmlFor="palace-name" />
      <Input id="palace-name" placeholder="The Roman Forum" />
    </div>
  ),
};

export const WithDisabledInput: Story = {
  name: 'With disabled input (peer)',
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Input id="disabled-name" placeholder="Unavailable" disabled className="peer" />
      <Label htmlFor="disabled-name">Disabled field</Label>
    </div>
  ),
};

export const Required: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-2">
      <Label {...args} htmlFor="required-name">
        {args.children}
        <span className="ml-0.5 text-destructive">*</span>
      </Label>
      <Input id="required-name" required placeholder="Required field" />
    </div>
  ),
};
