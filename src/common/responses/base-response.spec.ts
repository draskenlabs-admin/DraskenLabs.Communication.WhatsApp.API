import { HttpException } from '@nestjs/common';
import { BaseResponse } from './base-response';

describe('BaseResponse', () => {
  describe('success()', () => {
    it('sets statusCode 200, default message, and data', () => {
      const result = BaseResponse.success({ id: 1 });
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Success');
      expect(result.data).toEqual({ id: 1 });
    });

    it('accepts a custom message', () => {
      const result = BaseResponse.success('ok', 'Done');
      expect(result.message).toBe('Done');
    });
  });

  describe('created()', () => {
    it('sets statusCode 201', () => {
      const result = BaseResponse.created({ id: 2 });
      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual({ id: 2 });
    });
  });

  describe('redirect()', () => {
    it('throws an HttpException with the given status', () => {
      expect(() => BaseResponse.redirect(302, '/new-url')).toThrow(HttpException);
      try {
        BaseResponse.redirect(302, '/new-url');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(302);
      }
    });
  });

  describe('error()', () => {
    it('throws an HttpException with statusCode and message', () => {
      expect(() => BaseResponse.error(400, 'Bad input')).toThrow(HttpException);
      try {
        BaseResponse.error(400, 'Bad input');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(400);
        const body = (e as HttpException).getResponse() as BaseResponse<unknown>;
        expect(body.message).toBe('Bad input');
      }
    });
  });

  describe('fieldError()', () => {
    it('throws HttpException with field errors and 422 status', () => {
      const errors = [{ field: 'email', message: 'invalid' }];
      expect(() => BaseResponse.fieldError(422, errors)).toThrow(HttpException);
      try {
        BaseResponse.fieldError(422, errors);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(422);
        const body = (e as HttpException).getResponse() as BaseResponse<unknown>;
        expect(body.message).toBe('Field Validation Failed');
        expect(body.errors).toEqual(errors);
      }
    });
  });

  describe('paginate()', () => {
    it('sets statusCode 200, data, and meta', () => {
      const result = BaseResponse.paginate([1, 2, 3], 30, 3, 1, 10);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta).toEqual({ total: 30, totalPages: 3, page: 1, limit: 10 });
    });
  });
});
