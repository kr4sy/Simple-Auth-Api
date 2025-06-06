const pool = require('../db-pool');
const jwt = require('jsonwebtoken');
const { post } = require('../routes/rentPost');

//-------------------------------------------------------------------------------------//
//-----------------------------------Dodaj ogłoszenie----------------------------------//
//-------------------------------------------------------------------------------------//

exports.addRentPost = async ({
  userId,
  title,
  description,
  monThirsPrice,
  weekendPrice,
  twoDaysPrice,
  threeDaysPrice,
  everyNextDayPrice,
  categoriesId,
  phoneNumber,
  photoSrcs, // zmiana na tablicę
  features 
}) => {
  if (!userId || !title || !description || !monThirsPrice || !weekendPrice || !categoriesId || !phoneNumber) {
    throw new Error('Wszystkie pola są wymagane');
  }
  if (phoneNumber.length != 9) {
    throw new Error('Numer telefonu musi mieć 9 cyfr');
  }

  if (photoSrcs && photoSrcs.length > 6) {
    throw new Error('Możesz dodać maksymalnie 6 zdjęć do jednego ogłoszenia');
  }
  const priceSql = `
    INSERT INTO price (mon_thirs_price, weekend_price, 2_days_price, 3_days_price, every_next_day_price)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [priceResult] = await pool.query(priceSql, [
    monThirsPrice,
    weekendPrice,
    twoDaysPrice || null,
    threeDaysPrice || null,
    everyNextDayPrice || null
  ]);
  const priceId = priceResult.insertId;
  let photoIds = [];
  if (photoSrcs && photoSrcs.length > 0) {
    for (const src of photoSrcs) {
      const photoSql = `INSERT INTO photos (src) VALUES (?)`;
      const [photoResult] = await pool.query(photoSql, [src]);
      photoIds.push(photoResult.insertId);
    }
  }
  const mainPhotoId = photoIds.length > 0 ? photoIds[0] : null;
  const rentPostSql = `
    INSERT INTO rent_post (user_id, title, description, price_id, categories_id, phone_number, photo_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [rentPostResult] = await pool.query(rentPostSql, [
    userId,
    title,
    description,
    priceId,
    categoriesId,
    phoneNumber,
    mainPhotoId
  ]);
  const rentPostId = rentPostResult.insertId;
  if (features && features.length > 0) {
    const connectionSql = `
      INSERT INTO post_features_connection (post_id, features_id)
      VALUES ?
    `;
    const connectionValues = features.map(featureId => [rentPostId, featureId]);
    await pool.query(connectionSql, [connectionValues]);
  }
  const [[rentPost]] = await pool.query('SELECT * FROM rent_post WHERE id = ?', [rentPostId]);
  return rentPost;
};

//-------------------------------------------------------------------------------------//
//-------------------------------wyświetl liste ogłoszeń-------------------------------//
//-------------------------------------------------------------------------------------//

exports.getRentPosts = async (filters = {}) => {
  const { categoriesId, search, sortBy, sortOrder } = filters;
  let sql = 'SELECT * FROM rent_post';
  const params = [];
  if (categoriesId) {
    sql += ' WHERE categories_id = ?';
    params.push(categoriesId);
  }
  if (search) {
    sql += categoriesId ? ' AND' : ' WHERE';
    sql += ' title LIKE ?';
    params.push(`%${search}%`);
  }
  if (sortBy) {
    sql += ` ORDER BY ${sortBy} ${sortOrder || 'ASC'}`;
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

//-------------------------------------------------------------------------------------//
//------------------------------wyświetl ogłoszenie po id------------------------------//
//-------------------------------------------------------------------------------------//

exports.getRentPostById = async (id) => {
  const rentPostSql = `
    SELECT rp.id, rp.title, rp.description, rp.phone_number AS phoneNumber, 
           c.title AS category, p.src AS photoSrc,
           pr.mon_thirs_price AS monThirsPrice, pr.weekend_price AS weekendPrice,
           pr.2_days_price AS twoDaysPrice, pr.3_days_price AS threeDaysPrice,
           pr.every_next_day_price AS everyNextDayPrice
    FROM rent_post rp
    JOIN categories c ON rp.categories_id = c.id
    JOIN price pr ON rp.price_id = pr.id
    LEFT JOIN photos p ON rp.photo_id = p.id
    WHERE rp.id = ?
  `;
  const [[rentPost]] = await pool.query(rentPostSql, [id]);
  if (!rentPost) {
    throw new Error('Ogłoszenie nie zostało znalezione');
  }
  const featuresSql = `
    SELECT f.id, f.title, f.img_src AS imgSrc
    FROM post_features_connection pfc
    JOIN features f ON pfc.features_id = f.id
    WHERE pfc.post_id = ?
  `;
  const [features] = await pool.query(featuresSql, [id]);
  rentPost.features = features;
  return rentPost;
};

//-------------------------------------------------------------------------------------//
//------------------------------------dodaj promocje-----------------------------------//
//-------------------------------------------------------------------------------------//

exports.addPromotion = async (postId, startDate, endDate) => {
  if(!postId || !startDate || !endDate) {
    throw new Error('Wszystkie pola są wymagane');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw new Error('Data zakończenia musi być późniejsza niż data rozpoczęcia');
  }

  if(end - start > 7 * 24 * 60 * 60 * 1000) { 
    throw new Error('Promocja nie może trwać dłużej niż 7 dni');
  }

  const promotionSql = `
  INSERT INTO promotions(id, post_id, start_date, end_date)
  VALUES (?, ?, ?, ?)
  `
  const [result] = await pool.query(promotionSql, [null, postId, start, end]);

  const [[promotion]] = await pool.query('SELECT * FROM promotions WHERE id = ?', [result.insertId]);
  return promotion;
}

//-------------------------------------------------------------------------------------//
//----------------------------------wyświetl promocje----------------------------------//
//-------------------------------------------------------------------------------------//

exports.getPromotion = async(postId) => {
  if (!postId) {
    throw new Error('ID ogłoszenia jest wymagane');
  }
  const promotionSql = `
    SELECT * FROM promotions WHERE post_id = ?
  `;
  const [promotions] = await pool.query(promotionSql, [postId]);
  if (promotions.length === 0) {
    throw new Error('Brak promocji dla tego ogłoszenia');
  }
  return promotions[0];
}
