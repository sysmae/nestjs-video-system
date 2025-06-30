/**
 * 비디오 목록 조회 쿼리 클래스 (CQRS Query)
 * 비디오 목록을 페이지네이션으로 조회하기 위한 매개변수를 포함합니다.
 * CQRS 패턴에서 읽기 작업을 나타내는 쿼리 객체입니다.
 * 이 쿼리는 FindVideosQueryHandler에 의해 처리됩니다.
 */

import { IQuery } from '@nestjs/cqrs';

export class FindVideosQuery implements IQuery {
  constructor(
    readonly page: number, // 조회할 페이지 번호 (1부터 시작)
    readonly size: number, // 페이지당 조회할 비디오 수
  ) {}
}
