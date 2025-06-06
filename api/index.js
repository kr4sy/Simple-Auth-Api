const app = require('./app');

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serwer listening ${PORT}`);
});
//dependencje:
//npm init -y
//npm install express mysql2 dotenv cors jsonwebtoken cookie-parser bcrypt express-rate-limit xss-clean helmet
//npm install --save-dev jest
//npm install --save-dev supertest
//npm install swagger-jsdoc swagger-ui-express
//npm install sanitize-html
//npm install express-basic-auth
//do dodania:
//-dodać joi do walidacji danych rejestracji logowania i zmiany danych
//-dodać logowanie prób nieudanych logowań do audytu
//-zamiast przesylac zdjecia w base64 przesylac za pomoca multer jako pliki multipart/form-data
//-dodac blokade konta po x nieudanych probach logowania na jakis czas
/*
- CI/CD
Brak obsługi ról i uprawnień na poziomie endpointów (poza adminem)
-obsługa uploadu plików
*/