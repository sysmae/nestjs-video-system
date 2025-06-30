/**
 * 비디오 모듈
 * 비디오 업로드, 조회, 다운로드 등의 기능을 제공합니다.
 * CQRS(Command Query Responsibility Segregation) 패턴을 사용하여
 * 명령(Command)과 쿼리(Query)를 분리하고 이벤트 기반 아키텍처를 구현합니다.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entity/video.entity';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateVideoHandler } from './create-video.handler';
import { VideoCreatedHandler } from './video-created.handler';
import { FindVideosQueryHandler } from './find-videos.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]), // Video 엔티티를 이 모듈에서 사용할 수 있도록 등록
    CqrsModule, // CQRS 패턴 지원을 위한 모듈 (CommandBus, QueryBus, EventBus 제공)
  ],
  controllers: [VideoController], // 비디오 관련 API 엔드포인트
  providers: [
    VideoService, // 비디오 비즈니스 로직 서비스
    CreateVideoHandler, // 비디오 생성 명령 핸들러
    VideoCreatedHandler, // 비디오 생성 이벤트 핸들러
    FindVideosQueryHandler, // 비디오 목록 조회 쿼리 핸들러
  ],
  exports: [VideoService], // 다른 모듈에서 VideoService를 사용할 수 있도록 내보내기
})
export class VideoModule {}
