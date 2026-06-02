// Global test setup: in-memory Mongo + mocked Cognito verifier.

import { afterAll, afterEach, beforeAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Stub Cognito env vars so cognitoVerifier.js doesn't warn at import time.
process.env.COGNITO_USER_POOL_ID = "us-east-2_test";
process.env.COGNITO_CLIENT_ID = "test-client-id";
process.env.COGNITO_REGION = "us-east-2";
process.env.COGNITO_DOMAIN = "test-domain";
process.env.COGNITO_CLIENT_SECRET = "test-secret";
process.env.USDA_API_KEY = "test-usda-key";

// Token verification is controlled per-test by mutating this object.
// Default: every token resolves to user "user-a".
export const verifyState = {
	implementation: async () => ({
		sub: "user-a",
		username: "user-a",
		"cognito:username": "user-a",
		email: "user-a@example.com",
	}),
};

vi.mock("aws-jwt-verify", () => {
	return {
		CognitoJwtVerifier: {
			create: () => ({
				verify: (token) => verifyState.implementation(token),
			}),
		},
	};
});

let mongo;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
	const collections = mongoose.connection.collections;
	for (const name of Object.keys(collections)) {
		await collections[name].deleteMany({});
	}
	// Reset verifier to the default user between tests.
	verifyState.implementation = async () => ({
		sub: "user-a",
		username: "user-a",
		"cognito:username": "user-a",
		email: "user-a@example.com",
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	if (mongo) await mongo.stop();
});
