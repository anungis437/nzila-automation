import { initOtel, initMetrics } from '@nzila/os-core/telemetry';
import { validateEnv } from '@nzila/os-core/config';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initOtel({ appName: '${{ values.name }}' });
    initMetrics('${{ values.name }}');
    validateEnv('${{ values.name }}');
  }
}
