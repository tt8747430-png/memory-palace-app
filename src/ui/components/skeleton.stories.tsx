import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from '@/ui';

type SkeletonPlaygroundArgs = {
  width: number;
  height: number;
  rounded: 'sm' | 'md' | 'lg' | 'full';
};

const meta = {
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

const roundedClass = (r: SkeletonPlaygroundArgs['rounded']) =>
  ({ sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' })[r];

export const Playground: StoryObj<SkeletonPlaygroundArgs> = {
  args: { width: 240, height: 16, rounded: 'md' },
  argTypes: {
    width: { control: { type: 'range', min: 40, max: 600, step: 10 } },
    height: { control: { type: 'range', min: 8, max: 200, step: 4 } },
    rounded: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg', 'full'],
    },
  },
  render: (args) => (
    <Skeleton
      className={roundedClass(args.rounded)}
      style={{ width: args.width, height: args.height }}
    />
  ),
};

export const Line: Story = {
  render: () => <Skeleton className="h-4 w-60" />,
};

export const Avatar: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
};

export const CardLoader: Story = {
  name: 'Card loader',
  render: () => (
    <div className="flex w-80 flex-col gap-3 rounded-md border p-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-2 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  ),
};

export const ListLoader: Story = {
  name: 'List loader',
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
};
