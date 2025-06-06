const adminMiddleware = require('../adminMiddleware');

jest.mock('../authMiddleware', () => jest.fn((req, res, next) => next()));

describe('adminMiddleware', () => {
  it('should call next if user is admin', () => {
    const req = { user: { id: 1, is_admin: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    adminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if user is not admin', () => {
    const req = { user: { id: 2, is_admin: 0 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    adminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
  });

  it('should return 403 if user is missing', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    adminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
  });
});
