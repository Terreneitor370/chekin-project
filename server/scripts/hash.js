// Uso: npm run hash -- "MiContraseña"
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash -- "MiContraseña"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 10));
