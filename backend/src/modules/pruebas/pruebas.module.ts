import { Module } from '@nestjs/common'
import { PruebasController } from './pruebas.controller'

@Module({
  controllers: [PruebasController],
})
export class PruebasModule {}
