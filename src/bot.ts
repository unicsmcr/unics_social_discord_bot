import { Client, MessageEmbed, Guild, Channel, Role, MessageReaction, User, TextChannel } from 'discord.js';

import * as config from './config.json';

const client = new Client();
var guild: Guild;

client.on('ready', async () => {
	console.log('Discord Bot Online');
	guild = await client.guilds.fetch(config.discord.guild);
});

client.login(config.discord.token);

export async function createCategory(name: string) {
	return await guild.channels.create(name, {
		type: 'category'
	});
};

export async function createRole(name: string) {
	return await guild.roles.create({ data: {
		name: name
	}});
};

export async function createChannel(name: string, type: any, role: Role, parent: Channel) {
	console.log("Type", type)
	console.log(typeof(type))
	return await guild.channels.create(name, {
		type: type,
		parent: parent,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: 'VIEW_CHANNEL'
			},
			{
				id: role,
				allow: 'VIEW_CHANNEL'
			}
		]
	});
};

export async function createAnnouncementChannel(name: string, type: any, role: Role, parent: Channel) {
	return await guild.channels.create(name, {
		type: type,
		parent: parent,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: 'SEND_MESSAGES'
			}
		]
	});
};

export async function sendSignupMessage(name: string, description: string, channel: any) {
	const signupMessage = new MessageEmbed()
								.setTitle(`Sign up for the ${ name } event here! Simply click the ✅.`)
								.setDescription(description);
	const signup = await channel.send(signupMessage);
	signup.pin();
	signup.react('✅');
	return true;
}

export async function getSignedUpUsers(channel: any) {
	const announcementsChannel = await guild.channels.resolve(channel);
	if (announcementsChannel) {
		const pinsCollection = await (announcementsChannel as TextChannel).messages.fetchPinned();
		const pins = await pinsCollection.array();
		for (var pin of pins) {
			if (pin.author.id == config.discord.id) {
				await pin.fetch(true);
				const reactions = await pin.reactions.cache.get('✅');
				if (reactions) {
					await reactions.users.fetch();
					const users = await reactions.users.cache.array();
					const ids = users.filter(x => { return x.id != config.discord.id }).map(x => { return x.id });
					pin.delete();
					return ids;
				}
			}
		}
	}
	return [];
}

export async function assignRole(id: string, role: Role) {
	await guild.members.fetch(id);
	const user = await guild.members.resolve(id);
	if (user) {
		user.roles.add(role);
	}
}

export async function restrictPermissions(id: string, role: string) {
	const category = await guild.channels.resolve(id);
	if (category) {
		category.overwritePermissions([
			{
				id: guild.roles.everyone,
				deny: 'VIEW_CHANNEL'
			},
			{
				id: role,
				allow: 'VIEW_CHANNEL'
			}
		]);
	}
}

export async function deleteRole(id: string) {
	let role = await guild.roles.resolve(id);
	if (role) {
		role.delete();
		return true;
	}
	return false;
};

export async function deleteChannel(id: string) {
	let channel = await guild.channels.resolve(id);
	if (channel) {
		channel.delete();
		return true;
	}
	return false;
};