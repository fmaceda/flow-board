import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // makes PrismaService injectable everywhere without importing PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
