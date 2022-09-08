import {
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js';

export async function createPagedEmbed(
  interaction: CommandInteraction,
  fieldChunks: EmbedFieldData[][],
  embedLayout: MessageEmbed
) {
  const actionRows = [
    new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('first')
        .setEmoji('⏮️')
        .setStyle('PRIMARY')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('previous')
        .setEmoji('◀️')
        .setStyle('PRIMARY')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('page')
        .setLabel(`1/${fieldChunks.length}`)
        .setStyle('SECONDARY')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('next')
        .setEmoji('▶️')
        .setStyle('PRIMARY'),
      new MessageButton().setCustomId('last').setEmoji('⏭️').setStyle('PRIMARY')
    )
  ];

  const embed = new MessageEmbed(embedLayout).addFields(fieldChunks[0]);

  interaction.reply({
    embeds: [embed],
    components: actionRows
  });

  const pageEmbed = (await interaction.fetchReply()) as Message;

  const collector = pageEmbed.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 1000 * 60 * 2
  });

  let pageNumber = 1;

  collector.on('collect', (i) => {
    switch (i.customId) {
      case 'first':
        pageNumber = 1;
        break;
      case 'previous':
        pageNumber -= 1;
        break;
      case 'next':
        pageNumber += 1;
        break;
      case 'last':
        pageNumber = fieldChunks.length;
        break;
      default:
        break;
    }

    actionRows[0].components.forEach((button) => {
      button.setDisabled(true);
    });

    if (pageNumber > 2) {
      actionRows[0].components[0].setDisabled(false);
    }

    if (pageNumber !== 1) {
      actionRows[0].components[1].setDisabled(false);
    }

    if (pageNumber !== fieldChunks.length) {
      actionRows[0].components[3].setDisabled(false);
    }

    if (pageNumber < fieldChunks.length - 1) {
      actionRows[0].components[4].setDisabled(false);
    }

    (actionRows[0].components[2] as MessageButton).setLabel(
      `${pageNumber}/${fieldChunks.length}`
    );

    i.update({
      embeds: [
        new MessageEmbed(embedLayout).addFields(fieldChunks[pageNumber - 1])
      ],
      components: actionRows
    });
  });

  collector.on('end', () => {
    const disabledActionRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('first_disabled')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('previous_disabled')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('page_disabled')
        .setLabel('Expired')
        .setStyle('SECONDARY')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('next_disabled')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true),
      new MessageButton()
        .setCustomId('last_disabled')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true)
    );

    pageEmbed.edit({
      embeds: [embed.setColor('#bf616a')],
      components: [disabledActionRow]
    });
  });
}
