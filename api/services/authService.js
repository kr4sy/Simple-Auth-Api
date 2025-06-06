// api/services/authService.js
const pool = require('../db-pool');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//-------------------------------------------------------------------------------------//
//----------------------------------rejestracja----------------------------------------//
//-------------------------------------------------------------------------------------//

exports.register = async ({ firstName, surname, email, password }) => {
  if (!firstName || !surname || !email || !password) {
    throw Object.assign(new Error('all fields are required'), { status: 400 });
  }
  //Czy user istnieje
  const [[existingUser]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser) {
    if (!existingUser.is_verified) {
      const err = new Error('Konto na ten adres e-mail już istnieje, ale nie zostało zweryfikowane.');
      err.status = 409;
      throw err;
    } else {
      const err = new Error('Konto na ten adres e-mail już istnieje.');
      err.status = 409;
      throw err;
    }
  }
  //ahszuj password
  const hashedPassword = await bcrypt.hash(password, 10);
  //generuj OTP
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minut ważności
  //dodaj usera
  const sql = `
    INSERT INTO users (first_name, surname, email, password, otp, otp_expires_at, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, FALSE)
  `;
  const [result] = await pool.query(sql, [firstName, surname, email, hashedPassword, otp, otpExpiresAt]);
  //wyślij otp na mail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Potwierdź swój e-mail',
    text: `Twój kod weryfikacyjny to: ${otp}`
  });
  //Pobierz utworzonego usera
  const [[user]] = await pool.query(
    'SELECT id, first_name, surname, email FROM users WHERE id = ?',
    [result.insertId]
  );
  return user;
};

//-------------------------------------------------------------------------------------//
//---------------------------------weryfikacja OTP-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.verifyOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    throw new Error('Email i kod OTP są wymagane');
  }
  const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new Error('Nie znaleziono użytkownika');
  }
  //czy otp poprawny i nie wygasł
  if (user.otp !== otp || new Date(user.otp_expires_at) < new Date()) {
    throw new Error('Nieprawidłowy lub wygasły kod OTP');
  }
  //jeśli zweryfikowano to usuń otp i ustaw is_verified=1
  await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL, is_verified = 1 WHERE email = ?', [email]);
  return { message: 'E-mail został potwierdzony' };
};

//-------------------------------------------------------------------------------------//
//-------------------------------wyślij otp ponownie-----------------------------------//
//-------------------------------------------------------------------------------------//

exports.resendOtp = async ({ email }) => {
  if (!email) {
    throw new Error('Email jest wymagany');
  }
  const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new Error('Nie znaleziono użytkownika');
  }
  //nowy OTP
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP ważny przez 10 minut
  //aktualizuj otp w bazie
  await pool.query('UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?', [otp, otpExpiresAt, email]);
  //Wyślij OTP na e-mail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Potwierdź swój e-mail',
    text: `Twój nowy kod weryfikacyjny to: ${otp}`
  });
  return { message: 'Nowy kod OTP został wysłany na Twój e-mail' };
};

//-------------------------------------------------------------------------------------//
//------------------------------------logowanie----------------------------------------//
//-------------------------------------------------------------------------------------//

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION;

exports.login = async ({ email, password }) => {
  //czy user istnieje
  const sql1 = 'SELECT * FROM users WHERE email=?';
  const [[user]] = await pool.query(sql1, [email]);
  if (!user) throw Object.assign(new Error('Wrong email or password'), { status: 401 });
  //czy hasło jest poprawne
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw Object.assign(new Error('wrong email or password'), { status: 401 });
  //czy user zweryfikowany
  if (!user.is_verified) {
    const err = new Error('Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.');
    err.status = 403;
    throw err;
  }
  //czy user ma aktywny refresh token, jesli wiecej niz 3 to usuwa najstarszy
  const sql2 = 'SELECT * FROM refresh_tokens WHERE user_id=? AND revoked=0 ORDER BY created_at ASC';
  const [activeTokens] = await pool.query(sql2, [user.id]);
  if (activeTokens.length >= 3) {
    const sql3 = 'DELETE FROM refresh_tokens WHERE id=?';
    await pool.query(sql3, [activeTokens[0].id]);
  }
  //generowanie nowych tokenów refresh i access i dodawanie do bazy
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION, jwtid: randomUUID() }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION, jwtid: randomUUID() }
  );
  const sql4 = 'INSERT INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 7 DAY))';
  await pool.query(sql4, [user.id, refreshToken])
  return { user, accessToken, refreshToken };
};

//-------------------------------------------------------------------------------------//
//----------------------------------handling tokenów-----------------------------------//
//-------------------------------------------------------------------------------------//

exports.refreshAccessToken = async (refreshToken) => {
  //szukaj aktualnego refresh tokena
  const sql1 = 'SELECT * FROM refresh_tokens WHERE token=? AND revoked=0 AND expires_at>NOW()';
  const [tokens] = await pool.query(sql1, [refreshToken])
  if (tokens.length === 0) {
    throw new Error("refresh token has expired or is revoked");
  }
  try {
    //weryfikacja refresh tokena kluczem i generowanie nowego access tokena
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
  { id: user.id, email: user.email, is_admin: user.is_admin },
  ACCESS_TOKEN_SECRET,
  { expiresIn: ACCESS_TOKEN_EXPIRATION, jwtid: randomUUID() }
);
  return { accessToken };
  } catch (error) {
    throw new Error('Wrong refresh token');
  }
};

//-------------------------------------------------------------------------------------//
//------------------------------------wylogowanie--------------------------------------//
//-------------------------------------------------------------------------------------//

exports.logout = async (refreshToken) => {
  try {
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
  } catch (error) {
    throw new Error('Invalid refresh token')
  } 
  const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE token = ?';
  await pool.query(sql,[refreshToken]);
};

//-------------------------------------------------------------------------------------//
//-------------------------wylogowanie ze wszystkich urządzeń--------------------------//
//-------------------------------------------------------------------------------------//

exports.logoutAll = async (userId) => {
  const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?';
  await pool.query(sql, [userId]);
};