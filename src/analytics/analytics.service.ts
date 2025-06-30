/**
 * 분석(Analytics) 서비스
 * 비디오 플랫폼의 통계 데이터를 분석하고 정기적으로 리포트를 생성합니다.
 * 스케줄러를 사용하여 매일 정해진 시간에 자동으로 분석 작업을 수행합니다.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from 'src/email/email.service';
import { VideoService } from 'src/video/video.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly videoService: VideoService, // 비디오 데이터 조회를 위한 서비스
    private readonly emailService: EmailService, // 이메일 발송을 위한 서비스
  ) {}

  /**
   * 매일 오전 10시에 실행되는 이메일 리포트 작업
   * 인기 비디오 TOP 5 목록을 조회하여 관리자에게 이메일로 발송합니다.
   *
   * @Cron 데코레이터를 사용하여 스케줄링 설정
   * CronExpression.EVERY_DAY_AT_10AM = "0 0 10 * * *" (매일 오전 10시)
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleEmailCron() {
    Logger.log('일일 분석 리포트 이메일 발송 작업 시작');

    try {
      // 다운로드 횟수 기준으로 인기 비디오 TOP 5 조회
      const videos = await this.videoService.findTop5Download();

      // 조회된 비디오 목록을 이메일로 발송
      await this.emailService.send(videos);

      Logger.log(`분석 리포트 이메일 발송 완료 - 총 ${videos.length}개의 인기 비디오 정보 전송`);
    } catch (error) {
      Logger.error('분석 리포트 이메일 발송 중 오류 발생:', error);
    }
  }
}
