const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many refresh attempts, please try again later.'
});
const logoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many logout attempts, please try again later.'
});
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Logowanie użytkownika
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
 *               password:
 *                 type: string
 *                 example: "haslo123"
 *     responses:
 *       200:
 *         description: Zalogowano użytkownika
 *       401:
 *         description: Błędne dane logowania
 *       403:
 *         description: Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.
 */
router.post('/login', limiter, authController.loginUser);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Odśwież token dostępu
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nowy access token
 *       400:
 *         description: Błąd odświeżania tokena
 */
router.post('/refresh-token', refreshLimiter, authController.refreshToken);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Wyloguj użytkownika
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Wylogowano użytkownika
 *       400:
 *         description: Błąd wylogowania
 */
router.post('/logout', logoutLimiter, authController.logoutUser);

/**
 * @swagger
 * /logout-all:
 *   post:
 *     summary: Wyloguj użytkownika ze wszystkich urządzeń
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wylogowano ze wszystkich urządzeń
 *       401:
 *         description: Brak autoryzacji
 */
router.post('/logout-all', authMiddleware, logoutLimiter, authController.logoutAllDevices);

module.exports = router;