import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';

// Created outside register() so route handlers can import and call forceFlush()
// after a response — batch processor won't fire before a serverless function freezes.
export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': 'memory-palace-web' }),
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: 'https://us.i.posthog.com/i/v1/logs',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? ''}`,
          'Content-Type': 'application/json',
        },
      }),
    ),
  ],
});

// PostHog has no global server-side init; per-request posthog-node
// instances are created lazily if server-side event capture is needed.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logs.setGlobalLoggerProvider(loggerProvider);
  }
}
