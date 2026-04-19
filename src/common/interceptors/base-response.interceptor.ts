import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { BaseResponse } from '../responses/base-response';

@Injectable()
export class BaseResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    return next.handle().pipe(
      map((data: T | BaseResponse<T>) => {
        if (data instanceof StreamableFile) {
          return data as never;
        }

        if (
          typeof data === 'object' &&
          data !== null &&
          'statusCode' in data &&
          'message' in data &&
          ('data' in data || 'errors' in data)
        ) {
          return data as BaseResponse<T>;
        }

        return BaseResponse.success(data as T);
      }),
    );
  }
}
