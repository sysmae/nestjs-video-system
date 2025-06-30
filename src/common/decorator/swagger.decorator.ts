/**
 * Swagger API 문서화를 위한 커스텀 데코레이터 모음
 * API 응답 스키마를 자동으로 생성하여 일관된 API 문서를 제공합니다.
 * 각 데코레이터는 다양한 HTTP 메서드와 응답 형태에 맞는 스키마를 정의합니다.
 */

import { Type, applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageResDto } from '../dto/res.dto';

/**
 * GET 요청 단일 아이템 응답을 위한 Swagger 데코레이터
 *
 * 사용 예시:
 * @ApiGetResponse(UserResDto)
 * @Get(':id')
 * findOne(@Param('id') id: string) { ... }
 *
 * @param model 응답 데이터의 타입 모델 (예: UserResDto, VideoResDto)
 * @returns ApiOkResponse 데코레이터가 적용된 함수
 */
export const ApiGetResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 200 OK 응답에 대한 스키마 정의
    ApiOkResponse({
      schema: {
        // 전달받은 모델의 스키마를 참조하여 응답 구조 정의
        allOf: [{ $ref: getSchemaPath(model) }],
      },
    }),
  );
};

/**
 * POST 요청 생성 응답을 위한 Swagger 데코레이터
 *
 * 사용 예시:
 * @ApiPostResponse(UserResDto)
 * @Post()
 * create(@Body() createUserDto: CreateUserDto) { ... }
 *
 * @param model 생성된 리소스의 응답 타입 모델
 * @returns ApiCreatedResponse 데코레이터가 적용된 함수
 */
export const ApiPostResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 201 Created 응답에 대한 스키마 정의
    ApiCreatedResponse({
      schema: {
        // 전달받은 모델의 스키마를 참조하여 응답 구조 정의
        allOf: [{ $ref: getSchemaPath(model) }],
      },
    }),
  );
};

/**
 * GET 요청 페이지네이션 목록 응답을 위한 Swagger 데코레이터
 * PageResDto를 기반으로 한 페이지네이션 구조에 아이템 배열을 포함합니다.
 *
 * 응답 구조:
 * {
 *   page: number,      // 현재 페이지
 *   take: number,      // 한 페이지당 아이템 수
 *   total: number,     // 전체 아이템 수
 *   items: TModel[]    // 실제 데이터 배열
 * }
 *
 * 사용 예시:
 * @ApiGetItemsResponse(VideoResDto)
 * @Get()
 * findAll(@Query() query: FindVideosQuery) { ... }
 *
 * @param model 목록에 포함될 아이템의 타입 모델
 * @returns ApiOkResponse 데코레이터가 적용된 함수 (페이지네이션 구조 포함)
 */
export const ApiGetItemsResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    // HTTP 200 OK 응답에 대한 페이지네이션 스키마 정의
    ApiOkResponse({
      schema: {
        allOf: [
          // 기본 페이지네이션 구조 (PageResDto)
          { $ref: getSchemaPath(PageResDto) },
          {
            // 추가로 items 배열 속성 정의
            properties: {
              items: {
                type: 'array', // items는 배열 타입
                items: { $ref: getSchemaPath(model) }, // 각 배열 요소는 전달받은 모델 타입
              },
            },
            required: ['items'], // items 속성은 필수
          },
        ],
      },
    }),
  );
};
