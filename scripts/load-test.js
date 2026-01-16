#!/usr/bin/env node

/**
 * Script de teste de carga para validar throughput de 3000 sensores/segundo
 *
 * Uso:
 *   node scripts/load-test.js [opções]
 *
 * Opções:
 *   --url=URL          URL base do servidor (default: http://localhost:3000)
 *   --sensors=N        Número de sensores simulados (default: 100)
 *   --duration=S       Duração do teste em segundos (default: 10)
 *   --rate=N           Requisições por segundo por sensor (default: 30)
 *   --report           Gera relatório detalhado
 */

const http = require('http');
const https = require('https');

// Parse argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const CONFIG = {
  baseUrl: args.url || 'http://localhost:3000',
  sensors: parseInt(args.sensors) || 100,
  duration: parseInt(args.duration) || 10,
  ratePerSensor: parseInt(args.rate) || 30,
  report: args.report || false,
};

// Métricas
const metrics = {
  sent: 0,
  success: 0,
  failed: 0,
  latencies: [],
  errors: {},
  startTime: null,
  endTime: null,
};

// Gerar serial number aleatório
function generateSerialNumber(sensorId) {
  return `LOAD${String(sensorId).padStart(4, '0')}`;
}

// Gerar leitura aleatória
function generateReading(sensorId) {
  return {
    serial_number: generateSerialNumber(sensorId),
    temperature: parseFloat((15 + Math.random() * 25).toFixed(2)),
    humidity: parseFloat((30 + Math.random() * 50).toFixed(2)),
    'battery level': ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
  };
}

// Enviar requisição
function sendRequest(reading) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL('/ingest-temp-hum', CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const data = JSON.stringify(reading);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      const latency = Date.now() - startTime;
      metrics.latencies.push(latency);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        metrics.success++;
      } else {
        metrics.failed++;
        metrics.errors[res.statusCode] = (metrics.errors[res.statusCode] || 0) + 1;
      }

      res.resume();
      resolve();
    });

    req.on('error', (err) => {
      metrics.failed++;
      const errorKey = err.code || err.message;
      metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
      resolve();
    });

    req.on('timeout', () => {
      metrics.failed++;
      metrics.errors['TIMEOUT'] = (metrics.errors['TIMEOUT'] || 0) + 1;
      req.destroy();
      resolve();
    });

    metrics.sent++;
    req.write(data);
    req.end();
  });
}

// Calcular percentil
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Imprimir relatório
function printReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const throughput = metrics.sent / duration;
  const successRate = ((metrics.success / metrics.sent) * 100).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE TESTE DE CARGA');
  console.log('='.repeat(60));

  console.log('\n📈 CONFIGURAÇÃO:');
  console.log(`   URL: ${CONFIG.baseUrl}`);
  console.log(`   Sensores simulados: ${CONFIG.sensors}`);
  console.log(`   Duração: ${CONFIG.duration}s`);
  console.log(`   Taxa alvo: ${CONFIG.sensors * CONFIG.ratePerSensor} req/s`);

  console.log('\n📊 RESULTADOS:');
  console.log(`   Total enviado: ${metrics.sent.toLocaleString()}`);
  console.log(`   Sucesso: ${metrics.success.toLocaleString()} (${successRate}%)`);
  console.log(`   Falhas: ${metrics.failed.toLocaleString()}`);
  console.log(`   Throughput real: ${throughput.toFixed(2)} req/s`);

  if (metrics.latencies.length > 0) {
    console.log('\n⏱️  LATÊNCIA:');
    console.log(`   Mínima: ${Math.min(...metrics.latencies)}ms`);
    console.log(`   Média: ${(metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length).toFixed(2)}ms`);
    console.log(`   p50: ${percentile(metrics.latencies, 50)}ms`);
    console.log(`   p95: ${percentile(metrics.latencies, 95)}ms`);
    console.log(`   p99: ${percentile(metrics.latencies, 99)}ms`);
    console.log(`   Máxima: ${Math.max(...metrics.latencies)}ms`);
  }

  if (Object.keys(metrics.errors).length > 0) {
    console.log('\n❌ ERROS:');
    Object.entries(metrics.errors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([code, count]) => {
        console.log(`   ${code}: ${count}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Avaliação
  const targetThroughput = 3000;
  if (throughput >= targetThroughput) {
    console.log(`✅ PASSOU: Throughput ${throughput.toFixed(0)} >= ${targetThroughput} req/s`);
  } else {
    console.log(`⚠️  ABAIXO DO ALVO: Throughput ${throughput.toFixed(0)} < ${targetThroughput} req/s`);
  }

  if (parseFloat(successRate) >= 99) {
    console.log(`✅ PASSOU: Taxa de sucesso ${successRate}% >= 99%`);
  } else {
    console.log(`⚠️  ATENÇÃO: Taxa de sucesso ${successRate}% < 99%`);
  }

  const p99 = percentile(metrics.latencies, 99);
  if (p99 <= 500) {
    console.log(`✅ PASSOU: Latência p99 ${p99}ms <= 500ms`);
  } else {
    console.log(`⚠️  ATENÇÃO: Latência p99 ${p99}ms > 500ms`);
  }

  console.log('='.repeat(60) + '\n');
}

// Executar teste
async function runTest() {
  console.log('\n🚀 Iniciando teste de carga...');
  console.log(`   Alvo: ${CONFIG.sensors * CONFIG.ratePerSensor} req/s por ${CONFIG.duration}s`);
  console.log(`   URL: ${CONFIG.baseUrl}/ingest-temp-hum\n`);

  metrics.startTime = Date.now();

  const intervalMs = 1000 / CONFIG.ratePerSensor;
  const endTime = metrics.startTime + CONFIG.duration * 1000;

  // Criar intervalos para cada sensor
  const intervals = [];

  for (let sensorId = 1; sensorId <= CONFIG.sensors; sensorId++) {
    const interval = setInterval(() => {
      if (Date.now() >= endTime) return;
      const reading = generateReading(sensorId);
      sendRequest(reading);
    }, intervalMs);

    intervals.push(interval);
  }

  // Progress bar
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - metrics.startTime) / 1000;
    const progress = Math.min(100, (elapsed / CONFIG.duration) * 100);
    const throughput = metrics.sent / elapsed;
    process.stdout.write(
      `\r   Progresso: ${progress.toFixed(0)}% | Enviados: ${metrics.sent.toLocaleString()} | Throughput: ${throughput.toFixed(0)} req/s   `
    );
  }, 500);

  // Aguardar duração do teste
  await new Promise((resolve) => setTimeout(resolve, CONFIG.duration * 1000));

  // Limpar intervalos
  intervals.forEach((interval) => clearInterval(interval));
  clearInterval(progressInterval);

  // Aguardar requisições pendentes
  console.log('\n\n   Aguardando requisições pendentes...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  metrics.endTime = Date.now();

  printReport();
}

// Executar
runTest().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
