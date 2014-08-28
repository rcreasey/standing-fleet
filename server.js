require('newrelic');
require('simple-ioc')
	.register('fs', require('fs'))
	.register('express', require('express'))
	.register('_', require('lodash'))
	.register('async', require('async'))
	.register('mongodb', require('mongodb'))
	.register('rawbody', require('raw-body'))
	.register('neow', require('neow'))
	.register('Q', require('q'))
	.register('chunk', require('chunk'))

	.autoRegister('./lib/')
	.autoRegister('./config/')
	.start(function(expressSetup, settings) {
		expressSetup.start(settings.port || process.env.PORT || 5000);
	});
