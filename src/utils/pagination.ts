export interface PaginationOptions {
  limit?: number;
  page?: number;
  cursor?: string;
}

export function getOffsetPagination(limit: number, page?: number) {
  const pageNum = page || 1;
  const skip = (pageNum - 1) * limit;
  return { skip, take: limit, page: pageNum, limit };
}

export function getCursorPagination(limit: number, cursor?: string) {
  if (!cursor) {
    return { take: limit + 1, skip: 0 };
  }
  return { take: limit + 1, skip: 1, cursor: { id: cursor } };
}

export function formatCursorResponse<T extends { id: string }>(data: T[], limit: number) {
  const hasNextPage = data.length > limit;
  const resultData = hasNextPage ? data.slice(0, -1) : data;
  const nextCursor = hasNextPage ? resultData[resultData.length - 1].id : null;

  return { data: resultData, next_cursor: nextCursor };
}
