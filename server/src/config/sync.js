module.exports = {
  pushBatchSize: 50,
  pullBatchSize: 100,
  syncInterval: 60_000,
  retryDelay: 5_000,
  maxRetries: 3,
  conflictStrategy: 'lastWriteWins',
};
