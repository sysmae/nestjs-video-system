/**
 * 공통 응답 DTO (Data Transfer Object) 클래스들
 *
 * ===== 초보자를 위한 DTO 개념 설명 =====
 * DTO는 계층 간 데이터 전송을 위한 객체입니다.
 * - 클라이언트와 서버 간의 데이터 교환 규약을 정의
 * - 비즈니스 로직과 데이터 전송 로직을 분리
 * - API 문서 자동 생성을 위한 메타데이터 제공
 *
 * ===== 응답 DTO의 장점 =====
 * 1. 일관성: 모든 API가 동일한 구조로 응답
 * 2. 타입 안전성: TypeScript를 통한 컴파일 타임 검증
 * 3. 문서화: Swagger를 통한 자동 API 문서 생성
 * 4. 유지보수: 응답 구조 변경 시 중앙 관리 가능
 *
 * ===== 사용 패턴 =====
 * - 단일 객체 응답: UserResDto, VideoResDto 등
 * - 목록 응답: PageResDto<T> 사용
 * - 성공/실패 응답: HTTP 상태 코드와 함께 사용
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 응답을 위한 공통 DTO
 *
 * ===== 페이지네이션이란? =====
 * 대량의 데이터를 작은 단위로 나누어 전송하는 기법입니다.
 * - 네트워크 부하 감소
 * - 메모리 사용량 최적화
 * - 사용자 경험 향상 (빠른 초기 로딩)
 *
 * ===== 이 DTO의 설계 철학 =====
 * 제네릭 타입 <TData>를 사용하여 재사용성을 극대화합니다.
 * 한 번 정의하면 모든 엔티티 타입에 사용 가능합니다.
 *
 * ===== 실제 응답 예시 =====
 * ```json
 * // GET /api/videos?page=1&size=10 응답
 * {
 *   "page": 1,
 *   "size": 10,
 *   "items": [
 *     {
 *       "id": 1,
 *       "title": "NestJS 입문",
 *       "user": { "id": 1, "email": "user@example.com" }
 *     },
 *     // ... 9개 더
 *   ]
 * }
 * ```
 *
 * ===== 프론트엔드 사용 예시 =====
 * ```typescript
 * // React에서 사용
 * interface VideoListResponse extends PageResDto<VideoResDto> {}
 *
 * const fetchVideos = async (page: number): Promise<VideoListResponse> => {
 *   const response = await fetch(`/api/videos?page=${page}&size=10`);
 *   return response.json();
 * };
 *
 * // Vue.js에서 사용
 * const { data } = await $fetch<PageResDto<VideoResDto>>('/api/videos', {
 *   params: { page: 1, size: 10 }
 * });
 * ```
 *
 * ===== 학습 포인트 =====
 * 1. 제네릭 타입의 활용 방법
 * 2. API 응답 구조의 표준화
 * 3. 타입스크립트와 Swagger의 연동
 * 4. 재사용 가능한 컴포넌트 설계
 */
export class PageResDto<TData> {
  /**
   * 현재 페이지 번호 (1부터 시작)
   *
   * ===== 중요한 규칙 =====
   * - 항상 1부터 시작 (0-based 인덱스가 아님)
   * - 클라이언트가 요청한 페이지 번호를 그대로 반환
   * - 잘못된 페이지 번호 요청 시에도 요청값 그대로 반환
   *
   * ===== 프론트엔드 활용 예시 =====
   * ```typescript
   * // 페이지네이션 컴포넌트에서 사용
   * const currentPage = response.page; // 1, 2, 3...
   * const isFirstPage = currentPage === 1;
   * const prevPage = currentPage - 1;
   * const nextPage = currentPage + 1;
   * ```
   */
  @ApiProperty({
    required: true,
    description: '현재 페이지 번호 (1부터 시작)',
    example: 1,
    minimum: 1,
  })
  page: number;

  /**
   * 현재 페이지에 포함된 아이템 수
   *
   * ===== 주의사항 =====
   * - 요청한 size와 다를 수 있음 (특히 마지막 페이지)
   * - 실제 데이터베이스에서 조회된 결과의 개수
   * - 빈 페이지의 경우 0이 될 수 있음
   *
   * ===== 계산 로직 예시 =====
   * ```typescript
   * // 전체 100개 데이터, 페이지당 10개씩
   * // 1~9 페이지: size = 10
   * // 10 페이지: size = 10
   * // 11 페이지: size = 0 (데이터 없음)
   *
   * // 전체 95개 데이터, 페이지당 10개씩
   * // 1~9 페이지: size = 10
   * // 10 페이지: size = 5 (마지막 페이지)
   * ```
   *
   * ===== 프론트엔드 활용 =====
   * ```typescript
   * const hasNextPage = response.size === requestedSize;
   * const isEmpty = response.size === 0;
   * const isPartialPage = response.size < requestedSize && response.size > 0;
   * ```
   */
  @ApiProperty({
    required: true,
    description: '현재 페이지에 포함된 실제 아이템 수',
    example: 10,
    minimum: 0,
  })
  size: number;

  /**
   * 실제 데이터 배열
   *
   * ===== 제네릭 타입의 이해 =====
   * TData는 컴파일 타임에만 존재하는 타입 매개변수입니다.
   * - 런타임에는 존재하지 않음
   * - TypeScript 컴파일러가 타입 검사에만 사용
   * - 실제 JavaScript로 컴파일되면 사라짐
   *
   * ===== Swagger 문서화 전략 =====
   * @ApiProperty를 직접 사용하지 않는 이유:
   * 1. 제네릭 타입은 런타임에 인식 불가
   * 2. 각 컨트롤러에서 구체적인 타입으로 문서화
   * 3. @ApiResponse나 커스텀 데코레이터 활용
   *
   * ===== 사용 예시 =====
   * ```typescript
   * // 비디오 목록 응답
   * const videoList: PageResDto<VideoResDto> = {
   *   page: 1,
   *   size: 2,
   *   items: [
   *     { id: 1, title: "NestJS 기초", user: { id: 1, email: "user1@test.com" } },
   *     { id: 2, title: "TypeScript 심화", user: { id: 2, email: "user2@test.com" } }
   *   ]
   * };
   *
   * // 사용자 목록 응답
   * const userList: PageResDto<UserResDto> = {
   *   page: 1,
   *   size: 1,
   *   items: [
   *     { id: 1, email: "admin@test.com", role: "ADMIN" }
   *   ]
   * };
   * ```
   *
   * ===== 배열 조작 예시 =====
   * ```typescript
   * // 프론트엔드에서 데이터 처리
   * response.items.forEach(item => console.log(item.id));
   * const titles = response.items.map(video => video.title);
   * const firstItem = response.items[0];
   * const hasItems = response.items.length > 0;
   * ```
   */
  items: TData[];
}

/**
 * ===== 추가 학습 자료 =====
 *
 * 1. 페이지네이션 구현 패턴
 *    - Offset 기반 페이지네이션 (현재 구현)
 *    - Cursor 기반 페이지네이션 (대용량 데이터용)
 *    - 무한 스크롤 페이지네이션
 *
 * 2. 관련 파일들
 *    - src/common/dto/req.dto.ts: 요청 DTO (PageReqDto)
 *    - src/video/video.controller.ts: 실제 사용 예시
 *    - src/user/user.controller.ts: 다른 엔티티에서의 활용
 *
 * 3. 성능 최적화 팁
 *    ```typescript
 *    // BAD: N+1 쿼리 문제 발생 가능
 *    const videos = await videoRepository.find();
 *
 *    // GOOD: 관계 데이터를 한 번에 로드
 *    const videos = await videoRepository.find({
 *      relations: ['user'],
 *      take: size,
 *      skip: (page - 1) * size
 *    });
 *    ```
 *
 * 4. 프론트엔드 베스트 프랙티스
 *    ```typescript
 *    // 페이지네이션 상태 관리 (React 예시)
 *    const [currentPage, setCurrentPage] = useState(1);
 *    const [loading, setLoading] = useState(false);
 *    const [data, setData] = useState<PageResDto<VideoResDto>>();
 *
 *    const fetchPage = async (page: number) => {
 *      setLoading(true);
 *      try {
 *        const response = await api.get<PageResDto<VideoResDto>>('/videos', {
 *          params: { page, size: 10 }
 *        });
 *        setData(response.data);
 *        setCurrentPage(page);
 *      } finally {
 *        setLoading(false);
 *      }
 *    };
 *    ```
 *
 * 5. 테스트 작성 예시
 *    ```typescript
 *    describe('PageResDto', () => {
 *      it('should create valid pagination response', () => {
 *        const response: PageResDto<{ id: number }> = {
 *          page: 1,
 *          size: 2,
 *          items: [{ id: 1 }, { id: 2 }]
 *        };
 *
 *        expect(response.page).toBe(1);
 *        expect(response.size).toBe(2);
 *        expect(response.items).toHaveLength(2);
 *      });
 *    });
 *    ```
 *
 * ===== 실습 과제 =====
 * 1. 다른 엔티티(User, Comment 등)에 대한 페이지네이션 API 구현
 * 2. 검색 기능이 포함된 페이지네이션 구현
 * 3. 정렬 옵션이 포함된 페이지네이션 구현
 * 4. 무한 스크롤을 위한 cursor 기반 페이지네이션 구현
 */
