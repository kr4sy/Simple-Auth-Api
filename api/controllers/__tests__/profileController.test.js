const request = require('supertest');
const app = require('../../app');
const profileService = require('../../services/profileService');

jest.mock('../../services/profileService');
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('helmet', () => () => (req, res, next) => next());
jest.mock('sanitize-html', () => (str) => str);
//----------------.supertest wyswietlania infa proflu.----------------//
describe('GET /api/profile', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return profile info', async () => {
    profileService.getProfileInfo.mockResolvedValue([{ first_name: 'A', surname: 'B', email: 'test@test.com', phone_number: '123' }]);
    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', 'accessToken=mocked')
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('firstName', 'A');
    expect(res.body).toHaveProperty('surname', 'B');
    expect(res.body).toHaveProperty('email', 'test@test.com');
    expect(res.body).toHaveProperty('phoneNumber', '123');
  });
  it('should return 404 if user not found', async () => {
    profileService.getProfileInfo.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', 'accessToken=mocked')
      .send();
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });
});
//----------------.supertest zmiany profilu.----------------//
describe('PUT /api/profile', () => {
  afterEach(() => jest.clearAllMocks());
  it('should update profile info', async () => {
    profileService.updateProfileInfo.mockResolvedValue();
    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', 'accessToken=mocked')
      .send({ firstName: 'Jan', surname: 'Nowak', email: 'jan@nowak.com', phoneNumber: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Data has been updated');
  });
  it('should return 400 if no data to update', async () => {
    profileService.updateProfileInfo.mockImplementation(() => { throw new Error('No data to update'); });
    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', 'accessToken=mocked')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('No data to update');
  });
});
//----------------.supertest zmiany hasla.----------------//
describe('PUT /api/profile/password', () => {
  afterEach(() => jest.clearAllMocks());
  it('should update password', async () => {
    profileService.checkPassword.mockResolvedValue(true);
    profileService.updateProfilePassword.mockResolvedValue();
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', 'accessToken=mocked')
      .send({ oldPassword: 'old', newPassword: 'new' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Password has beed updated succesfully');
  });
  it('should return 401 if wrong password', async () => {
    profileService.checkPassword.mockResolvedValue(false);
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', 'accessToken=mocked')
      .send({ oldPassword: 'old', newPassword: 'new' });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Wrong password');
  });
  it('should return 404 if user not found', async () => {
    profileService.checkPassword.mockImplementation(() => { throw new Error('User not found'); });
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', 'accessToken=mocked')
      .send({ oldPassword: 'old', newPassword: 'new' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });
});
