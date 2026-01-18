const app = require('./app');
const { startWorker } = require('./worker');
const alertWorker = require('./modules/workers/alert.worker');

const PORT = process.env.PORT || 3000;
const ALERT_WORKER_INTERVAL_MS = 60 * 1000; // 1 minuto

let alertWorkerInterval = null;

function startAlertWorker() {
  // Executa imediatamente na primeira vez
  console.log('[Server] Iniciando worker de alertas (intervalo: 1 minuto)');
  alertWorker.run().catch(err => {
    console.error('[Server] Erro na primeira execucao do alert worker:', err.message);
  });

  // Agenda execucoes periodicas
  alertWorkerInterval = setInterval(() => {
    alertWorker.run().catch(err => {
      console.error('[Server] Erro no alert worker:', err.message);
    });
  }, ALERT_WORKER_INTERVAL_MS);
}

function stopAlertWorker() {
  if (alertWorkerInterval) {
    clearInterval(alertWorkerInterval);
    alertWorkerInterval = null;
    console.log('[Server] Worker de alertas parado');
  }
}

async function start() {
  try {
    // Inicia o worker (conecta ao banco e RabbitMQ, executa migrations)
    await startWorker();

    // Inicia o worker de alertas (cron a cada 1 minuto)
    startAlertWorker();

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Documentacao Swagger em http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Erro ao iniciar aplicacao:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando...');
  stopAlertWorker();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando...');
  stopAlertWorker();
  process.exit(0);
});

start();
