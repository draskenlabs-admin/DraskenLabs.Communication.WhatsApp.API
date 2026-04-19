import { HttpException } from '@nestjs/common';
import { FieldErrorResponse } from './field-error.util';

export class BaseResponse<T> {
  public statusCode: number;
  public message: string;
  public data: T;
  public errors?: FieldErrorResponse[];
  public meta?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };

  public static success<T>(
    data: T,
    message: string = 'Success',
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = 200;
    response.message = message;
    response.data = data;
    return response;
  }

  public static created<T>(
    data: T,
    message: string = 'Success',
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = 201;
    response.message = message;
    response.data = data;
    return response;
  }

  public static redirect<T>(
    status: number,
    data: T,
    message: string = 'Redirect',
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = status;
    response.message = message;
    response.data = data;
    throw new HttpException(response, status);
  }

  public static error<T>(
    statusCode: number,
    message: string,
    errors: any = undefined,
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = statusCode;
    response.message = message;
    response.errors = errors;
    throw new HttpException(response, statusCode);
  }

  public static fieldError<T>(
    statusCode: number,
    errors: FieldErrorResponse[],
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = statusCode;
    response.message = 'Field Validation Failed';
    response.errors = errors;
    throw new HttpException(response, statusCode);
  }

  public static paginate<T>(
    data: T,
    total: number,
    totalPages: number,
    page: number,
    limit: number,
  ): BaseResponse<T> {
    const response = new BaseResponse<T>();
    response.statusCode = 200;
    response.message = 'Success';
    response.data = data;
    response.meta = {
      total,
      totalPages,
      page,
      limit,
    };
    return response;
  }
}
