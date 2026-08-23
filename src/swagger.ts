export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'TaskFlow API',
    version: '1.0.0',
    description: 'API documentation for the TaskFlow backend',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'newuser@example.com' },
                  password: { type: 'string', example: 'password123' },
                  name: { type: 'string', example: 'New User' },
                  organizationId: { type: 'string', description: 'Optional ID of the organization to join' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Success - Returns Access Token and Refresh Token' },
          '409': { description: 'Email already in use' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'alice@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Success - Returns Access Token and Refresh Token' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh Access Token',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', example: 'your_refresh_token_here' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Success - Returns new tokens' },
          '401': { description: 'Invalid or expired refresh token' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user (revokes refresh token)',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', example: 'your_refresh_token_here' }
                }
              }
            }
          }
        },
        responses: {
          '204': { description: 'Success - Token revoked' }
        }
      }
    },
    '/projects': {
      get: {
        summary: 'List all projects',
        tags: ['Projects'],
        responses: { '200': { description: 'Success' } }
      },
      post: {
        summary: 'Create a new project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Q3 Marketing' },
                  description: { type: 'string', example: 'Marketing campaign for Q3' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/projects/{id}': {
      get: {
        summary: 'Get a project by ID',
        tags: ['Projects'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      patch: {
        summary: 'Update a project',
        tags: ['Projects'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' }, description: { type: 'string' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Success' } }
      },
      delete: {
        summary: 'Delete a project (Requires Admin Role)',
        tags: ['Projects'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' } }
      }
    },
    '/tasks': {
      get: {
        summary: 'List all tasks (with pagination & filters)',
        tags: ['Tasks'],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'page', in: 'query', schema: { type: 'integer', description: 'For Offset Pagination' } },
          { name: 'cursor', in: 'query', schema: { type: 'string', description: 'For Cursor Pagination (pass previous task ID)' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] } },
          { name: 'search', in: 'query', schema: { type: 'string', description: 'Full text search query' } }
        ],
        responses: { '200': { description: 'Success' } }
      },
      post: {
        summary: 'Create a new task',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Design Homepage' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  projectId: { type: 'string', description: 'UUID of the project' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/tasks/{id}/assign': {
      post: {
        summary: 'Assign a user to a task (Triggers Email)',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { userId: { type: 'string', description: 'UUID of the user to assign' } }
              }
            }
          }
        },
        responses: { '201': { description: 'Assigned successfully' } }
      }
    },
    '/tasks/{id}/comments': {
      get: {
        summary: 'Get all comments for a task',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      },
      post: {
        summary: 'Add a comment to a task',
        tags: ['Tasks'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', example: 'I will take care of this immediately.' } }
              }
            }
          }
        },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/jobs/{id}': {
      get: {
        summary: 'Check the status of a background job (like email notifications)',
        tags: ['Jobs'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/users/availability': {
      get: {
        summary: 'Check team availability',
        tags: ['Users'],
        responses: { '200': { description: 'Success' } }
      }
    },
    '/organizations': {
      get: {
        summary: 'List all available organizations',
        tags: ['Organizations'],
        security: [],
        responses: { '200': { description: 'Success' } }
      }
    }
  }
};
