import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const numWorkers = os.availableParallelism() - 1;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numWorkers} workers`);

  const workerPorts: number[] = [];
  for (let i = 0; i < numWorkers; i++) {
    workerPorts.push(PORT + i + 1);
  }

  // Create workers
  for (let i = 0; i < numWorkers; i++) {
    const workerPort = workerPorts[i];
    const worker = cluster.fork({ WORKER_PORT: workerPort.toString() });
    console.log(`Worker ${worker.id} started on port ${workerPort}`);
  }

  // Load balancer using built-in http module with round-robin
  let currentWorker = 0;

  const loadBalancer = http.createServer((req, res) => {
    const targetPort = workerPorts[currentWorker];
    currentWorker = (currentWorker + 1) % numWorkers;

    const options = {
      hostname: 'localhost',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });

    req.pipe(proxyReq, { end: true });
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer is running on port ${PORT}`);
  });

  // Store worker port mapping
  const workerPortMap = new Map<number, number>();

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    const oldPort = workerPortMap.get(worker.id) || workerPorts[0];
    const newWorker = cluster.fork({ WORKER_PORT: oldPort.toString() });
    workerPortMap.set(newWorker.id, oldPort);
    console.log(`New worker ${newWorker.id} started on port ${oldPort}`);
  });

  // Initialize port mapping for initial workers
  cluster.on('online', (worker) => {
    const workerIndex = worker.id - 1;
    if (workerIndex < workerPorts.length) {
      workerPortMap.set(worker.id, workerPorts[workerIndex]);
    }
  });
} else {
  // Worker process
  const workerPort = process.env.WORKER_PORT ? parseInt(process.env.WORKER_PORT, 10) : PORT + 1;
  process.env.PORT = workerPort.toString();

  require('../server');
}
