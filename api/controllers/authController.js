const authService = require('../services/authService');

//-------------------------------------------------------------------------------------//
//-------------------------------------rejestracja-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const user = await authService.register(userData);
    res.status(201).json({ user });
  } catch (error) {
    if (error.status === 409) {
      res.status(409).json({ message: error.message });
    } else {
      res.status(error.status || 400).json({ error: error.message });
    }
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------weryfikacja OTP---------------------------------//
//-------------------------------------------------------------------------------------//

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOtp({ email, otp });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp({ email });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//--------------------------------------logowanie--------------------------------------//
//-------------------------------------------------------------------------------------//

const cookieOptions = {
  httpOnly: true,
  //secure: true,
  secure: false,
  //sameSite: 'None', // ustawic na strict lub lax
  sameSite: 'Lax',
  path: '/' //albo '/api'
};

exports.loginUser = async (req, res) => {
  try {
    const userData = req.body;
    const { user, accessToken, refreshToken } = await authService.login(userData);
    const safeUser = {
      id: user.id,
      first_name: user.first_name,
      surname: user.surname,
      email: user.email
    };
    res
      .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 900000 })
      .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 604800000 })
      .status(200)
      .json({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    if (error.status === 403) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(error.status || 400).json({ error: error.message });
    }
  }
  
};

//-------------------------------------------------------------------------------------//
//---------------------------------odswiezanie tokenów---------------------------------//
//-------------------------------------------------------------------------------------//

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res
      .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 900000 })
      .status(200)
      .json({ accessToken });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------wylogowanie-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res
      .clearCookie('accessToken', cookieOptions)
      .clearCookie('refreshToken', cookieOptions)
      .status(200)
      .json({ message: 'logged out successfully' });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------wylogowanie ze wszystkich urządzeń--------------------------//
//-------------------------------------------------------------------------------------//

exports.logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    await authService.logoutAll(userId);
    res
      .clearCookie('accessToken', cookieOptions)
      .clearCookie('refreshToken', cookieOptions)
      .status(200)
      .json({ message: 'Wylogowano ze wszystkich urządzeń.' });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};