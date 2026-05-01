import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

function makeHost(mockResponse: { status: jest.Mock; json: jest.Mock }) {
  const jsonFn = mockResponse.json;
  const statusFn = mockResponse.status.mockReturnValue({ json: jsonFn });
  return {
    switchToHttp: () => ({ getResponse: () => ({ status: statusFn, json: jsonFn }) }),
  } as any;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let host: ReturnType<typeof makeHost>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    host = makeHost({ status: mockStatus, json: mockJson });
  });

  describe('HttpException', () => {
    it('forwards a structured exception response as-is', () => {
      const body = { statusCode: 404, message: 'Not found', data: null };
      const exception = new HttpException(body, 404);
      filter.catch(exception, host);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(body);
    });

    it('formats a string exception message into the standard shape', () => {
      const exception = new HttpException('Forbidden resource', 403);
      filter.catch(exception, host);
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, message: 'Forbidden resource' }),
      );
    });

    it('handles NestJS built-in exceptions like NotFoundException', () => {
      const exception = new NotFoundException('Item not found');
      filter.catch(exception, host);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });
  });

  describe('non-HTTP exception', () => {
    it('returns 500 for an unknown Error', () => {
      filter.catch(new Error('Something exploded'), host);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unexpected server error',
        }),
      );
    });

    it('returns 500 for a thrown non-Error value', () => {
      filter.catch('oops', host);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
