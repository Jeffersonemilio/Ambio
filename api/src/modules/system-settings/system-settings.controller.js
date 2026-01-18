const systemSettingsService = require('./system-settings.service');

class SystemSettingsController {
  async findAll(req, res) {
    try {
      const settings = await systemSettingsService.findAll();
      res.json({ data: settings });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async findByKey(req, res) {
    try {
      const { key } = req.params;
      const setting = await systemSettingsService.findByKey(key);

      if (!setting) {
        return res.status(404).json({ error: 'Configuracao nao encontrada' });
      }

      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      if (!value) {
        return res.status(400).json({ error: 'Campo value e obrigatorio' });
      }

      const setting = await systemSettingsService.update(
        key,
        value,
        req.user,
        ipAddress
      );

      res.json(setting);
    } catch (error) {
      if (error.message.includes('Apenas usuarios Ambio')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SystemSettingsController();
