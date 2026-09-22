import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export const swaggerConfig = () =>
  new DocumentBuilder()
    .setTitle('Établi API')
    .setDescription(
      'Réseau d’ateliers partagés : habilitations machine, réservation de créneaux, pointage par QR code.'
    )
    .setVersion('2.0.0')
    .addBearerAuth()
    .build()

export const mountSwagger = (app: INestApplication): void => {
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swaggerConfig()))
}
