/**
 * TypeORM 데이터베이스 연결 설정
 *
 * TypeORM은 TypeScript/JavaScript용 객체 관계 매핑(ORM) 라이브러리입니다.
 * 이 파일은 PostgreSQL 데이터베이스와의 연결을 위한 설정을 정의합니다.
 *
 * 주요 기능:
 * - 데이터베이스 연결 관리
 * - 엔티티 자동 감지 및 등록
 * - 마이그레이션 실행 및 관리
 * - 개발/운영 환경별 설정 분리
 *
 * 환경 변수를 통한 설정 관리:
 * - POSTGRES_HOST: 데이터베이스 호스트 (기본값: localhost)
 * - POSTGRES_PORT: 데이터베이스 포트 (기본값: 5434)
 * - POSTGRES_DATABASE: 데이터베이스 이름 (기본값: postgres)
 * - POSTGRES_USERNAME: 사용자명 (기본값: postgres)
 * - POSTGRES_PASSWORD: 패스워드 (기본값: postgres)
 */

import { DataSource } from 'typeorm';

/**
 * 애플리케이션 전역에서 사용할 TypeORM DataSource 인스턴스
 *
 * DataSource는 TypeORM에서 데이터베이스 연결을 관리하는 핵심 클래스입니다.
 * 엔티티 매니저, 리포지토리, 마이그레이션 등의 기능을 제공합니다.
 */
export const AppDataSource = new DataSource({
  // 데이터베이스 타입 (MySQL, MariaDB, SQLite, Oracle, MSSQL 등도 지원)
  type: 'postgres',

  // 데이터베이스 서버 호스트 주소
  host: process.env.POSTGRES_HOST || 'localhost',

  // 데이터베이스 서버 포트 번호
  port: Number(process.env.POSTGRES_PORT || '5434'),

  // 연결할 데이터베이스 이름
  database: process.env.POSTGRES_DATABASE || 'postgres',

  // 데이터베이스 사용자명
  username: process.env.POSTGRES_USERNAME || 'postgres',

  // 데이터베이스 패스워드
  password: process.env.POSTGRES_PASSWORD || 'postgres',

  // 엔티티 파일들의 위치 패턴
  // 모든 하위 디렉토리에서 .entity.ts 또는 .entity.js 파일을 자동으로 찾아 등록
  entities: [__dirname + '/**/*.entity{.ts,.js}'],

  // 스키마 자동 동기화 설정 (운영 환경에서는 반드시 false로 설정)
  // true로 설정하면 엔티티 변경 시 자동으로 테이블 구조가 변경되어 데이터 손실 위험
  synchronize: false,

  // 마이그레이션 파일들의 위치 패턴
  // 데이터베이스 스키마 변경 이력을 관리하는 파일들
  migrations: [__dirname + '/**/migrations/*{.ts,.js}'],

  // 마이그레이션 실행 기록을 저장할 테이블 이름
  migrationsTableName: 'migrations',
});
