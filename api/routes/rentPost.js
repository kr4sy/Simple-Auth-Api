const express = require('express');
const router = express.Router();
const rentPostController = require('../controllers/rentPostController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const rentPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many rent posts created from this IP, please try again later.'
});

/**
 * @swagger
 * /rentposts:
 *   get:
 *     summary: Pobierz listę ogłoszeń
 *     tags: [RentPost]
 *     parameters:
 *       - in: query
 *         name: categoriesId
 *         schema:
 *           type: integer
 *         description: ID kategorii (np. 1 - kampery, 2 - noclegi, 3 - sauna)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Wyszukiwanie po tytule ogłoszenia
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Kolumna do sortowania (np. title)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Kierunek sortowania
 *     responses:
 *       200:
 *         description: Lista ogłoszeń
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Błąd pobierania ogłoszeń
 */
router.get('/rentposts', rentPostController.getRentPosts);

/**
 * @swagger
 * /rentpost:
 *   post:
 *     summary: Dodaj nowe ogłoszenie
 *     tags: [RentPost]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Rower górski"
 *               description:
 *                 type: string
 *                 example: "Super rower na weekend."
 *               monThirsPrice:
 *                 type: number
 *                 example: 10
 *               weekendPrice:
 *                 type: number
 *                 example: 20
 *               twoDaysPrice:
 *                 type: number
 *                 example: 30
 *               threeDaysPrice:
 *                 type: number
 *                 example: 40
 *               everyNextDayPrice:
 *                 type: number
 *                 example: 50
 *               categoriesId:
 *                 type: integer
 *                 example: 1
 *               phoneNumber:
 *                 type: string
 *                 example: "123456789"
 *               photoSrc:
 *                 type: string
 *                 example: "img.png"
 *     responses:
 *       201:
 *         description: Ogłoszenie dodane
 *       400:
 *         description: Błąd dodawania ogłoszenia
 */
router.post('/rentpost', authMiddleware, rentPostLimiter, rentPostController.addRentPost);

/**
 * @swagger
 * /rentpost/{id}:
 *   get:
 *     summary: Pobierz ogłoszenie po ID
 *     tags: [RentPost]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ogłoszenia
 *     responses:
 *       200:
 *         description: Ogłoszenie
 *       404:
 *         description: Nie znaleziono ogłoszenia
 */
router.get('/rentpost/:id', rentPostController.getRentPostById);

/**
 * @swagger
 * /rentpost/{id}/promotion:
 *   post:
 *     summary: Dodaj promocję do ogłoszenia
 *     tags: [RentPost]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ogłoszenia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-10"
 *     responses:
 *       201:
 *         description: Promocja została ustawiona
 *       400:
 *         description: Błąd dodawania promocji
 */
router.post('/rentpost/:id/promotion', rentPostController.addPromotion);

/**
 * @swagger
 * /rentpost/{id}/promotion:
 *   get:
 *     summary: Pobierz promocję ogłoszenia
 *     tags: [RentPost]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ogłoszenia
 *     responses:
 *       200:
 *         description: Promocja ogłoszenia
 *       404:
 *         description: Nie znaleziono promocji
 */
router.get('/rentpost/:id/promotion', rentPostController.getPromotion);

module.exports = router;
