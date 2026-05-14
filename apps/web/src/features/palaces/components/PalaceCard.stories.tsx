import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PalaceCard } from './PalaceCard';
import type { SelectPalace } from '@/db';

type PalacePlaygroundArgs = {
  title: string;
  description: string;
  mode: SelectPalace['mode'];
};

const buildPalace = (overrides: Partial<SelectPalace> = {}): SelectPalace => ({
  id: 'palace-1',
  userId: 'user-1',
  title: 'The Roman Forum',
  description:
    'A classic memory palace built around the ancient heart of Rome. Walk past the Temple of Saturn to recall key historical dates.',
  color: null,
  icon: null,
  mode: 'bible',
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-06-01'),
  deletedAt: null,
  ...overrides,
});

const meta = {
  component: PalaceCard,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'centered',
  },
} satisfies Meta<typeof PalaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: StoryObj<PalacePlaygroundArgs> = {
  args: {
    title: 'The Roman Forum',
    description: 'A classic memory palace built around the ancient heart of Rome.',
    mode: 'bible',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    mode: {
      control: { type: 'inline-radio' },
      options: ['bible', 'simple'] satisfies SelectPalace['mode'][],
    },
  },
  render: (args) => (
    <PalaceCard
      palace={buildPalace({
        title: args.title,
        description: args.description || null,
        mode: args.mode,
      })}
    />
  ),
};

export const WithDescription: Story = {
  args: { palace: buildPalace() },
};

export const NoDescription: Story = {
  args: {
    palace: buildPalace({
      id: 'palace-2',
      title: 'Shopping list palace',
      description: null,
    }),
  },
};

export const LongTitle: Story = {
  args: {
    palace: buildPalace({
      id: 'palace-3',
      title: 'My extremely detailed weekly grocery and household supplies memory palace',
      description: 'Used every Sunday morning before heading to the market.',
    }),
  },
};

export const LongDescription: Story = {
  args: {
    palace: buildPalace({
      id: 'palace-4',
      title: 'World capitals',
      description:
        'A comprehensive palace covering all 195 world capitals, organised by continent. Each room represents a continent and each station a country. Created to prepare for the Geography Olympiad 2025.',
    }),
  },
};
