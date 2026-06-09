import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { ClassSerializerInterceptor } from '@nestjs/common/serializer/class-serializer.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix - all routes are /api/v1/...
  app.setGlobalPrefix('api/v1');

  // CORS - explicit origin, not '*'
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  // whitelist: strips properties not in the DTO
  // forbidNonWhitelisted: throws an error if non-whitelisted properties are present
  // transform: automatically transforms payloads to DTO instances,
  //            also enables implicit type conversion (e.g., "123" -> 123 for @IsInt())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Auto-serialize response objects (respects @Exclude decorators on entities)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger - available at /api/docs
  const config = new DocumentBuilder()
    .setTitle('Flow Board API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API is running at http://localhost:${port}/api/v1`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
