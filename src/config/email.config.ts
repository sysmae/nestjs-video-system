/**
 * 이메일 서비스 설정
 *
 * 애플리케이션에서 이메일 전송을 위한 SMTP 인증 정보를 관리합니다.
 * 일반적으로 사용자 회원가입 확인, 비밀번호 재설정, 알림 등의 용도로 사용됩니다.
 *
 * 지원하는 이메일 서비스:
 * - Gmail: app password 또는 OAuth2 사용 권장
 * - Outlook/Hotmail: app password 사용
 * - 기타 SMTP 서비스: 해당 서비스의 인증 정보 사용
 *
 * 보안 주의사항:
 * - 이메일 계정의 실제 패스워드 대신 앱 전용 패스워드 사용 권장
 * - 환경 변수를 통해 민감한 정보 관리 필수
 * - 운영 환경에서는 별도의 이메일 계정 사용 권장
 *
 * 환경 변수:
 * - EMAIL_USER: SMTP 서버 로그인용 이메일 주소
 * - EMAIL_PASS: 이메일 계정의 패스워드 또는 앱 전용 패스워드
 */

import { registerAs } from '@nestjs/config';

/**
 * 이메일 설정 객체를 생성하는 팩토리 함수
 * @nestjs/config의 registerAs를 사용하여 'email' 네임스페이스로 등록
 *
 * 사용 예시:
 * - EmailService에서 this.configService.get('email.user') 형태로 접근
 * - NodeMailer 설정 시 SMTP 인증 정보로 활용
 */
export default registerAs('email', () => ({
  // SMTP 서버 로그인용 이메일 주소
  // 개발 환경에서는 빈 값이어도 됨 (메일 서비스 비활성화)
  user: process.env.EMAIL_USER || 'dev@example.com',
  // 이메일 계정의 패스워드 (앱 전용 패스워드 권장)
  // 개발 환경에서는 더미 값 사용
  pass: process.env.EMAIL_PASS || 'dev-password',
  // 개발 환경에서 메일 서비스 비활성화 플래그
  enabled: process.env.EMAIL_ENABLED === 'true' || false,
}));
