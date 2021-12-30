const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const {Player} = require('discord-player');
require('dotenv').config()

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

console.log(client.commands);

const player = new Player(client);

player.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Erro emitido da fila: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
  console.log(`[${queue.guild.name}] Erro emitido pela conexão: ${error.message}`);
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(`▶ | Começou a tocar: **${track.title}** em **${queue.connection.channel.name}**!`);
});

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(`🎶 | Música na **${track.title}** fila!`);
});

player.on('botDisconnect', queue => {
  queue.metadata.send('❌ | Fui desconectado manualmente do canal de voz, limpando a fila!');
});

player.on('channelEmpty', queue => {
  queue.metadata.send('❌ | Ninguém está no canal de voz, saindo ...');
});

player.on('queueEnd', queue => {
  queue.metadata.send('✅ | Fila encerrada!');
});

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('ready', function() {
  client.user.setActivity(process.env.ACTIVITY, { type: process.env.ACTIVITYTYPE });
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('Deployed!');
      })
      .catch(err => {
        message.reply('Não foi possível implantar comandos! Certifique-se de que o bot tenha a permissão application.commands!');
        console.error(err);
      });
  }
});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

const token = process.env.TOKEN

client.login(token);
