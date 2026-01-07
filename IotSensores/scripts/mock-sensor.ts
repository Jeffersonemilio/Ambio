/**
 * Mock Sensor Script
 *
 * Simulates sensor data being sent to the ingest endpoint.
 *
 * Usage:
 *   npx tsx scripts/mock-sensor.ts
 *
 * Environment variables:
 *   API_URL - Base URL of the API (default: http://localhost:3000)
 *   SERIAL_NUMBER - Serial number of the sensor to simulate
 *   INTERVAL - Interval between readings in milliseconds (default: 5000)
 *   COUNT - Number of readings to send (default: 10, 0 = infinite)
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const SERIAL_NUMBER = process.env.SERIAL_NUMBER || 'JV005SMHO000001';
const INTERVAL = parseInt(process.env.INTERVAL || '5000', 10);
const COUNT = parseInt(process.env.COUNT || '10', 10);

type BatteryLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

interface SensorPayload {
  serial_number: string;
  temperature: number;
  humidity: number;
  battery_level: BatteryLevel;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function randomBatteryLevel(): BatteryLevel {
  const rand = Math.random();
  if (rand < 0.6) return 'HIGH';
  if (rand < 0.85) return 'MEDIUM';
  if (rand < 0.95) return 'LOW';
  return 'CRITICAL';
}

function generatePayload(serialNumber: string): SensorPayload {
  return {
    serial_number: serialNumber,
    temperature: randomFloat(-5, 30),
    humidity: randomFloat(30, 90),
    battery_level: randomBatteryLevel(),
  };
}

async function sendReading(payload: SensorPayload): Promise<void> {
  const url = `${API_URL}/ingest`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(
        `[${new Date().toISOString()}] ✅ Sent: temp=${payload.temperature}°C, humidity=${payload.humidity}%, battery=${payload.battery_level}`
      );
      console.log(`   Response: ${JSON.stringify(data)}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Network error:`, error);
  }
}

async function main() {
  console.log('🔌 Mock Sensor Started');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Serial Number: ${SERIAL_NUMBER}`);
  console.log(`   Interval: ${INTERVAL}ms`);
  console.log(`   Count: ${COUNT === 0 ? 'infinite' : COUNT}`);
  console.log('');

  let sent = 0;

  const sendAndSchedule = async () => {
    const payload = generatePayload(SERIAL_NUMBER);
    await sendReading(payload);
    sent++;

    if (COUNT === 0 || sent < COUNT) {
      setTimeout(sendAndSchedule, INTERVAL);
    } else {
      console.log(`\n✅ Done! Sent ${sent} readings.`);
      process.exit(0);
    }
  };

  await sendAndSchedule();
}

main();
