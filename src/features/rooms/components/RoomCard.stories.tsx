import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RoomCard } from './RoomCard';
import type { SelectRoom } from '@/db';

type RoomPlaygroundArgs = {
  title: string;
  position: number;
  withReorderControls: boolean;
};

const buildRoom = (overrides: Partial<SelectRoom> = {}): SelectRoom => ({
  id: 'room-1',
  palaceId: 'palace-1',
  title: 'Entrance Hall',
  position: 0,
  prevRoomId: null,
  nextRoomId: null,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-06-01'),
  deletedAt: null,
  ...overrides,
});

const meta = {
  component: RoomCard,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'centered',
  },
} satisfies Meta<typeof RoomCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: StoryObj<RoomPlaygroundArgs> = {
  args: {
    title: 'Entrance Hall',
    position: 0,
    withReorderControls: false,
  },
  argTypes: {
    title: { control: 'text' },
    position: { control: { type: 'number', min: 0, max: 99, step: 1 } },
    withReorderControls: { control: 'boolean' },
  },
  render: (args) => (
    <div className="w-80">
      <RoomCard
        room={buildRoom({ title: args.title, position: args.position })}
        reorderControls={
          args.withReorderControls ? (
            <div className="flex gap-1">
              <button type="button" className="rounded border px-1.5 text-xs text-muted-foreground">
                ↑
              </button>
              <button type="button" className="rounded border px-1.5 text-xs text-muted-foreground">
                ↓
              </button>
            </div>
          ) : null
        }
      />
    </div>
  ),
};

export const Default: Story = {
  args: { room: buildRoom() },
};

export const LongTitle: Story = {
  args: {
    room: buildRoom({
      id: 'room-2',
      title: 'The grand entrance hall with marble columns and frescoes',
    }),
  },
};

export const WithReorderControls: Story = {
  args: {
    room: buildRoom(),
    reorderControls: (
      <div className="flex gap-1">
        <button type="button" className="rounded border px-1.5 text-xs text-muted-foreground">
          ↑
        </button>
        <button type="button" className="rounded border px-1.5 text-xs text-muted-foreground">
          ↓
        </button>
      </div>
    ),
  },
};

export const MidSequence: Story = {
  args: {
    room: buildRoom({
      id: 'room-3',
      title: 'Library',
      position: 3,
      prevRoomId: 'room-2',
      nextRoomId: 'room-4',
    }),
  },
};
