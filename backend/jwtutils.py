# backend/jwtutils.py
import jwt
import requests
import os
from jwt import PyJWKClient

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise ValueError("CLERK_JWKS_URL environment variable is not set")

# Use a PyJWKClient, which caches the keys for 5 minutes [citation:1]
jwks_client = PyJWKClient(CLERK_JWKS_URL, headers={"User-Agent": "FastAPI-Backend/1.0"})

def verify_clerk_token(token: str) -> dict:
    """Verifies a Clerk JWT and returns the decoded payload."""
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=os.getenv("CLERK_AUDIENCE"),
            issuer=os.getenv("CLERK_ISSUER"),
            options={"verify_aud": True, "verify_iss": True},
        )
        return payload
    except jwt.PyJWTError as e:
        print(f"JWT validation error: {e}")
        return None