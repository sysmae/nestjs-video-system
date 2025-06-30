/**
 * 리프레시 토큰 엔티티
 * 사용자의 JWT 리프레시 토큰을 저장하는 데이터베이스 테이블과 매핑됩니다.
 * 액세스 토큰이 만료되었을 때 새로운 토큰을 발급받기 위해 사용됩니다.
 * 한 사용자당 하나의 리프레시 토큰만 가질 수 있습니다 (1:1 관계).
 */

import { User } from 'src/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity() // 이 클래스가 데이터베이스 테이블과 매핑되는 엔티티임을 표시
export class RefreshToken {
  /**
   * 리프레시 토큰 고유 식별자
   * UUID 형태로 자동 생성되는 기본 키
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * JWT 리프레시 토큰 문자열
   * 새로운 액세스 토큰 발급 시 검증에 사용됩니다
   */
  @Column()
  token: string;

  /**
   * 토큰 생성 시각
   * 레코드가 생성될 때 자동으로 현재 시간이 저장됩니다
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 토큰 마지막 업데이트 시각
   * 토큰이 갱신될 때마다 자동으로 현재 시간으로 갱신됩니다
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 이 토큰을 소유한 사용자
   * 한 사용자는 하나의 리프레시 토큰만 가질 수 있습니다 (1:1 관계)
   */
  @OneToOne(() => User, (user) => user.refreshToken)
  @JoinColumn({ name: 'user_id' }) // 외래키 컬럼명 지정
  user: User;
}
