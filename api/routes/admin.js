const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many admin actions, please try again later.'
});

/**
 * @swagger
 * /admin/features:
 *   post:
 *     summary: Dodaj nową rolę/feature
 *     tags: [Admin]
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
 *                 example: "Rower"
 *               img_src:
 *                 type: string
 *                 example: "rower.png"
 *     responses:
 *       201:
 *         description: Dodano feature
 */
router.post('/features', adminMiddleware, adminLimiter, adminController.addFeature);

/**
 * @swagger
 * /admin/admins:
 *   post:
 *     summary: Dodaj nowego admina
 *     tags: [Admin]
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
 *                 example: "jan@kowalski.pl"
 *               password:
 *                 type: string
 *                 example: "tajnehaslo"
 *     responses:
 *       201:
 *         description: Dodano admina
 */
router.post('/admins', adminMiddleware, adminLimiter, adminController.addAdmin);

/**
 * @swagger
 * /admin/admins/{id}:
 *   delete:
 *     summary: Usuń admina
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usunięto admina
 */
router.delete('/admins/:id', adminMiddleware, adminLimiter, adminController.deleteAdmin);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Pobierz listę użytkowników
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista użytkowników
 */
router.get('/users', adminMiddleware, adminLimiter, adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Anonimizuj użytkownika (flaga is_deleted)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Użytkownik zanonimizowany
 */     
router.delete('/users/:id', adminMiddleware, adminLimiter, adminController.deleteUser);  

module.exports = router;