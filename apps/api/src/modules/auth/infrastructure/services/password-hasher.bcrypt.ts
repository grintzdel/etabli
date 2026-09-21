import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'

import type { IPasswordHasher } from '../../domain/services/password-hasher.interface.ts'

const COST = 10

@Injectable()
export class PasswordHasherBcrypt implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return hash(plain, COST)
  }

  async verify(plain: string, digest: string): Promise<boolean> {
    return compare(plain, digest)
  }
}
