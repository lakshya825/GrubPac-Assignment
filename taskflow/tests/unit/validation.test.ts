import { assignTaskSchema, addCommentSchema } from '../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('assignTaskSchema', () => {
    it('should validate a correct uuid', () => {
      const data = { body: { userId: '123e4567-e89b-12d3-a456-426614174000' } };
      const result = assignTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid uuid', () => {
      const data = { body: { userId: 'not-a-uuid' } };
      const result = assignTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('addCommentSchema', () => {
    it('should validate a correct comment', () => {
      const data = { body: { content: 'Looks good to me' } };
      const result = addCommentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject an empty comment', () => {
      const data = { body: { content: '' } };
      const result = addCommentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
