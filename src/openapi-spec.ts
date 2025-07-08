import {ApplicationConfig} from '@loopback/core';

import {config} from './common/config';
import {LottoApiApplication} from './application';

/**
 * Export the OpenAPI spec from the application
 */
async function exportOpenApiSpec(): Promise<void> {
  const appConfig: ApplicationConfig = {
    rest: {
      port: config.openApiSpec.port,
      host: config.openApiSpec.host,
    },
  };
  const outFile = process.argv[2] ?? '';
  const app = new LottoApiApplication(appConfig);
  await app.boot();
  await app.exportOpenApiSpec(outFile);
}

exportOpenApiSpec().catch(err => {
  console.error('Fail to export OpenAPI spec from the application.', err);
  process.exit(1);
});
