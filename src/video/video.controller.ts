/**
 * 비디오 관련 HTTP 요청을 처리하는 컨트롤러
 * 비디오 업로드, 조회, 다운로드 등의 API 엔드포인트를 제공합니다.
 * CQRS 패턴을 사용하여 명령과 쿼리를 분리합니다.
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
    private commandBus: CommandBus, // CQRS 명령 버스
    private queryBus: QueryBus, // CQRS 쿼리 버스
    private videoService: VideoService, // 비디오 서비스
  ) {}

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
