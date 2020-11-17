import Mongoose = require("mongoose");

const uri: string = 'mongodb://localhost:27017/unics_social_discord_bot';

export function connect() { 
	Mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err: any) => {
		if (err) {
			console.error(err);
		}
		else {
			console.log("Successfully Connected to MongoDB");
		}
	});
}