/**
 * 사용자 정보를 저장하는 데이터베이스 엔티티
 * TypeORM을 사용하여 PostgreSQL 데이터베이스의 user 테이블과 매핑됩니다.
 */

import { RefreshToken } from 'src/auth/entity/refresh-token.entity';
import { Video } from 'src/video/entity/video.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enum/user.enum';

@Entity() // 이 클래스가 데이터베이스 테이블과 매핑되는 엔티티임을 표시
export class User {
  /**
   * 사용자 고유 식별자
   * UUID 형태로 자동 생성되는 기본 키
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 사용자 이메일 주소
   * 중복을 허용하지 않는 고유 값
   */
  @Column({ unique: true })
  email: string;

  /**
   * 사용자 비밀번호
   * bcrypt로 해시화되어 저장됩니다
   */
  @Column()
  password: string;

  /**
   * 사용자 권한 레벨
   * 기본값은 일반 사용자(User)로 설정됩니다
   */
  @Column({ type: 'enum', enum: Role })
  role: Role = Role.User;

  /**
   * 계정 생성 시각
   * 레코드가 생성될 때 자동으로 현재 시간이 저장됩니다
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 계정 정보 마지막 수정 시각
   * 레코드가 업데이트될 때마다 자동으로 현재 시간으로 갱신됩니다
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 사용자가 업로드한 비디오 목록
   * 한 사용자는 여러 개의 비디오를 가질 수 있습니다 (1:N 관계)
   */
  @OneToMany(() => Video, (video) => video.user)
  videos: Video[];

  /**
   * 사용자의 리프레시 토큰
   * 한 사용자는 하나의 리프레시 토큰을 가집니다 (1:1 관계)
   */
  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;
}
