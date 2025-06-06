const request = require('supertest');
const app = require('../../app');
const rentPostService = require('../../services/rentPostService');

jest.mock('../../services/rentPostService');
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 1 }; // lub dowolny testowy user
  next();
});
jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('helmet', () => () => (req, res, next) => next());
jest.mock('sanitize-html', () => (str) => str);
//----------------.supertest dodawnia postu.----------------//
describe('POST /api/rentpost', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 201 and ad on success', async () => {
    rentPostService.addRentPost.mockResolvedValue({ id: 1, title: 'T' });
    const res = await request(app)
      .post('/api/rentpost')
      .set('Cookie', 'accessToken=mocked')
      .send({ title: 'T', description: 'D', monThirsPrice: 10, weekendPrice: 20, twoDaysPrice: 30, threeDaysPrice: 40, everyNextDayPrice: 50, categoriesId: 1, phoneNumber: '123456789', photoSrc: 'img.png' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('ad');
  });
  it('should return 400 on error', async () => {
    rentPostService.addRentPost.mockImplementation(() => { const err = new Error('Błąd'); err.status = 400; throw err; });
    const res = await request(app)
      .post('/api/rentpost')
      .set('Cookie', 'accessToken=mocked')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest listy postow.----------------//
describe('GET /api/rentposts', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 and list of posts', async () => {
    const mockPosts = [{ id: 1, title: 'A' }, { id: 2, title: 'B' }];
    rentPostService.getRentPosts.mockResolvedValue(mockPosts);
    const res = await request(app)
      .get('/api/rentposts')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockPosts);
  });

  it('should return 400 on error', async () => {
    rentPostService.getRentPosts.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .get('/api/rentposts')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest ogłoszenie po id.----------------//
describe('GET /api/rentpost/:id', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 and rentPost on success', async () => {
    rentPostService.getRentPostById.mockResolvedValue({ id: 1, title: 'T' });
    const res = await request(app)
      .get('/api/rentpost/1')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });
  it('should return 404 on error', async () => {
    rentPostService.getRentPostById.mockImplementation(() => { const err = new Error('Nie znaleziono'); err.status = 404; throw err; });
    const res = await request(app)
      .get('/api/rentpost/1')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest dodawania promocji.----------------//
describe('POST /api/rentpost/:id/promotion', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 201 and promotion on success', async () => {
    rentPostService.addPromotion.mockResolvedValue({ id: 1, startDate: '2024-01-01', endDate: '2024-01-10' });
    const res = await request(app)
      .post('/api/rentpost/1/promotion')
      .set('Cookie', 'accessToken=mocked')
      .send({ startDate: '2024-01-01', endDate: '2024-01-10' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('promotion');
  });
  it('should return 400 on error', async () => {
    rentPostService.addPromotion.mockImplementation(() => { const err = new Error('Błąd'); err.status = 400; throw err; });
    const res = await request(app)
      .post('/api/rentpost/1/promotion')
      .set('Cookie', 'accessToken=mocked')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest pobierania promocji.----------------//
describe('GET /api/rentpost/:id/promotion', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 and promotion on success', async () => {
    rentPostService.getPromotion.mockResolvedValue({ id: 1, startDate: '2024-01-01', endDate: '2024-01-10' });
    const res = await request(app)
      .get('/api/rentpost/1/promotion')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });
  it('should return 404 on error', async () => {
    rentPostService.getPromotion.mockImplementation(() => { const err = new Error('Nie znaleziono'); err.status = 404; throw err; });
    const res = await request(app)
      .get('/api/rentpost/1/promotion')
      .set('Cookie', 'accessToken=mocked');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
