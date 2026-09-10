import mongoose, { type ClientSession } from 'mongoose';

let supportsTransactions: boolean | null = null;

function isTransactionUnsupportedError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = String((err as { message: unknown }).message);
    if (
      msg.includes('replica set') ||
      msg.includes('Transaction numbers are only allowed') ||
      msg.includes('This MongoDB deployment does not support retryable writes') ||
      msg.includes('does not support transactions')
    ) {
      return true;
    }
  }
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    // MongoDB error code 20 is IllegalOperation (e.g. transactions not supported on standalone)
    if (code === 20) {
      return true;
    }
  }
  return false;
}

/**
 * Executes a callback within a MongoDB transaction if the connected MongoDB instance
 * is a replica set or mongos (e.g. Atlas, cluster).
 *
 * If connected to a standalone MongoDB instance (such as local/containerized single mongod),
 * it seamlessly runs the callback without a transaction session.
 */
export async function withOptionalTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>,
): Promise<T> {
  // If we already detected that the database does not support transactions, execute directly.
  if (supportsTransactions === false) {
    return await fn(undefined);
  }

  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session!);
    });
    supportsTransactions = true;
    return result;
  } catch (err: unknown) {
    if (isTransactionUnsupportedError(err)) {
      supportsTransactions = false;
      console.warn(
        '[db] Standalone MongoDB detected (no replica set). Running operations without multi-document transaction.',
      );
      return await fn(undefined);
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
