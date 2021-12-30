module.exports = {
  name: 'ban',
  description: 'Bane um usuário',
  options: [
    {
      name: 'user',
      type: 6, //USER Type
      description: 'O usuário que você deseja banir',
      required: true,
    },
  ],
  execute(interaction, client) {
    const member = interaction.options.get('user').value;

    if (!member) {
      return message.reply('Você precisa mencionar o membro que deseja bani-lo');
    }

    if (!interaction.member.permissions.has('BAN_MEMBERS')) {
      return message.reply("Eu não posso banir este usuário.");
    }

    const userinfo = client.users.cache.get(member);

    return interaction.guild.members
      .ban(member)
      .then(() => {
        interaction.reply({
          content: `${userinfo.username} foi banido.`,
          ephemeral: true,
        });
      })
      .catch(error =>
        interaction.reply({
          content: `Desculpe, ocorreu um erro.`,
          ephemeral: true,
        }),
      );
  },
};
