import { Injectable } from '@nestjs/common'

import { RedisService } from './redis.service'
import { CacheRepository } from '../cache-repository'

@Injectable()
export class RedisCacheRepository implements CacheRepository {
  constructor(private redis: RedisService) {}

  async set(key: string, value: string) {
    await this.redis.set(key, value, 'EX', 60 * 15)
  }

  async get(key: string) {
    return await this.redis.get(key)
  }

  async delete(key: string) {
    await this.redis.del(key)
  }
}
