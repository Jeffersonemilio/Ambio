const app = require('./app');
const { startWorker } = require('./worker');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Inicia o worker (conecta ao banco e RabbitMQ, executa migrations)
    await startWorker();

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Documentação Swagger em http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

start();
