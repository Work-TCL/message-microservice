import { httpServer } from './socket';
import app from './app';
import { PORT } from './config';
import { mongooseConnection } from './database/connection';

app.use(mongooseConnection);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello, Welcome to Message-Microservice!');
});