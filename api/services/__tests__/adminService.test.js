const adminService = require('../adminService');
const pool = require('../../db-pool');
const bcrypt = require('bcrypt');

jest.mock('../../db-pool');
jest.mock('bcrypt');

//----------------.test dodawania feature'a.----------------//

describe('adminService.addFeature', () => {
  it('throws error if title is missing', async () => {
    await expect(adminService.addFeature({})).rejects.toThrow('Title is required');
  });
  it('inserts feature if title is provided', async () => {
    pool.query.mockResolvedValueOnce();
    await expect(adminService.addFeature({ title: 'Test', img_src: 'img.png' })).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO categories (title, img_src) VALUES (?, ?)',
      ['Test', 'img.png']
    );
  });
});

//----------------.test dodawania admina.----------------//

describe('adminService.addAdmin', () => {
  it('throws error if any field is missing', async () => {
    await expect(adminService.addAdmin({})).rejects.toThrow('All fields are required');
  });
  it('throws error if user already exists', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    await expect(adminService.addAdmin({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' }))
      .rejects.toThrow('User already exists');
  });
  it('inserts admin if data is correct', async () => {
    pool.query
      .mockResolvedValueOnce([[]]) // user does not exist
      .mockResolvedValueOnce(); // insert
    bcrypt.hash.mockResolvedValue('hashed');
    await expect(adminService.addAdmin({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' })).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO users (first_name, surname, email, password, is_admin, is_verified) VALUES (?, ?, ?, ?, 1, 1)',
      ['A', 'B', 'test@test.com', 'hashed']
    );
  });
});

//----------------.test usuwania admina.----------------//

describe('adminService.deleteAdmin', () => {
  it('throws error if admin not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(adminService.deleteAdmin(1)).rejects.toThrow('Admin not found');
  });
  it('sets is_admin=0 if admin exists', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(adminService.deleteAdmin(1)).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith('UPDATE users SET is_admin = 0 WHERE id = ?', [1]);
  });
});

//----------------.test wyswietlania userów.----------------//

describe('adminService.getUsers', () => {
  it('returns users without admins', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, is_deleted: 0 }]]);
    const users = await adminService.getUsers();
    expect(users).toEqual([{ id: 1, is_deleted: 0 }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT id, first_name, surname, email, is_deleted FROM users WHERE is_admin = 0');
  });
});

//----------------.test usuwania userów.----------------//

describe('adminService.deleteUser', () => {
  it('throws error if user not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(adminService.deleteUser(1)).rejects.toThrow('User not found');
  });
  it('anonymizes user if found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(adminService.deleteUser(1)).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET is_deleted = 1, first_name = NULL, surname = NULL, email = NULL, password = NULL WHERE id = ?',
      [1]
    );
  });
});
