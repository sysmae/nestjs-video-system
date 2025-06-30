/**
 * 비디오 관련 비즈니스 로직을 처리하는 서비스
 * 비디오 조회, 다운로드, 인기 비디오 목록 등의 기능을 제공합니다.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from './entity/video.entity';
import { Repository } from 'typeorm';
import { join } from 'node:path';
import { stat } from 'fs/promises';
import { createReadStream, ReadStream } from 'node:fs';

@Injectable()
export class VideoService {
  constructor(@InjectRepository(Video) private readonly videoRepository: Repository<Video>) {}

  /**
   * 특정 비디오 정보를 조회합니다
   * 사용자 정보도 함께 가져옵니다 (relations)
   *
   * @param id 비디오 ID
   * @returns 비디오 정보 (사용자 정보 포함)
   * @throws NotFoundException 비디오가 존재하지 않을 때
   */
  async findOne(id: string) {
    const video = await this.videoRepository.findOne({ relations: ['user'], where: { id } });
    if (!video) throw new NotFoundException('비디오를 찾을 수 없습니다.');
    return video;
  }

  /**
   * 비디오 파일을 다운로드할 수 있는 스트림을 제공합니다
   * 다운로드 횟수를 1 증가시키고, 파일 스트림을 반환합니다
   *
   * @param id 비디오 ID
   * @returns 파일 스트림, MIME 타입, 파일 크기
   * @throws NotFoundException 비디오가 존재하지 않을 때
   */
  async download(id: string): Promise<{ stream: ReadStream; mimetype: string; size: number }> {
    // 비디오 정보를 데이터베이스에서 조회
    const video = await this.videoRepository.findOneBy({ id });
    if (!video) throw new NotFoundException('비디오를 찾을 수 없습니다.');

    // 다운로드 횟수를 1 증가시킵니다 (원자적 연산)
    await this.videoRepository.update({ id }, { downloadCnt: () => 'download_cnt + 1' });

    // 파일 확장자를 MIME 타입에서 추출
    const { mimetype } = video;
    const extension = mimetype.split('/')[1];

    // 비디오 파일의 실제 경로 구성
    const videoPath = join(process.cwd(), 'video-storage', `${id}.${extension}`);

    // 파일 크기 정보를 가져옵니다
    const { size } = await stat(videoPath);

    // 파일을 읽기 위한 스트림 생성
    const stream = createReadStream(videoPath);

    return { stream, mimetype, size };
  }

  /**
   * 다운로드 횟수 기준으로 상위 5개의 인기 비디오를 조회합니다
   * 사용자 정보도 함께 가져옵니다
   *
   * @returns 다운로드 횟수 순으로 정렬된 상위 5개 비디오 목록
   */
  async findTop5Download() {
    const videos = await this.videoRepository.find({
      relations: ['user'], // 비디오 업로더 정보도 함께 조회
      order: {
        downloadCnt: 'DESC', // 다운로드 횟수 내림차순 정렬
      },
      take: 5, // 상위 5개만 가져오기
    });
    return videos;
  }
}
