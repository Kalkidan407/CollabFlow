import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { AppModule } from './app.module.js';

// This is the NestJS app bootstrap method.
// It is async because app creation and startup steps are asynchronous in Node.js,
// just like a Spring Boot main method starts the application context.
// We must wait for the app to be created before we configure filters, pipes, docs, and listen.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter: catches errors from all controllers and returns a consistent JSON response.
  app.useGlobalFilters(new AllExceptionsFilter());

  // ValidationPipe checks request DTOs automatically.
  // This is similar to Spring Boot validation with @Valid and Bean Validation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const message = errors
          .map((error) =>
            Object.values(error.constraints ?? {}).join(', '),
          )
          .filter(Boolean)
          .join(', ');

        return new BadRequestException({
          statusCode: 400,
          message: message || 'Validation failed',
          error: 'Validation Error',
          details: errors.map((error) => ({
            property: error.property,
            value: error.value,
            constraints: error.constraints,
          })),
        });
      },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger configuration lives here.
  // In Spring Boot, you usually configure OpenAPI/Swagger in a config class.
  // In NestJS, this is done in the bootstrap file with DocumentBuilder + SwaggerModule.
  const config = new DocumentBuilder()
    .setTitle('Who Would…? API')
    .setDescription(
      'Public room-based game API. Users join a room using a room code and a display name; no login or registration is required.',
    )
    .setVersion('1.0')
    .build();

  // Generate the OpenAPI document from the NestJS app metadata and route decorators.
  const document = SwaggerModule.createDocument(app, config);

  // Expose the Swagger UI at /docs.
  // This is the NestJS equivalent of a Springdoc /swagger-ui/index.html endpoint.
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Who Would…? API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start the HTTP server after all configuration is ready.
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
