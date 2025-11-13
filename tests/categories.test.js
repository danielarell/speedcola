const request = require('supertest');
const express = require('express');

// Mock del pool de base de datos
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../config/db');
const categoriesRouter = require('../routes/categories.routes.js');

const app = express();
app.use(express.json());
app.use('/', categoriesRouter);

describe('GET /api/categories', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver todas las categorías correctamente', async () => {
    // Datos simulados
    const mockRows = [
      { idCategoria: 1, nombre: 'Salud' },
      { idCategoria: 2, nombre: 'Educación' },
    ];
    pool.query.mockResolvedValueOnce([mockRows]);

    const res = await request(app).get('/api/categories');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM categoria');
  });

  it('debe devolver error 500 si la base de datos falla', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app).get('/api/categories');

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Error al mostrar Categorias');
    expect(res.body).toHaveProperty('details', 'DB Error');
  });
});
