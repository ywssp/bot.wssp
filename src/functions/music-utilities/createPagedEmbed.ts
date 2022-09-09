import {
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js';
import { ColorPalette } from '../../settings/ColorPalette';

export async function createPagedEmbed(
  interaction: CommandInteraction,
  fieldChunks: EmbedFieldData[][],
  embedLayout: MessageEmbed
) {
  const navigationButtons = new MessageActionRow();
  const disabledNavigationButtons = new MessageActionRow();

  if (fieldChunks.length > 3) {
    navigationButtons.addComponents(
      new MessageButton()
        .setCustomId('first')
        .setEmoji('⏮️')
        .setStyle('PRIMARY')
        .setDisabled(true)
    );

    disabledNavigationButtons.addComponents(
      new MessageButton()
        .setCustomId('first')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true)
    );
  }

  navigationButtons.addComponents(
    new MessageButton()
      .setCustomId('previous')
      .setEmoji('◀️')
      .setStyle('PRIMARY')
      .setDisabled(true),
    new MessageButton()
      .setCustomId('page_number')
      .setLabel(`1/${fieldChunks.length}`)
      .setStyle('SECONDARY')
      .setDisabled(true),
    new MessageButton().setCustomId('next').setEmoji('▶️').setStyle('PRIMARY')
  );

  disabledNavigationButtons.addComponents(
    new MessageButton()
      .setCustomId('previous')
      .setEmoji('⛔')
      .setStyle('DANGER')
      .setDisabled(true),
    new MessageButton()
      .setCustomId('page_number')
      .setLabel('Expired')
      .setStyle('SECONDARY')
      .setDisabled(true),
    new MessageButton()
      .setCustomId('next')
      .setEmoji('⛔')
      .setStyle('DANGER')
      .setDisabled(true)
  );

  if (fieldChunks.length > 3) {
    navigationButtons.addComponents(
      new MessageButton().setCustomId('last').setEmoji('⏭️').setStyle('PRIMARY')
    );

    disabledNavigationButtons.addComponents(
      new MessageButton()
        .setCustomId('last')
        .setEmoji('⛔')
        .setStyle('DANGER')
        .setDisabled(true)
    );
  }

  const actionRows = [
    navigationButtons,
    new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('close')
        .setLabel('Close')
        .setStyle('DANGER')
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
    if (i.customId === 'close') {
      collector.stop();
      return;
    }

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

    const getComponentIndex = (buttonId: string) => {
      return actionRows[0].components.findIndex(
        (component) => component.customId === buttonId
      );
    };

    actionRows[0].components.forEach((button) => {
      button.setDisabled(true);
    });

    if (pageNumber > 2) {
      actionRows[0].components[getComponentIndex('first')]?.setDisabled(false);
    }

    if (pageNumber !== 1) {
      actionRows[0].components[getComponentIndex('previous')].setDisabled(
        false
      );
    }

    if (pageNumber !== fieldChunks.length) {
      actionRows[0].components[getComponentIndex('next')].setDisabled(false);
    }

    if (pageNumber < fieldChunks.length - 1) {
      actionRows[0].components[getComponentIndex('last')]?.setDisabled(false);
    }

    (
      actionRows[0].components[
        getComponentIndex('page_number')
      ] as MessageButton
    ).setLabel(`${pageNumber}/${fieldChunks.length}`);

    i.update({
      embeds: [
        new MessageEmbed(embedLayout).addFields(fieldChunks[pageNumber - 1])
      ],
      components: actionRows
    });
  });

  collector.on('end', () => {
    pageEmbed.edit({
      embeds: [embed.setColor(ColorPalette.error)],
      components: [disabledNavigationButtons]
    });
  });
}
