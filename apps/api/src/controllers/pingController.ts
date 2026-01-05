import {get} from '@loopback/rest';

export class PingController {
  @get('/ping', {
    responses: {
      '200': {
        description: 'Ping Response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {type: 'string'},
                timestamp: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  ping(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
