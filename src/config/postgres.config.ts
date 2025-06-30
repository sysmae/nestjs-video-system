/**
 * PostgreSQL 데이터베이스 연결 설정
 * 환경 변수를 통해 데이터베이스 연결 정보를 구성합니다.
 * 환경 변수가 없을 경우 기본값을 사용합니다.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('postgres', () => ({
  host: process.env.POSTGRES_HOST || 'localhost', // 데이터베이스 호스트
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5434, // 포트 번호
  database: process.env.POSTGRES_DATABASE || 'postgres', // 데이터베이스 이름
  username: process.env.POSTGRES_USERNAME || 'postgres', // 사용자명
  password: process.env.POSTGRES_PASSWORD || 'postgres', // 비밀번호
}));
