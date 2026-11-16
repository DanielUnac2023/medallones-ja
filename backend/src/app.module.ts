import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FirestoreModule } from './firebase/firebase.module'
import { CatalogoModule } from './modules/catalogo/catalogo.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsuariosModule } from './modules/usuarios/usuarios.module'
import { ProgresoModule } from './modules/progreso/progreso.module'
import { PruebasModule } from './modules/pruebas/pruebas.module'
import { InstructorModule } from './modules/instructor/instructor.module'
import { InscripcionesModule } from './modules/inscripciones/inscripciones.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirestoreModule,
    InscripcionesModule,
    AuthModule,
    UsuariosModule,
    ProgresoModule,
    PruebasModule,
    InstructorModule,
    CatalogoModule, // último: sus rutas catch-all de un segmento no deben capturar rutas específicas
  ],
})
export class AppModule {}
