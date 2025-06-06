const authMiddleware = require('../authMiddleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  it('should return 401 if no token', () => {
    const req = { cookies: {}, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authentication token' });
  });

  it('should call next if token is valid (from cookies)', () => {
    jwt.verify.mockReturnValue({ id: 1, email: 'test@test.com' });
    const req = { cookies: { accessToken: 'valid' }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(jwt.verify).toHaveBeenCalledWith('valid', process.env.ACCESS_TOKEN_SECRET);
    expect(req.user).toEqual({ id: 1, email: 'test@test.com' });
    expect(next).toHaveBeenCalled();
  });

  it('should call next if token is valid (from headers)', () => {
    jwt.verify.mockReturnValue({ id: 2, email: 'header@test.com' });
    const req = { cookies: {}, headers: { authorization: 'Bearer validheader' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(jwt.verify).toHaveBeenCalledWith('validheader', process.env.ACCESS_TOKEN_SECRET);
    expect(req.user).toEqual({ id: 2, email: 'header@test.com' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    jwt.verify.mockImplementation(() => { throw new Error('bad token'); });
    const req = { cookies: { accessToken: 'bad' }, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });
});