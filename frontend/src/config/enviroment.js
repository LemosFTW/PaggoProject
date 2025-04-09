const nodeEnv = process.env.NEXT_PUBLIC_NODE_ENV;
const remoteBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const localBackendUrl = process.env.NEXT_PUBLIC_LOCAL_URL;

let backendUrl = null

if (nodeEnv === 'production') {
  backendUrl = remoteBackendUrl;
} else {
  backendUrl = localBackendUrl;
}

console.log(nodeEnv);
console.log(remoteBackendUrl);
console.log(localBackendUrl);
console.log(backendUrl);
if (!backendUrl) {
  console.error("Erro: A URL do backend não está definida nas variáveis de ambiente.");
}

export const API_BASE_URL = backendUrl;

export const ENVIRONMENT = nodeEnv;

console.log(`Ambiente: ${ENVIRONMENT}`);
console.log(`URL do Backend: ${API_BASE_URL}`);
