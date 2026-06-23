module.exports = {
  // Local sync (POS ↔ Relay)
  local: {
    port: parseInt(process.env.PORT || '5000', 10),
    pushBatchSize: 50,
    pullBatchSize: 100,
    pullMaxPerTable: 500,
    pushMaxBatch: 100,
    defaultSince: 0,
  },

  // Cloud sync (Relay ↔ Cloud)
  cloud: {
    enabled: false,
    endpoint: process.env.CLOUD_SYNC_URL || '',
    apiKey: process.env.CLOUD_API_KEY || '',
    intervalMs: 5 * 60 * 1000,       // 5 minutes
    retryMaxAttempts: 3,
    retryBaseDelayMs: 5000,          // 5s → 25s → 125s
    batchSize: 100,
  },

  // Allowed tables for sync
  allowedTables: ['products', 'sales', 'users', 'returns'],

  conflictStrategy: 'lastWriteWins',
};
