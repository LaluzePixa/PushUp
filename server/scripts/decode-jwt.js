/**
 * Script para decodificar un token JWT
 * Uso: node scripts/decode-jwt.js "tu-token-aqui"
 */

const token = process.argv[2];

if (!token) {
    console.error('❌ Por favor proporciona un token JWT como argumento');
    console.error('Uso: node scripts/decode-jwt.js "tu-token-jwt"');
    process.exit(1);
}

try {
    // Decodificar el payload sin verificar la firma (solo para debugging)
    const parts = token.split('.');

    if (parts.length !== 3) {
        console.error('❌ Token JWT inválido (debe tener 3 partes separadas por puntos)');
        process.exit(1);
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    console.log('📋 Header:');
    console.log(JSON.stringify(header, null, 2));

    console.log('\n📦 Payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Mostrar información útil
    console.log('\n🔍 Información del token:');
    console.log(`  - User ID field: ${payload.id ? 'id ✅' : payload.userId ? 'userId ⚠️' : 'NO ENCONTRADO ❌'}`);
    console.log(`  - User ID value: ${payload.id || payload.userId || 'N/A'}`);
    console.log(`  - Email: ${payload.email || 'N/A'}`);
    console.log(`  - Role: ${payload.role || 'N/A'}`);

    if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        const expired = expDate < now;
        console.log(`  - Expira: ${expDate.toLocaleString()} ${expired ? '❌ EXPIRADO' : '✅'}`);
    }

} catch (error) {
    console.error('❌ Error al decodificar el token:', error.message);
    process.exit(1);
}
