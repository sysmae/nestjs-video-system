/**
 * Swagger API 문서화를 위한 커스텀 데코레이터 모음
 *
 * ===== 🚀 초보자를 위한 Swagger/OpenAPI 개념 설명 =====
 *
 * **Swagger란?**
 * - REST API를 문서화하고 테스트할 수 있는 도구
 * - API의 엔드포인트, 요청/응답 구조, 파라미터를 시각적으로 표현
 * - 개발자와 클라이언트 간의 소통을 원활하게 함
 *
 * **OpenAPI Specification이란?**
 * - REST API를 기술하기 위한 표준 규격 (구 Swagger Specification)
 * - JSON/YAML 형식으로 API 명세를 정의
 * - 언어에 독립적인 API 문서화 표준
 *
 * **NestJS에서 Swagger 통합의 장점:**
 * 1. 자동 문서 생성: 코드 변경 시 문서도 자동 업데이트
 * 2. 타입 안전성: TypeScript 타입과 API 스키마 동기화
 * 3. API 테스트: Swagger UI에서 직접 API 호출 가능
 * 4. 코드 생성: 클라이언트 SDK 자동 생성 지원
 *
 * ===== 🎯 데코레이터 패턴의 이해 =====
 *
 * **데코레이터란?**
 * ```typescript
 * // 기본 함수
 * function findUser() { return user; }
 *
 * // 데코레이터 적용
 * @ApiGetResponse(UserResDto)  // <- 이것이 데코레이터
 * function findUser() { return user; }
 * ```
 *
 * **메타데이터 기반 프로그래밍:**
 * - 데코레이터는 함수나 클래스에 메타데이터를 추가
 * - 런타임에 이 메타데이터를 읽어서 동작 변경
 * - Reflect API를 통해 메타데이터 관리
 *
 * **커스텀 데코레이터의 구조:**
 * ```typescript
 * export const MyDecorator = (param: any) => {
 *   return applyDecorators(        // 여러 데코레이터를 조합
 *     SomeDecorator(),             // 실제 NestJS/Swagger 데코레이터들
 *     AnotherDecorator(param)
 *   );
 * };
 * ```
 *
 * ===== 🔧 스키마 참조 시스템 이해 =====
 *
 * **$ref와 getSchemaPath():**
 * - $ref: JSON Schema에서 다른 스키마를 참조하는 방법
 * - getSchemaPath(): NestJS가 클래스를 스키마 경로로 변환
 * - allOf: 여러 스키마를 조합하여 새로운 스키마 생성
 *
 * **작동 원리:**
 * ```typescript
 * // 1. DTO 클래스 정의
 * class UserResDto {
 *   @ApiProperty() id: number;
 *   @ApiProperty() email: string;
 * }
 *
 * // 2. 스키마 참조 생성
 * { $ref: getSchemaPath(UserResDto) }
 * // -> "#/components/schemas/UserResDto"
 *
 * // 3. 최종 OpenAPI 스키마
 * {
 *   "components": {
 *     "schemas": {
 *       "UserResDto": {
 *         "type": "object",
 *         "properties": {
 *           "id": { "type": "number" },
 *           "email": { "type": "string" }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ===== 📋 이 파일의 설계 패턴 =====
 *
 * **팩토리 패턴:**
 * - 각 함수는 데코레이터를 생성하는 팩토리
 * - 매개변수에 따라 다른 설정의 데코레이터 반환
 * - 재사용성과 일관성 확보
 *
 * **컴포지션 패턴:**
 * - applyDecorators()로 여러 데코레이터 조합
 * - 기본 기능 + 추가 기능의 조합으로 확장
 * - 단일 책임 원칙 준수
 *
 * **제네릭 타입 활용:**
 * - <TModel extends Type<any>>로 타입 안전성 확보
 * - 컴파일 타임에 타입 검증
 * - 런타임에는 실제 클래스 객체 사용
 */

import { Type, applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageResDto } from '../dto/res.dto';

/**
 * GET 요청 단일 아이템 응답을 위한 Swagger 데코레이터
 *
 * ===== 🎯 이 데코레이터의 목적 =====
 * 단일 리소스를 조회하는 GET API의 응답 스키마를 정의합니다.
 * 예: 특정 사용자 조회, 특정 비디오 조회 등
 *
 * ===== 📝 생성되는 OpenAPI 스키마 예시 =====
 * ```yaml
 * responses:
 *   '200':
 *     description: ''
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/UserResDto'
 * ```
 *
 * ===== 🔍 코드 분석 =====
 * 1. 제네릭 타입 <TModel extends Type<any>>:
 *    - TModel: 응답 데이터의 클래스 타입
 *    - Type<any>: NestJS의 클래스 타입 인터페이스
 *    - extends로 타입 제약을 걸어 안전성 확보
 *
 * 2. applyDecorators():
 *    - 여러 데코레이터를 하나로 결합
 *    - 코드 재사용성과 일관성 향상
 *    - 내부적으로 Reflect.decorate() 사용
 *
 * 3. ApiOkResponse():
 *    - HTTP 200 응답에 대한 Swagger 문서 생성
 *    - schema 객체로 응답 구조 정의
 *
 * 4. allOf와 $ref:
 *    - allOf: JSON Schema의 조합 키워드
 *    - $ref: 다른 스키마 정의 참조
 *    - getSchemaPath(): 클래스를 스키마 경로로 변환
 *
 * ===== 💡 실제 사용 예시 =====
 * ```typescript
 * // 컨트롤러에서 사용
 * @Controller('users')
 * export class UserController {
 *   @Get(':id')
 *   @ApiGetResponse(UserResDto)  // <- 여기서 사용
 *   async findOne(@Param('id') id: string): Promise<UserResDto> {
 *     return this.userService.findOne(id);
 *   }
 * }
 *
 * // 응답 DTO 정의
 * export class UserResDto {
 *   @ApiProperty() id: number;
 *   @ApiProperty() email: string;
 *   @ApiProperty() role: UserRole;
 * }
 * ```
 *
 * ===== 🌐 Swagger UI에서 보이는 모습 =====
 * - API 경로: GET /users/{id}
 * - 응답 섹션에 UserResDto 스키마 표시
 * - 각 속성의 타입과 설명 자동 생성
 * - "Try it out" 버튼으로 실제 테스트 가능
 *
 * ===== ⚠️ 주의사항 =====
 * - DTO 클래스에 @ApiProperty() 데코레이터 필수
 * - main.ts에서 SwaggerModule.setup() 호출 필요
 * - 순환 참조 시 forwardRef() 사용 고려
 *
 * @param model 응답 데이터의 타입 모델 (예: UserResDto, VideoResDto)
 * @returns ApiOkResponse 데코레이터가 적용된 함수
 */
export const ApiGetResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 200 OK 응답에 대한 스키마 정의
    // 💡 ApiOkResponse는 @nestjs/swagger에서 제공하는 기본 데코레이터
    ApiOkResponse({
      schema: {
        // 🔗 allOf: JSON Schema 조합 키워드 - 여러 스키마를 하나로 결합
        // 📋 $ref: 다른 위치의 스키마 정의를 참조하는 JSON Pointer
        // 🎯 getSchemaPath(): NestJS가 클래스명을 OpenAPI 스키마 경로로 변환
        // 결과: "#/components/schemas/UserResDto" 형태의 참조 생성
        allOf: [{ $ref: getSchemaPath(model) }],
      },
    }),
  );
};

/**
 * POST 요청 생성 응답을 위한 Swagger 데코레이터
 *
 * ===== 🎯 이 데코레이터의 목적 =====
 * 새로운 리소스를 생성하는 POST API의 응답 스키마를 정의합니다.
 * HTTP 201 Created 상태 코드와 함께 생성된 리소스 정보를 반환합니다.
 *
 * ===== 📝 생성되는 OpenAPI 스키마 예시 =====
 * ```yaml
 * responses:
 *   '201':
 *     description: 'Resource created successfully'
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/UserResDto'
 * ```
 *
 * ===== 🔍 HTTP 상태 코드의 의미 =====
 * - 200 OK: 기존 리소스 조회/수정 성공
 * - 201 Created: 새로운 리소스 생성 성공 ← 이 데코레이터가 사용
 * - 204 No Content: 성공했지만 응답 본문 없음
 *
 * ===== 💡 실제 사용 예시 =====
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @ApiPostResponse(UserResDto)  // <- 201 Created 응답 정의
 *   async create(@Body() createUserDto: CreateUserDto): Promise<UserResDto> {
 *     const user = await this.userService.create(createUserDto);
 *     return user;
 *   }
 * }
 *
 * // 요청 DTO (입력)
 * export class CreateUserDto {
 *   @ApiProperty() email: string;
 *   @ApiProperty() password: string;
 * }
 *
 * // 응답 DTO (출력) - 비밀번호는 제외
 * export class UserResDto {
 *   @ApiProperty() id: number;
 *   @ApiProperty() email: string;
 *   @ApiProperty() createdAt: Date;
 * }
 * ```
 *
 * ===== 🌐 Swagger UI에서 보이는 모습 =====
 * - API 경로: POST /users
 * - 응답 섹션에 "201 Created" 표시
 * - 생성된 리소스의 구조 스키마 표시
 * - "Try it out"으로 실제 생성 테스트 가능
 *
 * ===== 🔄 GET vs POST 데코레이터 비교 =====
 * ```typescript
 * // GET: 조회 (200 OK)
 * @ApiGetResponse(UserResDto)
 * // ↓ 내부적으로 ApiOkResponse() 사용
 *
 * // POST: 생성 (201 Created)
 * @ApiPostResponse(UserResDto)
 * // ↓ 내부적으로 ApiCreatedResponse() 사용
 * ```
 *
 * ===== ⚠️ 주의사항 =====
 * - 생성 API는 반드시 201 상태 코드 사용
 * - 응답에는 생성된 리소스의 ID 포함 권장
 * - 민감한 정보(비밀번호 등)는 응답에서 제외
 * - Location 헤더에 생성된 리소스 URL 포함 고려
 *
 * @param model 생성된 리소스의 응답 타입 모델
 * @returns ApiCreatedResponse 데코레이터가 적용된 함수
 */
export const ApiPostResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 201 Created 응답에 대한 스키마 정의
    // 💡 ApiCreatedResponse: 리소스 생성 성공을 나타내는 전용 데코레이터
    // 🎯 RESTful API 원칙에 따라 생성 작업은 201 상태 코드 사용
    ApiCreatedResponse({
      schema: {
        // 🔗 동일한 스키마 참조 패턴 사용
        // 📋 생성된 리소스의 구조를 클라이언트에게 명확히 전달
        allOf: [{ $ref: getSchemaPath(model) }],
      },
    }),
  );
};

/**
 * GET 요청 페이지네이션 목록 응답을 위한 Swagger 데코레이터
 *
 * ===== 🎯 이 데코레이터의 목적 =====
 * 대량의 데이터를 페이지 단위로 나누어 조회하는 API의 응답 스키마를 정의합니다.
 * PageResDto를 기반으로 하되, 실제 아이템 배열의 타입을 제네릭으로 지정할 수 있습니다.
 *
 * ===== 📋 응답 구조 상세 분석 =====
 * ```typescript
 * interface PaginatedResponse<T> {
 *   page: number;      // 현재 페이지 번호 (1부터 시작)
 *   size: number;      // 현재 페이지의 실제 아이템 수
 *   items: T[];        // 실제 데이터 배열 (제네릭 타입)
 * }
 * ```
 *
 * ===== 🔍 복합 스키마 생성 과정 =====
 * 이 데코레이터는 두 개의 스키마를 조합하여 하나의 새로운 스키마를 만듭니다:
 *
 * 1️⃣ **기본 스키마 (PageResDto):**
 * ```yaml
 * PageResDto:
 *   type: object
 *   properties:
 *     page: { type: number }
 *     size: { type: number }
 * ```
 *
 * 2️⃣ **아이템 배열 스키마 (동적 생성):**
 * ```yaml
 * items:
 *   type: array
 *   items:
 *     $ref: '#/components/schemas/VideoResDto'  # 예시
 * ```
 *
 * 3️⃣ **최종 조합 스키마 (allOf):**
 * ```yaml
 * allOf:
 *   - $ref: '#/components/schemas/PageResDto'
 *   - type: object
 *     properties:
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/components/schemas/VideoResDto'
 *     required: [items]
 * ```
 *
 * ===== 💡 실제 사용 예시 =====
 * ```typescript
 * @Controller('videos')
 * export class VideoController {
 *   @Get()
 *   @ApiGetItemsResponse(VideoResDto)  // <- 페이지네이션 응답 정의
 *   async findAll(
 *     @Query() query: PageReqDto
 *   ): Promise<PageResDto<VideoResDto>> {
 *     return this.videoService.findAll(query);
 *   }
 * }
 *
 * // 실제 응답 예시
 * {
 *   "page": 1,
 *   "size": 2,
 *   "items": [
 *     {
 *       "id": 1,
 *       "title": "NestJS 기초",
 *       "user": { "id": 1, "email": "user1@test.com" }
 *     },
 *     {
 *       "id": 2,
 *       "title": "TypeScript 심화",
 *       "user": { "id": 2, "email": "user2@test.com" }
 *     }
 *   ]
 * }
 * ```
 *
 * ===== 🧩 allOf 조합 패턴의 이해 =====
 * JSON Schema의 `allOf`는 여러 스키마를 "AND" 조건으로 결합합니다:
 *
 * ```typescript
 * // 이렇게 생각하면 됩니다:
 * type Result = PageResDto & { items: TModel[] }
 *
 * // 실제로는 이런 구조가 됩니다:
 * interface CombinedSchema {
 *   page: number;        // PageResDto에서 상속
 *   size: number;        // PageResDto에서 상속
 *   items: TModel[];     // 추가로 정의한 속성
 * }
 * ```
 *
 * ===== 🌐 Swagger UI에서 보이는 모습 =====
 * - API 경로: GET /videos?page=1&size=10
 * - 응답 섹션에 조합된 스키마 표시
 * - page, size, items 속성 모두 표시
 * - items 배열의 각 요소 구조도 상세히 표시
 * - "Try it out"으로 페이지네이션 테스트 가능
 *
 * ===== 🔧 고급 활용 팁 =====
 * ```typescript
 * // 다양한 엔티티에 재사용
 * @ApiGetItemsResponse(UserResDto)     // 사용자 목록
 * @ApiGetItemsResponse(PostResDto)     // 게시글 목록
 * @ApiGetItemsResponse(CommentResDto)  // 댓글 목록
 *
 * // 중첩된 관계 데이터도 지원
 * export class VideoResDto {
 *   @ApiProperty() id: number;
 *   @ApiProperty() title: string;
 *   @ApiProperty(() => UserResDto) user: UserResDto;  // 관계 데이터
 * }
 * ```
 *
 * ===== ⚠️ 주의사항 =====
 * - PageResDto와 아이템 DTO 모두 @ApiProperty() 필수
 * - 순환 참조 시 () => Model 형태로 지연 참조 사용
 * - 성능을 위해 적절한 페이지 크기 제한 설정
 * - N+1 쿼리 문제 방지를 위한 관계 데이터 최적화
 *
 * @param model 목록에 포함될 아이템의 타입 모델
 * @returns ApiOkResponse 데코레이터가 적용된 함수 (페이지네이션 구조 포함)
 */
export const ApiGetItemsResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 200 OK 응답에 대한 페이지네이션 스키마 정의
    ApiOkResponse({
      schema: {
        // 🧩 allOf: JSON Schema 조합 키워드 - 여러 스키마를 AND 조건으로 결합
        allOf: [
          // 1️⃣ 기본 페이지네이션 구조 (PageResDto) 상속
          // 📋 page, size 속성을 포함하는 기본 스키마
          { $ref: getSchemaPath(PageResDto) },
          {
            // 2️⃣ 추가 속성 정의 - items 배열
            properties: {
              items: {
                type: 'array', // 📚 items는 배열 타입
                // 🎯 배열의 각 요소는 전달받은 모델 타입을 참조
                // 예: VideoResDto[] -> items: [VideoResDto, VideoResDto, ...]
                items: { $ref: getSchemaPath(model) },
              },
            },
            // ✅ items 속성은 응답에서 필수 항목
            required: ['items'],
          },
        ],
      },
    }),
  );
};

/**
 * ===== 🎓 종합 학습 가이드 =====
 *
 * **1. 데코레이터 선택 가이드**
 * ```typescript
 * // ✅ 단일 리소스 조회
 * @Get(':id')
 * @ApiGetResponse(UserResDto)
 *
 * // ✅ 리소스 생성
 * @Post()
 * @ApiPostResponse(UserResDto)
 *
 * // ✅ 목록 조회 (페이지네이션)
 * @Get()
 * @ApiGetItemsResponse(UserResDto)
 * ```
 *
 * **2. 실제 컨트롤러 구현 예시**
 * ```typescript
 * @Controller('api/videos')
 * @ApiTags('Videos')  // Swagger UI에서 그룹핑
 * export class VideoController {
 *   // 단일 비디오 조회
 *   @Get(':id')
 *   @ApiGetResponse(VideoResDto)
 *   @ApiParam({ name: 'id', description: '비디오 ID' })
 *   async findOne(@Param('id') id: string): Promise<VideoResDto> {
 *     return this.videoService.findOne(id);
 *   }
 *
 *   // 비디오 목록 조회 (페이지네이션)
 *   @Get()
 *   @ApiGetItemsResponse(VideoResDto)
 *   @ApiQuery({ name: 'page', required: false, example: 1 })
 *   @ApiQuery({ name: 'size', required: false, example: 10 })
 *   async findAll(@Query() query: PageReqDto): Promise<PageResDto<VideoResDto>> {
 *     return this.videoService.findAll(query);
 *   }
 *
 *   // 새 비디오 생성
 *   @Post()
 *   @ApiPostResponse(VideoResDto)
 *   @ApiBody({ type: CreateVideoDto })
 *   async create(@Body() dto: CreateVideoDto): Promise<VideoResDto> {
 *     return this.videoService.create(dto);
 *   }
 * }
 * ```
 *
 * **3. DTO 클래스 설계 베스트 프랙티스**
 * ```typescript
 * // 응답 DTO - 클라이언트가 받을 데이터
 * export class VideoResDto {
 *   @ApiProperty({ description: '비디오 고유 ID', example: 1 })
 *   id: number;
 *
 *   @ApiProperty({ description: '비디오 제목', example: 'NestJS 완전정복' })
 *   title: string;
 *
 *   @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00Z' })
 *   createdAt: Date;
 *
 *   // 관계 데이터 - 순환 참조 방지를 위한 지연 참조
 *   @ApiProperty({ type: () => UserResDto, description: '업로더 정보' })
 *   user: UserResDto;
 * }
 *
 * // 요청 DTO - 클라이언트가 보낼 데이터
 * export class CreateVideoDto {
 *   @ApiProperty({ description: '비디오 제목', minLength: 1, maxLength: 100 })
 *   @IsString()
 *   @IsNotEmpty()
 *   title: string;
 *
 *   @ApiProperty({ description: '비디오 설명', required: false })
 *   @IsOptional()
 *   @IsString()
 *   description?: string;
 * }
 * ```
 *
 * **4. 고급 스키마 패턴**
 * ```typescript
 * // Union 타입 지원
 * export const ApiUnionResponse = (...models: Type<any>[]) => {
 *   return applyDecorators(
 *     ApiOkResponse({
 *       schema: {
 *         oneOf: models.map(model => ({ $ref: getSchemaPath(model) }))
 *       }
 *     })
 *   );
 * };
 *
 * // 조건부 속성 스키마
 * export const ApiConditionalResponse = <T extends Type<any>>(
 *   baseModel: T,
 *   conditionalProps: any
 * ) => {
 *   return applyDecorators(
 *     ApiOkResponse({
 *       schema: {
 *         allOf: [
 *           { $ref: getSchemaPath(baseModel) },
 *           { properties: conditionalProps }
 *         ]
 *       }
 *     })
 *   );
 * };
 * ```
 *
 * **5. Swagger UI 최적화 팁**
 * ```typescript
 * // main.ts에서 Swagger 설정
 * const config = new DocumentBuilder()
 *   .setTitle('Video API')
 *   .setDescription('동영상 관리 API 문서')
 *   .setVersion('1.0')
 *   .addBearerAuth()  // JWT 인증 지원
 *   .addTag('Videos', '동영상 관리')
 *   .addTag('Users', '사용자 관리')
 *   .build();
 *
 * const document = SwaggerModule.createDocument(app, config);
 * SwaggerModule.setup('api/docs', app, document, {
 *   swaggerOptions: {
 *     persistAuthorization: true,  // 인증 정보 유지
 *     tagsSorter: 'alpha',         // 태그 정렬
 *     operationsSorter: 'alpha'    // API 정렬
 *   }
 * });
 * ```
 *
 * **6. 성능 최적화 고려사항**
 * ```typescript
 * // ❌ 피해야 할 패턴
 * @ApiGetItemsResponse(VideoWithAllRelationsDto)  // 너무 많은 관계 데이터
 *
 * // ✅ 권장 패턴
 * @ApiGetItemsResponse(VideoSummaryDto)  // 필요한 데이터만 포함
 *
 * // 선택적 관계 데이터 로딩
 * export class VideoSummaryDto {
 *   @ApiProperty() id: number;
 *   @ApiProperty() title: string;
 *   // user 정보는 별도 API에서 조회
 * }
 * ```
 *
 * **7. 에러 처리와 문서화**
 * ```typescript
 * // 에러 응답도 문서화
 * @Get(':id')
 * @ApiGetResponse(VideoResDto)
 * @ApiNotFoundResponse({ description: '비디오를 찾을 수 없습니다' })
 * @ApiBadRequestResponse({ description: '잘못된 ID 형식입니다' })
 * async findOne(@Param('id') id: string) {
 *   // 구현...
 * }
 * ```
 */

/**
 * ===== 🚀 실습 과제 =====
 *
 * **초급 과제:**
 * 1. Comment 엔티티를 위한 응답 DTO 작성
 * 2. 기본 CRUD API에 Swagger 데코레이터 적용
 * 3. Swagger UI에서 API 테스트해보기
 *
 * **중급 과제:**
 * 1. 검색 기능이 포함된 페이지네이션 API 구현
 * 2. 파일 업로드 API의 Swagger 문서화
 * 3. 인증이 필요한 API의 보안 스키마 정의
 *
 * **고급 과제:**
 * 1. 다중 응답 형태를 지원하는 커스텀 데코레이터 작성
 * 2. 동적 스키마 생성 데코레이터 구현
 * 3. OpenAPI 스펙을 활용한 클라이언트 SDK 자동 생성
 *
 * **실무 과제:**
 * 1. 마이크로서비스 간 API 문서 통합
 * 2. 버전별 API 문서 관리 시스템 구축
 * 3. CI/CD 파이프라인에 API 문서 검증 추가
 */

/**
 * ===== 📚 추가 학습 리소스 =====
 *
 * **관련 파일들:**
 * - src/common/dto/res.dto.ts: 응답 DTO 정의
 * - src/common/dto/req.dto.ts: 요청 DTO 정의
 * - src/config/swagger.config.ts: Swagger 설정
 * - src/main.ts: Swagger 초기화
 *
 * **공식 문서:**
 * - NestJS Swagger: https://docs.nestjs.com/openapi/introduction
 * - OpenAPI 3.0 Spec: https://swagger.io/specification/
 * - JSON Schema: https://json-schema.org/
 *
 * **고급 주제:**
 * - API 버저닝 전략
 * - GraphQL과 REST API 문서화 비교
 * - Swagger UI 커스터마이징
 * - 자동화된 API 테스트 생성
 */
