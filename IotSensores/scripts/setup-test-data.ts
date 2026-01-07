/**
 * Setup Test Data Script
 *
 * Creates a test tenant and sensor for development.
 *
 * Usage:
 *   npx tsx scripts/setup-test-data.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface Tenant {
  id: string;
  name: string;
  document: string;
  email: string;
}

interface Sensor {
  id: string;
  serial_number: string;
  tenant_id: string;
  name: string;
  location: string;
}

async function createTenant(): Promise<Tenant> {
  const response = await fetch(`${API_URL}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Laboratório Teste',
      document: '12345678000199',
      email: 'teste@laboratorio.com',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      console.log('⚠️  Tenant already exists, fetching...');
      const listResponse = await fetch(`${API_URL}/api/tenants`);
      const tenants = (await listResponse.json()) as Tenant[];
      const existing = tenants.find((t) => t.document === '12345678000199');
      if (existing) return existing;
    }
    throw new Error(`Failed to create tenant: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function createSensor(tenantId: string, index: number): Promise<Sensor> {
  const serialNumber = `JV005SMHO00000${index}`;

  const response = await fetch(`${API_URL}/api/sensors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serial_number: serialNumber,
      tenant_id: tenantId,
      name: `Sensor ${index}`,
      location: `Sala ${index}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      console.log(`⚠️  Sensor ${serialNumber} already exists`);
      const listResponse = await fetch(`${API_URL}/api/sensors?tenant_id=${tenantId}`);
      const sensors = (await listResponse.json()) as Sensor[];
      const existing = sensors.find((s) => s.serial_number === serialNumber);
      if (existing) return existing;
    }
    throw new Error(`Failed to create sensor: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Setting up test data...\n');

  try {
    // Create tenant
    console.log('Creating tenant...');
    const tenant = await createTenant();
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})\n`);

    // Create sensors
    console.log('Creating sensors...');
    const sensors: Sensor[] = [];
    for (let i = 1; i <= 3; i++) {
      const sensor = await createSensor(tenant.id, i);
      sensors.push(sensor);
      console.log(`✅ Sensor created: ${sensor.serial_number} - ${sensor.name}`);
    }

    console.log('\n✅ Test data setup complete!\n');
    console.log('You can now run the mock sensor:');
    console.log(`  SERIAL_NUMBER=${sensors[0].serial_number} npx tsx scripts/mock-sensor.ts`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
