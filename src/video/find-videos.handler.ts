/**
 * 비디오 목록 조회 쿼리 핸들러 (CQRS Query Handler)
 * FindVideosQuery를 처리하여 페이지네이션이 적용된 비디오 목록을 조회합니다.
 * CQRS 패턴에서 읽기 전용 작업을 담당하는 쿼리 핸들러입니다.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindVideosQuery } from './query/find-videos.query';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from './entity/video.entity';
import { Repository } from 'typeorm';

@QueryHandler(FindVideosQuery) // 이 핸들러가 FindVideosQuery를 처리함을 명시
export class FindVideosQueryHandler implements IQueryHandler<FindVideosQuery> {
  constructor(
    @InjectRepository(Video) private videoRepository: Repository<Video>, // Video 엔티티 레포지토리 주입
  ) {}

  /**
   * FindVideosQuery 실행 메서드
   * 페이지네이션을 적용하여 비디오 목록을 조회합니다.
   * 사용자 정보도 함께 로드하여 반환합니다.
   *
   * @param query 비디오 조회 쿼리 객체 (page, size 포함)
   * @returns 조회된 비디오 목록 (사용자 정보 포함)
   */
  async execute({ page, size }: FindVideosQuery): Promise<Video[]> {
    const videos = await this.videoRepository.find({
      relations: ['user'], // 비디오와 연관된 사용자 정보도 함께 조회
      skip: (page - 1) * size, // 건너뛸 레코드 수 계산
      take: size, // 가져올 레코드 수
    });
    return videos;
  }
}
