// CRC-32 (IEEE 802.3, reflected, polynomial 0xEDB88320) as used by the zip
// format. Table-driven; a 6 MB bundle checks in a few milliseconds.

const TABLE = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  TABLE[n] = c
}

/**
 * @param {Uint8Array} bytes
 * @param {number} [previous] running value from an earlier call, for incremental use
 * @returns {number} unsigned 32-bit checksum
 */
export function crc32(bytes, previous = 0) {
  let c = ~previous
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return ~c >>> 0
}
