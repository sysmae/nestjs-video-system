/**
 * 이메일 발송 서비스
 * Gmail SMTP를 통해 다양한 종류의 이메일을 발송합니다.
 * 주로 분석 리포트나 시스템 알림 메일 전송에 사용됩니다.
 */

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Video } from 'src/video/entity/video.entity';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * 인기 비디오 분석 리포트를 이메일로 발송
   * 비디오 목록을 HTML 테이블 형태로 구성하여 관리자에게 전송합니다.
   *
   * @param videos 전송할 비디오 목록 (일반적으로 TOP 5 인기 비디오)
   */
  async send(videos: Video[]) {
    // 비디오 정보를 HTML 테이블 행으로 변환
    const data = videos.map(({ id, title, downloadCnt }) => {
      return `<tr><td>${id}</td><td>${title}</td><td>${downloadCnt}</td></tr>`;
    });

    // 이메일 발송
    await this.mailerService.sendMail({
      from: 'nestjs2023@gmail.com', // 발신자 이메일 (설정에서 가져와야 함)
      to: 'fresh502@gmail.com', // 수신자 이메일 (관리자)
      subject: 'Fastcampus NestJS 프로젝트 - 일일 인기 비디오 리포트', // 제목
      html: `
        <h2>🎥 일일 인기 비디오 리포트</h2>
        <p>오늘의 다운로드 순위 TOP ${videos.length} 비디오 목록입니다.</p>
        <table style="border: 1px solid black; width: 60%; margin: auto; text-align: center; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid black; padding: 8px;">비디오 ID</th>
              <th style="border: 1px solid black; padding: 8px;">제목</th>
              <th style="border: 1px solid black; padding: 8px;">다운로드 횟수</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((row) => row.replace(/<td>/g, '<td style="border: 1px solid black; padding: 8px;">')).join('')}
          </tbody>
        </table>
        <p><small>이 리포트는 매일 오전 10시에 자동으로 발송됩니다.</small></p>
      `,
    });
  }
}
