// src/database/utils.js

import { NITRO_SQLITE_NULL } from 'react-native-nitro-sqlite';

export function toSqliteValue(val) {
  return val === null || val === undefined ? NITRO_SQLITE_NULL : val;
}

export function fromSqliteValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.isNitroSQLiteNull) return null;
  return val;
}
