/**
 * 이메일 서비스 모듈
 * Gmail SMTP를 사용하여 이메일 발송 기능을 제공합니다.
 * 분석 리포트, 알림 메일 등을 자동으로 발송할 수 있습니다.
 */

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Mailer 모듈을 비동기적으로 설정 (환경 변수 사용)
    MailerModule.forRootAsync({
      inject: [ConfigService], // ConfigService를 주입하여 환경 변수 접근
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com', // Gmail SMTP 서버
          port: 587, // SMTP 포트 (TLS)
          auth: {
            user: configService.get('email.user'), // Gmail 계정 이메일
            pass: configService.get('email.pass'), // Gmail 앱 비밀번호
          },
        },
      }),
    }),
  ],
  providers: [EmailService], // 이메일 서비스 등록
  exports: [EmailService], // 다른 모듈에서 사용할 수 있도록 내보내기
})
export class EmailModule {}
