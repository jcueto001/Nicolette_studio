const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// Reproducir la carga CommonJS cuando require(ESM) está desactivado en el servidor.
for (const directory of [path.resolve(__dirname, '..'), __dirname]) {
    test(`Firebase Auth carga sin require(ESM): ${path.basename(directory)}`, () => {
        const source = `
            const assert = require('node:assert/strict');
            const { generateKeyPairSync, sign, verify } = require('node:crypto');
            const { initializeApp } = require('firebase-admin/app');
            const { getAuth } = require('firebase-admin/auth');
            const jwks = require('jwks-rsa');
            (async () => {
                const app = initializeApp({ projectId: 'demo-runtime-test' });
                await assert.rejects(getAuth(app).verifyIdToken('invalid-token', true),
                    error => ['auth/argument-error', 'auth/invalid-id-token'].includes(error.code));
                const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
                const client = jwks({ jwksUri: 'https://unused.example.invalid', cache: false, rateLimit: false,
                    fetcher: async () => ({ keys: [{ ...publicKey.export({ format: 'jwk' }),
                        kid: 'test-key', alg: 'RS256', use: 'sig' }] }) });
                const key = await client.getSigningKey('test-key');
                const data = Buffer.from('runtime-test');
                assert.equal(verify('RSA-SHA256', data, key.getPublicKey(), sign('RSA-SHA256', data, privateKey)), true);
                console.log('runtime-ok');
            })().catch(error => { console.error(error); process.exitCode = 1; });
        `;
        const output = execFileSync(process.execPath, ['--no-experimental-require-module', '-e', source], {
            cwd: directory, encoding: 'utf8', timeout: 20000
        });
        assert.ok(output.includes('runtime-ok'));
    });
}
