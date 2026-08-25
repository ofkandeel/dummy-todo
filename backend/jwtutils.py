# backend/jwtutils.py
import jwt
import os
from jwt import PyJWKClient
from dotenv import load_dotenv

load_dotenv()

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise ValueError("CLERK_JWKS_URL environment variable is not set")

jwks_client = PyJWKClient(
    CLERK_JWKS_URL,
    headers={"User-Agent": "FastAPI-Backend/1.0"}
)

def verify_clerk_token(token: str) -> dict:
    """Verifies a Clerk JWT and returns the decoded payload."""
    try:
        print(f"🔍 Verifying token: {token[:20]}...")  # Print first 20 chars
        
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        print(f"🔑 Signing key fetched: {signing_key.key_id}")
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=os.getenv("CLERK_ISSUER"),
            options={
                "verify_aud": False,
                "verify_iss": True
            }
        )
        print(f"✅ Decoded payload: {payload}")
        return payload
    except jwt.PyJWTError as e:
        print(f"❌ JWT validation error: {e}")
        return None