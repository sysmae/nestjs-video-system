/**
 * Swagger API 문서화 도구 설정
 *
 * Swagger는 RESTful API를 시각적으로 문서화하고 테스트할 수 있는 도구입니다.
 * 이 설정은 개발 환경에서 API 문서에 접근할 때 사용할 인증 정보를 정의합니다.
 *
 * 보안상 운영 환경에서는 Swagger 접근을 제한하거나 비활성화하는 것이 좋습니다.
 *
 * 환경 변수:
 * - SWAGGER_USER: Swagger UI 접근을 위한 사용자명 (기본값: 'fastcampus')
 * - SWAGGER_PASSWORD: Swagger UI 접근을 위한 패스워드 (기본값: 'fastcampus')
 */

import { registerAs } from '@nestjs/config';

/**
 * Swagger 설정 객체를 생성하는 팩토리 함수
 * @nestjs/config의 registerAs를 사용하여 'swagger' 네임스페이스로 등록
 *
 * 사용 예시:
 * - ConfigService에서 this.configService.get('swagger.user') 형태로 접근
 * - 또는 @ConfigType(swaggerConfig) 데코레이터로 타입 안전하게 주입
 */
export default registerAs('swagger', async () => {
  return {
    // Swagger UI 기본 인증을 위한 사용자명
    user: process.env.SWAGGER_USER || 'fastcampus',
    // Swagger UI 기본 인증을 위한 패스워드
    password: process.env.SWAGGER_PASSWORD || 'fastcampus',
  };
});
