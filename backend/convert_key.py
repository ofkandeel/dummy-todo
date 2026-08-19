# convert_key.py
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

# The x and y coordinates from your JSON (copy them exactly)
x_coord = "X4rJdDgG6OxwAVHdmM8q8tb9_Rm9_Umnd3REMMof6ww"
y_coord = "XH6Y2fOcCU9nn5gRU_nR2Wu-YApaTIbmbhBac_W1tD8"

# Decode the base64url encoded coordinates
x_bytes = base64.urlsafe_b64decode(x_coord + "==")
y_bytes = base64.urlsafe_b64decode(y_coord + "==")

# Create the public key from the coordinates
public_key = ec.EllipticCurvePublicNumbers(
    int.from_bytes(x_bytes, byteorder='big'),
    int.from_bytes(y_bytes, byteorder='big'),
    ec.SECP256R1()
).public_key(default_backend())

# Serialize the key to PEM format
pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

print(pem.decode())