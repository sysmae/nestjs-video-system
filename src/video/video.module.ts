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
  // imports: 이 모듈에서 사용할 외부 모듈, 데이터베이스 엔티티, CQRS 등 의존성 모듈을 등록합니다.
  //   - TypeOrmModule: TypeORM은 Node.js ORM(Object-Relational Mapping) 라이브러리로, DB 테이블을 객체처럼 다룰 수 있게 해줍니다.
  //     forFeature([Video])는 이 모듈에서 Video 엔티티(테이블)를 사용할 수 있게 등록합니다.
  //     @InjectRepository(Video)로 주입받아 DB 작업에 활용합니다.
  //   - CqrsModule: CQRS(Command Query Responsibility Segregation) 패턴을 지원하는 NestJS 모듈입니다.
  //     CommandBus(명령 버스), QueryBus(쿼리 버스), EventBus(이벤트 버스)를 제공하여
  //     명령(Command), 쿼리(Query), 이벤트(Event) 핸들러를 등록/실행할 수 있습니다.
  imports: [TypeOrmModule.forFeature([Video]), CqrsModule],
  // controllers: HTTP 요청을 처리하는 컨트롤러(라우터)를 등록합니다. API 엔드포인트를 정의합니다.
  //   - Controller: 사용자의 요청(REST API 등)을 받아 서비스로 전달하는 역할을 합니다.
  //     예: /video 경로의 업로드, 조회 등 요청 처리
  controllers: [VideoController],
  // providers: 서비스, 핸들러 등 비즈니스 로직 및 의존성 주입 대상들을 등록합니다.
  //   - Service: 실제 비즈니스 로직(업로드, 조회, DB 작업 등)을 담당합니다.
  //   - Command Handler: CQRS 패턴에서 명령(Command, 예: 생성/수정/삭제 등) 처리를 담당합니다.
  //   - Event Handler: CQRS 패턴에서 이벤트(Event, 예: 생성됨 등) 처리를 담당합니다.
  //   - Query Handler: CQRS 패턴에서 조회(Query) 처리를 담당합니다.
  //   - 의존성 주입(DI, Dependency Injection): NestJS가 객체를 자동으로 생성/주입해주는 시스템입니다.
  providers: [VideoService, CreateVideoHandler, VideoCreatedHandler, FindVideosQueryHandler],
  // exports: 이 모듈에서 외부로 공개할(다른 모듈에서 사용할) 서비스, 프로바이더를 지정합니다.
  //   - exports에 등록된 서비스는 다른 모듈에서 import하여 사용할 수 있습니다.
  //   - 예: 통계, 추천 등 다른 도메인에서 비디오 관련 기능 필요 시 VideoService를 활용
  exports: [VideoService],
})
export class VideoModule {}
