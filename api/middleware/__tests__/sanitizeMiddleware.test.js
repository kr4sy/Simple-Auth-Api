const sanitizeMiddleware = require('../sanitizeMiddleware');
const sanitizeHtml = require('sanitize-html');

jest.mock('sanitize-html', () => jest.fn(str => `clean:${str}`));

describe('sanitizeMiddleware', () => {
  it('sanitizes all string fields in req.body', () => {
    const req = {
      body: {
        name: '<script>alert(1)</script>',
        desc: 'test',
        number: 123
      }
    };
    const res = {};
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.body.name).toBe('clean:<script>alert(1)</script>');
    expect(req.body.desc).toBe('clean:test');
    expect(req.body.number).toBe(123); // nie zmienia liczb
    expect(sanitizeHtml).toHaveBeenCalledWith('<script>alert(1)</script>');
    expect(sanitizeHtml).toHaveBeenCalledWith('test');
    expect(next).toHaveBeenCalled();
  });

  it('calls next if req.body is not an object', () => {
    const req = { body: null };
    const res = {};
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});