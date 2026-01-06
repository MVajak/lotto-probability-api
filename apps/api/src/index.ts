import {config} from '@lotto/shared';
import {type ApplicationConfig, LottoApiApplication} from './application';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new LottoApiApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/lotto-probability`);

  return app;
}

if (require.main === module) {
  const appConfig = {
    rest: {
      port: config.app.port,
      host: config.app.host,
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(appConfig).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
