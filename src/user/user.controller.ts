/**
 * 사용자(User) 컨트롤러
 * 사용자 계정 조회 및 관리 기능을 제공하는 API 엔드포인트들입니다.
 * 관리자 권한이 필요한 기능과 일반 사용자가 접근 가능한 기능을 구분하여 제공합니다.
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { FindUserReqDto } from './dto/req.dto';
import { PageReqDto } from 'src/common/dto/req.dto';
import { ApiGetItemsResponse, ApiGetResponse } from 'src/common/decorator/swagger.decorator';
import { FindUserResDto } from './dto/res.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from './enum/user.enum';

@ApiTags('User') // Swagger에서 'User' 태그로 그룹핑
@ApiExtraModels(FindUserReqDto, FindUserResDto) // Swagger 모델 정의
@Controller('api/users') // '/api/users' 경로의 요청을 처리
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 전체 사용자 목록 조회 API (관리자 전용)
   * 페이지네이션을 지원하며, 관리자 권한이 있는 사용자만 접근 가능합니다.
   *
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @returns 사용자 목록 (ID, 이메일, 생성일시)
   */
  @ApiBearerAuth() // JWT 인증 필요
  @ApiGetItemsResponse(FindUserResDto)
  @Roles(Role.Admin) // 관리자 권한 필요
  @Get()
  async findAll(@Query() { page, size }: PageReqDto): Promise<FindUserResDto[]> {
    const users = await this.userService.findAll(page, size);

    // 응답 데이터 변환 (필요한 필드만 반환, 날짜를 ISO 문자열로 변환)
    return users.map(({ id, email, createdAt }) => {
      return { id, email, createdAt: createdAt.toISOString() };
    });
  }

  /**
   * 특정 사용자 상세 조회 API
   * 사용자 ID로 특정 사용자의 상세 정보를 조회합니다.
   *
   * @param id 조회할 사용자 ID
   * @returns 사용자 상세 정보
   */
  @ApiBearerAuth() // JWT 인증 필요
  @ApiGetResponse(FindUserResDto)
  @Get(':id')
  findOne(@Param() { id }: FindUserReqDto) {
    return this.userService.findOne(id);
  }
}
