import { Module } from '@nestjs/common'
import { ProgresoController } from './progreso.controller'

@Module({
  controllers: [ProgresoController],
})
export class ProgresoModule {}
