import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017/unics_social_discord_bot';

export function connect() {
	void mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err: any) => {
		if (err) {
			console.error(err);
		} else {
			console.log('Successfully Connected to MongoDB');
		}
	});
}
