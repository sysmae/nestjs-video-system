/**
 * 비디오 정보를 저장하는 데이터베이스 엔티티
 * TypeORM을 사용하여 PostgreSQL 데이터베이스의 video 테이블과 매핑됩니다.
 */

import { User } from 'src/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity() // 이 클래스가 데이터베이스 테이블과 매핑되는 엔티티임을 표시
export class Video {
  /**
   * 비디오 고유 식별자
   * UUID 형태로 자동 생성되는 기본 키
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 비디오 제목
   */
  @Column()
  title: string;

  /**
   * 비디오 파일의 MIME 타입
   * 예: 'video/mp4', 'video/avi' 등
   */
  @Column()
  mimetype: string;

  /**
   * 비디오 다운로드 횟수
   * 기본값은 0으로 설정되며, 다운로드할 때마다 증가합니다
   */
  @Column({ name: 'download_cnt', default: 0 })
  downloadCnt: number;

  /**
   * 비디오 업로드 시각
   * 레코드가 생성될 때 자동으로 현재 시간이 저장됩니다
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 비디오 정보 마지막 수정 시각
   * 레코드가 업데이트될 때마다 자동으로 현재 시간으로 갱신됩니다
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 비디오를 업로드한 사용자
   * 다수의 비디오가 하나의 사용자에 속할 수 있습니다 (N:1 관계)
   */
  @ManyToOne(() => User, (user) => user.videos)
  @JoinColumn({ name: 'user_id' }) // 외래키 컬럼명 지정
  user: User;
}
