import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

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

  const config = new DocumentBuilder()
    .setTitle('CollabFlow API')
    .setDescription(
      'Collaborative software-engineering platform for final-year CS/SW student teams. It supports project creation, member onboarding, problem discovery, advisor review, requirements planning, sprint execution, task tracking, project history, and documentation generation.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'CollabFlow Project Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
