/**
 * 이메일 발송 서비스
 *
 * ===== 🚀 초보자를 위한 이메일 서비스 개념 설명 =====
 *
 * **이메일 서비스의 역할:**
 * - 시스템에서 자동으로 이메일을 발송하는 서비스
 * - 사용자 알림, 리포트, 시스템 알림 등을 담당
 * - SMTP(Simple Mail Transfer Protocol)를 사용하여 메일 서버와 통신
 *
 * **주요 사용 사례:**
 * 1. 사용자 회원가입 확인 메일
 * 2. 비밀번호 재설정 메일
 * 3. 시스템 알림 및 리포트
 * 4. 마케팅 메일 (뉴스레터 등)
 *
 * **개발 환경 vs 운영 환경:**
 * - 개발: 실제 메일 발송 없이 로그만 출력
 * - 운영: 실제 SMTP 서버를 통해 메일 발송
 *
 * ===== 🔧 SMTP 설정 이해 =====
 *
 * **Gmail SMTP 설정 예시:**
 * - 서버: smtp.gmail.com
 * - 포트: 587 (TLS) 또는 465 (SSL)
 * - 보안: 2단계 인증 + 앱 비밀번호 사용 필수
 *
 * **기타 메일 서비스:**
 * - Outlook: smtp.live.com (587)
 * - Yahoo: smtp.mail.yahoo.com (587)
 * - 사내 메일 서버: 자체 SMTP 설정
 */

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Video } from 'src/video/entity/video.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService, private readonly configService: ConfigService) {}

  /**
   * 인기 비디오 분석 리포트를 이메일로 발송
   *
   * ===== 📋 메서드 상세 분석 =====
   *
   * **입력 데이터 처리:**
   * - Video 엔티티 배열을 받아서 HTML 테이블로 변환
   * - map() 함수를 사용한 데이터 변환 패턴
   *
   * **HTML 템플릿 생성:**
   * - 인라인 스타일을 사용한 이메일 친화적 HTML
   * - 테이블 구조로 데이터를 체계적으로 표현
   *
   * **에러 처리:**
   * - 개발 환경에서는 로그만 출력
   * - 운영 환경에서는 실제 메일 발송 시도
   *
   * ===== 💡 실제 사용 시나리오 =====
   * ```typescript
   * // 스케줄러에서 매일 실행
   * @Cron('0 10 * * *') // 매일 오전 10시
   * async sendDailyReport() {
   *   const topVideos = await this.videoService.getTopVideos(5);
   *   await this.emailService.send(topVideos);
   * }
   * ```
   *
   * @param videos 전송할 비디오 목록 (일반적으로 TOP 5 인기 비디오)
   */
  async send(videos: Video[]) {
    // 🔍 이메일 서비스 활성화 여부 확인
    const emailEnabled = this.configService.get<boolean>('email.enabled');

    if (!emailEnabled) {
      // 📝 개발 환경에서는 로그만 출력
      this.logger.log('📧 이메일 서비스가 비활성화되어 있습니다 (개발 환경)');
      this.logger.log('📊 일일 인기 비디오 리포트:');
      videos.forEach((video, index) => {
        this.logger.log(`${index + 1}. ${video.title} (다운로드: ${video.downloadCnt}회)`);
      });
      return;
    }

    try {
      // 🎨 비디오 정보를 HTML 테이블 행으로 변환
      const data = videos.map(({ id, title, downloadCnt }, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        return `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #667eea;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${id}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${title}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${downloadCnt}</td>
          </tr>
        `;
      });

      // 📧 실제 이메일 발송
      await this.mailerService.sendMail({
        from: this.configService.get<string>('email.user'),
        to: 'admin@example.com',
        subject: '🎥 Fastcampus NestJS - 일일 인기 비디오 리포트',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">🎥 일일 인기 비디오 리포트</h2>
            <p style="color: #666; text-align: center;">
              ${new Date().toLocaleDateString('ko-KR')} 기준 다운로드 순위 TOP ${videos.length} 비디오 목록입니다.
            </p>

            <table style="border: 1px solid #ddd; width: 100%; margin: 20px auto; text-align: center; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                  <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">순위</th>
                  <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">비디오 ID</th>
                  <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">제목</th>
                  <th style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">다운로드 횟수</th>
                </tr>
              </thead>
              <tbody>
                ${data.join('')}
              </tbody>
            </table>

            <div style="margin-top: 30px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                📅 <strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}<br>
                🔄 <strong>발송 주기:</strong> 매일 오전 10시 자동 발송<br>
                ⚙️ <strong>시스템:</strong> NestJS 자동화 리포트 시스템
              </p>
            </div>

            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
              이 메일은 시스템에서 자동으로 발송되었습니다. 문의사항이 있으시면 시스템 관리자에게 연락해주세요.
            </p>
          </div>
        `,
      });

      this.logger.log(`📧 인기 비디오 리포트 이메일이 성공적으로 발송되었습니다. (비디오 ${videos.length}개)`);
    } catch (error) {
      // 🚨 이메일 발송 실패 시 에러 로깅
      this.logger.error('📧 이메일 발송 중 오류 발생:', error.message);

      // 💡 개발 환경에서는 에러를 던지지 않고 로그만 남김
      if (process.env.NODE_ENV === 'production') {
        throw error; // 운영 환경에서는 에러를 다시 던져서 상위에서 처리
      }
    }
  }
}

/**
 * ===== 🎓 추가 학습 자료 =====
 *
 * **1. 이메일 템플릿 엔진 활용**
 * ```typescript
 * // Handlebars 템플릿 사용 예시
 * await this.mailerService.sendMail({
 *   template: 'report', // templates/report.hbs
 *   context: { videos, date: new Date() }
 * });
 * ```
 *
 * **2. 첨부파일 지원**
 * ```typescript
 * await this.mailerService.sendMail({
 *   attachments: [
 *     { filename: 'report.pdf', content: pdfBuffer },
 *     { filename: 'logo.png', path: './assets/logo.png' }
 *   ]
 * });
 * ```
 *
 * **3. 대량 메일 발송 최적화**
 * ```typescript
 * // 배치 처리로 메일 발송
 * const chunks = this.chunkArray(recipients, 10);
 * for (const chunk of chunks) {
 *   await Promise.all(chunk.map(email => this.sendMail(email)));
 *   await this.delay(1000); // Rate limiting
 * }
 * ```
 *
 * **4. 메일 발송 상태 추적**
 * ```typescript
 * interface EmailLog {
 *   to: string;
 *   subject: string;
 *   status: 'pending' | 'sent' | 'failed';
 *   sentAt?: Date;
 *   error?: string;
 * }
 * ```
 *
 * **실습 과제:**
 * 1. 사용자별 개인화된 메일 발송 기능 구현
 * 2. 메일 발송 실패 시 재시도 로직 추가
 * 3. 메일 발송 통계 및 모니터링 기능 구현
 */
