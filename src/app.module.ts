/**
 * 애플리케이션의 루트 모듈
 * 모든 모듈과 설정을 통합하고 관리하는 메인 모듈입니다.
 */

import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import postgresConfig from './config/postgres.config';
import jwtConfig from './config/jwt.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import swaggerConfig from './config/swagger.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import sentryConfig from './config/sentry.config';
import emailConfig from './config/email.config';

@Module({
  imports: [
    // API 요청 속도 제한 설정 (Rate Limiting)
    // 60초 동안 최대 20개의 요청만 허용합니다
    ThrottlerModule.forRoot({
      ttl: 60, // 시간 윈도우 (초)
      limit: 20, // 최대 요청 수
    }),

    // 환경 설정 모듈 - 전역적으로 사용 가능하도록 설정
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 사용 가능
      load: [postgresConfig, jwtConfig, swaggerConfig, sentryConfig, emailConfig],
    }),

    // TypeORM 데이터베이스 연결 설정
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // 기본 PostgreSQL 데이터베이스 연결 설정
        let obj: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get('postgres.host'),
          port: configService.get('postgres.port'),
          database: configService.get('postgres.database'),
          username: configService.get('postgres.username'),
          password: configService.get('postgres.password'),
          autoLoadEntities: true, // 엔티티를 자동으로 로드
          synchronize: false, // 운영환경에서는 false로 설정 (마이그레이션 사용)
        };

        // 주의! local 환경에서만 개발 편의성을 위해 SQL 로깅을 활성화
        if (configService.get('STAGE') === 'local') {
          obj = Object.assign(obj, {
            logging: true, // SQL 쿼리를 콘솔에 출력
          });
        }
        return obj;
      },
    }),

    // 기능별 모듈들을 가져옵니다
    AuthModule, // 인증 관련 기능
    UserModule, // 사용자 관리 기능
    VideoModule, // 비디오 관리 기능
    AnalyticsModule, // 분석 기능
    HealthModule, // 헬스 체크 기능
    EmailModule, // 이메일 서비스 기능
  ],
  providers: [Logger], // 로거 프로바이더
})
export class AppModule implements NestModule {
  /**
   * 미들웨어를 설정합니다
   * 모든 경로('*')에 LoggerMiddleware를 적용하여 요청/응답을 로깅합니다
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
