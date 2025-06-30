/**
 * 헬스 체크 모듈
 * 애플리케이션의 상태를 모니터링하고 외부 서비스와의 연결 상태를 확인합니다.
 * 로드 밸런서나 모니터링 시스템에서 서비스 상태를 확인할 때 사용됩니다.
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule], // NestJS Terminus 헬스 체크 라이브러리
  controllers: [HealthController], // 헬스 체크 API 엔드포인트
})
export class HealthModule {}
