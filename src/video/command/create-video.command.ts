/**
 * 비디오 생성 명령 클래스 (CQRS Command)
 * 새로운 비디오를 생성하기 위한 모든 필요한 데이터를 포함합니다.
 * CQRS 패턴에서 쓰기 작업을 나타내는 명령 객체입니다.
 * 이 명령은 CreateVideoHandler에 의해 처리됩니다.
 */

import { ICommand } from '@nestjs/cqrs';

export class CreateVideoCommand implements ICommand {
  constructor(
    readonly userId: string, // 비디오를 업로드한 사용자 ID
    readonly title: string, // 비디오 제목
    readonly mimetype: string, // 비디오 파일의 MIME 타입 (예: 'video/mp4')
    readonly extension: string, // 파일 확장자 (예: 'mp4')
    readonly buffer: Buffer, // 업로드된 비디오 파일의 바이너리 데이터
  ) {}
}
