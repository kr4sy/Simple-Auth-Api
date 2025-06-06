const request = require('supertest');
const app = require('../../app');
const authService = require('../../services/authService');

jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('helmet', () => () => (req, res, next) => next());
jest.mock('../../services/authService');
jest.mock('sanitize-html', () => (str) => str);

//----------------.supertest rejestracji.----------------//

describe('POST /api/register', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 201 and user data on success', async () => {
    authService.register.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const res = await request(app)
      .post('/api/register')
      .send({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
  });
  it('should return 400 on missing fields', async () => {
    authService.register.mockImplementation(() => { const err = new Error('all fields are required'); err.status = 400; throw err; });
    const res = await request(app).post('/api/register').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
  it('should return 409 if user exists and not verified', async () => {
    authService.register.mockImplementation(() => { const err = new Error('Konto na ten adres e-mail już istnieje, ale nie zostało zweryfikowane.'); err.status = 409; throw err; });
    const res = await request(app).post('/api/register').send({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBeDefined();
  });
  it('should return 409 if user exists and verified', async () => {
    authService.register.mockImplementation(() => { const err = new Error('Konto na ten adres e-mail już istnieje.'); err.status = 409; throw err; });
    const res = await request(app).post('/api/register').send({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBeDefined();
  });
});
//----------------.supertest logowania.----------------//
describe('POST /api/login', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 401 for wrong credentials', async () => {
    authService.login.mockImplementation(() => { const err = new Error('Wrong email or password'); err.status = 401; throw err; });
    const res = await request(app).post('/api/login').send({ email: 'wrong@test.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });
  it('should return 403 if user is not verified', async () => {
    authService.login.mockImplementation(() => { const err = new Error('Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.'); err.status = 403; throw err; });
    const res = await request(app).post('/api/login').send({ email: 'notverified@test.com', password: '123' });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBeDefined();
  });
  it('should set cookies and return user on success', async () => {
    authService.login.mockResolvedValue({ user: { id: 1, email: 'test@test.com' }, accessToken: 'access', refreshToken: 'refresh' });
    const res = await request(app).post('/api/login').send({ email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toContain('accessToken=');
    expect(cookies.join(';')).toContain('refreshToken=');
  });
});
//----------------.supertest refreshtoken.----------------//
describe('POST /api/refresh-token', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return new access token and set cookie', async () => {
    authService.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access-token' });
    const res = await request(app).post('/api/refresh-token').set('Cookie', 'refreshToken=mocked-refresh-token').send();
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken', 'new-access-token');
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toContain('accessToken=');
  });
});
//----------------.supertest logoutu.----------------//
describe('POST /api/logout', () => {
  afterEach(() => jest.clearAllMocks());
  it('should clear cookies and return message', async () => {
    authService.logout.mockResolvedValue();
    const res = await request(app).post('/api/logout').set('Cookie', 'refreshToken=mocked-refresh-token').send();
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toContain('accessToken=;');
    expect(cookies.join(';')).toContain('refreshToken=;');
  });
});
//----------------.supertest weryfikacji otp.----------------//
describe('POST /api/verify-otp', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 on correct otp', async () => {
    authService.verifyOtp.mockResolvedValue({ message: 'OK' });
    const res = await request(app).post('/api/verify-otp').send({ email: 'test@test.com', otp: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
  it('should return 400 on error', async () => {
    authService.verifyOtp.mockImplementation(() => { const err = new Error('Invalid'); err.status = 400; throw err; });
    const res = await request(app).post('/api/verify-otp').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
//----------------.supertest resendotp.----------------//
describe('POST /api/resend-otp', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 on resend', async () => {
    authService.resendOtp.mockResolvedValue({ message: 'Resent' });
    const res = await request(app).post('/api/resend-otp').send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
  it('should return 400 on error', async () => {
    authService.resendOtp.mockImplementation(() => { const err = new Error('Invalid'); err.status = 400; throw err; });
    const res = await request(app).post('/api/resend-otp').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});