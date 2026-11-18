// Cria os arquivos .env a partir dos modelos, sem sobrescrever os que já existem.
import { copyFileSync, existsSync } from 'node:fs';

const pares = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env.local'],
];
for (const [modelo, destino] of pares) {
  if (existsSync(destino)) {
    console.log(`mantido: ${destino}`);
  } else {
    copyFileSync(modelo, destino);
    console.log(`criado:  ${destino} (revise as senhas)`);
  }
}
