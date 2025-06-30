/**
 * 응답 데이터를 표준 형식으로 변환하는 인터셉터
 * 배열 응답의 경우 페이지네이션 정보를 추가하여 표준화된 형태로 변환합니다.
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T, R> implements NestInterceptor<T, R> {
  /**
   * 인터셉터 실행 메서드
   * 응답 데이터를 가로채서 표준 형식으로 변환합니다.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<R> {
    return next.handle().pipe(
      map((data) => {
        const http = context.switchToHttp();
        const request = http.getRequest<ExpressRequest>();

        // 배열 응답인 경우 페이지네이션 정보를 포함한 객체로 변환
        if (Array.isArray(data)) {
          return {
            items: data, // 실제 데이터 배열
            page: Number(request.query['page'] || 1), // 현재 페이지 번호
            size: Number(request.query['size'] || 20), // 페이지 크기
          };
        } else {
          // 단일 객체 응답인 경우 그대로 반환
          return data;
        }
      }),
    );
  }
}
