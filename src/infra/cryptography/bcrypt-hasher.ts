import { compare, hash } from 'bcryptjs'
import { Injectable } from '@nestjs/common'

import { HashComparer } from '@/domain/forum/application/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/forum/application/cryptography/hash-generator'

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_ROUNDS = 8

  hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_ROUNDS)
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}
