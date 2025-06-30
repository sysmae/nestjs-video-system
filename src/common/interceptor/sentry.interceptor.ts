/**
 * 에러 모니터링 및 알림을 위한 Sentry 인터셉터
 *
 * 이 인터셉터는 애플리케이션에서 발생하는 모든 에러를 자동으로 캐치하여
 * Sentry 에러 추적 서비스와 Slack으로 실시간 알림을 전송합니다.
 *
 * 주요 기능:
 * 1. 예외 발생 시 Sentry로 에러 정보 전송
 * 2. Slack 웹훅을 통한 실시간 에러 알림
 * 3. 에러 발생 URL 및 스택 트레이스 정보 포함
 *
 * 사용법:
 * - 전역적으로 적용하려면 main.ts에서 app.useGlobalInterceptors() 사용
 * - 특정 컨트롤러나 메서드에만 적용하려면 @UseInterceptors() 데코레이터 사용
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { IncomingWebhook } from '@slack/webhook';
import { Request as ExpressRequest } from 'express';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  /**
   * 요청/응답 처리 과정에서 발생하는 에러를 인터셉트합니다.
   *
   * @param context 실행 컨텍스트 (HTTP, WebSocket, RPC 등의 정보 포함)
   * @param next 다음 핸들러를 호출하는 CallHandler
   * @returns Observable - 에러 처리가 포함된 응답 스트림
   */
  intercept(context: ExecutionContext, next: CallHandler) {
    // HTTP 컨텍스트에서 요청 객체 추출
    const http = context.switchToHttp();
    const request = http.getRequest<ExpressRequest>();
    const { url } = request;

    // 다음 핸들러 실행 및 에러 처리 파이프라인 구성
    return next.handle().pipe(
      catchError((error) => {
        // 1. Sentry로 에러 전송 (자동 스택 트레이스 및 컨텍스트 포함)
        Sentry.captureException(error);

        // 2. Slack 웹훅을 통한 실시간 알림 전송
        const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
        webhook.send({
          attachments: [
            {
              text: 'NestJS 프로젝트 에러 발생',
              fields: [
                {
                  title: `Error message: ${error.response?.message || error.message}`,
                  value: `URL: ${url}\n${error.stack}`,
                  short: false,
                },
              ],
              // Unix 타임스탬프 (Slack에서 시간 표시용)
              ts: Math.floor(new Date().getTime() / 1000).toString(),
            },
          ],
        });

        // 3. 원본 에러를 다시 던져서 정상적인 에러 처리 플로우 유지
        throw error;
      }),
    );
  }
}
