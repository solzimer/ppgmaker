const
	program = require('commander'),
	cluster = require('cluster'),
	os = require("os"),
	extend = require("extend");

const DEF_CONF = {
	workers : "auto",
	host : "0.0.0.0",
	port : 3000,
	context : ""
}

if(cluster.isMaster) {
	if(isNaN(options.workers) || options.workers<=0) {
		os.cpus().forEach(()=>cluster.fork());
	}
	else {
		var wlen = parseInt(options.workers);
		for(let i=0;i<wlen;i++)
			cluster.fork();
	}
}
else {
	const
		express = require('express'),
		enableWs = require('express-ws'),
		bodyParser = require('body-parser'),
		cors = require('cors'),
		ctx = options.context;

	var app = express();

	enableWs(app);
	app.use(bodyParser.json());
	app.use(cors());
	app.use('/',express.static('static'));
	app.use('/lib',express.static('bower_components'));
	app.listen(options.port, () => {
		console.log(`Worker ${process.pid} started`);
	});
}
