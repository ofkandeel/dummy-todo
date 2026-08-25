# backend/jwtutils.py
import jwt
import os
import logging
from jwt import PyJWKClient
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise ValueError("CLERK_JWKS_URL environment variable is not set")

jwks_client = PyJWKClient(
    CLERK_JWKS_URL,
    headers={"User-Agent": "FastAPI-Backend/1.0"}
)

def verify_clerk_token(token: str) -> dict:
    """Verifies a Clerk JWT by signature only — no issuer/audience validation."""
    try:
        logger.info(f"🔍 Verifying token: {token[:20]}...")
        
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        logger.info(f"🔑 Signing key fetched: {signing_key.key_id}")
        
        # Decode without any validation (just signature check)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": False,
                "verify_iss": False,
                "verify_aud": False,
                "verify_nbf": False,
                "verify_iat": False,
            }
        )
        logger.info(f"✅ Decoded payload: {payload}")
        return payload
    except jwt.PyJWTError as e:
        logger.error(f"❌ JWT validation error: {e}")
        return None