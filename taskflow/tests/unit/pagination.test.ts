import { getOffsetPagination, getCursorPagination, formatCursorResponse } from '../../src/utils/pagination';

describe('Pagination Utility', () => {
  describe('getOffsetPagination', () => {
    it('should calculate offset correctly for page 1', () => {
      const result = getOffsetPagination(10, 1);
      expect(result).toEqual({ skip: 0, take: 10, page: 1, limit: 10 });
    });

    it('should calculate offset correctly for page 3', () => {
      const result = getOffsetPagination(10, 3);
      expect(result).toEqual({ skip: 20, take: 10, page: 3, limit: 10 });
    });
  });

  describe('getCursorPagination', () => {
    it('should return correct params without cursor', () => {
      const result = getCursorPagination(10);
      expect(result).toEqual({ take: 11, skip: 0 });
    });

    it('should return correct params with cursor', () => {
      const result = getCursorPagination(10, 'my-cursor-id');
      expect(result).toEqual({ take: 11, skip: 1, cursor: { id: 'my-cursor-id' } });
    });
  });

  describe('formatCursorResponse', () => {
    it('should format response when has next page', () => {
      const data = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const result = formatCursorResponse(data, 2);
      expect(result).toEqual({
        data: [{ id: '1' }, { id: '2' }],
        next_cursor: '2'
      });
    });

    it('should format response when no next page', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = formatCursorResponse(data, 2);
      expect(result).toEqual({
        data: [{ id: '1' }, { id: '2' }],
        next_cursor: null
      });
    });
  });
});
