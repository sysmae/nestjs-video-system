/**
 * NestJS 애플리케이션의 진입점(Entry Point) 파일
 * 서버 설정, 미들웨어, 인터셉터 등을 구성하고 애플리케이션을 시작합니다.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import * as Sentry from '@sentry/node';
import { SentryInterceptor } from './common/interceptor/sentry.interceptor';

/**
 * 애플리케이션 부트스트랩 함수
 * 서버를 시작하고 필요한 설정들을 적용합니다.
 */
async function bootstrap() {
  // 서버가 실행될 포트 번호 설정
  const port = 3000;

  /**
   * NestJS 애플리케이션 인스턴스 생성
   * Winston 로거를 사용하여 콘솔에 로그를 출력합니다.
   * 운영환경(prod)에서는 info 레벨, 개발환경에서는 debug 레벨의 로그를 출력합니다.
   */
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.STAGE === 'prod' ? 'info' : 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('NestJS', { prettyPrint: true }),
          ),
        }),
      ],
    }),
  });

  // 환경 설정 서비스 인스턴스를 가져옵니다
  const configService = app.get(ConfigService);
  const stage = configService.get('STAGE');

  // Swagger API 문서 설정
  // local, dev 환경에서만 Swagger 문서를 제공합니다
  const SWAGGER_ENVS = ['local', 'dev'];
  if (SWAGGER_ENVS.includes(stage)) {
    // Swagger 문서에 기본 인증(Basic Auth)을 적용합니다
    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [configService.get('swagger.user')]: configService.get('swagger.password'),
        },
      }),
    );

    // Swagger 문서 설정을 구성합니다
    const config = new DocumentBuilder()
      .setTitle('NestJS project')
      .setDescription('NestJS project API description')
      .setVersion('1.0')
      .addBearerAuth() // JWT 토큰 인증을 위한 Bearer Auth 추가
      .build();
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        // Swagger UI에서 인증 정보를 지속적으로 유지합니다
        persistAuthorization: true,
      },
    };
    // Swagger 문서를 생성하고 '/docs' 경로에 설정합니다
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, customOptions);
  }

  /**
   * ValidationPipe를 전역적으로 적용
   * 들어오는 요청 데이터를 자동으로 검증하고 변환합니다
   */
  app.useGlobalPipes(
    new ValidationPipe({
      // class-transformer를 적용하여 DTO 객체로 자동 변환
      transform: true,
    }),
  );

  /**
   * Sentry 에러 추적 서비스 초기화
   * 애플리케이션에서 발생하는 에러를 Sentry로 전송합니다
   */
  Sentry.init({ dsn: configService.get('sentry.dsn') });

  /**
   * 글로벌 인터셉터 적용
   * - SentryInterceptor: 에러를 Sentry로 전송
   * - TransformInterceptor: 응답 데이터를 표준 형식으로 변환
   */
  app.useGlobalInterceptors(new SentryInterceptor(), new TransformInterceptor());

  // 지정된 포트에서 서버를 시작합니다
  await app.listen(port);
  Logger.log(`stage: ${stage}`);
  Logger.log(`listening port: ${port}`);
}

// 애플리케이션을 시작합니다
bootstrap();
