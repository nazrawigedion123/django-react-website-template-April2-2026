const PROTOBUF_FIELD_TAG = 0x0a;

export const PROTOBUF_CONTENT_TYPE = "application/x-protobuf";
export const PROTOBUF_ALT_CONTENT_TYPE = "application/protobuf";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function encodeVarint(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Varint values must be non-negative integers.");
  }

  const bytes: number[] = [];
  let remaining = value;

  while (remaining > 0x7f) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }

  bytes.push(remaining);
  return Uint8Array.from(bytes);
}

function decodeVarint(data: Uint8Array, start: number): { value: number; offset: number } {
  let value = 0;
  let shift = 0;
  let offset = start;

  while (offset < data.length) {
    const byte = data[offset];
    offset += 1;
    value |= (byte & 0x7f) << shift;

    if ((byte & 0x80) === 0) {
      return { value, offset };
    }

    shift += 7;
    if (shift >= 35) {
      break;
    }
  }

  throw new Error("Invalid protobuf varint.");
}

function toUint8Array(value: ArrayBuffer | Uint8Array): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  return new Uint8Array(value);
}

export function encodeProtobufEnvelope(payload: unknown): Uint8Array {
  const jsonBytes = textEncoder.encode(JSON.stringify(payload));
  const sizeBytes = encodeVarint(jsonBytes.length);
  const result = new Uint8Array(1 + sizeBytes.length + jsonBytes.length);

  result[0] = PROTOBUF_FIELD_TAG;
  result.set(sizeBytes, 1);
  result.set(jsonBytes, 1 + sizeBytes.length);

  return result;
}

export function decodeProtobufEnvelope(payload: ArrayBuffer | Uint8Array): unknown {
  const data = toUint8Array(payload);
  if (data.length === 0) {
    return null;
  }

  let offset = 0;
  let body: Uint8Array | null = null;

  while (offset < data.length) {
    const tag = decodeVarint(data, offset);
    offset = tag.offset;

    const wireType = tag.value & 0x07;
    const fieldNumber = tag.value >> 3;
    if (wireType !== 2) {
      throw new Error("Unsupported protobuf wire type.");
    }

    const size = decodeVarint(data, offset);
    offset = size.offset;

    const end = offset + size.value;
    if (end > data.length) {
      throw new Error("Malformed protobuf payload.");
    }

    const value = data.slice(offset, end);
    offset = end;

    if (fieldNumber === 1) {
      body = value;
    }
  }

  if (!body) {
    throw new Error("Missing protobuf payload field.");
  }

  return JSON.parse(textDecoder.decode(body));
}

export function isProtobufContentType(contentType?: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return [PROTOBUF_CONTENT_TYPE, PROTOBUF_ALT_CONTENT_TYPE].some((value) => contentType.includes(value));
}

export function decodeApiResponseBody(
  body: unknown,
  contentType?: string | null,
): unknown {
  if (body == null) {
    return body;
  }

  if (isProtobufContentType(contentType)) {
    if (body instanceof ArrayBuffer || body instanceof Uint8Array) {
      return decodeProtobufEnvelope(body);
    }
    throw new Error("Expected a binary protobuf response.");
  }

  if (body instanceof ArrayBuffer) {
    if (body.byteLength === 0) {
      return null;
    }

    const text = textDecoder.decode(new Uint8Array(body));
    if (!text) {
      return null;
    }

    if (!contentType || contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (_error) {
        return text;
      }
    }

    return text;
  }

  return body;
}
