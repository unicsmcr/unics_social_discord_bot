import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
const app = express();

import * as db from './db';
db.connect();

import * as bot from './bot'

import { Event } from './events';

import * as config from './config.json';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'))
app.use(session({
	secret: config.web.secret,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}));

app.get('/', (req, res) => {
	if (req.session && req.session.loggedin) {
		res.sendFile(__dirname + '/views/dashboard.html');
	}
	else {
		res.sendFile(__dirname + '/views/login.html');
	}

});

app.post('/api/auth/', (req, res) => {
	if (req.body.username == config.web.username && req.body.password == config.web.password) {
		// @ts-ignore
		req.session.loggedin = true;
		res.sendStatus(204);
	}
	else {
		res.sendStatus(401);
	}
});

app.delete('/api/auth/', (req, res) => {
	// @ts-ignore
	req.session.destroy();
	res.sendStatus(204);
});

app.get('/api/events/', async (req, res) => {
	if (req.session && req.session.loggedin) {
		const events = await Event.find({}).exec();
		res.send(events);
	}
	else {
		res.sendStatus(401);
	}
});

app.post('/api/event/', async (req, res) => {
	const validChannels = ["text", "voice", "textvoice"];
	if (req.body.name && req.body.channels && validChannels.indexOf(req.body.channels) > -1) {
		if (req.session && req.session.loggedin) {
			const category = await bot.createCategory(req.body.name);

			const mainRole = await bot.createRole(req.body.name);

			const mainChannel = await bot.createAnnouncementChannel(req.body.name, 'text', mainRole, category);

			await bot.sendSignupMessage(req.body.name, req.body.description, mainChannel);

			let event = new Event({
				name: req.body.name,
				description: req.body.description,
				options: req.body.channels,
				groups: null,
				mainRole: mainRole.id,
				roles: [],
				channels: [],
				mainChannel: mainChannel.id,
				category: category.id,
				assigned: false
			});
			event.save();

			res.sendStatus(204);
		}
		else {
			res.sendStatus(401);
		}
	}
	else {
		res.sendStatus(400);
	}
});

app.put('/api/event/:id/', async (req, res) => {
	if (req.body.method && ((req.body.method == "fixed" && req.body.groups && !isNaN(parseInt(req.body.groups))) || (req.body.method == "variable" && req.body.size && !isNaN(parseInt(req.body.size))))) {
		if (req.session && req.session.loggedin) {
			const id = req.params.id;
			var groups: number;

			Event.findById(id, async function (err, event: any) {
				if (!err) {
					const signedUpUsers = await bot.getSignedUpUsers(event.mainChannel);
					if (req.body.method == 'fixed') {
						groups = parseInt(req.body.groups);
					}
					if (req.body.method == 'variable') {
						groups = Math.ceil(signedUpUsers.length / parseInt(req.body.size));
					}

					for (var i = 1; i <= groups; i++) {
						let groupRole = await bot.createRole(`${event.name} - Group ${i}`);
						event.roles.push(groupRole.id);
						if (event.options == "textvoice" || event.options == "text") {
							let textChannel = await bot.createChannel(`${event.name} - Group ${i}`, 'text', groupRole, event.category);
							event.channels.push(textChannel.id);
						}
						if (event.options == "textvoice" || event.options == "voice") {
							let voiceChannel = await bot.createChannel(`${event.name} - Group ${i}`, 'voice', groupRole, event.category);
							event.channels.push(voiceChannel.id);
						}
					}

					if (signedUpUsers) {
						let i = 0;
						for (var user of signedUpUsers) {

							if (i >= event.roles.length) {
								i = 0;
							}

							bot.assignRole(user, event.mainRole)
							bot.assignRole(user, event.roles[i])

							i++;
						}
					}

					bot.restrictPermissions(event.category, event.mainRole);
					bot.restrictPermissions(event.mainChannel, event.mainRole);

					event.assigned = true;
					event.save();	

					res.sendStatus(204);	
				}
				else {
					console.error(err);
					res.sendStatus(500);				
				}
			});
		}
		else {
			res.sendStatus(401);
		}
	}
	else {
		res.sendStatus(400);
	}
});

app.delete('/api/event/:id/', async (req, res) => {
	if (req.session && req.session.loggedin) {
		const id = req.params.id;

		Event.findById(id, async function (err, event: any) {
			if (event.roles) {
				for (var role of event.roles) {
					await bot.deleteRole(role);
				}
			}
			if (event.channels) {
				for (var channel of event.channels) {
					await bot.deleteChannel(channel);
				}
			}
			await bot.deleteChannel(event.mainChannel);
			await bot.deleteChannel(event.category);
			await bot.deleteRole(event.mainRole);
		});

		Event.deleteOne({ _id: id }, (err) => {
			if (!err) {
				res.sendStatus(204);
			}
			else {
				console.error(err);
				res.sendStatus(500);
			}
		});
	}
	else {
		res.sendStatus(401);
	}
});

app.listen(config.web.port, () => {
    console.log( `Web Server Listening on Port ${config.web.port}`);
});