import { Request } from '../types/http';

export const parseBody = (req: Request): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
};

export const enhanceResponse = (res: any): any => {
  res.status = function (code: number) {
    this.statusCode = code;
    return this;
  };

  res.json = function (data: any) {
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'application/json');
      this.statusCode = this.statusCode || 200;
      this.end(JSON.stringify(data));
    }
  };

  res.send = function (data?: any) {
    if (!this.headersSent) {
      this.statusCode = this.statusCode || 200;
      if (data) {
        this.end(data);
      } else {
        this.end();
      }
    }
  };

  return res;
};

