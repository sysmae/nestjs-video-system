/**
 * 인증 관련 HTTP 요청을 처리하는 컨트롤러
 * 회원가입, 로그인, 토큰 갱신 등의 API 엔드포인트를 제공합니다.
 */

import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { SigninReqDto, SignupReqDto } from './dto/req.dto';
import { RefreshResDto, SigninResDto, SignupResDto } from './dto/res.dto';
import { ApiPostResponse } from 'src/common/decorator/swagger.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { UserAfterAuth } from 'src/common/decorator/user.decorator';

@ApiTags('Auth') // Swagger에서 'Auth' 태그로 그룹핑
@ApiExtraModels(SignupResDto, SigninResDto, RefreshResDto) // Swagger 모델 정의
@Controller('api/auth') // '/api/auth' 경로의 요청을 처리
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 회원가입 API
   * 새로운 사용자를 등록하고 액세스/리프레시 토큰을 발급합니다.
   */
  @ApiPostResponse(SignupResDto) // Swagger 응답 문서화
  @Public() // JWT 인증을 거치지 않는 공개 엔드포인트
  @Post('signup')
  async signup(@Body() { email, password, passwordConfirm }: SignupReqDto): Promise<SignupResDto> {
    // 비밀번호와 비밀번호 확인이 일치하는지 검증
    if (password !== passwordConfirm) throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    const { id, accessToken, refreshToken } = await this.authService.signup(email, password);
    return { id, accessToken, refreshToken };
  }

  /**
   * 로그인 API
   * 이메일과 비밀번호로 사용자를 인증하고 토큰을 발급합니다.
   */
  @ApiPostResponse(SigninResDto)
  @Public() // JWT 인증을 거치지 않는 공개 엔드포인트
  @Post('signin')
  async signin(@Body() { email, password }: SigninReqDto) {
    return this.authService.signin(email, password);
  }

  /**
   * 토큰 갱신 API
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.
   */
  @ApiPostResponse(RefreshResDto)
  @ApiBearerAuth() // Swagger에서 Bearer 토큰 인증 표시
  @Post('refresh')
  async refresh(@Headers('authorization') authorization, @User() user: UserAfterAuth) {
    // Authorization 헤더에서 Bearer 토큰 추출
    const token = /Bearer\s(.+)/.exec(authorization)[1];
    const { accessToken, refreshToken } = await this.authService.refresh(token, user.id);
    return { accessToken, refreshToken };
  }
}
