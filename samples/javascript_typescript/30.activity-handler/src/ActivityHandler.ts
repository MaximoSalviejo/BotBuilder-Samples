import { ActivityTypes, TurnContext } from 'botbuilder';

export type BotHandler = (context: TurnContext, next: () => Promise<void>) => Promise<void>;

export class ActivityHandler {
    private readonly handlers: {[type: string]: BotHandler[]} = {};

    // Fires first for every incoming activity
    public onTurn(handler: BotHandler): this {
        return this.on('Turn', handler);
    }

    // Fires for incoming message activities
    public onMessage(handler: BotHandler): this {
        return this.on('Message', handler);
    }

    public onContactRelationUpdate(handler: BotHandler): this {
        return this.on('ContactRelationUpdate', handler);
    }

    public onConversationUpdate(handler: BotHandler): this {
        return this.on('ConversationUpdate', handler);
    }

    public onConversationMembersAdded(handler: BotHandler): this {
        return this.on('ConversationMembersAdded', handler);
    }

    public onConversationMembersRemoved(handler: BotHandler): this {
        return this.on('ConversationMembersRemoved', handler);
    }

    public onEndOfConversation(handler: BotHandler): this {
        return this.on('EndOfConversation', handler);
    }

    public onEvent(handler: BotHandler): this {
        return this.on('Event', handler);
    }

    public onInvoke(handler: BotHandler): this {
        return this.on('Invoke', handler);
    }

    public onInstallationUpdate(handler: BotHandler): this {
        return this.on('InstallationUpdate', handler);
    }

    public onMessageDelete(handler: BotHandler): this {
        return this.on('MessageDelete', handler);
    }

    public onMessageUpdate(handler: BotHandler): this {
        return this.on('MessageUpdate', handler);
    }

    public onMessageReaction(handler: BotHandler): this {
        return this.on('MessageReaction', handler);
    }

    public onMessageReactionAdded(handler: BotHandler): this {
        return this.on('MessageReactionAdded', handler);
    }

    public onMessageReactionRemoved(handler: BotHandler): this {
        return this.on('MessageReactionRemoved', handler);
    }

    public onTyping(handler: BotHandler): this {
        return this.on('Typing', handler);
    }

    public onHandoff(handler: BotHandler): this {
        return this.on('Handoff', handler);
    }

    public onCreateConversation(handler: BotHandler): this {
        return this.on('CreateConversation', handler);
    }

   public onContinueConversation(handler: BotHandler): this {
        return this.on('ContinueConversation', handler);
   }

    public onUnrecognizedActivityType(handler: BotHandler): this {
        return this.on('UnrecognizedActivityType', handler);
    }

    // Fires last, and can be used to manage dialogs
    public onDialog(handler: BotHandler): this {
        return this.on('Dialog', handler);
    }

    public async run(context: TurnContext): Promise<void> {

        // Allow the dialog system to be triggered at the end of the chain
        const runDialogs = async (): Promise<void> => {
            await this.handle(context, 'Dialog', async () => {
                // noop
            });
        };

        // List of all Activity Types:
        // https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botframework-schema/src/index.ts#L1627
        // TODO: Implement handlers for all valid activity types
        await this.handle(context, 'Turn', async () => {
            switch (context.activity.type) {
                case ActivityTypes.Message:
                    await this.handle(context, 'Message', runDialogs);
                    break;
                case ActivityTypes.ContactRelationUpdate:
                    await this.handle(context, 'ContactRelationUpdate', runDialogs);
                    break;
                case ActivityTypes.ConversationUpdate:
                    await this.handle(context, 'ConversationUpdate', async () => {
                        if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
                            await this.handle(context, 'ConversationMembersAdded', runDialogs);
                        } else if (context.activity.membersRemoved && context.activity.membersRemoved.length > 0) {
                            await this.handle(context, 'ConversationMembersRemoved', runDialogs);
                        } else {
                            await runDialogs();
                        }
                    });
                    break;
                case ActivityTypes.EndOfConversation:
                    await this.handle(context, 'EndOfConversation', runDialogs);
                    break;
                case ActivityTypes.Event:
                    await this.handle(context, 'Event', async () => {
                        if (context.activity.name === 'createConversation') {
                            await this.handle(context, 'CreateConversation', runDialogs);
                        } else if (context.activity.name === 'continueConversation') {
                            await this.handle(context, 'ContinueConversation', runDialogs);
                        } else {
                            await runDialogs();
                        }
                    });
                    break;
                case ActivityTypes.Invoke:
                    await this.handle(context, 'Invoke', runDialogs);
                    break;
                case ActivityTypes.InstallationUpdate:
                    await this.handle(context, 'InstallationUpdate', runDialogs);
                    break;
                case ActivityTypes.MessageDelete:
                    await this.handle(context, 'MessageDelete', runDialogs);
                    break;
                case ActivityTypes.MessageUpdate:
                    await this.handle(context, 'MessageUpdate', runDialogs);
                    break;
                case ActivityTypes.MessageReaction:
                    await this.handle(context, 'MessageReaction', runDialogs);
                    if (context.activity.reactionsAdded && context.activity.reactionsAdded.length) {
                        await this.handle(context, 'MessageReactionAdded', runDialogs);
                    }
                    if (context.activity.reactionsRemoved && context.activity.reactionsRemoved.length) {
                        await this.handle(context, 'MessageReactionRemoved', runDialogs);
                    }
                    break;
                case ActivityTypes.Typing:
                    await this.handle(context, 'Typing', runDialogs);
                    break;
                case ActivityTypes.Handoff:
                    await this.handle(context, 'Handoff', runDialogs);
                    break;
                default:
                    // handler for unknown or unhandled types
                    await this.handle(context, 'UnrecognizedActivityType', runDialogs);
                    break;
            }
        });
    }

    private on(type: string, handler: BotHandler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler];
        } else {
            this.handlers[type].push(handler);
        }
        return this;
    }

    private async handle(context: TurnContext, type: string,  onNext: () => Promise<void>): Promise<void> {
        async function runHandler(index: number): Promise<void> {
            if (index < handlers.length) {
                await handlers[index](context, () => runHandler(index + 1));
            } else {
                await onNext();
            }
        }

        const handlers = this.handlers[type] || [];
        await runHandler(0);
    }

}