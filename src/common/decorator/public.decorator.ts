/**
 * 공개 엔드포인트 데코레이터
 * @Public 데코레이터가 적용된 엔드포인트는 JWT 인증을 거치지 않습니다.
 * 회원가입, 로그인 등 인증이 필요하지 않은 API에 사용됩니다.
 */

import { SetMetadata } from '@nestjs/common';

// 메타데이터 키 - JwtAuthGuard에서 이 키로 공개 엔드포인트 여부를 확인
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 엔드포인트 데코레이터
 * 사용법: @Public()
 * 이 데코레이터가 적용된 엔드포인트는 JWT 인증을 건너뜁니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
