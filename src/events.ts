import * as Mongoose from "mongoose";

export const EventSchema = new Mongoose.Schema({
	name: { type: String },
	description: { type: String },
	groups: { type: Number },
	options: { type: String },
	roles: { type: [String] },
	mainRole: { type: String },
	channels: { type: [String] },
	mainChannel: { type: String },
	category: { type: String },
	assigned: { type: Boolean }
});

export const Event = Mongoose.model('Event', EventSchema);