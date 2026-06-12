import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse HttpOnly cookies (required for refresh token)
  app.use(cookieParser());

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

  // Consistent response envelope: { success: true, data: ... }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Consistent error envelope: { success: false, error: { code, message } }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger - available at /api/docs
  const config = new DocumentBuilder()
    .setTitle('Flow Board API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      // Required so the browser sends cookies (refresh_token) with Swagger requests
      withCredentials: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API is running at http://localhost:${port}/api/v1`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
