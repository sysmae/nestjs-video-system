/**
 * 비디오 생성 이벤트 핸들러 (CQRS Event Handler)
 * 비디오가 성공적으로 생성되었을 때 발생하는 VideoCreatedEvent를 처리합니다.
 * 이벤트 기반 아키텍처에서 비동기적으로 후속 작업을 수행하는 역할을 합니다.
 * 예: 알림 발송, 통계 업데이트, 외부 시스템 연동 등
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { VideoCreatedEvent } from './event/video-created.event';

@EventsHandler(VideoCreatedEvent) // 이 핸들러가 VideoCreatedEvent를 처리함을 명시
export class VideoCreatedHandler implements IEventHandler<VideoCreatedEvent> {
  /**
   * VideoCreatedEvent 처리 메서드
   * 비디오 생성 완료 후 실행되는 후속 작업들을 처리합니다.
   * 현재는 로그 출력만 하지만, 실제 운영 환경에서는 다양한 작업을 수행할 수 있습니다.
   *
   * @param event 비디오 생성 이벤트 객체
   */
  handle(event: VideoCreatedEvent) {
    // 비디오 생성 완료 로그 출력
    console.info(`✅ 비디오 생성 완료 (ID: ${event.id})`);

    // TODO: 실제 운영 환경에서는 다음과 같은 작업들을 수행할 수 있습니다:
    // - 사용자에게 업로드 완료 알림 발송
    // - 비디오 분석 시스템에 새 비디오 정보 전송
    // - 검색 인덱스에 비디오 정보 추가
    // - 외부 CDN에 비디오 업로드
    // - 썸네일 생성 작업 큐에 추가
  }
}
