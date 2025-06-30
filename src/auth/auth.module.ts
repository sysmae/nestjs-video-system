/**
 * 인증(Authentication) 모듈
 * JWT 기반의 사용자 인증 시스템을 제공합니다.
 * 회원가입, 로그인, 토큰 갱신, 권한 기반 접근 제어 등의 기능을 포함합니다.
 * 전역 가드를 통해 모든 엔드포인트에 기본적으로 JWT 인증을 적용합니다.
 */

import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh-token.entity';

@Module({
  imports: [
    UserModule, // 사용자 정보 조회를 위한 모듈
    PassportModule, // Passport 인증 전략 지원

    // JWT 모듈을 비동기적으로 설정 (환경 변수 사용)
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          global: true, // 전역적으로 사용 가능하도록 설정
          secret: configService.get('jwt.secret'), // JWT 서명용 비밀키
          signOptions: { expiresIn: '1d' }, // 기본 토큰 만료 시간 (1일)
        };
      },
    }),

    TypeOrmModule.forFeature([RefreshToken]), // RefreshToken 엔티티 등록
  ],
  providers: [
    AuthService, // 인증 비즈니스 로직 서비스
    JwtStrategy, // JWT 인증 전략 (Passport)

    // JwtAuthGuard를 전역 가드로 등록
    // 모든 엔드포인트에 기본적으로 JWT 인증이 적용됩니다
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    Logger, // 로깅 서비스
  ],
  controllers: [AuthController], // 인증 관련 API 엔드포인트
  exports: [AuthService], // 다른 모듈에서 AuthService를 사용할 수 있도록 내보내기
})
export class AuthModule {}
