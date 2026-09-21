import { Module } from '@nestjs/common'

import { ConfigModule } from '../../../infrastructure/config/config.module.ts'
import { PASSWORD_HASHER } from '../domain/services/password-hasher.token.ts'
import { TOKEN_ISSUER } from '../domain/services/token-issuer.token.ts'
import { PasswordHasherBcrypt } from './services/password-hasher.bcrypt.ts'
import { TokenIssuerJose } from './services/token-issuer.jose.ts'

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: PASSWORD_HASHER, useClass: PasswordHasherBcrypt },
    { provide: TOKEN_ISSUER, useClass: TokenIssuerJose },
  ],
  exports: [PASSWORD_HASHER, TOKEN_ISSUER],
})
export class AuthInfrastructureModule {}
