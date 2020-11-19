import { Client, MessageEmbed, Guild, Channel, Role, TextChannel } from 'discord.js';

import * as config from './config.json';

const client = new Client();
let guild: Guild;

// eslint-disable-next-line
client.on('ready', async () => {
	console.log('Discord Bot Online');
	guild = await client.guilds.fetch(config.discord.guild);
});

void client.login(config.discord.token);

export async function createCategory(name: string) {
	return guild.channels.create(name, {
		type: 'category'
	});
}

export async function createRole(name: string) {
	return guild.roles.create({
		data: {
			name: name
		}
	});
}

export async function createChannel(name: string, type: any, role: Role, parent: Channel) {
	console.log('Type', type);
	console.log(typeof (type));
	return guild.channels.create(name, {
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
}

export async function createAnnouncementChannel(name: string, type: any, role: Role, parent: Channel) {
	return guild.channels.create(name, {
		type: type,
		parent: parent,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: 'SEND_MESSAGES'
			}
		]
	});
}

export async function sendSignupMessage(name: string, description: string, channel: any) {
	const signupMessage = new MessageEmbed()
		.setTitle(`Sign up for the ${name} event here! Simply click the ✅.`)
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
		for (const pin of pins) {
			if (pin.author.id === config.discord.id) {
				await pin.fetch(true);
				const reactions = await pin.reactions.cache.get('✅');
				if (reactions) {
					await reactions.users.fetch();
					const users = await reactions.users.cache.array();
					const ids = users.filter(x => x.id !== config.discord.id).map(x => x.id);
					void pin.delete();
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
		void user.roles.add(role);
	}
}

export async function restrictPermissions(id: string, role: string) {
	const category = await guild.channels.resolve(id);
	if (category) {
		void category.overwritePermissions([
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
	const role = await guild.roles.resolve(id);
	if (role) {
		void role.delete();
		return true;
	}
	return false;
}

export async function deleteChannel(id: string) {
	const channel = await guild.channels.resolve(id);
	if (channel) {
		void channel.delete();
		return true;
	}
	return false;
}
