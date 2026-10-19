import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

export interface LoggerOptions {
  service: string;
  level: string;
  pretty: boolean;
}

/** Structured JSON logs with request ids; secrets are redacted. */
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: {
            level: options.level,
            base: { service: options.service },
            customProps: () => ({ service: options.service }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-internal-token"]',
                'req.headers["x-gateway-token"]',
                'res.headers["set-cookie"]',
                '*.password',
                '*.newPassword',
                '*.currentPassword',
                '*.refreshToken',
                '*.accessToken',
                '*.token',
                '*.code',
              ],
              censor: '[redacted]',
            },
            autoLogging: { ignore: (req) => req.url === '/health' },
            transport: options.pretty ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
          },
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}
