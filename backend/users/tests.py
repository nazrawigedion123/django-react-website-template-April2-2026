from django.test import SimpleTestCase
from rest_framework.exceptions import ParseError

from config.protobuf import decode_protobuf_envelope, encode_protobuf_envelope


class ProtobufEnvelopeTests(SimpleTestCase):
    def test_round_trip_dict_payload(self):
        payload = {
            "detail": "ok",
            "items": [1, 2, {"nested": True}],
        }

        encoded = encode_protobuf_envelope(payload)

        self.assertEqual(decode_protobuf_envelope(encoded), payload)

    def test_invalid_payload_raises_parse_error(self):
        with self.assertRaises(ParseError):
            decode_protobuf_envelope(b"\x08\x01")
