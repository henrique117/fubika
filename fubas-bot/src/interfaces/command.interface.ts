import { SlashCommandBuilder, ChatInputCommandInteraction, Message, AutocompleteInteraction } from 'discord.js';

export default interface ICommand {
    data: SlashCommandBuilder | any // Dados do SlashCommand
    
    aliases?: string[]; // Configs dos comandos de texto
    
    execute(interaction: ChatInputCommandInteraction): Promise<void> // Execução do Slash Command
    
    executePrefix?(message: Message, index?: number | null, args?: string[]): Promise<void>
    
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>
}