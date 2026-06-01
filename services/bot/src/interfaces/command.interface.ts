import { SlashCommandBuilder, ChatInputCommandInteraction, Message, AutocompleteInteraction } from 'discord.js';

export default interface ICommand {
    data: SlashCommandBuilder | any

    aliases?: string[];

    isAdmin?: boolean;

    isDestructive?: boolean;

    execute(interaction: ChatInputCommandInteraction): Promise<void>

    executePrefix?(message: Message, index?: number | null, args?: string[]): Promise<void>

    autocomplete?(interaction: AutocompleteInteraction): Promise<void>
}
