const pool = require('../db-pool');
const bcrypt = require('bcrypt');

//-------------------------------------------------------------------------------------//
//----------------------------------dodaj feature--------------------------------------//
//-------------------------------------------------------------------------------------//

exports.addFeature = async ({ title, img_src }) => {
  if (!title) throw new Error('Title is required');
  const sql = 'INSERT INTO categories (title, img_src) VALUES (?, ?)';
  await pool.query(sql, [title, img_src || null]);
};

//-------------------------------------------------------------------------------------//
//----------------------------------dodaj admina---------------------------------------//
//-------------------------------------------------------------------------------------//

exports.addAdmin = async ({ firstName, surname, email, password }) => {
  if (!firstName || !surname || !email || !password) throw new Error('All fields are required');
  const [[existingUser]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser) throw new Error('User already exists');
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = `INSERT INTO users (first_name, surname, email, password, is_admin, is_verified) VALUES (?, ?, ?, ?, 1, 1)`;
  await pool.query(sql, [firstName, surname, email, hashedPassword]);
};

//-------------------------------------------------------------------------------------//
//----------------------------------usuń admina----------------------------------------//
//-------------------------------------------------------------------------------------//

exports.deleteAdmin = async (id) => {
  const sql = 'UPDATE users SET is_admin = 0 WHERE id = ?';
  const [result] = await pool.query(sql, [id]);
  if (result.affectedRows === 0) throw new Error('Admin not found');
};

//-------------------------------------------------------------------------------------//
//---------------------------------wyświetl userów-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.getUsers = async () => {
  const sql = 'SELECT id, first_name, surname, email, is_deleted FROM users WHERE is_admin = 0';
  const [rows] = await pool.query(sql);
  return rows;
};

//-------------------------------------------------------------------------------------//
//-----------------------------------usuń usera----------------------------------------//
//-------------------------------------------------------------------------------------//

exports.deleteUser = async (id) => {
  const sql = `UPDATE users SET is_deleted = 1, first_name = NULL, surname = NULL, email = NULL, password = NULL WHERE id = ?`;
  const [result] = await pool.query(sql, [id]);
  if (result.affectedRows === 0) throw new Error('User not found');
};
