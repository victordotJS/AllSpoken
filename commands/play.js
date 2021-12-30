const {GuildMember} = require('discord.js');
const {QueryType} = require('discord-player');

module.exports = {
  name: 'play',
  description: 'Toque uma música em seu canal!',
  options: [
    {
      name: 'inquerir',
      type: 3, // 'STRING' Type
      description: 'A musica que voce quer tocar',
      required: true,
    },
  ],
  async execute(interaction, player) {
    try {
      if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return void interaction.reply({
          content: 'Você não está em um canal de voz!',
          ephemeral: true,
        });
      }

      if (
        interaction.guild.me.voice.channelId &&
        interaction.member.voice.channelId !== interaction.guild.me.voice.channelId
      ) {
        return void interaction.reply({
          content: 'Você não está no meu canal de voz!',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const query = interaction.options.get('query').value;
      const searchResult = await player
        .search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO,
        })
        .catch(() => {});
      if (!searchResult || !searchResult.tracks.length)
        return void interaction.followUp({content: 'Nenhum resultado foi encontrado!'});

      const queue = await player.createQueue(interaction.guild, {
        ytdlOptions: {
				quality: "highest",
				filter: "audioonly",
				highWaterMark: 1 << 25,
				dlChunkSize: 0,
			},
        metadata: interaction.channel,
      });

      try {
        if (!queue.connection) await queue.connect(interaction.member.voice.channel);
      } catch {
        void player.deleteQueue(interaction.guildId);
        return void interaction.followUp({
          content: 'Não foi possível entrar no seu canal de voz!',
        });
      }

      await interaction.followUp({
        content: `⏱ | Carregando seu ${searchResult.playlist ? 'lista de reprodução' : 'música'}...`,
      });
      searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
      if (!queue.playing) await queue.play();
    } catch (error) {
      console.log(error);
      interaction.followUp({
        content: 'Ocorreu um erro ao tentar executar esse comando: ' + error.message,
      });
    }
  },
};
