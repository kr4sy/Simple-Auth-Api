const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Auth]
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
 *               password:
 *                 type: string
 *                 example: "haslo123"
 *     responses:
 *       201:
 *         description: Użytkownik zarejestrowany
 *       400:
 *         description: Błąd walidacji lub brak wymaganych danych
 *       409:
 *         description: |
 *           Konto na ten adres e-mail już istnieje, ale nie zostało zweryfikowane.
 *           Konto na ten adres e-mail już istnieje.
 */
router.post('/register', limiter, authController.registerUser);

module.exports = router;
