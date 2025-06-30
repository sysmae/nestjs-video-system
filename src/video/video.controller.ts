/**
 * 비디오 관련 HTTP 요청을 처리하는 컨트롤러
 * 비디오 업로드, 조회, 다운로드 등의 API 엔드포인트를 제공합니다.
 * CQRS 패턴을 사용하여 명령과 쿼리를 분리합니다.
 *
 * ===== 🎯 CQRS (Command Query Responsibility Segregation) 완전 이해 =====
 *
 * **CQRS란?**
 * - Command(명령)과 Query(쿼리)의 책임을 분리하는 아키텍처 패턴
 * - 데이터를 변경하는 작업과 조회하는 작업을 완전히 분리
 * - 복잡한 비즈니스 로직을 깔끔하게 구조화할 수 있음
 *
 * **기존 방식 vs CQRS 방식:**
 * ```
 * 📊 기존 방식 (CRUD):
 * Controller → Service → Repository → Database
 * - 모든 작업이 하나의 서비스에 집중
 * - 복잡한 비즈니스 로직이 섞임
 * - 테스트와 유지보수가 어려움
 *
 * 🚀 CQRS 방식:
 * Controller → CommandBus/QueryBus → Handler → Repository → Database
 * - 명령과 쿼리가 완전히 분리됨
 * - 각 작업별로 독립적인 핸들러
 * - 테스트와 확장이 용이함
 * ```
 *
 * **Command (명령) - 데이터 변경 작업:**
 * ```typescript
 * // 예시: 비디오 업로드
 * 1. CreateVideoCommand 생성
 * 2. CommandBus.execute(command)
 * 3. CreateVideoHandler 실행
 * 4. 비즈니스 로직 처리 (파일 저장, DB 기록, 이벤트 발행)
 * 5. 결과 반환
 * ```
 *
 * **Query (쿼리) - 데이터 조회 작업:**
 * ```typescript
 * // 예시: 비디오 목록 조회
 * 1. FindVideosQuery 생성
 * 2. QueryBus.execute(query)
 * 3. FindVideosHandler 실행
 * 4. 데이터 조회 및 변환
 * 5. 결과 반환
 * ```
 *
 * **CQRS의 핵심 원칙:**
 * 1. **명령과 쿼리 분리**: 데이터 변경과 조회의 완전한 분리
 * 2. **단일 책임**: 각 핸들러는 하나의 작업만 담당
 * 3. **이벤트 기반**: 명령 완료 후 이벤트 발행으로 사이드 이펙트 처리
 * 4. **확장성**: 새로운 기능 추가 시 기존 코드 영향 최소화
 *
 * **CQRS + Event Sourcing 조합:**
 * ```
 * Command → Handler → Event 발행 → Event Handler들
 *                    ↓
 * - 비디오 생성 완료 이벤트
 * - 분석 서비스에 데이터 전송
 * - 사용자에게 알림 발송
 * - 검색 엔진 인덱스 업데이트
 * ```
 *
 * **실제 프로젝트에서의 CQRS 흐름:**
 * ```
 * 📤 비디오 업로드 (Command):
 * POST /api/videos
 * → CreateVideoCommand
 * → CreateVideoHandler
 * → 파일 저장 + DB 기록 + 이벤트 발행
 *
 * 📥 비디오 조회 (Query):
 * GET /api/videos
 * → FindVideosQuery
 * → FindVideosHandler
 * → DB 조회 + 데이터 변환
 * ```
 *
 * **CQRS의 장점:**
 * ✅ 복잡한 비즈니스 로직의 명확한 분리
 * ✅ 각 작업별 독립적인 최적화 가능
 * ✅ 테스트 코드 작성이 쉬움
 * ✅ 팀 단위 개발 시 충돌 최소화
 * ✅ 마이크로서비스 아키텍처에 적합
 *
 * **CQRS 사용 시기:**
 * - 복잡한 비즈니스 로직이 있는 도메인
 * - 읽기와 쓰기 패턴이 다른 경우
 * - 높은 확장성이 필요한 시스템
 * - 이벤트 기반 아키텍처 구축 시
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { CreateVideoReqDto, FindVideoReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse, ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { CreateVideoResDto, FindVideoResDto } from './dto/res.dto';
import { PageResDto } from 'src/common/dto/res.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from 'src/common/guard/throttler-behind-proxy.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateVideoCommand } from './command/create-video.command';
import { User, UserAfterAuth } from 'src/common/decorator/user.decorator';
import { FindVideosQuery } from './query/find-videos.query';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('Video') // Swagger에서 'Video' 태그로 그룹핑
@ApiExtraModels(FindVideoReqDto, PageReqDto, CreateVideoResDto, FindVideoResDto, PageResDto)
@UseGuards(ThrottlerBehindProxyGuard) // 프록시 환경에서 Rate Limiting 적용
@Controller('api/videos') // '/api/videos' 경로의 요청을 처리
export class VideoController {
  constructor(
    private commandBus: CommandBus, // 🚌 CQRS 명령 버스 - Command 라우팅 및 실행 담당
    private queryBus: QueryBus, // 🚌 CQRS 쿼리 버스 - Query 라우팅 및 실행 담당
    private videoService: VideoService, // 비디오 서비스
  ) {}

  /**
   * ===== 🚌 CQRS Bus (버스) 시스템 완전 이해 =====
   *
   * **Bus 패턴이란?**
   * - 요청(Command/Query)을 적절한 Handler로 라우팅하는 메시지 브로커 역할
   * - 컨트롤러와 핸들러 사이의 느슨한 결합(Loose Coupling) 구현
   * - 명령과 쿼리의 중앙 집중식 관리 및 배포
   *
   * **CommandBus vs QueryBus 비교:**
   * ```
   * 🚌 CommandBus (명령 버스):
   * - 데이터 변경 작업 담당 (Create, Update, Delete)
   * - 비즈니스 로직 실행 및 사이드 이펙트 처리
   * - 이벤트 발행을 통한 후속 작업 연쇄
   * - 트랜잭션 관리 및 데이터 일관성 보장
   *
   * 🚌 QueryBus (쿼리 버스):
   * - 데이터 조회 작업 전담 (Read Only)
   * - 캐싱, 성능 최적화에 특화
   * - 읽기 전용이므로 안전하고 빠름
   * - 복잡한 조회 로직의 독립적 관리
   * ```
   *
   * **Bus 시스템의 내부 동작:**
   * ```typescript
   * // 1. 명령/쿼리 등록 (모듈 설정 시)
   * @Module({
   *   providers: [
   *     CreateVideoHandler,     // Command Handler
   *     FindVideosHandler,      // Query Handler
   *   ]
   * })
   *
   * // 2. 런타임에 Bus가 Handler 매핑 테이블 생성
   * const handlerMap = {
   *   'CreateVideoCommand': CreateVideoHandler,
   *   'FindVideosQuery': FindVideosHandler,
   * };
   *
   * // 3. execute() 호출 시 적절한 Handler로 라우팅
   * await commandBus.execute(command);
   * // → handlerMap['CreateVideoCommand'].execute(command)
   * ```
   *
   * **Bus 패턴의 핵심 이점:**
   * ```
   * 🎯 느슨한 결합 (Loose Coupling):
   * - Controller는 Handler를 직접 알 필요 없음
   * - 새로운 Handler 추가 시 Controller 수정 불필요
   * - 테스트 시 Mock Bus로 쉽게 대체 가능
   *
   * 🔄 확장성 (Scalability):
   * - 동일한 명령에 여러 Handler 연결 가능
   * - 미들웨어 패턴으로 로깅, 검증, 캐싱 추가
   * - 마이크로서비스 간 메시지 라우팅 확장
   *
   * 🧪 테스트 용이성:
   * - Handler 단위로 독립적 테스트
   * - Bus Mock으로 Controller 테스트 격리
   * - 통합 테스트에서 실제 플로우 검증
   * ```
   *
   * **실제 사용 예시:**
   * ```typescript
   * // ✅ Command 실행 (데이터 변경)
   * const command = new CreateVideoCommand(userId, title, file);
   * const result = await this.commandBus.execute(command);
   * // → CreateVideoHandler.execute(command) 호출
   *
   * // ✅ Query 실행 (데이터 조회)
   * const query = new FindVideosQuery(page, size);
   * const videos = await this.queryBus.execute(query);
   * // → FindVideosHandler.execute(query) 호출
   * ```
   *
   * **Bus 미들웨어 활용:**
   * ```typescript
   * // 로깅 미들웨어
   * @Injectable()
   * export class LoggingMiddleware implements CommandMiddleware {
   *   async execute(command: any, next: () => Promise<any>) {
   *     console.log(`Executing: ${command.constructor.name}`);
   *     const result = await next();
   *     console.log(`Completed: ${command.constructor.name}`);
   *     return result;
   *   }
   * }
   *
   * // 검증 미들웨어
   * @Injectable()
   * export class ValidationMiddleware implements CommandMiddleware {
   *   async execute(command: any, next: () => Promise<any>) {
   *     await this.validateCommand(command);
   *     return next();
   *   }
   * }
   * ```
   *
   * **에러 처리 및 복구:**
   * ```typescript
   * try {
   *   const result = await this.commandBus.execute(command);
   *   return result;
   * } catch (error) {
   *   // Bus에서 발생한 에러를 적절히 처리
   *   if (error instanceof ValidationError) {
   *     throw new BadRequestException(error.message);
   *   } else if (error instanceof BusinessLogicError) {
   *     throw new ConflictException(error.message);
   *   }
   *   throw new InternalServerErrorException('명령 처리 중 오류 발생');
   * }
   * ```
   *
   * **성능 최적화 팁:**
   * ```
   * 🚀 QueryBus 최적화:
   * - 읽기 전용 데이터베이스 분리 (CQRS + Database Segregation)
   * - Redis 캐싱 레이어 추가
   * - 쿼리 결과 압축 및 페이지네이션
   *
   * ⚡ CommandBus 최적화:
   * - 비동기 이벤트 처리로 응답 시간 단축
   * - 배치 처리로 데이터베이스 부하 분산
   * - 트랜잭션 범위 최소화
   * ```
   */

  /**
   * 비디오 업로드 API
   * 멀티파트 폼 데이터로 비디오 파일을 업로드합니다.
   * 파일 크기와 타입을 검증하고 CQRS 명령으로 처리합니다.
   */
  @ApiBearerAuth() // JWT 인증 필요
  @ApiConsumes('multipart/form-data') // 멀티파트 폼 데이터 사용
  @ApiPostResponse(CreateVideoResDto)
  @UseInterceptors(FileInterceptor('video')) // 'video' 필드의 파일 처리
  @Post()
  async upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'mp4', // MP4 파일만 허용
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 최대 5MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: any, // Multer 파일 객체
    @Body() createVideoReqDto: CreateVideoReqDto,
    @User() user: UserAfterAuth, // 인증된 사용자 정보
  ): Promise<CreateVideoResDto> {
    const { mimetype, originalname, buffer } = file;
    const extension = originalname.split('.')[1]; // 파일 확장자 추출
    const { title } = createVideoReqDto;

    // CQRS 명령 생성 및 실행
    const command = new CreateVideoCommand(user.id, title, mimetype, extension, buffer);
    const { id } = await this.commandBus.execute(command);
    return { id, title };
  }

  /**
   * 비디오 목록 조회 API (페이지네이션 지원)
   * CQRS 쿼리를 사용하여 비디오 목록을 조회합니다.
   * Rate Limiting을 건너뜁니다.
   */
  @ApiBearerAuth()
  @ApiGetItemsResponse(FindVideoResDto)
  @SkipThrottle() // 이 엔드포인트는 Rate Limiting을 건너뜀
  @Get()
  async findAll(@Query() { page, size }: PageReqDto): Promise<FindVideoResDto[]> {
    // CQRS 쿼리 생성 및 실행
    const findVideosQuery = new FindVideosQuery(page, size);
    const videos = await this.queryBus.execute(findVideosQuery);

    // 응답 데이터 변환 (필요한 필드만 반환)
    return videos.map(({ id, title, user }) => {
      return {
        id,
        title,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    });
  }

  /**
   * 특정 비디오 상세 조회 API
   * 비디오 ID로 특정 비디오의 상세 정보를 조회합니다.
   */
  @ApiBearerAuth()
  @ApiGetResponse(FindVideoResDto)
  @Get(':id')
  async findOne(@Param() { id }: FindVideoReqDto) {
    const { title, user } = await this.videoService.findOne(id);
    return {
      id,
      title,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  /**
   * 비디오 다운로드 API
   * 비디오 파일을 스트림으로 다운로드합니다.
   * Rate Limiting: 60초 동안 최대 3회 다운로드 허용
   */
  @ApiBearerAuth()
  @Throttle(3, 60) // 60초 동안 최대 3회 다운로드
  @Get(':id/download')
  async download(@Param() { id }: FindVideoReqDto, @Res({ passthrough: true }) res: Response) {
    // 비디오 파일 스트림과 메타데이터 조회
    const { stream, mimetype, size } = await this.videoService.download(id);

    // HTTP 응답 헤더 설정
    res.set({
      'Content-Length': size, // 파일 크기
      'Content-Type': mimetype, // MIME 타입
      'Content-Disposition': 'attachment;', // 다운로드로 처리
    });

    // 파일 스트림 반환
    return new StreamableFile(stream);
  }
}
