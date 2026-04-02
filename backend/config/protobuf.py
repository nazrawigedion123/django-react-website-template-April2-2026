import json
from typing import Any

from rest_framework.exceptions import ParseError
from rest_framework.parsers import BaseParser
from rest_framework.renderers import BaseRenderer

PROTOBUF_MEDIA_TYPE = "application/x-protobuf"
PROTOBUF_ALT_MEDIA_TYPE = "application/protobuf"
PROTOBUF_FIELD_TAG = 0x0A  # field 1, wire type 2


def _encode_varint(value: int) -> bytes:
    if value < 0:
        raise ValueError("Varint values must be non-negative.")

    parts = bytearray()
    while value > 0x7F:
        parts.append((value & 0x7F) | 0x80)
        value >>= 7
    parts.append(value)
    return bytes(parts)


def _decode_varint(data: memoryview, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0

    while offset < len(data):
        byte = data[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if not (byte & 0x80):
            return value, offset
        shift += 7
        if shift >= 64:
            break

    raise ParseError("Invalid protobuf varint.")


def encode_protobuf_envelope(payload: Any) -> bytes:
    json_bytes = json.dumps(payload).encode("utf-8")
    return bytes([PROTOBUF_FIELD_TAG]) + _encode_varint(len(json_bytes)) + json_bytes


def decode_protobuf_envelope(raw_body: bytes) -> Any:
    if not raw_body:
        return None

    data = memoryview(raw_body)
    offset = 0
    payload_bytes = None

    while offset < len(data):
        tag, offset = _decode_varint(data, offset)
        wire_type = tag & 0x07
        field_number = tag >> 3

        if wire_type != 2:
            raise ParseError("Unsupported protobuf wire type.")

        size, offset = _decode_varint(data, offset)
        end = offset + size
        if end > len(data):
            raise ParseError("Malformed protobuf payload.")

        field_value = data[offset:end].tobytes()
        offset = end

        if field_number == 1:
            payload_bytes = field_value

    if payload_bytes is None:
        raise ParseError("Missing protobuf payload field.")

    try:
        return json.loads(payload_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ParseError("Invalid protobuf JSON payload.") from exc


class _BaseProtobufParser(BaseParser):
    def parse(self, stream, media_type=None, parser_context=None):
        return decode_protobuf_envelope(stream.read())


class ProtobufParser(_BaseProtobufParser):
    media_type = PROTOBUF_MEDIA_TYPE


class LegacyProtobufParser(_BaseProtobufParser):
    media_type = PROTOBUF_ALT_MEDIA_TYPE


class _BaseProtobufRenderer(BaseRenderer):
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        return encode_protobuf_envelope(data)


class ProtobufRenderer(_BaseProtobufRenderer):
    media_type = PROTOBUF_MEDIA_TYPE
    format = "protobuf"


class LegacyProtobufRenderer(_BaseProtobufRenderer):
    media_type = PROTOBUF_ALT_MEDIA_TYPE
    format = "proto"
