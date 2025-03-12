module.exports = {
    devServer: {
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
  
        // Add your custom middleware here
        devServer.app.get('/some-custom-path', (req, res) => {
          res.json({ custom: 'response' });
        });
  
        // Return the middleware stack
        return middlewares;
      },
      port: 3000,
      hot: true
    }
  };
  