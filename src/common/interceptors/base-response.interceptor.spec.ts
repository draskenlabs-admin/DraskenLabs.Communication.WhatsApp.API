import { ExecutionContext, StreamableFile } from '@nestjs/common';
import { of } from 'rxjs';
import { BaseResponseInterceptor } from './base-response.interceptor';
import { BaseResponse } from '../responses/base-response';

function makeCallHandler(returnValue: unknown) {
  return { handle: () => of(returnValue) };
}

const mockContext = {} as ExecutionContext;

describe('BaseResponseInterceptor', () => {
  let interceptor: BaseResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new BaseResponseInterceptor();
  });

  it('passes StreamableFile through unchanged', (done) => {
    const file = new StreamableFile(Buffer.from(''));
    interceptor.intercept(mockContext, makeCallHandler(file)).subscribe((result) => {
      expect(result).toBe(file);
      done();
    });
  });

  it('passes through a pre-wrapped BaseResponse unchanged', (done) => {
    const wrapped = BaseResponse.success({ id: 1 });
    interceptor.intercept(mockContext, makeCallHandler(wrapped)).subscribe((result) => {
      expect(result).toBe(wrapped);
      done();
    });
  });

  it('wraps plain object data in BaseResponse.success()', (done) => {
    const data = { id: 1, name: 'test' };
    interceptor.intercept(mockContext, makeCallHandler(data)).subscribe((result) => {
      expect(result).toBeInstanceOf(BaseResponse);
      expect((result as BaseResponse<typeof data>).statusCode).toBe(200);
      expect((result as BaseResponse<typeof data>).data).toEqual(data);
    });
    done();
  });

  it('wraps null data in BaseResponse.success()', (done) => {
    interceptor.intercept(mockContext, makeCallHandler(null)).subscribe((result) => {
      expect(result).toBeInstanceOf(BaseResponse);
      expect((result as BaseResponse<null>).data).toBeNull();
      done();
    });
  });

  it('wraps primitive string in BaseResponse.success()', (done) => {
    interceptor.intercept(mockContext, makeCallHandler('hello')).subscribe((result) => {
      expect((result as BaseResponse<string>).data).toBe('hello');
      done();
    });
  });
});
