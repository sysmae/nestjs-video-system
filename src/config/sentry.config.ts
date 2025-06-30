/**
 * Sentry 에러 모니터링 서비스 설정
 *
 * Sentry는 실시간 에러 추적 및 성능 모니터링 서비스입니다.
 * 애플리케이션에서 발생하는 예외, 에러, 성능 이슈를 자동으로 수집하고
 * 개발팀에게 알림을 제공하여 빠른 문제 해결을 도와줍니다.
 *
 * 주요 기능:
 * - 실시간 에러 및 예외 추적
 * - 에러 발생 빈도 및 영향도 분석
 * - 사용자 세션 재현 (Session Replay)
 * - 성능 모니터링 (APM)
 * - 팀 알림 및 이슈 관리
 *
 * 환경 변수:
 * - SENTRY_DSN: Sentry 프로젝트의 고유 식별자 URL
 *   (예: https://examplePublicKey@o0.ingest.sentry.io/0)
 */

import { registerAs } from '@nestjs/config';

/**
 * Sentry 설정 객체를 생성하는 팩토리 함수
 * @nestjs/config의 registerAs를 사용하여 'sentry' 네임스페이스로 등록
 *
 * DSN(Data Source Name)은 Sentry에서 제공하는 고유한 엔드포인트 URL로,
 * 애플리케이션에서 발생한 에러 데이터를 올바른 Sentry 프로젝트로 전송하기 위해 필요합니다.
 *
 * 사용 예시:
 * - main.ts에서 Sentry.init({ dsn: configService.get('sentry.dsn') })
 * - SentryInterceptor에서 자동으로 에러 전송
 */
export default registerAs('sentry', () => ({
  // Sentry 프로젝트의 고유 DSN (Data Source Name)
  dsn: process.env.SENTRY_DSN,
}));
