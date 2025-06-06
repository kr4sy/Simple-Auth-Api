const pool = require('../db-pool');
const bcrypt = require('bcrypt');

//-------------------------------------------------------------------------------------//
//----------------------------------get info o profilu---------------------------------//
//-------------------------------------------------------------------------------------//

exports.getProfileInfo = async (userId) => {
    const sql1 = 'SELECT first_name, surname, email, phone_number FROM users WHERE id = ?';
    const [rows] = await pool.query(sql1, [userId]);
    return rows;
};

//-------------------------------------------------------------------------------------//
//---------------------------------zmień dane profilu----------------------------------//
//-------------------------------------------------------------------------------------//

exports.updateProfileInfo = async (userId, { firstName, surname, email, phoneNumber }) => {
    const fields = [];
    const values = [];
    if (firstName !== undefined) {
        if (firstName.length < 2) {
            throw new Error('Imię musi mieć co najmniej 2 znaki');
        }
        fields.push('first_name = ?');
        values.push(firstName);
    }
    if (surname !== undefined) {
        if (surname.length < 2) {
            throw new Error('Nazwisko musi mieć co najmniej 2 znaki');
        }
        fields.push('surname = ?');
        values.push(surname);
    }
    if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
    }
    if (phoneNumber !== undefined) {
        fields.push('phone_number = ?');
        values.push(phoneNumber);
    }
    if (fields.length === 0) {
        throw new Error('No data provided for update');
    }
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);
    const [result] = await pool.query(sql, values);
    if (result.changedRows === 0) {
        throw new Error('Nie zmieniono żadnych danych');
    }
    return result;
};

//-------------------------------------------------------------------------------------//
//-------------------------------------zmień hasło-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.updateProfilePassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await pool.query(sql, [hashedPassword, userId]);
    if (result.affectedRows === 0) {
        throw new Error('User not found');
    }
    return result;

};

exports.checkPassword = async (userId, password) => {
    const sql = 'SELECT password FROM users WHERE id = ?';
    const [rows] = await pool.query(sql, [userId]);
    if (!rows.length) throw new Error('User not found');
    const user = rows[0];
    return await bcrypt.compare(password, user.password);
};