const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Retorna uma mensagem de saudação
 *     description: Endpoint que retorna "Olá Mundo"
 *     tags:
 *       - Hello
 *     responses:
 *       200:
 *         description: Mensagem de saudação retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Olá Mundo
 */
router.get('/hello', (req, res) => {
  res.json({ message: 'Olá Mundo' });
});

module.exports = router;
