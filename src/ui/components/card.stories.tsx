import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from '@/ui';

type CardPlaygroundArgs = {
  title: string;
  description: string;
  content: string;
  showFooter: boolean;
  width: number;
};

const meta = {
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: StoryObj<CardPlaygroundArgs> = {
  args: {
    title: 'The Method of Loci',
    description: 'A memory technique dating back to ancient Greece',
    content:
      'Visualise walking through a familiar location and placing vivid mental images at key waypoints.',
    showFooter: true,
    width: 320,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    content: { control: 'text' },
    showFooter: { control: 'boolean' },
    width: { control: { type: 'range', min: 200, max: 600, step: 20 } },
  },
  render: (args) => (
    <Card style={{ width: args.width }}>
      <CardHeader>
        <CardTitle>{args.title}</CardTitle>
        {args.description ? <CardDescription>{args.description}</CardDescription> : null}
      </CardHeader>
      {args.content ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">{args.content}</p>
        </CardContent>
      ) : null}
      {args.showFooter ? (
        <CardFooter className="gap-2">
          <Button size="sm">Open palace</Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  ),
};

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>The Method of Loci</CardTitle>
        <CardDescription>A memory technique dating back to ancient Greece</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Visualise walking through a familiar location and placing vivid mental images at key
          waypoints.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Open palace</Button>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Ancient Rome</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No description provided.</p>
      </CardContent>
    </Card>
  ),
};

export const FooterActions: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Shopping list</CardTitle>
        <CardDescription>Weekly groceries memory palace</CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Button size="sm">Open</Button>
        <Button size="sm" variant="outline">
          Duplicate
        </Button>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </CardFooter>
    </Card>
  ),
};
