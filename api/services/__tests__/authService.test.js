const authService = require('../authService');
const pool = require('../../db-pool');

jest.mock('../../db-pool');
jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

//----------------.test rejestracji.----------------//

describe('authService.register', () => {
  it('throws error if any field is missing', async () => {
    await expect(authService.register({})).rejects.toThrow('all fields are required');
  });
  it('throws error if user already exists and is_verified=0', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, is_verified: 0 }]]); // user exists, not verified
    await expect(authService.register({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' }))
      .rejects.toThrow('Konto na ten adres e-mail już istnieje, ale nie zostało zweryfikowane.');
  });
  it('throws error if user already exists and is_verified=1', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, is_verified: 1 }]]); // user exists, verified
    await expect(authService.register({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' }))
      .rejects.toThrow('Konto na ten adres e-mail już istnieje.');
  });
});

//----------------.test weryfki otp.----------------//

describe('authService.verifyOtp', () => {
  it('throws error if email or otp is missing', async () => {
    await expect(authService.verifyOtp({})).rejects.toThrow('Email i kod OTP są wymagane');
  });
  it('throws error if user not found', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(authService.verifyOtp({ email: 'test@test.com', otp: '123456' })).rejects.toThrow('Nie znaleziono użytkownika');
  });
  it('sets is_verified=1 and clears otp on correct code', async () => {
    pool.query
      .mockResolvedValueOnce([[{ email: 'test@test.com', otp: '123456', otp_expires_at: new Date(Date.now() + 10000) }]]) // SELECT * FROM users WHERE email = ?
      .mockResolvedValueOnce([{}]); // UPDATE users SET ...
    const result = await authService.verifyOtp({ email: 'test@test.com', otp: '123456' });
    expect(result).toEqual({ message: 'E-mail został potwierdzony' });
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET otp = NULL, otp_expires_at = NULL, is_verified = 1 WHERE email = ?',
      ['test@test.com']
    );
  });
});

//----------------.test resend otp.----------------//

describe('authService.resendOtp', () => {
  it('throws error if email is missing', async () => {
    await expect(authService.resendOtp({})).rejects.toThrow('Email jest wymagany');
  });
  it('throws error if user not found', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(authService.resendOtp({ email: 'test@test.com' })).rejects.toThrow('Nie znaleziono użytkownika');
  });
});

//----------------.test logowania.----------------//

describe('authService.login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('throws error if user does not exist', async () => {
    pool.query.mockResolvedValue([[]]); // brak usera
    await expect(authService.login({ email: 'test@test.com', password: '123' }))
      .rejects.toThrow('Wrong email or password');
  });
  it('throws error if user is not verified', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, email: 'test@test.com', password: 'hashed', is_verified: 0 }]]);
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    await expect(authService.login({ email: 'test@test.com', password: '123' }))
      .rejects.toThrow('Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.');
  });
});

//----------------.test handlingu tokenów.----------------//

describe('authService.refreshAccessToken', () => {
  it('throws error if refresh token is revoked or expired', async () => {
    pool.query.mockResolvedValue([[]]);
    await expect(authService.refreshAccessToken('fakeToken')).rejects.toThrow('refresh token has expired or is revoked');
  });
});

//----------------.test wylogowania.----------------//

describe('authService.logout', () => {
  it('throws error if refresh token is invalid', async () => {
    const jwt = require('jsonwebtoken');
    jwt.verify = jest.fn(() => { throw new Error('Invalid refresh token'); });
    await expect(authService.logout('badToken')).rejects.toThrow('Invalid refresh token');
  });
});

//----------------.test wylogowania z każdego urządzenia.----------------//

describe('authService.logoutAll', () => {
  it('should call pool.query to revoke all tokens', async () => {
    pool.query.mockResolvedValue([{}]);
    await expect(authService.logoutAll(1)).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledWith('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [1]);
  });
});

//----------------.logowanie i rejestracja jesli sie udalo.----------------//

describe('authService positive flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[]]) //SELECT * FROM users WHERE email = ?
      .mockResolvedValueOnce([{ insertId: 1 }]) //INSERT INTO users ...
      .mockResolvedValueOnce([[{ id: 1, first_name: 'A', surname: 'B', email: 'test@test.com' }]]); //SELECT * FROM users WHERE id = ?
    const result = await authService.register({ firstName: 'A', surname: 'B', email: 'test@test.com', password: '123' });
    expect(result).toMatchObject({ id: 1, first_name: 'A', surname: 'B', email: 'test@test.com' });
  });

  it('logs in user with correct credentials', async () => {
    const bcrypt = require('bcrypt');
    pool.query.mockImplementation((sql) => {
      if (sql.includes('SELECT * FROM users WHERE email')) {
        return Promise.resolve([[{ id: 1, email: 'test@test.com', password: 'hashed', is_verified: 1, is_admin: 0 }]]);
      }
      if (sql.includes('SELECT COUNT(*) FROM refresh_tokens')) {
        return Promise.resolve([[{ count: 0 }]]);
      }
      if (sql.includes('INSERT INTO refresh_tokens')) {
        return Promise.resolve([{ insertId: 1 }]);
      }
      return Promise.resolve([[]]);
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign').mockReturnValue('token');
    const result = await authService.login({ email: 'test@test.com', password: '123' });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken', 'token');
    expect(result).toHaveProperty('refreshToken', 'token');
  });
});

//----------------.integracja login-register.----------------//

describe('authService integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers and then logs in the same user', async () => {
    let call = 0;
    pool.query.mockImplementation((sql) => {
      call++;
      if (call === 1) return Promise.resolve([[]]); //SELECT * FROM users WHERE email = ?
      if (call === 2) return Promise.resolve([{ insertId: 2 }]); //INSERT INTO users ...
      if (call === 3) return Promise.resolve([[{ id: 2, first_name: 'Jan', surname: 'Nowak', email: 'jan@nowak.com' }]]); //SELECT * FROM users WHERE id = ?
      if (call === 4) return Promise.resolve([[{ id: 2, email: 'jan@nowak.com', password: 'hashed', is_verified: 1, is_admin: 0 }]]); //SELECT * FROM users WHERE email = ?
      if (call === 5) return Promise.resolve([[{ count: 0 }]]); //SELECT COUNT(*) FROM refresh_tokens
      if (call === 6) return Promise.resolve([{ insertId: 2 }]); //INSERT INTO refresh_tokens ...
      return Promise.resolve([[]]);
    });
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'sign').mockReturnValue('token');
    const user = await authService.register({ firstName: 'Jan', surname: 'Nowak', email: 'jan@nowak.com', password: '123' });
    expect(user).toMatchObject({ id: 2, first_name: 'Jan', surname: 'Nowak', email: 'jan@nowak.com' });
    const login = await authService.login({ email: 'jan@nowak.com', password: '123' });
    expect(login).toHaveProperty('user');
    expect(login).toHaveProperty('accessToken', 'token');
    expect(login).toHaveProperty('refreshToken', 'token');
  });
});