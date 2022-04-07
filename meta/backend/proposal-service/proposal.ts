import express, {Application} from 'express';
import Server from './src/index';
import * as dotenv from 'dotenv';
dotenv.config();

const app: Application = express();
const server: Server = new Server(app);
const PORT = process.env.PORT;


app.listen(PORT, () => {
    console.log(`Server listening at ${PORT}`);
}).on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
        console.log("Port is already in use.");
    } else {
        console.log("Error: ", err);
    }
});