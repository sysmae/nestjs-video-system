/**
 * JWT 인증 전략 (Passport Strategy)
 * Passport를 통해 JWT 토큰의 유효성을 검증하고 사용자 정보를 추출합니다.
 * JwtAuthGuard에서 super.canActivate() 호출 시 이 전략이 실행됩니다.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Authorization 헤더의 Bearer 토큰에서 JWT를 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 만료된 토큰은 거부 (false: 만료 토큰 거부, true: 만료 토큰 허용)
      ignoreExpiration: false,

      // JWT 서명 검증에 사용할 비밀키
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  /**
   * JWT 토큰이 유효할 때 호출되는 검증 메서드
   * 이 메서드의 반환값이 request.user에 저장됩니다.
   *
   * @param payload JWT 페이로드 (디코딩된 토큰 내용)
   * @returns 사용자 정보 객체
   */
  async validate(payload: any) {
    // JWT의 'sub' 클레임에서 사용자 ID를 추출하여 반환
    // 이 객체가 @User() 데코레이터로 접근할 수 있는 사용자 정보가 됩니다
    return { id: payload.sub };
  }
}
