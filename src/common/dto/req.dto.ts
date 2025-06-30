/**
 * 공통 요청 DTO (Data Transfer Object) 클래스들
 *
 * DTO는 계층 간 데이터 전송을 위한 객체로, 주로 다음 목적으로 사용됩니다:
 * 1. API 요청/응답 데이터의 구조 정의
 * 2. 데이터 유효성 검증 (class-validator)
 * 3. 데이터 변환 (class-transformer)
 * 4. API 문서 자동 생성 (Swagger)
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

/**
 * 페이지네이션 요청을 위한 공통 DTO
 *
 * 대부분의 목록 조회 API에서 공통으로 사용되는 페이지네이션 파라미터를 정의합니다.
 * 클라이언트가 많은 데이터를 한 번에 받지 않고 페이지 단위로 나누어 받을 수 있게 합니다.
 *
 * 사용 예시:
 * GET /api/videos?page=2&size=10
 * -> 2페이지, 페이지당 10개씩 비디오 목록 조회
 */
export class PageReqDto {
  /**
   * 조회할 페이지 번호 (1부터 시작)
   *
   * @ApiPropertyOptional: Swagger 문서에서 선택적 파라미터로 표시
   * @Transform: 문자열로 전달된 값을 숫자로 변환 (쿼리 파라미터는 문자열로 전달됨)
   * @IsInt: 정수 여부 검증
   */
  @ApiPropertyOptional({ description: '페이지. default = 1' })
  @Transform((param) => Number(param.value))
  @IsInt()
  page?: number = 1;

  /**
   * 한 페이지당 조회할 데이터 개수
   *
   * 서버 부하를 고려하여 적절한 기본값과 최대값을 설정하는 것이 좋습니다.
   * 너무 큰 값은 서버 성능에 영향을 줄 수 있습니다.
   */
  @ApiPropertyOptional({ description: '페이지당 데이터 갯수. default = 20' })
  @Transform((param) => Number(param.value))
  @IsInt()
  size?: number = 20;
}
