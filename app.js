import express from 'express'
import mustacheExpress from 'mustache-express';
import { fileURLToPath } from 'url';
import path, {dirname} from 'path'
import ip from 'ip'
import fs from 'fs'


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = path.join(process.cwd(), 'config.json')

//check if ConfigPath exists and if not create it with default settings
export let config = {
    port: 3000,
    obsHost: "localhost:4000",
    obsPassword: null,
    obsUsername: null,
    screenShotTime: 5000
}

if(!fs.existsSync(configPath)){
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4))
}
else {
    // read config file and spread with default settings
    const configFile = fs.readFileSync(configPath)
    config = {...config, ...JSON.parse(configFile)}
}


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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});



app.route('/').get((req,res) => {
    // console.log('Here')
    res.render('index', {'ip': localIp, 'port': config.port, 'screenShotTime': config.screenShotTime})
})
app.route('/obs').get((req,res) => {
    res.render('obs', {'ip': localIp, 'port': config.port})
})


export default app;
