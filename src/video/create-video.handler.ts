/**
 * 비디오 생성 명령 핸들러 (CQRS Command Handler)
 * CreateVideoCommand를 처리하여 비디오를 데이터베이스에 저장하고 파일 시스템에 업로드합니다.
 * 트랜잭션을 사용하여 데이터 일관성을 보장하고, 완료 후 이벤트를 발행합니다.
 */

import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateVideoCommand } from './command/create-video.command';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { Video } from './entity/video.entity';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { VideoCreatedEvent } from './event/video-created.event';

@Injectable()
@CommandHandler(CreateVideoCommand) // 이 핸들러가 CreateVideoCommand를 처리함을 명시
export class CreateVideoHandler implements ICommandHandler<CreateVideoCommand> {
  constructor(
    private dataSource: DataSource, // 데이터베이스 트랜잭션 관리
    private eventBus: EventBus, // 도메인 이벤트 발행을 위한 이벤트 버스
  ) {}

  /**
   * CreateVideoCommand 실행 메서드
   * 1. 데이터베이스 트랜잭션 시작
   * 2. 사용자 정보 조회 및 비디오 엔티티 생성
   * 3. 파일 시스템에 비디오 파일 저장
   * 4. 트랜잭션 커밋 및 이벤트 발행
   *
   * @param command 비디오 생성 명령 객체
   * @returns 생성된 비디오 엔티티
   */
  async execute(command: CreateVideoCommand): Promise<Video> {
    const { userId, title, mimetype, extension, buffer } = command;

    // 데이터베이스 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    let error;
    try {
      // 1. 사용자 정보 조회 (비디오 소유자)
      const user = await queryRunner.manager.findOneBy(User, { id: userId });

      // 2. 비디오 엔티티 생성 및 데이터베이스에 저장
      const video = await queryRunner.manager.save(queryRunner.manager.create(Video, { title, mimetype, user }));

      // 3. 파일 시스템에 비디오 파일 업로드
      await this.uploadVideo(video.id, extension, buffer);

      // 4. 모든 작업이 성공하면 트랜잭션 커밋
      await queryRunner.commitTransaction();

      // 5. 비디오 생성 완료 이벤트 발행 (분석, 알림 등에 활용)
      this.eventBus.publish(new VideoCreatedEvent(video.id));

      return video;
    } catch (e) {
      // 에러 발생 시 트랜잭션 롤백
      await queryRunner.rollbackTransaction();
      error = e;
    } finally {
      // 트랜잭션 연결 정리
      await queryRunner.release();
      if (error) throw error;
    }
  }

  /**
   * 비디오 파일을 파일 시스템에 저장하는 private 메서드
   * 프로젝트 루트의 'video-storage' 디렉터리에 파일을 저장합니다.
   *
   * @param id 비디오 ID (파일명으로 사용)
   * @param extension 파일 확장자
   * @param buffer 파일 데이터 버퍼
   */
  private async uploadVideo(id: string, extension: string, buffer: Buffer) {
    const filePath = join(process.cwd(), 'video-storage', `${id}.${extension}`);
    await writeFile(filePath, buffer as Uint8Array);
  }
}
