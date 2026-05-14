import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/ui';

type AlertPlaygroundArgs = {
  variant: 'default' | 'info' | 'success' | 'warning' | 'destructive';
  title: string;
  description: string;
  withIcon: boolean;
};

const meta = {
  component: Alert,
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const iconFor = (variant: AlertPlaygroundArgs['variant']) => {
  switch (variant) {
    case 'info':
      return <Info className="h-4 w-4" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'destructive':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export const Playground: StoryObj<AlertPlaygroundArgs> = {
  args: {
    variant: 'info',
    title: 'Heads up!',
    description: 'You can use this component to alert users to important information.',
    withIcon: true,
  },
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'info', 'success', 'warning', 'destructive'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
    withIcon: { control: 'boolean' },
  },
  render: (args) => (
    <Alert variant={args.variant} className={args.withIcon ? 'relative pl-10' : undefined}>
      {args.withIcon ? iconFor(args.variant) : null}
      {args.title ? <AlertTitle>{args.title}</AlertTitle> : null}
      {args.description ? <AlertDescription>{args.description}</AlertDescription> : null}
    </Alert>
  ),
};

export const Default: Story = {
  args: { variant: 'default' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Note</AlertTitle>
      <AlertDescription>This is a neutral notification.</AlertDescription>
    </Alert>
  ),
};

export const InfoVariant: Story = {
  name: 'Info',
  args: { variant: 'info' },
  render: (args) => (
    <Alert {...args} className="relative pl-10">
      <Info className="h-4 w-4" />
      <AlertTitle>Did you know?</AlertTitle>
      <AlertDescription>The method of loci dates back to 500 BC.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  args: { variant: 'success' },
  render: (args) => (
    <Alert {...args} className="relative pl-10">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Palace saved</AlertTitle>
      <AlertDescription>Your changes have been persisted.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  args: { variant: 'warning' },
  render: (args) => (
    <Alert {...args} className="relative pl-10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Unsaved changes</AlertTitle>
      <AlertDescription>You have unsaved edits in this room.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => (
    <Alert {...args} className="relative pl-10">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Delete failed</AlertTitle>
      <AlertDescription>Could not delete palace. Please try again.</AlertDescription>
    </Alert>
  ),
};
