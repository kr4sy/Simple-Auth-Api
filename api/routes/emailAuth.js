const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many OTP attempts, please try again later.'
});

/**
 * @swagger
 * /verify-otp:
 *   post:
 *     summary: Weryfikacja kodu OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Kod OTP zweryfikowany
 *       400:
 *         description: Błąd walidacji lub nieprawidłowy kod
 */
router.post('/verify-otp', otpLimiter, authController.verifyOtp);

/**
 * @swagger
 * /resend-otp:
 *   post:
 *     summary: Wysyła ponownie kod OTP na email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Kod OTP wysłany ponownie
 *       400:
 *         description: Błąd walidacji lub nieprawidłowy email
 */
router.post('/resend-otp', otpLimiter, authController.resendOtp);

module.exports = router;