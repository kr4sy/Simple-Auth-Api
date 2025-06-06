const rentPostService = require('../rentPostService');
const pool = require('../../db-pool');

jest.mock('../../db-pool');

afterEach(() => jest.clearAllMocks());

//----------------.test dodawania ogłoszenia.----------------//

describe('rentPostService.addRentPost', () => {
  it('throws error if required fields are missing', async () => {
    await expect(rentPostService.addRentPost({})).rejects.toThrow('Wszystkie pola są wymagane');
  });
  it('throws error if phone number is not 9 digits', async () => {
    await expect(rentPostService.addRentPost({
      userId: 1, title: 'T', description: 'D', monThirsPrice: 10, weekendPrice: 20, categoriesId: 1, phoneNumber: '123',
    })).rejects.toThrow('Numer telefonu musi mieć 9 cyfr');
  });
  it('inserts rent post with photo', async () => {
    pool.query
      .mockResolvedValueOnce([{ insertId: 10 }, []])
      .mockResolvedValueOnce([{ insertId: 20 }, []])
      .mockResolvedValueOnce([{ insertId: 30 }, []])
      .mockResolvedValueOnce([[{ id: 30, title: 'T' }], []]);
    const result = await rentPostService.addRentPost({
      userId: 1,
      title: 'T',
      description: 'D',
      monThirsPrice: 10,
      weekendPrice: 20,
      twoDaysPrice: 30,
      threeDaysPrice: 40,
      everyNextDayPrice: 50,
      categoriesId: 1,
      phoneNumber: '123456789',
      photoSrcs: ['img.png']
    });
    expect(result).toEqual({ id: 30, title: 'T' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO price'), [10, 20, 30, 40, 50]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO photos'), ['img.png']);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO rent_post'), [1, 'T', 'D', 10, 1, '123456789', 20]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post WHERE id = ?', [30]);
  });
  it('inserts rent post without photo', async () => {
    pool.query
      .mockResolvedValueOnce([{ insertId: 10 }, []])
      .mockResolvedValueOnce([{ insertId: 30 }, []])
      .mockResolvedValueOnce([[{ id: 30, title: 'T' }], []]);
    const result = await rentPostService.addRentPost({
      userId: 1,
      title: 'T',
      description: 'D',
      monThirsPrice: 10,
      weekendPrice: 20,
      twoDaysPrice: 30,
      threeDaysPrice: 40,
      everyNextDayPrice: 50,
      categoriesId: 1,
      phoneNumber: '123456789',
      photoSrcs: [] // poprawka: przekazujemy pustą tablicę
    });
    expect(result).toEqual({ id: 30, title: 'T' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO price'), [10, 20, 30, 40, 50]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO rent_post'), [1, 'T', 'D', 10, 1, '123456789', null]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post WHERE id = ?', [30]);
  });
});

//----------------.test wyświetlania ogłoszeń i filtracji.----------------//

describe('rentPostService.getRentPosts', () => {
  it('returns all posts when no filters', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, title: 'A' }, { id: 2, title: 'B' }], []]);
    const result = await rentPostService.getRentPosts();
    expect(result).toEqual([{ id: 1, title: 'A' }, { id: 2, title: 'B' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post', []);
  });
  it('filters by categoriesId', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 3, title: 'C' }], []]);
    const result = await rentPostService.getRentPosts({ categoriesId: 5 });
    expect(result).toEqual([{ id: 3, title: 'C' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post WHERE categories_id = ?', [5]);
  });
  it('filters by search', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 4, title: 'rower' }], []]);
    const result = await rentPostService.getRentPosts({ search: 'rower' });
    expect(result).toEqual([{ id: 4, title: 'rower' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post WHERE title LIKE ?', ['%rower%']);
  });
  it('filters by categoriesId and search', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 5, title: 'rower' }], []]);
    const result = await rentPostService.getRentPosts({ categoriesId: 2, search: 'rower' });
    expect(result).toEqual([{ id: 5, title: 'rower' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post WHERE categories_id = ? AND title LIKE ?', [2, '%rower%']);
  });
  it('sorts by column', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 6, title: 'Z' }], []]);
    const result = await rentPostService.getRentPosts({ sortBy: 'title', sortOrder: 'DESC' });
    expect(result).toEqual([{ id: 6, title: 'Z' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM rent_post ORDER BY title DESC', []);
  });
});

//----------------.test wyświetlania ogłoszenia po id.----------------//
describe('rentPostService.getRentPostById', () => {
  it('returns rent post with features', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, title: 'T', description: 'D' }], []])
      .mockResolvedValueOnce([[{ id: 2, title: 'F', imgSrc: 'img.png' }], []]);
    const result = await rentPostService.getRentPostById(1);
    expect(result).toEqual({ id: 1, title: 'T', description: 'D', features: [{ id: 2, title: 'F', imgSrc: 'img.png' }] });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT rp.id'), [1]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT f.id'), [1]);
  });
  it('throws error if not found', async () => {
    pool.query.mockResolvedValueOnce([[undefined], []]);
    await expect(rentPostService.getRentPostById(1)).rejects.toThrow('Ogłoszenie nie zostało znalezione');
  });
});

//----------------.test dodawania promocji.----------------//
describe('rentPostService.addPromotion', () => {
  it('throws error if missing fields', async () => {
    await expect(rentPostService.addPromotion()).rejects.toThrow('Wszystkie pola są wymagane');
  });
  it('throws error if end before start', async () => {
    await expect(rentPostService.addPromotion(1, '2024-01-10', '2024-01-01')).rejects.toThrow('Data zakończenia musi być późniejsza niż data rozpoczęcia');
  });
  it('throws error if longer than 7 days', async () => {
    await expect(rentPostService.addPromotion(1, '2024-01-01', '2024-01-20')).rejects.toThrow('Promocja nie może trwać dłużej niż 7 dni');
  });
  it('inserts promotion and returns it', async () => {
    pool.query
      .mockResolvedValueOnce([{ insertId: 5 }, []])
      .mockResolvedValueOnce([[{ id: 5, post_id: 1, start_date: '2024-01-01', end_date: '2024-01-05' }], []]);
    const result = await rentPostService.addPromotion(1, '2024-01-01', '2024-01-05');
    expect(result).toEqual({ id: 5, post_id: 1, start_date: '2024-01-01', end_date: '2024-01-05' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO promotions'), [null, 1, expect.any(Date), expect.any(Date)]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM promotions WHERE id = ?', [5]);
  });
});

//----------------.test pobierania promocji.----------------//
describe('rentPostService.getPromotion', () => {
  it('throws error if no postId', async () => {
    await expect(rentPostService.getPromotion()).rejects.toThrow('ID ogłoszenia jest wymagane');
  });
  it('throws error if no promotion', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    await expect(rentPostService.getPromotion(1)).rejects.toThrow('Brak promocji dla tego ogłoszenia');
  });
  it('returns promotion', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 2, post_id: 1, start_date: '2024-01-01', end_date: '2024-01-05' }], []]);
    const result = await rentPostService.getPromotion(1);
    expect(result).toEqual({ id: 2, post_id: 1, start_date: '2024-01-01', end_date: '2024-01-05' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM promotions WHERE post_id = ?'), [1]);
  });
});