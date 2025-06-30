/**
 * JWT 인증 가드
 * 모든 보호된 라우트에서 JWT 토큰을 검증하고 사용자 인증을 처리합니다.
 * @Public 데코레이터가 있는 엔드포인트는 인증을 건너뜁니다.
 * 권한(Role) 기반 접근 제어도 함께 처리합니다.
 */

import { ExecutionContext, Inject, Injectable, Logger, LoggerService, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { ROLES_KEY } from 'src/common/decorator/role.decorator';
import { Role } from 'src/user/enum/user.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector, // 메타데이터를 읽기 위한 서비스
    private jwtService: JwtService, // JWT 토큰 처리 서비스
    private userService: UserService, // 사용자 정보 조회 서비스
    @Inject(Logger) private logger: LoggerService, // 로깅 서비스
  ) {
    super(); // Passport AuthGuard 초기화
  }

  /**
   * 요청이 인증된 사용자인지 확인하는 메서드
   * 1. @Public 데코레이터가 있으면 인증 생략
   * 2. Authorization 헤더에서 JWT 토큰 추출 및 검증
   * 3. 토큰 타입 확인 (access vs refresh)
   * 4. 권한(Role) 기반 접근 제어
   *
   * @param context 실행 컨텍스트 (요청 정보 포함)
   * @returns 인증 성공 여부
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 1. @Public 데코레이터가 적용된 엔드포인트인지 확인
    // 핸들러(메서드)와 클래스 모두에서 메타데이터를 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 메서드 레벨 데코레이터
      context.getClass(), // 클래스 레벨 데코레이터
    ]);

    // 공개 엔드포인트라면 인증 없이 통과
    if (isPublic) {
      return true;
    }

    // 2. HTTP 요청 객체에서 인증 정보 추출
    const http = context.switchToHttp();
    const { url, headers } = http.getRequest<Request>();

    // 3. Authorization 헤더 검증
    const authorization = headers['authorization'];
    if (!authorization) throw new UnauthorizedException('Authorization 헤더가 필요합니다.');
    if (!authorization.includes('Bearer')) throw new UnauthorizedException('Bearer 토큰이 필요합니다.');

    // 4. Bearer 토큰에서 실제 JWT 토큰 추출
    const token = /Bearer\s(.+)/.exec(authorization)[1];
    if (!token) throw new UnauthorizedException('accessToken이 필요합니다.');

    // 5. JWT 토큰 디코딩 (검증 없이 페이로드만 추출)
    const decoded = this.jwtService.decode(token);

    // 6. 토큰 타입 검증 (refresh 토큰은 /api/auth/refresh에서만 사용 가능)
    if (url !== '/api/auth/refresh' && decoded['tokenType'] === 'refresh') {
      const error = new UnauthorizedException('accessToken이 필요합니다.');
      this.logger.error(error.message, error.stack);
      throw error;
    }

    // 7. 권한(Role) 기반 접근 제어 확인
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 특정 권한이 필요한 엔드포인트인 경우 관리자 권한 확인
    if (requiredRoles) {
      const userId = decoded['sub']; // JWT에서 사용자 ID 추출
      return this.userService.checkUserIsAdmin(userId);
    }

    // 8. 기본 JWT 인증 로직 실행 (Passport Strategy 사용)
    return super.canActivate(context);
  }
}
