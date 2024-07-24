import { Module } from '@nestjs/common'

import { RedisService } from './redis.service'
import { EnvModule } from '@/infra/env/env.module'
import { CacheRepository } from '../cache-repository'
import { RedisCacheRepository } from './redis-cache-repository'

@Module({
  imports: [EnvModule],
  providers: [
    RedisService,
    {
      provide: CacheRepository,
      useClass: RedisCacheRepository,
    },
  ],
  exports: [CacheRepository],
})
export class CacheModule {}
