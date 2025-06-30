/**
 * 사용자 정보 추출 데코레이터
 * JWT 인증을 통과한 사용자의 정보를 컨트롤러 메서드에서 쉽게 접근할 수 있도록 합니다.
 * Passport JWT Strategy에서 request.user에 저장된 사용자 정보를 추출합니다.
 */

import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * 인증된 사용자 정보를 추출하는 매개변수 데코레이터
 * 사용법: @User() user: UserAfterAuth
 * JWT 토큰에서 추출된 사용자 정보를 반환합니다.
 */
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user; // Passport JWT Strategy에서 설정한 사용자 정보
});

/**
 * 인증 후 사용자 정보 인터페이스
 * JWT 토큰에서 추출되는 사용자 정보의 타입을 정의합니다.
 */
export interface UserAfterAuth {
  id: string; // 사용자 고유 식별자 (JWT sub 클레임에서 추출)
}
