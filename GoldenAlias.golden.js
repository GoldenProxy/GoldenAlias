const fs = require('fs');

module.exports = class {
    constructor(logger, config, api) {
        this.logger = logger;
        this.config = config;
        this.api = api;

        this.chat = api.chatlog;

        this.logger.success('GoldenAlias loaded!');

        this.config = api.config;

        if (!this.config.get('aliases'))
            this.config.set('aliases', []);

        this.api.commands.register('/galias', (args, client) => {
            if (args.length < 1) 
                return this.chat.warn('Usage: /galias <list/add/remove>');
                            

            switch (args[0]) {
                case 'list':
                    this.chat.info('Listing aliases:');
                    this.config.get('aliases').forEach(alias => {
                        this.chat.small(`${alias.name} -> ${alias.value}`);
                    })
                    break;
                case 'add':
                    if (args.length < 3)
                        return this.chat.warn('Usage: /galias add <alias> <value>');

                    const [name, ...value] = args.slice(1);
                    const alias = { name, value: value.join(' ') };

                    this.config.get('aliases').push(alias);

                    this.chat.info(`Added alias ${name} -> ${value.join(' ')}`);

                    this.api.commands.register(`${name.startsWith('/') ? '' : '/'}${name}`, (args, client) => {
                        this.registerAlias(`${alias.name.startsWith('/') ? '' : '/'}${alias.name}`, alias.value);
                    })

                    this.config.save();
                    break;
                case 'remove':
                    if (args.length < 2)
                        return this.chat.warn('Usage: /galias remove <alias>');

                    const rmname = args[1];

                    const index = this.config.get('aliases').findIndex(alias => alias.name === rmname);
                    
                    this.config.get('aliases').splice(index, 1);
                    this.chat.info(`Removed alias ${rmname}`);

                    this.config.save();
                    break;

                default:
                    this.chat.warn('Usage: /galias <list/add>');
                    break;
            }
        });

        this.config.get('aliases').forEach(alias => {
            this.registerAlias(`${alias.name.startsWith('/') ? '' : '/'}${alias.name}`, alias.value);
        })
        
    }

    registerAlias(name, value) {
        this.api.commands.register(name, (args, client) => {
            this.api.proxy.remoteClient.write(
                'chat',
                { message: value + (args.length > 0 ? ' ' + args.join(' ') : '') }
            );
        })
    }
}