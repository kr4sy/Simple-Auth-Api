const request = require('supertest');
const app = require('../../app');
const adminService = require('../../services/adminService');

jest.mock('../../services/adminService');
jest.mock('../../middleware/adminMiddleware', () => (req, res, next) => {
  req.user = { id: 1, is_admin: 1 }; // lub dowolny testowy user
  next();
});
jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('helmet', () => () => (req, res, next) => next());
jest.mock('sanitize-html', () => (str) => str);

//----------------.supertest dodawania featureow.----------------//

describe('POST /api/admin/features', () => {
  afterEach(() => jest.clearAllMocks());
  it('should add feature and return 201', async () => {
    adminService.addFeature.mockResolvedValue();
    const res = await request(app)
      .post('/api/admin/features')
      .send({ title: 'Test', img_src: 'img.png' });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Feature (category) added successfully');
  });
  it('should return 400 on error', async () => {
    adminService.addFeature.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .post('/api/admin/features')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest dodania admina.----------------//

describe('POST /api/admin/admins', () => {
  afterEach(() => jest.clearAllMocks());
  it('should add admin and return 201', async () => {
    adminService.addAdmin.mockResolvedValue();
    const res = await request(app)
      .post('/api/admin/admins')
      .send({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Admin added successfully');
  });
  it('should return 400 on error', async () => {
    adminService.addAdmin.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .post('/api/admin/admins')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest usuwania admina.----------------//

describe('DELETE /api/admin/admins/:id', () => {
  afterEach(() => jest.clearAllMocks());
  it('should delete admin and return 200', async () => {
    adminService.deleteAdmin.mockResolvedValue();
    const res = await request(app)
      .delete('/api/admin/admins/1')
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Admin deleted successfully');
  });
  it('should return 400 on error', async () => {
    adminService.deleteAdmin.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .delete('/api/admin/admins/1')
      .send();
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest wyswietlania userow.----------------//

describe('GET /api/admin/users', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return users', async () => {
    adminService.getUsers.mockResolvedValue([{ id: 1, first_name: 'A' }]);
    const res = await request(app)
      .get('/api/admin/users')
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, first_name: 'A' }]);
  });
  it('should return 400 on error', async () => {
    adminService.getUsers.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .get('/api/admin/users')
      .send();
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

//----------------.supertest usuwania usera.----------------//

describe('DELETE /api/admin/users/:id', () => {
  afterEach(() => jest.clearAllMocks());
  it('should delete user and return 200', async () => {
    adminService.deleteUser.mockResolvedValue();
    const res = await request(app)
      .delete('/api/admin/users/1')
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User anonymized (is_deleted=true)');
  });
  it('should return 400 on error', async () => {
    adminService.deleteUser.mockImplementation(() => { throw new Error('Błąd'); });
    const res = await request(app)
      .delete('/api/admin/users/1')
      .send();
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
