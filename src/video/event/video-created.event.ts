/**
 * 비디오 생성 완료 이벤트 클래스 (CQRS Event)
 * 비디오가 성공적으로 생성되었을 때 발행되는 도메인 이벤트입니다.
 * 이벤트 기반 아키텍처에서 느슨한 결합을 유지하면서 후속 작업을 트리거합니다.
 * 이 이벤트는 VideoCreatedHandler에 의해 처리됩니다.
 */

import { IEvent } from '@nestjs/cqrs';

export class VideoCreatedEvent implements IEvent {
  constructor(
    readonly id: string, // 생성된 비디오의 고유 식별자
  ) {}
}
