import '@babel/polyfill';
import express from 'express';
import mystiko from 'mystiko';

(async () => {
  await mystiko();

  const app = express();
  const port = 3000;

  app.get('/', (req, res) => {
    res.send(
      `<p>${JSON.stringify(
        Object.entries(process.env)
          .map(e => e.join('='))
          .join('<br>')
      )}</p>`
    );
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
  
})();
