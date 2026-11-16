import { Global, Module } from '@nestjs/common'
import { InscripcionesService } from './inscripciones.service'

@Global()
@Module({
  providers: [InscripcionesService],
  exports: [InscripcionesService],
})
export class InscripcionesModule {}
