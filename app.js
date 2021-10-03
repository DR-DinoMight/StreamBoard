import express from 'express'
import mustacheExpress from 'mustache-express';
import { fileURLToPath } from 'url';
import path, {dirname} from 'path'
import ip from 'ip'


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
// function to get the local ip address
const localIp = ip.address()

app.engine('mst', mustacheExpress())
app.set('view engine', 'mst')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS
    //Allow localhost and local ip address
    res.header("Access-Control-Allow-Origin", "http://localhost:3000, http://*:3000");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});



app.route('/').get((req,res) => {
    // console.log('Here')
    res.render('index', {'ip': localIp})
})
app.route('/obs').get((req,res) => {
    res.render('obs', {'ip': localIp});
})


export default app;
