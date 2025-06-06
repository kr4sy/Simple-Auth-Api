require('dotenv').config({ path: '../config/.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const basicAuth = require('express-basic-auth');
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(sanitizeMiddleware);
app.use('/api-docs', basicAuth({users : {'admin':'xdlol'}, challenge: true,}), swaggerUi.serve, swaggerUi.setup(swaggerSpec, { swaggerUrl: '/api-docs.json' }));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const registrationRoutes = require('./routes/registration');
const loginRoutes = require('./routes/login');
const rentPostRoutes = require('./routes/rentPost');
const emailAuth = require('./routes/emailAuth');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
app.use('/api', profileRoutes);
app.use('/api', registrationRoutes);
app.use('/api', loginRoutes);
app.use('/api', rentPostRoutes);
app.use('/api', emailAuth);
app.use('/api/admin', adminRoutes);

module.exports = app;