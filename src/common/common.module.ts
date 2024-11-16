import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { APP_LOGGER } from './constants';

@Global()
@Module({
  providers: [
    {
      provide: APP_LOGGER,
      useClass: AppLogger,
    },
  ],
  exports: [APP_LOGGER],
})
export class CommonModule {}
