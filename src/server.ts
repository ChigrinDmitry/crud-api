import http from 'http';
import dotenv from 'dotenv';
import { Router } from './utils/router';
import { Request, Response } from './types/http';
import { parseBody, enhanceResponse } from './utils/requestParser';
import * as userRoutes from './routes/users';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const router = new Router();

router.get('/api/users', userRoutes.getAllUsers);
router.get('/api/users/:userId', userRoutes.getUserById);
router.post('/api/users', userRoutes.createUser);
router.put('/api/users/:userId', userRoutes.updateUser);
router.delete('/api/users/:userId', userRoutes.deleteUser);

const notFoundHandler = (res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
};

const errorHandler = (res: Response, error: Error) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {

  const enhancedRes = enhanceResponse(res) as Response;

  try {
    const enhancedReq = req as Request;
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        enhancedReq.body = await parseBody(enhancedReq);
      } catch (error) {
        enhancedRes.status(400).json({ error: 'Invalid JSON in request body' });
        return;
      }
    }

    const routeMatch = router.findRoute(req.method || 'GET', req.url || '/');

    if (routeMatch) {
      enhancedReq.params = routeMatch.params;
      try {
        await routeMatch.route.handler(enhancedReq, enhancedRes);
      } catch (error) {
        errorHandler(enhancedRes, error as Error);
      }
    } else {
      notFoundHandler(enhancedRes);
    }
  } catch (error) {
    errorHandler(enhancedRes, error as Error);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default server;
