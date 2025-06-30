/**
 * 프록시 환경에서 작동하는 커스텀 Rate Limiting Guard
 *
 * 일반적인 웹 애플리케이션은 로드 밸런서나 리버스 프록시(예: Nginx, CloudFlare) 뒤에서 실행됩니다.
 * 이런 환경에서는 실제 클라이언트 IP가 아닌 프록시 서버의 IP가 전달되어
 * Rate Limiting이 제대로 작동하지 않을 수 있습니다.
 *
 * 이 Guard는 프록시 서버가 전달하는 원본 클라이언트 IP를 올바르게 추출하여
 * 각 클라이언트별로 정확한 Rate Limiting을 적용합니다.
 */

import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * 클라이언트를 식별하기 위한 고유 키(IP 주소)를 추출합니다.
   *
   * 프록시 환경에서는 다음과 같은 헤더들을 통해 원본 IP가 전달됩니다:
   * - X-Forwarded-For: 클라이언트와 프록시들의 IP 체인
   * - X-Real-IP: 실제 클라이언트 IP
   *
   * Express.js는 이런 헤더들을 파싱하여 req.ips 배열에 저장합니다.
   * 첫 번째 IP가 가장 원본에 가까운 클라이언트 IP입니다.
   *
   * @param req Express 요청 객체
   * @returns 클라이언트를 식별할 수 있는 IP 주소 문자열
   */
  protected getTracker(req: Record<string, any>): string {
    // req.ips 배열이 존재하고 비어있지 않으면 첫 번째 IP 사용 (원본 클라이언트)
    // 그렇지 않으면 직접 연결된 IP 사용 (프록시가 없는 환경)
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
