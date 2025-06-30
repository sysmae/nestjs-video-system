/**
 * 응답 데이터를 표준 형식으로 변환하는 인터셉터
 *
 * ===== 🚀 초보자를 위한 인터셉터 개념 설명 =====
 *
 * **인터셉터란?**
 * - 요청/응답 사이클을 가로채서 추가 로직을 수행하는 컴포넌트
 * - AOP(Aspect-Oriented Programming) 패턴의 구현체
 * - 컨트롤러 실행 전후에 공통 로직을 적용할 수 있음
 *
 * **NestJS 인터셉터의 특징:**
 * 1. RxJS Observable 기반으로 작동
 * 2. 비동기 처리와 스트림 변환 지원
 * 3. 전역, 컨트롤러, 메서드 레벨에서 적용 가능
 * 4. 응답 데이터 변환, 로깅, 캐싱 등에 활용
 *
 * ===== 🎯 이 인터셉터의 목적 =====
 * - 배열 응답을 페이지네이션 형태로 자동 변환
 * - API 응답 구조의 일관성 확보
 * - 프론트엔드에서 예측 가능한 응답 형태 제공
 *
 * **변환 규칙:**
 * ```typescript
 * // 입력: [item1, item2, item3]
 * // 출력: { items: [item1, item2, item3], page: 1, size: 20 }
 *
 * // 입력: { id: 1, name: "user" }
 * // 출력: { id: 1, name: "user" } (그대로 유지)
 * ```
 *
 * ===== 🔧 RxJS와 Observable 패턴 이해 =====
 *
 * **Observable이란?**
 * - 비동기 데이터 스트림을 다루는 라이브러리
 * - Promise의 확장된 형태로 여러 값을 다룰 수 있음
 * - 함수형 프로그래밍 패러다임 지원
 *
 * **파이프와 오퍼레이터:**
 * ```typescript
 * observable
 *   .pipe(           // 파이프: 여러 오퍼레이터를 연결
 *     map(data => transform(data)),    // map: 데이터 변환
 *     filter(data => data.isValid),    // filter: 조건부 필터링
 *     catchError(err => handleError)   // catchError: 에러 처리
 *   )
 *   .subscribe(result => console.log(result));
 * ```
 *
 * ===== 📋 ExecutionContext 이해 =====
 *
 * **ExecutionContext란?**
 * - 현재 실행 중인 컨텍스트 정보를 제공하는 객체
 * - HTTP, WebSocket, GraphQL 등 다양한 컨텍스트 지원
 * - 요청 정보, 응답 정보, 메타데이터 접근 가능
 *
 * **주요 메서드들:**
 * ```typescript
 * context.switchToHttp()           // HTTP 컨텍스트로 전환
 * context.getRequest()             // 요청 객체 가져오기
 * context.getResponse()            // 응답 객체 가져오기
 * context.getHandler()             // 핸들러 함수 참조
 * context.getClass()               // 컨트롤러 클래스 참조
 * ```
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 응답 데이터 변환 인터셉터 클래스
 *
 * ===== 🎯 클래스 구조 분석 =====
 *
 * **제네릭 타입 <T, R>:**
 * - T: 입력 데이터 타입 (컨트롤러에서 반환하는 원본 데이터)
 * - R: 출력 데이터 타입 (클라이언트가 받게 되는 변환된 데이터)
 * - 타입 안전성을 보장하면서도 유연한 데이터 변환 지원
 *
 * **@Injectable() 데코레이터:**
 * - NestJS 의존성 주입 시스템에 등록
 * - 싱글톤 패턴으로 관리됨
 * - 다른 서비스나 컴포넌트에서 주입 가능
 *
 * **NestInterceptor<T, R> 인터페이스:**
 * - NestJS가 제공하는 인터셉터 표준 인터페이스
 * - intercept() 메서드 구현 강제
 * - 타입 안전성과 일관된 인터페이스 보장
 *
 * ===== 💡 실제 사용 시나리오 =====
 * ```typescript
 * // 컨트롤러에서 배열 반환
 * @Get()
 * async findAll(): Promise<Video[]> {
 *   return [
 *     { id: 1, title: "Video 1" },
 *     { id: 2, title: "Video 2" }
 *   ];
 * }
 *
 * // 인터셉터가 자동으로 변환
 * // 클라이언트가 받는 실제 응답:
 * {
 *   "items": [
 *     { "id": 1, "title": "Video 1" },
 *     { "id": 2, "title": "Video 2" }
 *   ],
 *   "page": 1,
 *   "size": 20
 * }
 * ```
 */
@Injectable()
export class TransformInterceptor<T, R> implements NestInterceptor<T, R> {
  /**
   * 인터셉터 실행 메서드 - 핵심 로직
   *
   * ===== 🔍 메서드 파라미터 분석 =====
   *
   * **context: ExecutionContext**
   * - 현재 실행 컨텍스트 정보 제공
   * - HTTP 요청/응답 객체 접근 가능
   * - 메타데이터와 핸들러 정보 포함
   *
   * **next: CallHandler**
   * - 다음 단계(컨트롤러 메서드) 실행을 담당
   * - handle() 메서드로 실제 비즈니스 로직 호출
   * - Observable<T> 타입의 결과 반환
   *
   * ===== 🚀 실행 플로우 =====
   * 1. 컨텍스트에서 HTTP 요청 정보 추출
   * 2. next.handle()로 컨트롤러 메서드 실행
   * 3. 반환된 Observable을 pipe()로 변환 파이프라인 구성
   * 4. map() 오퍼레이터로 응답 데이터 변환
   * 5. 변환된 결과를 Observable<R>로 반환
   *
   * ===== 💡 RxJS 파이프라인 이해 =====
   * ```typescript
   * // 순서대로 실행되는 변환 파이프라인
   * return next.handle()                    // 1. 컨트롤러 실행
   *   .pipe(                               // 2. 파이프라인 시작
   *     map(data => transform(data)),       // 3. 데이터 변환
   *     // 필요시 추가 오퍼레이터 체이닝 가능
   *     // tap(data => console.log(data)),   // 디버깅용
   *     // catchError(err => handleError),   // 에러 처리
   *   );                                   // 4. 최종 Observable 반환
   * ```
   *
   * @param context 실행 컨텍스트 (요청/응답 정보 포함)
   * @param next 다음 핸들러 (컨트롤러 메서드 실행기)
   * @returns 변환된 응답 데이터를 담은 Observable
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<R> {
    return next.handle().pipe(
      map((data) => {
        // 🌐 HTTP 컨텍스트로 전환하여 요청/응답 객체 접근
        const http = context.switchToHttp();
        // 📥 Express 요청 객체 가져오기 (타입 안전성을 위해 명시적 타입 지정)
        const request = http.getRequest<ExpressRequest>();

        // 🔍 배열 응답 감지 및 페이지네이션 변환 로직
        if (Array.isArray(data)) {
          // ===== 📋 페이지네이션 객체 생성 =====
          return {
            items: data, // 📚 실제 데이터 배열 (원본 유지)

            // 📄 페이지 번호 추출 및 검증
            // query['page']: 문자열이므로 Number()로 숫자 변환
            // || 1: 값이 없거나 유효하지 않으면 기본값 1 사용
            page: Number(request.query['page'] || 1),

            // 📊 페이지 크기 추출 및 검증
            // 기본값 20: 일반적인 페이지네이션 크기
            // 실제로는 data.length와 다를 수 있음 (마지막 페이지의 경우)
            size: Number(request.query['size'] || 20),
          };
        } else {
          // 🔄 단일 객체 응답인 경우 원본 데이터 그대로 반환
          // 변환 없이 투명하게 전달 (pass-through)
          return data;
        }
      }),
    );
  }
}

/**
 * ===== 🎓 종합 학습 가이드 =====
 *
 * **1. 인터셉터 등록 방법들**
 * ```typescript
 * // 전역 인터셉터 (모든 API에 적용)
 * // main.ts에서
 * app.useGlobalInterceptors(new TransformInterceptor());
 *
 * // 컨트롤러 레벨 인터셉터
 * @Controller('videos')
 * @UseInterceptors(TransformInterceptor)
 * export class VideoController {}
 *
 * // 메서드 레벨 인터셉터
 * @Get()
 * @UseInterceptors(TransformInterceptor)
 * async findAll() {}
 * ```
 *
 * **2. 다양한 응답 변환 시나리오**
 * ```typescript
 * // 시나리오 1: 빈 배열 응답
 * // 입력: []
 * // 출력: { items: [], page: 1, size: 20 }
 *
 * // 시나리오 2: 단일 객체 응답
 * // 입력: { id: 1, name: "John" }
 * // 출력: { id: 1, name: "John" } (변환 없음)
 *
 * // 시나리오 3: 복잡한 객체 배열
 * // 입력: [{ id: 1, user: { name: "John" } }]
 * // 출력: { items: [{ id: 1, user: { name: "John" } }], page: 1, size: 20 }
 * ```
 *
 * **3. 쿼리 파라미터 처리 상세**
 * ```typescript
 * // URL: /api/videos?page=2&size=5&search=nest
 * request.query = {
 *   page: "2",      // 문자열!
 *   size: "5",      // 문자열!
 *   search: "nest"  // 변환 로직에서 무시됨
 * }
 *
 * // 변환 결과
 * {
 *   items: [...],
 *   page: 2,        // Number()로 변환됨
 *   size: 5         // Number()로 변환됨
 * }
 * ```
 *
 * **4. 고급 RxJS 패턴 활용**
 * ```typescript
 * // 확장된 인터셉터 예시
 * intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 *   const startTime = Date.now();
 *
 *   return next.handle().pipe(
 *     map(data => this.transformData(data, context)),      // 데이터 변환
 *     tap(result => this.logResponse(result, startTime)),  // 로깅 (부수 효과)
 *     catchError(err => this.handleError(err)),            // 에러 처리
 *     timeout(5000),                                       // 타임아웃 설정
 *   );
 * }
 * ```
 *
 * **5. 타입 안전성 강화 방법**
 * ```typescript
 * // 더 엄격한 타입 정의
 * interface PaginatedResponse<T> {
 *   items: T[];
 *   page: number;
 *   size: number;
 * }
 *
 * export class TypedTransformInterceptor<T> implements NestInterceptor<T[], PaginatedResponse<T>> {
 *   intercept(context: ExecutionContext, next: CallHandler<T[]>): Observable<PaginatedResponse<T>> {
 *     // 구현...
 *   }
 * }
 * ```
 *
 * **6. 성능 최적화 고려사항**
 * ```typescript
 * // ❌ 피해야 할 패턴
 * if (Array.isArray(data) && data.length > 1000) {
 *   // 대용량 배열 처리 시 메모리 이슈 발생 가능
 * }
 *
 * // ✅ 권장 패턴
 * // 데이터베이스 레벨에서 페이지네이션 처리
 * // 인터셉터는 단순히 메타데이터만 추가
 * ```
 *
 * **7. 테스트 작성 방법**
 * ```typescript
 * describe('TransformInterceptor', () => {
 *   let interceptor: TransformInterceptor<any, any>;
 *   let mockContext: ExecutionContext;
 *   let mockCallHandler: CallHandler;
 *
 *   beforeEach(() => {
 *     interceptor = new TransformInterceptor();
 *     // Mock 객체 설정...
 *   });
 *
 *   it('should transform array response to paginated format', (done) => {
 *     const testData = [{ id: 1 }, { id: 2 }];
 *     mockCallHandler.handle.mockReturnValue(of(testData));
 *
 *     interceptor.intercept(mockContext, mockCallHandler).subscribe(result => {
 *       expect(result).toEqual({
 *         items: testData,
 *         page: 1,
 *         size: 20
 *       });
 *       done();
 *     });
 *   });
 * });
 * ```
 */

/**
 * ===== 🚀 실습 과제 =====
 *
 * **초급 과제:**
 * 1. 인터셉터를 특정 컨트롤러에만 적용해보기
 * 2. 로깅 기능을 추가한 인터셉터 만들기
 * 3. 응답 시간을 측정하는 인터셉터 구현
 *
 * **중급 과제:**
 * 1. 에러 응답을 표준화하는 인터셉터 작성
 * 2. 캐싱 기능이 포함된 인터셉터 구현
 * 3. 다국어 지원을 위한 응답 변환 인터셉터
 *
 * **고급 과제:**
 * 1. GraphQL과 REST API를 모두 지원하는 범용 인터셉터
 * 2. 스트림 데이터 처리를 위한 고성능 인터셉터
 * 3. 마이크로서비스 간 통신을 위한 메시지 변환 인터셉터
 *
 * **실무 과제:**
 * 1. A/B 테스트를 위한 응답 분기 인터셉터
 * 2. API 버전별 응답 포맷 관리 인터셉터
 * 3. 실시간 모니터링을 위한 메트릭 수집 인터셉터
 */

/**
 * ===== 📚 관련 학습 자료 =====
 *
 * **관련 파일들:**
 * - src/common/dto/res.dto.ts: 응답 DTO 구조
 * - src/common/interceptor/sentry.interceptor.ts: 에러 추적 인터셉터
 * - src/app.module.ts: 전역 인터셉터 등록
 * - src/main.ts: 애플리케이션 설정
 *
 * **핵심 개념:**
 * - AOP (Aspect-Oriented Programming)
 * - RxJS Observable과 오퍼레이터
 * - NestJS 실행 컨텍스트
 * - 의존성 주입 패턴
 *
 * **추천 학습 순서:**
 * 1. RxJS 기초 학습
 * 2. NestJS 라이프사이클 이해
 * 3. 인터셉터 기본 사용법
 * 4. 고급 RxJS 오퍼레이터 활용
 * 5. 성능 최적화와 테스트 작성
 */
