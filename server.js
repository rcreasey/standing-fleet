require('newrelic');
require('simple-ioc')
	.register('_', require('lodash'))
	.register('async', require('async'))
	.register('chunk', require('chunk'))
	.register('CrowdStrategy', require('./passport/crowd').Strategy)
	.register('express', require('express'))
	.register('flash', require('connect-flash'))
	.register('fs', require('fs'))
	.register('session', require('session-mongoose'))
	.register('neow', require('neow'))
	.register('passport', require('passport'))
	.register('Q', require('q'))
	.register('rawbody', require('raw-body'))

	.autoRegister('./lib/')
	.autoRegister('./config/')
	.start(function(expressSetup, settings) {
		expressSetup.start(settings.port || process.env.PORT || 5000);
	});
