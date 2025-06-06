const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many profile update attempts, please try again later.'
});

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Pobierz dane profilu użytkownika
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dane profilu użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                 surname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *       404:
 *         description: Użytkownik nie znaleziony
 */
router.get('/profile', authMiddleware, profileController.getProfileInfoHandler);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Zmień dane profilu użytkownika
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jan"
 *               surname:
 *                 type: string
 *                 example: "Kowalski"
 *               email:
 *                 type: string
 *                 example: "jan@kowalski.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: Dane zostały zaktualizowane
 *       400:
 *         description: Błąd walidacji lub brak danych do zmiany
 *       404:
 *         description: Użytkownik nie znaleziony
 */
router.put('/profile', authMiddleware, profileLimiter, profileController.updateProfileInfoHandler);

/**
 * @swagger
 * /profile/password:
 *   put:
 *     summary: Zmień hasło użytkownika
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "starehaslo"
 *               newPassword:
 *                 type: string
 *                 example: "nowehaslo"
 *     responses:
 *       200:
 *         description: Hasło zostało zmienione
 *       400:
 *         description: Brak wymaganych danych lub błąd walidacji
 *       401:
 *         description: Błędne stare hasło
 *       404:
 *         description: Użytkownik nie znaleziony
 */
router.put('/profile/password', authMiddleware, profileLimiter, profileController.updatePasswordHandler);

module.exports = router;