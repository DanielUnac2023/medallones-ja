import { Module } from '@nestjs/common'
import { CatalogoController } from './catalogo.controller'
import { FirestoreService } from './firestore.service'

@Module({
  controllers: [CatalogoController],
  providers: [FirestoreService],
})
export class CatalogoModule {}
