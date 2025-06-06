const profileService = require('../profileService');
const pool = require('../../db-pool');
const bcrypt = require('bcrypt');

jest.mock('../../db-pool');
jest.mock('bcrypt');

//----------------.test pobierania infa profilu.----------------//

describe('profileService.getProfileInfo', () => {
  it('returns profile info for user', async () => {
    pool.query.mockResolvedValueOnce([[{ first_name: 'A', surname: 'B', email: 'test@test.com', phone_number: '123' }]]);
    const result = await profileService.getProfileInfo(1);
    expect(result).toEqual([{ first_name: 'A', surname: 'B', email: 'test@test.com', phone_number: '123' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT first_name, surname, email, phone_number FROM users WHERE id = ?', [1]);
  });
});

//----------------.test zmiany danych profilu.----------------//

describe('profileService.updateProfileInfo', () => {
  it('throws error if no data provided', async () => {
    await expect(profileService.updateProfileInfo(1, {})).rejects.toThrow('No data provided for update');
  });
  it('throws error if firstName too short', async () => {
    await expect(profileService.updateProfileInfo(1, { firstName: 'A' })).rejects.toThrow('Imię musi mieć co najmniej 2 znaki');
  });
  it('throws error if surname too short', async () => {
    await expect(profileService.updateProfileInfo(1, { surname: 'B' })).rejects.toThrow('Nazwisko musi mieć co najmniej 2 znaki');
  });
  it('throws error if nothing changed', async () => {
    pool.query.mockResolvedValueOnce([{ changedRows: 0 }]);
    await expect(profileService.updateProfileInfo(1, { firstName: 'Jan' })).rejects.toThrow('Nie zmieniono żadnych danych');
  });
  it('updates profile info if data is valid', async () => {
    pool.query.mockResolvedValueOnce([{ changedRows: 1 }]);
    await expect(profileService.updateProfileInfo(1, { firstName: 'Jan', surname: 'Nowak', email: 'jan@nowak.com', phoneNumber: '123' })).resolves.toBeDefined();
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET first_name = ?, surname = ?, email = ?, phone_number = ? WHERE id = ?',
      ['Jan', 'Nowak', 'jan@nowak.com', '123', 1]
    );
  });
});

//----------------.test zmiany hasła.----------------//

describe('profileService.updateProfilePassword', () => {
  it('throws error if user not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    bcrypt.hash.mockResolvedValue('hashed');
    await expect(profileService.updateProfilePassword(1, 'newpass')).rejects.toThrow('User not found');
  });
  it('updates password if user exists', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    bcrypt.hash.mockResolvedValue('hashed');
    await expect(profileService.updateProfilePassword(1, 'newpass')).resolves.toBeDefined();
    expect(pool.query).toHaveBeenCalledWith('UPDATE users SET password = ? WHERE id = ?', ['hashed', 1]);
  });
});

//----------------.test check password.----------------//

describe('profileService.checkPassword', () => {
  it('throws error if user not found', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(profileService.checkPassword(1, 'pass')).rejects.toThrow('User not found');
  });
  it('returns true if password matches', async () => {
    pool.query.mockResolvedValueOnce([[{ password: 'hashed' }]]);
    bcrypt.compare.mockResolvedValue(true);
    const result = await profileService.checkPassword(1, 'pass');
    expect(result).toBe(true);
  });
  it('returns false if password does not match', async () => {
    pool.query.mockResolvedValueOnce([[{ password: 'hashed' }]]);
    bcrypt.compare.mockResolvedValue(false);
    const result = await profileService.checkPassword(1, 'pass');
    expect(result).toBe(false);
  });
});