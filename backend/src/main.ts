import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  app.enableCors({ origin: origins.length ? origins : true })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  await app.listen(Number(process.env.PORT) ?? 3000)
  console.log(`CLUBESTJA backend en http://localhost:${Number(process.env.PORT) ?? 3000}/api`)
}
void bootstrap()
