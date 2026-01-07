# FASE 6 — HARDWARE/FIRMWARE

## Objetivo

Desenvolver o sensor físico completo:
- Hardware funcional (ESP32-C3 + SHT35)
- Firmware com comunicação HTTPS
- Operação offline com data logger
- Autonomia de bateria de 6-12 meses

**Ao final desta fase**: sensores físicos enviando dados reais para o sistema.

---

## Pré-requisitos

- Fase 4 completa (API em produção)
- Endpoint `/ingest` funcionando com API Key
- Ambiente de testes disponível
- Componentes eletrônicos adquiridos

---

## Especificações do Hardware

### Componentes Principais

| Componente | Modelo | Especificação | Qtd |
|------------|--------|---------------|-----|
| Microcontrolador | ESP32-C3-WROOM-02 | Wi-Fi, BLE, low power | 1 |
| Sensor Temp/Umid | SHT35-DIS | ±0.1°C, ±1.5% RH | 1 |
| Bateria | ER14505 (Li-SOCl₂) | 3.6V, 2700mAh | 1 |
| Regulador | TPS62840 | 3.3V, 750nA quiescent | 1 |
| Flash externa | W25Q128 | 16MB SPI Flash | 1 |
| Antena | 2.4GHz PCB/externa | Wi-Fi | 1 |
| LED | RGB ou verde | Status | 1 |
| Botão | Push button | Config/Reset | 1 |
| Caixa | IP67 | Proteção | 1 |

### Diagrama de Blocos

```
┌─────────────────────────────────────────────────────────────┐
│                      SENSOR IoT                             │
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                     │
│  │   BATERIA    │────▶│  REGULADOR   │────▶ 3.3V           │
│  │  ER14505     │     │  TPS62840    │                     │
│  │   3.6V       │     │  (750nA)     │                     │
│  └──────────────┘     └──────────────┘                     │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    ESP32-C3                          │  │
│  │                                                      │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐            │  │
│  │   │  Wi-Fi  │  │   SPI   │  │   I2C   │            │  │
│  │   │ 2.4GHz  │  │  Flash  │  │ Sensor  │            │  │
│  │   └────┬────┘  └────┬────┘  └────┬────┘            │  │
│  │        │            │            │                  │  │
│  └────────┼────────────┼────────────┼──────────────────┘  │
│           │            │            │                      │
│           ▼            ▼            ▼                      │
│      ┌────────┐   ┌────────┐   ┌────────┐                 │
│      │ Antena │   │ W25Q128│   │ SHT35  │                 │
│      │ 2.4GHz │   │ 16MB   │   │ Temp/  │                 │
│      └────────┘   └────────┘   │ Umid   │                 │
│                               └────────┘                   │
│                                                             │
│   [LED] ◉    [BTN] ○                                       │
└─────────────────────────────────────────────────────────────┘
```

### Pinout ESP32-C3

| Pino | Função | Conexão |
|------|--------|---------|
| GPIO0 | Boot | Botão (pull-up) |
| GPIO1 | ADC | Divisor bateria |
| GPIO2 | I2C SDA | SHT35 |
| GPIO3 | I2C SCL | SHT35 |
| GPIO4 | SPI MOSI | Flash |
| GPIO5 | SPI MISO | Flash |
| GPIO6 | SPI CLK | Flash |
| GPIO7 | SPI CS | Flash |
| GPIO8 | LED | Status LED |
| GPIO9 | Boot/Config | Botão |

---

## Firmware

### Stack de Desenvolvimento

| Opção | Prós | Contras |
|-------|------|---------|
| **ESP-IDF** | Mais controle, menor consumo | Mais complexo |
| **Arduino** | Mais simples, mais libs | Menos otimizado |

**Recomendação**: ESP-IDF para produção (melhor controle de energia).

### Estrutura do Projeto (ESP-IDF)

```
firmware/
├── main/
│   ├── main.c                 # Entry point
│   ├── app_config.h           # Configurações
│   ├── wifi_manager.c/h       # Conexão Wi-Fi
│   ├── sensor_sht35.c/h       # Driver SHT35
│   ├── data_logger.c/h        # Flash storage
│   ├── http_client.c/h        # Envio para API
│   ├── power_manager.c/h      # Gestão de energia
│   ├── led_status.c/h         # Indicação visual
│   └── button_handler.c/h     # Interação usuário
│
├── components/
│   └── (libs externas)
│
├── partitions.csv             # Partições da flash
├── sdkconfig                  # Configuração ESP-IDF
└── CMakeLists.txt
```

### Fluxo Principal do Firmware

```
┌─────────────────┐
│   BOOT/INIT    │
│  - Init HW     │
│  - Load config │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  LEITURA SENSOR │
│  - Temperatura  │
│  - Umidade      │
│  - Bateria      │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  SALVAR LOCAL   │
│  (Data Logger)  │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐     Não
│  Hora de enviar?├──────────┐
│  (intervalo)    │          │
└───────┬─────────┘          │
        │ Sim                │
        ▼                    │
┌─────────────────┐          │
│  CONECTAR Wi-Fi │          │
└───────┬─────────┘          │
        │                    │
   ┌────┴────┐               │
   │Conectou?│               │
   └────┬────┘               │
        │                    │
  Sim   │   Não              │
   │    │    │               │
   ▼    │    ▼               │
┌──────┐│ ┌──────────┐       │
│ENVIAR││ │ Manter   │       │
│DADOS ││ │ offline  │       │
│(API) ││ │ (retry   │       │
└──┬───┘│ │ depois)  │       │
   │    │ └─────┬────┘       │
   │    │       │            │
   ▼    ▼       ▼            │
┌─────────────────┐          │
│   DEEP SLEEP    │◀─────────┘
│  (X minutos)    │
└─────────────────┘
```

### Configurações do Firmware

```c
// app_config.h

// Intervalos
#define READING_INTERVAL_SEC      300    // 5 minutos
#define SEND_INTERVAL_SEC         900    // 15 minutos (batch)
#define MAX_OFFLINE_READINGS      1000   // Máximo de leituras offline

// Wi-Fi
#define WIFI_SSID                 ""     // Configurável via BLE/botão
#define WIFI_PASSWORD             ""
#define WIFI_CONNECT_TIMEOUT_MS   10000
#define WIFI_MAX_RETRIES          3

// API
#define API_URL                   "https://api.seudominio.com/ingest"
#define API_KEY                   ""     // Configurável
#define API_TIMEOUT_MS            5000

// Hardware
#define SHT35_I2C_ADDR            0x44
#define BATTERY_ADC_CHANNEL       ADC1_CHANNEL_0
#define LED_GPIO                  8
#define BUTTON_GPIO               9

// Power
#define DEEP_SLEEP_TIME_US        (READING_INTERVAL_SEC * 1000000)
```

### Payload de Envio

```c
// Estrutura do payload
typedef struct {
    char serial_number[20];
    float temperature;
    float humidity;
    char battery_level[10];  // "HIGH", "MEDIUM", "LOW", "CRITICAL"
} sensor_reading_t;

// Função de envio
esp_err_t send_reading(sensor_reading_t *reading) {
    char json[256];
    snprintf(json, sizeof(json),
        "{\"serial_number\":\"%s\","
        "\"temperature\":%.2f,"
        "\"humidity\":%.2f,"
        "\"battery_level\":\"%s\"}",
        reading->serial_number,
        reading->temperature,
        reading->humidity,
        reading->battery_level
    );

    return http_post(API_URL, API_KEY, json);
}
```

### Envio em Batch (Offline)

```c
// Enviar múltiplas leituras acumuladas
esp_err_t send_batch_readings(void) {
    sensor_reading_t readings[MAX_BATCH_SIZE];
    int count = data_logger_read_pending(readings, MAX_BATCH_SIZE);

    for (int i = 0; i < count; i++) {
        esp_err_t err = send_reading(&readings[i]);
        if (err == ESP_OK) {
            data_logger_mark_sent(i);
        } else {
            // Parar e tentar depois
            break;
        }
    }

    return ESP_OK;
}
```

### Data Logger (Flash Externa)

```c
// data_logger.h

// Estrutura de leitura armazenada
typedef struct {
    uint32_t timestamp;         // Unix timestamp
    float temperature;
    float humidity;
    uint8_t battery_percent;
    uint8_t flags;              // sent, valid, etc.
} stored_reading_t;

// API do data logger
esp_err_t data_logger_init(void);
esp_err_t data_logger_store(sensor_reading_t *reading);
int data_logger_read_pending(sensor_reading_t *readings, int max_count);
esp_err_t data_logger_mark_sent(int index);
esp_err_t data_logger_clear_sent(void);
uint32_t data_logger_get_count(void);
```

### Gestão de Energia

```c
// power_manager.c

// Níveis de bateria
typedef enum {
    BATTERY_HIGH,      // > 70%
    BATTERY_MEDIUM,    // 30-70%
    BATTERY_LOW,       // 10-30%
    BATTERY_CRITICAL   // < 10%
} battery_level_t;

// Ler nível da bateria
battery_level_t power_get_battery_level(void) {
    int raw = adc1_get_raw(BATTERY_ADC_CHANNEL);
    float voltage = (raw / 4095.0) * 3.3 * 2;  // Divisor de tensão

    // Li-SOCl₂: 3.6V full, 2.0V empty
    float percent = ((voltage - 2.0) / (3.6 - 2.0)) * 100;

    if (percent > 70) return BATTERY_HIGH;
    if (percent > 30) return BATTERY_MEDIUM;
    if (percent > 10) return BATTERY_LOW;
    return BATTERY_CRITICAL;
}

// Entrar em deep sleep
void power_deep_sleep(uint64_t time_us) {
    esp_wifi_stop();
    esp_deep_sleep(time_us);
}
```

### Cálculo de Autonomia

```
Consumo estimado:
- Deep sleep ESP32-C3: ~5 µA
- Acordar + ler sensor: ~20 mA por 100ms
- Conectar Wi-Fi + enviar: ~100 mA por 3s

Cenário: 1 leitura/5min, envio a cada 15min (batch de 3)

Por hora (12 leituras, 4 envios):
- Deep sleep: 55 min = ~5 µA × 55 min = 275 µAmin
- Leituras: 12 × 100ms × 20mA = 24 mAms = 0.4 mAmin
- Envios: 4 × 3s × 100mA = 1200 mAs = 20 mAmin

Total/hora: ~21 mAmin = 0.35 mAh
Total/dia: 8.4 mAh
Total/mês: 252 mAh

Bateria ER14505: 2700 mAh
Autonomia teórica: ~10 meses

Com margem de segurança: 6-8 meses
```

---

## Entregas

### 1. Protótipo de Hardware

- [ ] Desenhar esquemático
- [ ] Criar lista de materiais (BOM)
- [ ] Montar protótipo em protoboard
- [ ] Testar comunicação I2C com SHT35
- [ ] Testar comunicação SPI com Flash
- [ ] Testar deep sleep e consumo
- [ ] Medir autonomia real

### 2. PCB (Placa de Circuito)

- [ ] Design PCB (KiCad ou EasyEDA)
- [ ] Revisar design
- [ ] Encomendar PCB (JLCPCB, PCBWay)
- [ ] Montar componentes
- [ ] Testar placa montada

### 3. Firmware Base

- [ ] Setup projeto ESP-IDF
- [ ] Driver SHT35 (I2C)
- [ ] Driver Flash (SPI)
- [ ] Wi-Fi manager
- [ ] HTTP client com HTTPS
- [ ] Data logger
- [ ] Power manager
- [ ] LED status

### 4. Firmware Avançado

- [ ] Envio em batch
- [ ] Retry com backoff exponencial
- [ ] Configuração via BLE (opcional)
- [ ] Configuração via botão + LED
- [ ] OTA update (opcional)
- [ ] Watchdog timer
- [ ] Tratamento de erros

### 5. Provisioning

```c
// Processo de configuração inicial
// 1. Pressionar botão por 5s
// 2. LED pisca indicando modo config
// 3. Conectar no AP temporário "IoT-Sensor-XXXX"
// 4. Acessar 192.168.4.1 no navegador
// 5. Inserir SSID, senha Wi-Fi, API key
// 6. Salvar e reiniciar
```

- [ ] Criar AP temporário para config
- [ ] Servidor web embarcado simples
- [ ] Salvar config em NVS
- [ ] Documentar processo

### 6. Caixa/Enclosure

- [ ] Especificar caixa IP67
- [ ] Prensa-cabo para antena
- [ ] Suporte interno para PCB
- [ ] Acesso ao botão
- [ ] Visibilidade do LED
- [ ] Fácil troca de bateria

### 7. Testes

- [ ] Teste de leitura do sensor
- [ ] Teste de conexão Wi-Fi
- [ ] Teste de envio para API
- [ ] Teste de operação offline
- [ ] Teste de sincronização
- [ ] Teste de bateria (24h+)
- [ ] Teste de range Wi-Fi
- [ ] Teste de temperatura (-10°C a 50°C)

### 8. Produção Piloto

- [ ] Montar 10 unidades
- [ ] Calibrar sensores
- [ ] Gerar serial numbers
- [ ] Registrar no sistema
- [ ] Distribuir para clientes piloto
- [ ] Coletar feedback

---

## Serial Number

### Formato

```
JV005SMHO000001
│││││││││└──────── Número sequencial (6 dígitos)
││││││││└───────── Letra identificadora
│││││││└────────── O = Outdoor, I = Indoor
││││││└─────────── H = Humidity, T = Temp only
│││││└──────────── M = MVP, P = Production
││││└───────────── S = Sensor
│││└────────────── 5 = versão do hardware
││└─────────────── 0 = sem prefixo especial
│└──────────────── V = Versão
└───────────────── J = Empresa (Jefferson)
```

### Exemplo de Geração

```c
// Gerar serial baseado em MAC address
void generate_serial(char *serial) {
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);

    snprintf(serial, 20, "JV005SMHO%02X%02X%02X",
             mac[3], mac[4], mac[5]);
}
```

---

## Calibração

### Processo de Calibração Interna

```
1. Referência: termômetro calibrado (±0.1°C)
2. Ambiente controlado (câmara climática ou banho térmico)
3. Pontos de calibração: 0°C, 10°C, 25°C, 40°C
4. Registrar offset em cada ponto
5. Salvar coeficientes de correção na flash
6. Aplicar correção no firmware
```

### Estrutura de Calibração

```c
typedef struct {
    float temp_offset;      // Offset de temperatura
    float temp_slope;       // Correção de slope
    float humidity_offset;  // Offset de umidade
    uint32_t calibration_date;
    uint32_t next_calibration_date;
} calibration_data_t;

// Aplicar correção
float apply_calibration(float raw_temp, calibration_data_t *cal) {
    return (raw_temp * cal->temp_slope) + cal->temp_offset;
}
```

---

## Critérios de Conclusão

A Fase 6 está completa quando:

**Hardware:**
1. [ ] Protótipo funcional montado
2. [ ] PCB projetada e testada
3. [ ] Caixa IP67 especificada

**Firmware:**
4. [ ] Leitura de temperatura/umidade funciona
5. [ ] Envio para API funciona
6. [ ] Operação offline (data logger) funciona
7. [ ] Deep sleep implementado
8. [ ] Consumo medido e documentado

**Produção:**
9. [ ] 10 unidades piloto montadas
10. [ ] Serial numbers gerados
11. [ ] Sensores calibrados
12. [ ] Instalados em clientes piloto
13. [ ] Dados chegando no sistema

---

## Lista de Materiais (BOM) - MVP

| Item | Descrição | Qtd | Preço Unit. | Total |
|------|-----------|-----|-------------|-------|
| ESP32-C3-WROOM-02 | MCU Wi-Fi | 1 | R$ 25 | R$ 25 |
| SHT35-DIS | Sensor T/H | 1 | R$ 35 | R$ 35 |
| ER14505 | Bateria 3.6V | 1 | R$ 30 | R$ 30 |
| TPS62840 | Regulador | 1 | R$ 8 | R$ 8 |
| W25Q128 | Flash 16MB | 1 | R$ 10 | R$ 10 |
| PCB | Placa 2 camadas | 1 | R$ 5 | R$ 5 |
| Componentes SMD | Resistores, caps | - | R$ 10 | R$ 10 |
| Caixa IP67 | Enclosure | 1 | R$ 25 | R$ 25 |
| **TOTAL** | | | | **~R$ 148** |

> Produção em escala reduz custo para ~R$ 80-100/unidade.

---

## Ferramentas Necessárias

### Desenvolvimento

- ESP-IDF v5.x
- VSCode + ESP-IDF Extension
- Logic analyzer (opcional)
- Multímetro

### Produção

- Estação de solda
- Microscópio (SMD)
- Programador/gravador
- Fonte de bancada

---

## Documentação do Firmware

### Guia de Compilação

```bash
# Instalar ESP-IDF
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh
. ./export.sh

# Compilar firmware
cd firmware/
idf.py set-target esp32c3
idf.py build

# Gravar
idf.py -p /dev/ttyUSB0 flash

# Monitor serial
idf.py -p /dev/ttyUSB0 monitor
```

### Guia de Configuração

```bash
# Configurar Wi-Fi e API
idf.py menuconfig
# → Component config → IoT Sensor Config
# → WiFi SSID, Password
# → API URL, API Key
```

---

## Próximos Passos (Pós-MVP)

### Melhorias de Hardware

- [ ] Versão com conector externo para probe
- [ ] Versão com display (e-ink)
- [ ] Versão com gateway 4G
- [ ] Certificação ANATEL

### Melhorias de Firmware

- [ ] OTA updates
- [ ] Configuração via app mobile (BLE)
- [ ] Compressão de dados
- [ ] Criptografia adicional

### Escala

- [ ] Fornecedor de montagem (PCBA)
- [ ] Processo de calibração automatizado
- [ ] Sistema de testes automatizado
- [ ] Embalagem e manual

---

## Conclusão

Esta fase transforma o sistema de software em um produto completo de hardware + software. O sensor MVP é simples, confiável e de baixo custo, permitindo validar o mercado antes de investir em versões mais sofisticadas.

**Custo MVP por sensor: ~R$ 150**
**Autonomia: 6-12 meses**
**Precisão: ±0.2°C (após calibração)**
