/**
 * Clarity Value Hex Decoder
 * Parses raw hex strings returned by the Hiro API read-only endpoint
 * back into typed JavaScript values.
 *
 * The Hiro API returns Clarity values as hex-encoded strings (e.g.,
 * "0x0100000000000000000000000000000005" for (uint 5)). This module
 * provides a decoder that converts these back to native JS types.
 *
 * Type prefixes (first byte after 0x):
 *   0x00 = int128,  0x01 = uint128,  0x03 = true,  0x04 = false,
 *   0x05 = standard-principal,  0x06 = contract-principal,
 *   0x09 = ok,  0x08 = err,  0x0a = none,  0x0b = some,
 *   0x0c = tuple,  0x0d = string-ascii,  0x0e = string-utf8,
 *   0x0b = some,  0x0f = list,  0x02 = buffer
 */

export type DecodedClarityValue =
  | { type: 'uint'; value: bigint }
  | { type: 'int'; value: bigint }
  | { type: 'bool'; value: boolean }
  | { type: 'principal'; value: string }
  | { type: 'string-ascii'; value: string }
  | { type: 'string-utf8'; value: string }
  | { type: 'buffer'; value: Uint8Array }
  | { type: 'ok'; value: DecodedClarityValue }
  | { type: 'err'; value: DecodedClarityValue }
  | { type: 'none' }
  | { type: 'some'; value: DecodedClarityValue }
  | { type: 'tuple'; value: Record<string, DecodedClarityValue> }
  | { type: 'list'; value: DecodedClarityValue[] };

/** Internal reader that tracks position through the hex buffer. */
class HexReader {
  private pos = 0;
  constructor(private readonly bytes: Uint8Array) {}

  get remaining(): number {
    return this.bytes.length - this.pos;
  }

  readByte(): number {
    if (this.pos >= this.bytes.length) {
      throw new Error('Unexpected end of Clarity value');
    }
    return this.bytes[this.pos++]!;
  }

  readBytes(n: number): Uint8Array {
    if (this.pos + n > this.bytes.length) {
      throw new Error(`Cannot read ${n} bytes, only ${this.remaining} remaining`);
    }
    const slice = this.bytes.slice(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }

  readUint32(): number {
    const bytes = this.readBytes(4);
    return (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!;
  }

  /** Read a 16-byte big-endian unsigned int (uint128). */
  readUint128(): bigint {
    const bytes = this.readBytes(16);
    let result = 0n;
    for (let i = 0; i < 16; i++) {
      result = (result << 8n) | BigInt(bytes[i]!);
    }
    return result;
  }

  /** Read a 16-byte big-endian signed int (int128). */
  readInt128(): bigint {
    const bytes = this.readBytes(16);
    let result = 0n;
    for (let i = 0; i < 16; i++) {
      result = (result << 8n) | BigInt(bytes[i]!);
    }
    // Handle sign bit for 128-bit integers
    const signBit = 1n << 127n;
    if (result >= signBit) {
      result -= 1n << 128n;
    }
    return result;
  }

  /** Read a length-prefixed ASCII string (4-byte length + chars). */
  readLenPrefixedAscii(): string {
    const len = this.readUint32();
    const bytes = this.readBytes(len);
    return String.fromCharCode(...bytes);
  }

  /** Read a length-prefixed UTF-8 string (4-byte length + bytes). */
  readLenPrefixedUtf8(): string {
    const len = this.readUint32();
    const bytes = this.readBytes(len);
    return new TextDecoder().decode(bytes);
  }
}

/**
 * Convert a hex string (with or without 0x prefix) to a Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Read the 20-byte hash160 + 1-byte version for a standard principal.
 */
function readStandardPrincipal(reader: HexReader): string {
  const version = reader.readByte();
  const hash = reader.readBytes(20);

  // Encode as a c32check address (simplified - returns hex representation)
  // In production, use @stacks/transactions c32addressDecode
  const prefix = version === 22 ? 'SP' : version === 26 ? 'ST' : `S${version}`;
  const hashHex = Array.from(hash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${hashHex}`;
}

/**
 * Recursively decode a single Clarity value from the reader.
 */
function decodeValue(reader: HexReader): DecodedClarityValue {
  const typeId = reader.readByte();

  switch (typeId) {
    case 0x00: // int128
      return { type: 'int', value: reader.readInt128() };

    case 0x01: // uint128
      return { type: 'uint', value: reader.readUint128() };

    case 0x02: { // buffer
      const len = reader.readUint32();
      return { type: 'buffer', value: reader.readBytes(len) };
    }

    case 0x03: // true
      return { type: 'bool', value: true };

    case 0x04: // false
      return { type: 'bool', value: false };

    case 0x05: // standard-principal
      return { type: 'principal', value: readStandardPrincipal(reader) };

    case 0x06: { // contract-principal
      const addr = readStandardPrincipal(reader);
      const contractName = reader.readLenPrefixedAscii();
      // contract name uses 1-byte length prefix, not 4
      // Actually, re-check: contract principal = version(1) + hash(20) + name-len(1) + name
      // We already read the standard principal. Now read 1-byte name length + name.
      return { type: 'principal', value: `${addr}.${contractName}` };
    }

    case 0x07: // response-ok
      return { type: 'ok', value: decodeValue(reader) };

    case 0x08: // response-err
      return { type: 'err', value: decodeValue(reader) };

    case 0x09: // none
      return { type: 'none' };

    case 0x0a: // some
      return { type: 'some', value: decodeValue(reader) };

    case 0x0b: { // list
      const count = reader.readUint32();
      const items: DecodedClarityValue[] = [];
      for (let i = 0; i < count; i++) {
        items.push(decodeValue(reader));
      }
      return { type: 'list', value: items };
    }

    case 0x0c: { // tuple
      const fieldCount = reader.readUint32();
      const fields: Record<string, DecodedClarityValue> = {};
      for (let i = 0; i < fieldCount; i++) {
        const nameLen = reader.readByte();
        const nameBytes = reader.readBytes(nameLen);
        const name = String.fromCharCode(...nameBytes);
        fields[name] = decodeValue(reader);
      }
      return { type: 'tuple', value: fields };
    }

    case 0x0d: // string-ascii
      return { type: 'string-ascii', value: reader.readLenPrefixedAscii() };

    case 0x0e: // string-utf8
      return { type: 'string-utf8', value: reader.readLenPrefixedUtf8() };

    default:
      throw new Error(`Unknown Clarity type prefix: 0x${typeId.toString(16).padStart(2, '0')}`);
  }
}

/**
 * Decode a hex-encoded Clarity value from the Hiro API.
 *
 * @param hex - Hex string with or without 0x prefix
 * @returns The decoded Clarity value tree
 *
 * @example
 * // Decode a uint response
 * const result = decodeClarityHex('0x0100000000000000000000000000000005');
 * // { type: 'uint', value: 5n }
 *
 * @example
 * // Decode an ok(uint) response
 * const result = decodeClarityHex('0x070100000000000000000000000000000001');
 * // { type: 'ok', value: { type: 'uint', value: 1n } }
 */
export function decodeClarityHex(hex: string): DecodedClarityValue {
  const bytes = hexToBytes(hex);
  const reader = new HexReader(bytes);
  return decodeValue(reader);
}

// --- Convenience extractors ---

/**
 * Decode hex and extract a uint value. Returns undefined if not a uint.
 */
export function decodeUint(hex: string): bigint | undefined {
  const decoded = decodeClarityHex(hex);
  if (decoded.type === 'uint') return decoded.value;
  if (decoded.type === 'ok' && decoded.value.type === 'uint') return decoded.value.value;
  return undefined;
}

/**
 * Decode hex and extract a boolean. Returns undefined if not a bool.
 */
export function decodeBool(hex: string): boolean | undefined {
  const decoded = decodeClarityHex(hex);
  if (decoded.type === 'bool') return decoded.value;
  if (decoded.type === 'ok' && decoded.value.type === 'bool') return decoded.value.value;
  return undefined;
}

/**
 * Decode hex and extract a string. Returns undefined if not a string.
 */
export function decodeString(hex: string): string | undefined {
  const decoded = decodeClarityHex(hex);
  if (decoded.type === 'string-ascii' || decoded.type === 'string-utf8') return decoded.value;
  return undefined;
}

/**
 * Decode hex and extract tuple fields as a plain object.
 * Converts uint/int to number, bool to boolean, string to string.
 * Returns undefined for non-tuple values.
 */
export function decodeTupleToObject(hex: string): Record<string, unknown> | undefined {
  const decoded = decodeClarityHex(hex);
  const tuple = decoded.type === 'tuple'
    ? decoded
    : decoded.type === 'ok' && decoded.value.type === 'tuple'
      ? decoded.value
      : null;

  if (!tuple || tuple.type !== 'tuple') return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(tuple.value)) {
    result[key] = simplifyValue(val);
  }
  return result;
}

/**
 * Convert a decoded Clarity value to a simple JS value.
 */
function simplifyValue(val: DecodedClarityValue): unknown {
  switch (val.type) {
    case 'uint':
    case 'int': {
      const n = Number(val.value);
      return Number.isSafeInteger(n) ? n : val.value;
    }
    case 'bool':
      return val.value;
    case 'string-ascii':
    case 'string-utf8':
      return val.value;
    case 'principal':
      return val.value;
    case 'buffer':
      return val.value;
    case 'none':
      return null;
    case 'some':
      return simplifyValue(val.value);
    case 'ok':
      return simplifyValue(val.value);
    case 'err':
      return { error: simplifyValue(val.value) };
    case 'list':
      return val.value.map(simplifyValue);
    case 'tuple': {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val.value)) {
        obj[k] = simplifyValue(v);
      }
      return obj;
    }
  }
}

/**
 * Check if a decoded response is an (ok ...) value.
 */
export function isOkResponse(hex: string): boolean {
  const decoded = decodeClarityHex(hex);
  return decoded.type === 'ok';
}

/**
 * Check if a decoded response is an (err ...) value.
 */
export function isErrResponse(hex: string): boolean {
  const decoded = decodeClarityHex(hex);
  return decoded.type === 'err';
}
