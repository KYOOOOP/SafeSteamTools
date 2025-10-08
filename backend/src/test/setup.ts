// Jest setup file
import { config } from '../config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.STEAM_API_KEY = 'TEST_API_KEY_32_CHARACTERS_LONG';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '3001';

// Mock external services
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

// Increase timeout for integration tests
jest.setTimeout(10000);