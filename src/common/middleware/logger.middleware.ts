/**
 * HTTP 요청과 응답을 로깅하는 미들웨어
 * 모든 HTTP 요청에 대해 메서드, URL, 상태코드, 클라이언트 정보 등을 로그로 기록합니다.
 */

import { Inject, Injectable, Logger, LoggerService, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}

  /**
   * 미들웨어 실행 메서드
   * 요청 정보를 수집하고 응답 완료 시 로그를 출력합니다.
   */
  use(request: Request, response: Response, next: NextFunction): void {
    // 요청 정보 추출
    const { ip, method, originalUrl: url } = request;
    const userAgent = request.get('user-agent') || '';

    // 응답 완료 시 로그 출력
    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      // 로그 형식: "GET /api/users 200 1234 - Mozilla/5.0... 127.0.0.1"
      this.logger.log(`${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`);
    });

    // 다음 미들웨어로 제어 전달
    next();
  }
}
