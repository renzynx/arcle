import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

export type JWTVerifierConfig = {
  jwksUrl: string;
  issuer?: string;
  audience?: string;
};

export type VerifiedPayload = JWTPayload & {
  sub: string;
  email?: string;
  role?: string;
};

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJWKSUrl: string | null = null;

function getJWKS(jwksUrl: string) {
  if (cachedJWKS && cachedJWKSUrl === jwksUrl) {
    return cachedJWKS;
  }
  cachedJWKS = createRemoteJWKSet(new URL(jwksUrl));
  cachedJWKSUrl = jwksUrl;
  return cachedJWKS;
}

export async function verifyToken(
  token: string,
  config: JWTVerifierConfig,
): Promise<VerifiedPayload> {
  const JWKS = getJWKS(config.jwksUrl);

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: config.issuer,
    audience: config.audience,
  });

  return payload as VerifiedPayload;
}

export function createJWTVerifier(config: JWTVerifierConfig) {
  return {
    verify: (token: string) => verifyToken(token, config),
  };
}
