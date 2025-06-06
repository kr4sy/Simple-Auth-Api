const pool = require('../api/db-pool');

async function cleanupExpiredTokens() {
  try {
    const [result] = await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    console.log(`[${new Date().toISOString()}] Usunięto wygasłe refresh tokeny: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error('Błąd podczas czyszczenia tokenów:', err);
    process.exit(1);
  }
}
//npm run cleanup-tokens
//powinno sie to zrobic tak aby skrypt uruchamial sie co 24h sammemu
cleanupExpiredTokens();