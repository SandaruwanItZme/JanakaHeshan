const { ActivityLog } = require('../models');
const { collection } = require('../store');

const Notifications = collection('notifications'); // { id, type, title, body, read }

async function logActivity({ action, user = 'system', ip = '', result = 'success' }) {
  return ActivityLog.create({ action, user, ip, result });
}

async function notify({ type, title, body = '' }) {
  return Notifications.create({ type, title, body, read: false });
}

module.exports = { logActivity, notify, Notifications };
