/**
 * 헬스 체크 컨트롤러
 * 애플리케이션과 연결된 서비스들의 상태를 확인하는 API를 제공합니다.
 * 로드 밸런서, 모니터링 도구, DevOps 팀이 서비스 상태를 확인할 때 사용합니다.
 */

import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('health') // '/health' 경로로 접근 가능
export class HealthController {
  constructor(
    private health: HealthCheckService, // 헬스 체크 서비스
    private db: TypeOrmHealthIndicator, // 데이터베이스 상태 확인 지시자
  ) {}

  /**
   * 전체 시스템 헬스 체크 엔드포인트
   * GET /health 요청으로 시스템 상태를 확인할 수 있습니다.
   *
   * 응답 예시:
   * {
   *   "status": "ok",
   *   "info": {
   *     "database": {
   *       "status": "up"
   *     }
   *   }
   * }
   */
  @Get()
  @HealthCheck() // Terminus 헬스 체크 데코레이터
  @Public() // 인증 없이 접근 가능 (모니터링 도구에서 사용)
  check() {
    return this.health.check([
      // 데이터베이스 연결 상태 확인
      // 'database'라는 이름으로 PostgreSQL 연결을 ping 테스트
      () => this.db.pingCheck('database'),
    ]);
  }
}
