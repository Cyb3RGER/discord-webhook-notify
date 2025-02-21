const core = require('@actions/core');
const github = require('@actions/github');

const webhook = require("webhook-discord");

const default_avatarUrl = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
const default_username = "GitHub";
const default_colors = {
	info: '#00ff00',
	warn: '#ff9900',
	error: '#ff0000'
}
const long_severity = {
	info: "Informational",
	warn: "Warning",
	error: "Error"
}

async function getDefaultFooter() {
	const context = github.context;
	const payload = context.payload;
	switch (github.context.eventName) {
		case 'release':
			return '';
		default:
			return ("Severity: " + long_severity[severity]);
	}
}

async function getDefaultColor() {
	const context = github.context;
	const payload = context.payload;
	switch (github.context.eventName) {
		case 'release':
			return (payload.release.prerelease ? '#ff9900' : '#00ff00');
		default:
			return default_colors[severity];
	}
}

async function getDefaultAvatarUrl() {
	const context = github.context;
	const payload = context.payload;
	switch (github.context.eventName) {
		case 'release':
			return payload.release.author.avatar_url;
		default:
			return default_avatarUrl;
	}
}

async function getDefaultUrl() {
	const context = github.context;
	const payload = context.payload;
	switch (github.context.eventName) {
		case 'release':
			return payload.release.html_url;
		default:
			return '';
	}
}

async function getDefaultUsername() {
	const context = github.context;
	const payload = context.payload;
	switch (github.context.eventName) {
		case 'release':
			return payload.release.author.login;
		default:
			return default_username;
	}
}


async function getDefaultDescription() {
	const context = github.context;
	const payload = context.payload;

	switch (github.context.eventName) {
		case 'push':
			return `- **Event:** ${context.eventName}\n`
				+ `- **Repo:** ${payload.repository.full_name}\n`
				+ `- **Ref:** ${payload.ref}\n`
				+ `- **Workflow:** ${context.workflow}\n`
				+ `- **Author:** ${payload.head_commit.author.name}\n`
				+ `- **Committer:** ${payload.head_commit.committer.name}\n`
				+ `- **Pusher:** ${payload.pusher.name}\n`
				+ `- **Commit URL:** ${payload.head_commit.url}\n`
				+ `- **Commit Message:** ${payload.head_commit.message}\n`
				;
		case 'release':
			if (payload.action == "published")
				return `A new ${(payload.release.prerelease ? 'pre-release' : 'release')} of ${payload.repository.name} has been published: **${payload.release.name}**\n\n`
					+ `${payload.release.body}\n\n`
					+ `**It can be found here:** ${payload.release.html_url}`
					;
			else
				return `- **Event:** ${context.eventName}\n`
					+ `- **Repo:** ${payload.repository.full_name}\n`
					+ `- **Action:** ${payload.action}\n`
					+ `- **Name**: ${payload.release.name}\n`
					+ `- **Author:** ${payload.release.author.login}\n`
					+ `- **Tag:** ${payload.release.tag_name}`
					+ (payload.release.prerelease ? ' (pre-release)' : '')
					+ '\n'
					+ `- **Url:** ${payload.release.html_url}`
					;
		default:
			return `- **Event:** ${context.eventName}\n`
				+ `- **Repo:** ${payload.repository.full_name}\n`;
	}
}

async function run() {
	try {
		const webhookUrl = core.getInput('webhookUrl').replace("/github", "");
		if (!webhookUrl) {
			core.setFailed("The webhookUrl was not provided. For security reasons the secret URL must be provided "
				+ "in the action yaml using a context expression and can not be read as a default.");
			return;
		}
		const severity = core.getInput('severity');
		const description = core.getInput('description');
		const details = core.getInput('details');
		const footer = core.getInput('footer');
		const text = core.getInput('text');
		const username = core.getInput('username');
		const color = core.getInput('color');
		const avatarUrl = core.getInput('avatarUrl');
		const url = core.getInput('url');

		const context = github.context;
		const obstr = JSON.stringify(context, undefined, 2)
		core.debug(`The event github.context: ${obstr}`);

		const hook = new webhook.Webhook(webhookUrl);

		core.info(`${username} ${avatarUrl} ${color} ${description} ${details} ${footer} ${text}`)

		const msg = new webhook.MessageBuilder()
			.setName(username || await getDefaultUsername())
			.setAvatar(avatarUrl || await getDefaultAvatarUrl())
			.setColor(color || await getDefaultColor())
			.setDescription((description || await getDefaultDescription()) + "\n" + details)
			.setFooter(footer || await getDefaultFooter())
			.setText(text)
			.setTime()
			.setURL(url || await getDefaultUrl());

		hook.send(msg);

	} catch (error) {
		core.setFailed(error.message);
	}
}

run();