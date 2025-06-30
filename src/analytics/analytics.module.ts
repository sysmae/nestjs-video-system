/**
 * 분석(Analytics) 모듈
 * 비디오 다운로드 통계, 사용자 활동 분석 등의 기능을 제공합니다.
 * 스케줄링을 통해 정기적으로 분석 작업을 수행하고 이메일 리포트를 발송합니다.
 */

import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ScheduleModule } from '@nestjs/schedule';
import { VideoModule } from 'src/video/video.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 스케줄링 기능 활성화
    VideoModule, // 비디오 데이터 접근을 위한 모듈
    EmailModule, // 분석 리포트 이메일 발송을 위한 모듈
  ],
  providers: [AnalyticsService], // 분석 서비스 등록
  exports: [AnalyticsService], // 다른 모듈에서 사용할 수 있도록 내보내기
})
export class AnalyticsModule {}
