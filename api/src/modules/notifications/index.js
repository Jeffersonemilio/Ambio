const notificationsRepository = require('./notifications.repository');
const notificationsService = require('./notifications.service');
const channelRegistry = require('./channel.registry');

// Canais
const BaseNotificationChannel = require('./channels/base.channel');
const EmailChannel = require('./channels/email.channel');
const SmsChannel = require('./channels/sms.channel');
const WhatsAppChannel = require('./channels/whatsapp.channel');
const PhoneChannel = require('./channels/phone.channel');

module.exports = {
  notificationsRepository,
  notificationsService,
  channelRegistry,

  // Classes de canais (para extensao)
  BaseNotificationChannel,
  EmailChannel,
  SmsChannel,
  WhatsAppChannel,
  PhoneChannel,
};
